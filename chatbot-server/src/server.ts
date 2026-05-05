// Express server. GET /webhook = FB verify handshake. POST /webhook = receive messages.
// Handlers are fired in the background (no awaiting in the response path) so FB gets a 200
// fast — they retry aggressively if the response is slow.
import express, { type Request, type Response } from "express";
import { runTurn } from "./claude.js";
import { getHistory, setHistory } from "./conversation.js";
import {
  sendPropertyCarousel,
  sendText,
  sendTypingOn,
  verifySignature,
  verifyWebhook,
} from "./facebook.js";

const app = express();

// Capture raw body so we can verify the FB X-Hub-Signature-256 against it.
app.use(
  "/webhook",
  express.raw({ type: "application/json", limit: "1mb" })
);
app.use(express.json());

const PORT = Number(process.env.PORT ?? 8080);
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL ?? "https://claude.mn";

app.get("/", (_req, res) => {
  res.send("Khashaa chatbot is running.");
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Webhook verification (GET) — Facebook hits this once when you set up the subscription.
app.get("/webhook", (req: Request, res: Response) => {
  const result = verifyWebhook(req.query as Record<string, string | undefined>);
  if (result.ok) {
    res.status(200).send(result.challenge);
  } else {
    console.warn("[webhook] verify rejected", result.reason);
    res.sendStatus(403);
  }
});

// Receive messaging events.
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

  // Acknowledge fast — process in background.
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

  // Echo events are messages we ourselves sent — ignore.
  if (event.message?.is_echo) return;

  const text =
    event.message?.text ??
    event.message?.quick_reply?.payload ??
    event.postback?.payload;
  if (!text) return;

  console.log(`[msg in] ${psid}: ${text}`);

  // Show typing indicator while we think.
  await sendTypingOn(psid).catch(() => undefined);

  let result;
  try {
    const history = getHistory(psid);
    result = await runTurn(history, text, { fbPsid: psid });
    setHistory(psid, result.history);
  } catch (err) {
    console.error("[claude] runTurn failed", err);
    await sendText(
      psid,
      "Sorry, I'm having trouble right now. Please try again in a moment."
    ).catch(() => undefined);
    return;
  }

  // Send the text reply first…
  if (result.reply) {
    await sendText(psid, result.reply).catch((err) => {
      console.error("[fb] sendText failed", err);
    });
  }

  // …then the property carousel for any matched listings (with public images).
  const carouselable = result.matchedListings.filter((l) =>
    l.photos.some((u) => /^https?:\/\//i.test(u))
  );
  if (carouselable.length) {
    await sendPropertyCarousel(psid, carouselable, PUBLIC_SITE_URL).catch(
      (err) => console.error("[fb] carousel failed", err)
    );
  }
}

app.listen(PORT, () => {
  console.log(`[khashaa-chatbot] listening on :${PORT}`);
});
