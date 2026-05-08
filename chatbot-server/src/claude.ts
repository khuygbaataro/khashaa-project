// Claude tool-use orchestration. Runs a single conversational turn:
//   1. Send the customer's message + history to Claude
//   2. If Claude returns tool_use blocks, execute them and feed back the results
//   3. Loop until Claude produces a plain-text response (or we hit a safety cap)
// Uses prompt caching on the system prompt + tool definitions to keep cost low across turns.
import Anthropic from "@anthropic-ai/sdk";
import { tools, SYSTEM_PROMPT } from "./tools.js";
import {
  createLead,
  getAgent,
  getListing,
  searchListings,
  type Listing,
  type SellerLeadInput,
  type HandoffLeadInput,
} from "./listings.js";
import type { Msg } from "./conversation.js";

const client = new Anthropic();
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";
const MAX_TOOL_LOOPS = 6;

export interface TurnResult {
  reply: string;
  matchedListings: Listing[];
  history: Msg[];
}

// Runs one turn: history is the prior conversation, userText is the new customer message.
export async function runTurn(
  history: Msg[],
  userText: string,
  context: { fbPsid: string }
): Promise<TurnResult> {
  const messages: Msg[] = [
    ...history,
    { role: "user", content: userText },
  ];

  const matched: Listing[] = [];
  let finalText = "";

  for (let loop = 0; loop < MAX_TOOL_LOOPS; loop++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      // Cache the system prompt + tool definitions across requests for the same chat.
      // cache_control is at runtime supported but missing in this SDK's TS types — cast.
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ] as unknown as Anthropic.TextBlockParam[],
      tools,
      messages,
    });

    // Append Claude's full assistant message (may include tool_use blocks) to history.
    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason !== "tool_use") {
      // Done — collect the plain-text reply.
      finalText = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      break;
    }

    // Run each tool_use block and feed the results back as a single user message.
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      try {
        const out = await runTool(block.name, block.input as Record<string, unknown>, context);
        if (out.matched) matched.push(...out.matched);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: out.text,
        });
      } catch (err) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: `Error: ${(err as Error).message}`,
          is_error: true,
        });
      }
    }
    messages.push({ role: "user", content: toolResults });
  }

  if (!finalText) {
    finalText =
      "Sorry — I'm having trouble right now. Try again in a moment, or ask for a human agent.";
  }

  // De-duplicate matched listings by id (Claude may search and then fetch details on the same one).
  const uniq = new Map<string, Listing>();
  for (const l of matched) uniq.set(l.id, l);

  return { reply: finalText, matchedListings: [...uniq.values()], history: messages };
}

interface ToolResult {
  text: string;
  matched?: Listing[];
}

async function runTool(
  name: string,
  input: Record<string, unknown>,
  context: { fbPsid: string }
): Promise<ToolResult> {
  switch (name) {
    case "search_listings": {
      // Claude works in tugrik; Firestore stores USD. Convert at the boundary.
      const MNT_PER_USD = 3400;
      const maxMnt = numberOrUndef(input.max_price_mnt);
      const minMnt = numberOrUndef(input.min_price_mnt);
      const results = await searchListings(
        {
          type: input.type as "sale" | "rent" | undefined,
          max_price_usd: maxMnt != null ? Math.ceil(maxMnt / MNT_PER_USD) : undefined,
          min_price_usd: minMnt != null ? Math.floor(minMnt / MNT_PER_USD) : undefined,
          min_beds: numberOrUndef(input.min_beds),
          district: stringOrUndef(input.district),
          query: stringOrUndef(input.query),
        },
        5
      );
      const summary = await Promise.all(results.map((l) => summarizeForClaude(l)));
      return {
        text: JSON.stringify({ count: results.length, listings: summary }, null, 2),
        matched: results,
      };
    }
    case "get_listing_details": {
      const id = stringOrUndef(input.id);
      if (!id) return { text: "Error: id is required." };
      const l = await getListing(id);
      if (!l) return { text: "Not found or no longer active." };
      const detail = await summarizeForClaude(l, true);
      return { text: JSON.stringify(detail, null, 2), matched: [l] };
    }
    case "create_seller_lead": {
      const payload: SellerLeadInput = {
        name: String(input.name ?? ""),
        phone: stringOrUndef(input.phone),
        property_type: input.property_type === "rent" ? "rent" : "sale",
        location: String(input.location ?? ""),
        beds: numberOrUndef(input.beds),
        description: stringOrUndef(input.description),
        source: "messenger",
        fbPsid: context.fbPsid,
      };
      const id = await createLead(payload, "seller");
      return { text: `Lead saved (id=${id}). An agent will reach out soon.` };
    }
    case "request_human_agent": {
      const payload: HandoffLeadInput = {
        name: stringOrUndef(input.name),
        phone: stringOrUndef(input.phone),
        about: String(input.about ?? "general inquiry"),
        source: "messenger",
        fbPsid: context.fbPsid,
      };
      const id = await createLead(payload, "handoff");
      return { text: `Handoff lead saved (id=${id}). An agent will reach out soon.` };
    }
    default:
      return { text: `Error: unknown tool '${name}'` };
  }
}

async function summarizeForClaude(l: Listing, includeAgent = false) {
  // Convert USD → MNT before handing to Claude. Round to readable thousands so
  // the model says "295 сая ₮" not "295,231,400 ₮".
  const MNT_PER_USD = 3400;
  const mnt = l.price * MNT_PER_USD;
  const base = {
    id: l.id,
    title: l.title,
    type: l.type,
    price_mnt: Math.round(mnt / 1_000) * 1_000,
    price_label: formatMntForClaude(mnt, l.type),
    location: l.location,
    district: l.district,
    beds: l.beds,
    baths: l.baths,
    sqm: l.sqm,
    price_per_sqm_mnt: l.sqm > 0 ? Math.round(mnt / l.sqm / 1_000) * 1_000 : null,
    photo_count: l.photos.length,
    description: l.description,
  };
  if (!includeAgent) return base;
  const agent = await getAgent(l.agentId);
  return {
    ...base,
    agent: agent
      ? {
          id: agent.id,
          name: agent.name,
          phone: agent.phone ?? null,
          bio: agent.bio ?? null,
        }
      : null,
  };
}

function formatMntForClaude(mnt: number, type: "sale" | "rent"): string {
  let label: string;
  if (mnt >= 1_000_000_000) {
    label = (mnt / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + " тэрбум ₮";
  } else if (mnt >= 1_000_000) {
    label = Math.round(mnt / 1_000_000) + " сая ₮";
  } else if (mnt >= 1_000) {
    label = Math.round(mnt / 1_000) + " мянга ₮";
  } else {
    label = mnt.toLocaleString("en-US") + " ₮";
  }
  return type === "rent" ? `${label}/сар` : label;
}

function numberOrUndef(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function stringOrUndef(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s ? s : undefined;
}
