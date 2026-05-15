// Express server for the Zaisan High Land Messenger bot.
//   GET  /webhook  → Facebook verify handshake
//   POST /webhook  → incoming messaging events
//
// Per-event flow:
//   1. ACK 200 to FB immediately, then process in background (FB retries aggressive 200s).
//   2. If the PSID has no /conversations doc yet OR the text is the "11" trigger →
//      send the canned WELCOME_MESSAGE, log it, and skip Claude.
//   3. Otherwise → run Claude (with show_photos tool), send its text reply, then
//      send any exterior/interior photo attachments Claude requested.
//   4. Persist the turn to Firestore /conversations/{psid} (best-effort, fire-and-forget).
import "dotenv/config";
import express, { type Request, type Response } from "express";
import { runTurn, type PhotoCategory } from "./claude.js";
import { getHistory, setHistory } from "./conversation.js";
import { appendTurn, hasConversation } from "./conversationLog.js";
import {
  sendImageAttachment,
  sendText,
  sendTypingOn,
  verifySignature,
  verifyWebhook,
} from "./facebook.js";
import { WELCOME_MESSAGE, isWelcomeTriggerText } from "./welcome.js";

const app = express();

app.use(
  "/webhook",
  express.raw({ type: "application/json", limit: "1mb" })
);
app.use(express.json());

const PORT = Number(process.env.PORT ?? 8080);
const PUBLIC_SITE_URL = (process.env.PUBLIC_SITE_URL ?? "https://claude.mn").replace(/\/$/, "");

// Photo URLs assembled at startup from PUBLIC_SITE_URL — all ASCII filenames so FB
// can fetch them without URL-encoding surprises.
const PHOTOS: Record<PhotoCategory, string[]> = {
  exterior: [
    `${PUBLIC_SITE_URL}/gadna1.jpg`,
    `${PUBLIC_SITE_URL}/gadna2.jpg`,
    `${PUBLIC_SITE_URL}/gadna4.jpg`,
  ],
  interior: [
    `${PUBLIC_SITE_URL}/dotor1.jpg`,
    `${PUBLIC_SITE_URL}/dotor2.jpg`,
  ],
};

app.get("/", (_req, res) => {
  res.send("Zaisan High Land chatbot is running.");
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/webhook", (req: Request, res: Response) => {
  const result = verifyWebhook(req.query as Record<string, string | undefined>);
  if (result.ok) {
    res.status(200).send(result.challenge);
  } else {
    console.warn("[webhook] verify rejected", result.reason);
    res.sendStatus(403);
  }
});

app.post("/webhook", (req: Request, res: Response) => {
  const raw = req.body as Buffer;
  if (!verifySignature(raw, req.header("x-hub-signature-256") ?? undefined)) {
    console.warn("[webhook] bad signature, rejecting");
    res.sendStatus(403);
    return;
  }
  let body: WebhookBody;
  try {
    body = JSON.parse(raw.toString("utf8")) as WebhookBody;
  } catch {
    res.sendStatus(400);
    return;
  }

  res.sendStatus(200);

  if (body.object !== "page") return;
  for (const entry of body.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      handleEvent(event).catch((err) => {
        console.error("[handler] uncaught", err);
      });
    }
  }
});

interface WebhookBody {
  object?: string;
  entry?: {
    messaging?: MessagingEvent[];
  }[];
}

interface MessagingEvent {
  sender?: { id?: string };
  message?: {
    text?: string;
    is_echo?: boolean;
    quick_reply?: { payload?: string };
  };
  postback?: { payload?: string };
}

async function handleEvent(event: MessagingEvent): Promise<void> {
  const psid = event.sender?.id;
  if (!psid) return;
  if (event.message?.is_echo) return;

  const text =
    event.message?.text ??
    event.message?.quick_reply?.payload ??
    event.postback?.payload;
  if (!text) return;

  console.log(`[msg in] ${psid}: ${text}`);

  await sendTypingOn(psid).catch(() => undefined);

  // First-contact detection persisted in Firestore — survives server restarts so a returning
  // user does NOT get re-greeted. The "11" payload always triggers the welcome regardless.
  const firstContact = !(await hasConversation(psid));
  if (firstContact || isWelcomeTriggerText(text)) {
    await sendText(psid, WELCOME_MESSAGE).catch((err) =>
      console.error("[fb] sendText welcome failed", err)
    );
    // Seed the in-memory history with the welcome so Claude sees we already greeted —
    // prevents a duplicate "Сайн байна уу!" on the next AI turn.
    const seeded = [
      ...getHistory(psid),
      { role: "user" as const, content: text },
      { role: "assistant" as const, content: WELCOME_MESSAGE },
    ];
    setHistory(psid, seeded);
    void appendTurn(psid, text, WELCOME_MESSAGE);
    return;
  }

  let result;
  try {
    const history = getHistory(psid);
    result = await runTurn(history, text);
    setHistory(psid, result.history);
  } catch (err) {
    console.error("[claude] runTurn failed", err);
    await sendText(
      psid,
      "Уучлаарай, түр алдаа гарлаа. Дахин оролдоно уу, эсвэл борлуулалтын алба 8861-2088 руу холбогдоно уу."
    ).catch(() => undefined);
    return;
  }

  if (result.reply) {
    await sendText(psid, result.reply).catch((err) => {
      console.error("[fb] sendText failed", err);
    });
  }

  // Photos come after the text so the user reads context first, then sees the visuals.
  // De-dup categories in case the model emitted the same one twice in one turn.
  const seen = new Set<PhotoCategory>();
  for (const cat of result.photoCategories) {
    if (seen.has(cat)) continue;
    seen.add(cat);
    for (const url of PHOTOS[cat]) {
      await sendImageAttachment(psid, url).catch((err) =>
        console.error(`[fb] sendImage failed (${cat})`, err)
      );
    }
  }

  void appendTurn(psid, text, result.reply);
}

app.listen(PORT, () => {
  console.log(`[zaisan-chatbot] listening on :${PORT}`);
});
