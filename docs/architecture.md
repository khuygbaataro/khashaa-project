# Architecture overview

How the three pieces of Khashaa connect.

```
┌─────────────────────────────────────────────────────────────────┐
│                         claude.mn (web)                         │
│                                                                 │
│   ┌──────────────────────┐     ┌──────────────────────────┐     │
│   │  Agent dashboard     │     │  Public listings (P1.5)  │     │
│   │  (login required)    │     │  (no login)              │     │
│   │                      │     │                          │     │
│   │  - Add listings      │     │  - Browse all listings   │     │
│   │  - Upload photos     │     │  - Search and filter     │     │
│   │  - Manage profile    │     │  - View details          │     │
│   │  - View leads        │     │                          │     │
│   └──────────┬───────────┘     └────────────┬─────────────┘     │
│              │                              │                   │
└──────────────┼──────────────────────────────┼───────────────────┘
               │                              │
               │   write + read               │   read only
               ▼                              ▼
       ┌─────────────────────────────────────────────────┐
       │              Firebase (Google)                  │
       │                                                 │
       │   Firestore       Storage         Auth          │
       │   /listings       /listings/      email +       │
       │   /agents         /{id}/*.jpg     password      │
       │   /leads                                        │
       │   /conversations                                │
       └────────────────────┬────────────────────────────┘
                            │
                            │  read + write
                            ▼
       ┌─────────────────────────────────────────────────┐
       │       Chatbot server (Cloud Run / Render)       │
       │                                                 │
       │   - Express webhook /webhook                    │
       │   - Receives messages from Facebook             │
       │   - Calls Claude API with tool use              │
       │   - Searches Firestore for matching listings    │
       │   - Replies via Facebook Send API               │
       │   - Saves seller leads to /leads                │
       └─────────┬─────────────────────────────┬─────────┘
                 │                             │
                 │  webhook events             │  Claude API
                 ▼                             ▼
       ┌──────────────────┐          ┌──────────────────┐
       │  Facebook        │          │   Anthropic API  │
       │  Messenger       │          │                  │
       │  (customers)     │          │  claude-opus-4-7 │
       └──────────────────┘          │  claude-haiku-4-5│
                                     └──────────────────┘
```

## Data flow examples

### Agent adds a listing

1. Agent opens claude.mn, signs in
2. Fills out listing form, uploads 5 photos
3. Frontend compresses each photo to ~1000px JPEG
4. Photos upload to Firebase Storage at `/listings/{id}/*.jpg`
5. Listing document written to Firestore at `/listings/{id}`
6. Other agents' open dashboards see the new listing appear via `onSnapshot`
7. Public site (when built) sees it. Chatbot can now match it.

### Customer searches via Messenger

1. Customer messages Facebook Page: "I'm looking for a 2-bedroom apartment under $150k in Sukhbaatar"
2. Facebook posts the message to chatbot's `/webhook`
3. Server appends to `/conversations/{psid}` history
4. Server calls Claude API with system prompt + conversation + tools
5. Claude calls `search_listings(type="sale", max_price=150000, beds=2, district="Sukhbaatar")`
6. Server queries Firestore, returns matching docs
7. Claude calls Facebook Send API to send a text intro and a carousel of properties with photos, prices, "View details" buttons
8. Photos in the carousel link to the public listings page on claude.mn

### Customer wants to sell their house

1. Customer messages: "I want to sell my apartment"
2. Claude detects intent → asks for details conversationally
3. After collecting name, phone, location, asking price, description, Claude calls `create_seller_lead()`
4. Server writes a doc to `/leads/{id}` with status="new"
5. Agents see new lead appear in their Leads tab in real-time
6. Agent calls the customer back

## Why this architecture

- **One database, three faces.** Agent app, public site, chatbot all read the same Firestore. Add a listing once → it's available everywhere.
- **No backend to maintain in Phase 1.** Firebase handles auth, storage, security rules. The frontend talks directly to Firestore.
- **Chatbot is a thin layer.** Its only jobs are: translate Facebook events into Claude calls, and translate Claude tool calls into Firestore queries. It does not contain business logic about real estate.
- **Claude is the business logic.** The system prompt + tools define how the AI behaves. Updating behavior = editing the prompt, not redeploying code.
- **Cost-tunable.** Use Haiku for cheap routine queries, Opus only when needed. Caching common queries can cut costs further.

## What this architecture is NOT good for

- **High-frequency trading-style data.** Firestore reads cost money; real-time stock tickers would be expensive. Real estate listings change slowly, so it's fine.
- **Complex relational queries.** Firestore is a document DB. If you later need "show me all agents who have at least one listing in Sukhbaatar over $300k that hasn't sold in 6 months," you'd want to denormalize or move to Postgres (Supabase).
- **Heavy server-side processing.** No Lambda functions in Phase 1. If you need them later (e.g. scheduled emails, market reports), add Cloud Functions then.

Keep this architecture in mind when extending the project — does the new feature fit, or does it require a new piece?
