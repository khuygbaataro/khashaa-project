# Khashaa Messenger chatbot

Node + TypeScript Express server that connects your Facebook Page to Claude. It receives Messenger webhooks, lets Claude query your Firestore listings via tool use, and sends the reply (plus a property carousel) back to the customer.

## Architecture in one diagram

```
Customer DM → Facebook → POST /webhook
                         ├─ verify HMAC (FACEBOOK_APP_SECRET)
                         ├─ load thread history (in-memory by PSID)
                         └─ runTurn(history, text)
                              ├─ Claude messages.create with tools
                              ├─ Claude calls search_listings → Firestore admin SDK
                              ├─ Claude calls get_listing_details / create_seller_lead / request_human_agent
                              └─ Claude returns final text
                         ├─ sendText(psid, reply)
                         └─ sendPropertyCarousel(psid, matches) ← if any match has a public photo
```

## Local dev

### 1. Install deps

```powershell
cd chatbot-server
npm install
```

### 2. Set env vars

Copy `.env.example` to `.env` and fill in:

| Var | Where it comes from |
|---|---|
| `ANTHROPIC_API_KEY` | <https://console.anthropic.com> → API Keys |
| `ANTHROPIC_MODEL` | Optional — `claude-haiku-4-5` (default, cheap) or `claude-opus-4-7` (better, costlier) |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Meta dev console → Messenger → Settings → "Generate Token" for your page |
| `FACEBOOK_APP_SECRET` | Meta dev console → App Settings → Basic → "App Secret" |
| `FACEBOOK_VERIFY_TOKEN` | You pick this (any string). Paste the **same string** into Meta's webhook setup. |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Console → Project Settings → Service accounts → Generate new private key, then base64 the JSON file: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account.json"))` |
| `PUBLIC_SITE_URL` | URL where customers can view full listings, e.g. `https://claude.mn` |

### 3. Run

```powershell
npm run dev      # tsx watch mode
```

Should print `[khashaa-chatbot] listening on :8080`.

### 4. Expose to the internet (Facebook can't hit localhost)

Easiest: **ngrok** (free).

```powershell
# Install: https://ngrok.com/download
ngrok http 8080
```

Copy the `https://xxxx-xx-xx-xx-xx.ngrok-free.app` URL — that's your webhook URL.

## Wire up Facebook

You said you've done this before, so this is the short version:

1. <https://developers.facebook.com> → your App → **Messenger** product → **Webhooks** → **Add subscription**
2. **Callback URL:** `https://your-ngrok-or-cloud-run-url/webhook`
3. **Verify Token:** the same string as `FACEBOOK_VERIFY_TOKEN` in your `.env`
4. Subscribe to **`messages`**, **`messaging_postbacks`** (and `messaging_optins` if you want)
5. **Connect a page** → pick your Khashaa page → click **Subscribe**
6. Generate a **Page Access Token** for that same page → paste into `.env`
7. Send your page a DM to test — you should see logs like `[msg in] 12345: бид айл худалдаж авах...`

## Deploy to production

### Option A — Google Cloud Run (recommended; HTTPS + scale-to-zero free tier)

```powershell
# One-time
gcloud auth login
gcloud config set project un-property
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# From chatbot-server/
gcloud run deploy khashaa-chatbot `
  --source . `
  --region asia-northeast1 `
  --platform managed `
  --allow-unauthenticated `
  --set-env-vars "ANTHROPIC_API_KEY=sk-...,FACEBOOK_PAGE_ACCESS_TOKEN=...,FACEBOOK_APP_SECRET=...,FACEBOOK_VERIFY_TOKEN=...,FIREBASE_SERVICE_ACCOUNT=...,PUBLIC_SITE_URL=https://claude.mn"
```

Cloud Run gives you a URL like `https://khashaa-chatbot-xxxxxx-an.a.run.app`. Update your Facebook webhook callback URL to `<that-url>/webhook`.

Cloud Run has a generous free tier (2M requests/month, 360k vCPU-seconds). Realistic monthly cost for moderate traffic: $0.

### Option B — Render

1. Push this repo to GitHub
2. <https://render.com> → New → Web Service → connect repo → root dir: `chatbot-server`
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add the env vars in the Render dashboard
6. Deploy → copy the `https://...onrender.com` URL → update FB webhook

## Test prompts

Once your page is wired up, message it something like:

- "I want to rent a 2-bedroom apartment under $700 in Sukhbaatar"
- "Би 3 өрөө байр Зайсан хорооллод авмаар байна, төсөв 250 мянган доллар"
- "I have an apartment to rent out, can someone help me list it?"
- "Connect me to a human agent"

The bot should:
1. Reply in the same language
2. For "find" intents: call `search_listings`, summarize matches, send a photo carousel
3. For "list" intents: collect name + phone + location, call `create_seller_lead`
4. For "human" intents: call `request_human_agent` and reassure them

## Things you can tune

- `chatbot-server/src/tools.ts` — the `SYSTEM_PROMPT` is the personality + rules. Tweak it.
- `chatbot-server/src/conversation.ts` — `MAX_TURNS = 20`, `TTL_MS = 6h`. Bump if you want longer memory.
- `chatbot-server/src/listings.ts` → `searchListings()` — the in-memory filter logic. Add weighting / fuzzy match here.
- `ANTHROPIC_MODEL` — flip to `claude-opus-4-7` for sharper conversations, or stick with `claude-haiku-4-5` for cost.

## Leads inbox

The bot writes seller / handoff leads into Firestore at `/leads`. The current Firestore rules let any authenticated agent read and update them. The agent dashboard doesn't yet have a UI for `/leads` — that's the next phase. For now you can see them in the Firebase Console → Firestore → `leads`.
