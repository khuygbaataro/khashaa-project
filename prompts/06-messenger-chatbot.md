# Prompt 06 — Messenger chatbot (Phase 2)

> Run this only after Phase 1 is deployed and stable.

---

Build the Facebook Messenger AI chatbot that reads from the same Firestore database the agent dashboard writes to.

## Prerequisites the user needs to have done

- A Facebook Page for the real estate business
- A Facebook Developer account at <https://developers.facebook.com>
- A Meta App with Messenger product enabled
- Generated a Page Access Token (from Messenger product → Access Tokens → Generate)
- An Anthropic API key from <https://console.anthropic.com>
- A Firebase service account JSON (from Firebase Console → Project Settings → Service accounts → Generate new private key)

## What to build

Create a new directory `chatbot/` inside the project (separate from the frontend). Inside:

1. `package.json` — Node.js project with these dependencies:
   - `express` (web server)
   - `firebase-admin` (server-side Firestore access)
   - `@anthropic-ai/sdk` (Claude API)
   - `axios` (for Facebook Send API calls)
   - `dotenv`

2. `src/server.ts` — Express server with two routes:
   - `GET /webhook` — Facebook verification handshake. Compare `hub.verify_token` to env `FACEBOOK_VERIFY_TOKEN`, echo back `hub.challenge`.
   - `POST /webhook` — receives messages. Loop through `body.entry[].messaging[]`, extract sender PSID and text, hand off to `handleMessage()`. Always reply 200 OK fast (Facebook retries otherwise — process async).

3. `src/firebase.ts` — initialize Firebase Admin from the service account JSON in env

4. `src/listings.ts` — server-side helpers:
   - `searchListings(criteria)` where criteria is `{ type?, maxPrice?, minPrice?, district?, beds?, location? }` — returns matching active listings from Firestore

5. `src/messenger.ts` — Facebook Send API helpers:
   - `sendText(psid, text)`
   - `sendImage(psid, imageUrl)`
   - `sendCarousel(psid, listings)` — generic template carousel showing up to 10 listing cards with photo, title, price, and a "View details" button linking to the public listings site

6. `src/agent.ts` — the AI brain. Use Claude API with **tool use** (function calling). Define tools:
   - `search_listings(type, max_price, min_price, district, beds)` → returns up to 10 matching listings
   - `create_seller_lead(name, phone, property_description, asking_price, location)` → writes a `/leads` document for an agent to follow up
   - `request_human_handoff(reason)` → flags the conversation for a human agent

   The system prompt should:
   - Identify language (Mongolian or English) and reply in same language
   - Be warm but concise
   - Never invent listings — only describe ones returned by `search_listings`
   - When showing matches, send a text intro then a carousel
   - For sellers: collect property details conversationally, then call `create_seller_lead`
   - When asked questions outside scope (legal advice, mortgages), politely defer to a human agent

7. `src/conversations.ts` — persist conversation history per PSID in Firestore at `/conversations/{psid}` so context survives across messages. Include the last 20 turns when calling Claude.

8. `Dockerfile` — for deploying to Cloud Run or Render. Node 22 alpine, install deps, build, expose port 8080.

9. `.env.example`:
   ```
   ANTHROPIC_API_KEY=
   FACEBOOK_PAGE_ACCESS_TOKEN=
   FACEBOOK_VERIFY_TOKEN=     # any random string you choose, must match Facebook config
   FIREBASE_SERVICE_ACCOUNT=  # base64-encoded JSON
   PORT=8080
   ```

10. `README.md` in `chatbot/` explaining:
    - How to run locally with `ngrok` for Facebook to reach the webhook
    - How to deploy to Cloud Run
    - How to register the webhook URL in the Meta dashboard
    - How to test with the Page's test mode before going live

## Tasks for the agent dashboard (Phase 1 frontend)

In the existing frontend, add a new "Leads" section:
- Reads from `/leads` collection (sorted newest first)
- Shows seller's name, phone, location, asking price, description, status
- Agent can mark a lead as "contacted" or "closed"
- Add a Leads tab to the AppShell nav

## Important: model choice and cost

Default to `claude-haiku-4-5-20251001` for routine queries (search-and-respond) — it's much cheaper. Escalate to `claude-opus-4-7` only when the conversation is complex or when the customer is a seller (more careful conversation needed). Add an env var `CLAUDE_MODEL_DEFAULT` and `CLAUDE_MODEL_PREMIUM` so the user can adjust.

## Test plan

1. Run locally with ngrok, register webhook, message the page from a test account
2. Try: "Show me 3-bed apartments under $200k in Sukhbaatar" → should return matching listings
3. Try: "I want to sell my house" → should ask for details, eventually call `create_seller_lead`
4. Verify the lead appears in the agent dashboard in real-time

## Commit

`feat: messenger chatbot with claude tool use, listings search, and seller lead capture`
