// Facebook Messenger integration: signature verification, send-text, send-property carousel, sender actions.
import crypto from "node:crypto";
import type { Listing } from "./listings.js";

const GRAPH = "https://graph.facebook.com/v21.0";

function token(): string {
  const t = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!t) throw new Error("FACEBOOK_PAGE_ACCESS_TOKEN not set");
  return t;
}

/**
 * Verifies the X-Hub-Signature-256 header against the raw request body using the app secret.
 * Reject any unsigned or mismatching webhook to prevent spoofed messages.
 */
export function verifySignature(rawBody: Buffer, signatureHeader?: string): boolean {
  const secret = process.env.FACEBOOK_APP_SECRET;
  if (!secret) {
    console.warn("[facebook] FACEBOOK_APP_SECRET not set — skipping signature check (DO NOT do this in prod)");
    return true;
  }
  if (!signatureHeader) return false;
  const [scheme, theirs] = signatureHeader.split("=");
  if (scheme !== "sha256" || !theirs) return false;
  const ours = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(ours, "hex"), Buffer.from(theirs, "hex"));
  } catch {
    return false;
  }
}

/** GET /webhook handshake. Returns the challenge to FB if the verify token matches. */
export function verifyWebhook(query: Record<string, string | undefined>):
  | { ok: true; challenge: string }
  | { ok: false; reason: string } {
  const mode = query["hub.mode"];
  const verifyToken = query["hub.verify_token"];
  const challenge = query["hub.challenge"];
  if (mode === "subscribe" && verifyToken === process.env.FACEBOOK_VERIFY_TOKEN) {
    return { ok: true, challenge: String(challenge ?? "") };
  }
  return { ok: false, reason: "verify_token mismatch" };
}

async function fbCall(path: string, body: unknown): Promise<void> {
  const url = `${GRAPH}${path}?access_token=${encodeURIComponent(token())}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("[facebook] send failed", res.status, text);
    throw new Error(`Facebook API ${res.status}: ${text}`);
  }
}

export async function sendTypingOn(psid: string): Promise<void> {
  await fbCall("/me/messages", {
    recipient: { id: psid },
    sender_action: "typing_on",
  }).catch(() => undefined);
}

export async function sendText(psid: string, text: string): Promise<void> {
  // Facebook hard caps text at 2000 chars; chunk to be safe.
  const chunks = chunkText(text, 1900);
  for (const chunk of chunks) {
    await fbCall("/me/messages", {
      recipient: { id: psid },
      messaging_type: "RESPONSE",
      message: { text: chunk },
    });
  }
}

export async function sendPropertyCarousel(
  psid: string,
  listings: Listing[],
  publicSiteUrl: string
): Promise<void> {
  if (!listings.length) return;
  const elements = listings.slice(0, 10).map((l) => {
    const cover = firstHttpPhoto(l.photos);
    return {
      title: truncate(l.title, 80),
      subtitle: truncate(
        `${formatPrice(l.price, l.type)} · ${l.beds} bed · ${l.baths} bath · ${l.sqm}m² · ${l.location}`,
        80
      ),
      image_url: cover,
      buttons: [
        {
          type: "web_url",
          url: `${publicSiteUrl.replace(/\/$/, "")}/property/${l.id}`,
          title: "View details",
        },
      ],
    };
  });

  // Facebook rejects elements with missing image_url, so drop those entries' image only.
  for (const el of elements) {
    if (!el.image_url) delete (el as Record<string, unknown>).image_url;
  }

  await fbCall("/me/messages", {
    recipient: { id: psid },
    messaging_type: "RESPONSE",
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements,
        },
      },
    },
  });
}

function chunkText(s: string, max: number): string[] {
  if (s.length <= max) return [s];
  const out: string[] = [];
  for (let i = 0; i < s.length; i += max) out.push(s.slice(i, i + max));
  return out;
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

function firstHttpPhoto(urls: string[]): string | undefined {
  // Facebook needs a publicly-reachable https URL. Local /foo.jpg paths don't work.
  return urls.find((u) => /^https?:\/\//i.test(u));
}

function formatPrice(price: number, type: "sale" | "rent"): string {
  const usd = "$" + price.toLocaleString("en-US");
  return type === "rent" ? `${usd}/mo` : usd;
}
