# CLAUDE.md — Khashaa Real Estate Platform

> This file is read by Claude Code automatically on every session.
> It tells Claude what the project is, how it's organized, and how you want it built.
> Edit this file as the project grows.

## Project overview

**Khashaa** is a real estate platform for Mongolia (initially Ulaanbaatar). It has three connected pieces:

1. **Agent web dashboard** — agents log in, add/edit/delete property listings, upload photos. *(Phase 1 — building now)*
2. **Public listings site** — customers browse all listings on the web. *(Phase 1.5)*
3. **Facebook Messenger AI chatbot** — customers chat in Messenger, the AI helps them find properties to buy/rent and helps sellers list their property. *(Phase 2)*

The agent dashboard, public site, and chatbot all read from the **same database**. The agent app writes to it, the chatbot reads from it.

Target domain: `claude.mn` (the user's own domain — not Anthropic).

## Tech stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend / database:** Firebase (Firestore + Storage + Authentication)
- **Hosting:** Firebase Hosting (free tier handles initial traffic)
- **Chatbot server (Phase 2):** Node.js + Express, deployed to Cloud Run or Render
- **AI:** Anthropic Claude API (`claude-opus-4-7` for high-quality conversations, fall back to `claude-haiku-4-5` for cost optimization on simple queries)
- **Messenger integration:** Facebook Graph API + webhook on chatbot server

Reasoning behind these choices:
- Firebase gives real-time sync, auth, storage, and hosting in one bundle — no separate backend to maintain in Phase 1
- Vite + React is fast to build, fast to deploy, well understood by Claude
- Tailwind keeps styling consistent and readable
- Claude API for the chatbot because the agent uses Claude — keep the stack coherent

## Design system

This is **not a generic SaaS dashboard**. The aesthetic is **editorial real-estate** — think The Modern House or Sotheby's, not Zillow.

- **Display font:** Fraunces (serif, for headings and prices)
- **Body font:** Inter Tight (sans-serif, for UI text)
- **Mono font:** JetBrains Mono (for database views and code)
- **Palette:**
  - Background: cream `#F4EFE6`
  - Paper: white `#FFFFFF`
  - Ink (primary text): `#1F1A15`
  - Ink soft (secondary): `#6B6258`
  - Accent (terracotta): `#B85540`
  - Forest (success / "for sale" tag): `#3D5A40`
  - Border: `#E5DDC9`
- **No gradients, no drop shadows, no purple-to-blue AI clichés.** Flat surfaces, 1px borders, generous whitespace.
- Sentence case everywhere. Never Title Case, never ALL CAPS.
- All prices in USD initially, with MNT (Mongolian tugrik) as a future toggle.

## Database schema (Firestore)

Two top-level collections.

### `/agents/{agentId}`
```
{
  id: string,              // matches Firebase Auth uid
  name: string,            // "Bat-Erdene Ganbold"
  email: string,
  bio: string,             // shown to customers in chat
  avatar: string,          // 2-letter initials
  phone: string,           // optional, for Messenger handoff
  joinedAt: timestamp,
}
```

### `/listings/{listingId}`
```
{
  id: string,
  agentId: string,         // foreign key → /agents
  title: string,           // "Three-bedroom apartment, Sukhbaatar district"
  type: "sale" | "rent",
  price: number,           // in USD
  currency: "USD",
  location: string,        // "Sukhbaatar district, Ulaanbaatar"
  district: string,        // structured field for filtering, e.g. "Sukhbaatar"
  city: string,            // "Ulaanbaatar"
  beds: number,
  baths: number,
  sqm: number,             // floor area in square meters
  photos: string[],        // array of Firebase Storage URLs
  description: string,
  status: "active" | "pending" | "sold" | "rented",
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

Firestore security rules (must enforce):
- Anyone can read `/listings` where `status == "active"` (so the public site and chatbot can read)
- Only authenticated agents can create listings
- An agent can only update/delete listings where `agentId == request.auth.uid`
- `/agents` profiles are readable by anyone authenticated, writable only by the owner

## Phase 1 — features to build (current focus)

Required for v1:
- [ ] Agent signup + login (Firebase Auth, email + password)
- [ ] Agent profile page (view + edit name, bio, phone)
- [ ] Add new listing (form with all schema fields)
- [ ] Multi-photo upload to Firebase Storage with automatic compression to ~1000px JPEG
- [ ] Edit existing listing
- [ ] Delete listing (with confirmation)
- [ ] "My listings" view — agent sees only their own
- [ ] "All listings" view — agent sees everyone's listings (read-only for others)
- [ ] Listing detail page with photo carousel
- [ ] Search by title and location, filter by type (sale/rent)
- [ ] Dashboard with stats: active listings, total portfolio value
- [ ] Real-time sync — when one agent adds a listing, others see it appear without refresh (use Firestore `onSnapshot`)

Not in v1 (deliberately):
- No customer-facing pages yet
- No messaging between agents and customers
- No payments
- No analytics dashboard

## Phase 2 — Messenger chatbot (after Phase 1 is solid)

The chatbot is a separate Node.js server that:
1. Receives webhook events from Facebook when a customer messages your Page
2. Identifies intent (buy / rent / sell / general question)
3. Queries Firestore for matching listings
4. Calls Claude API with the customer's message + the relevant listings as context
5. Sends Claude's reply back to Facebook, including photo attachments for matched properties
6. If the customer wants to sell their house, collects details and creates a "lead" record that an agent can pick up in the dashboard

The chatbot must:
- Detect language (Mongolian / English) and reply in the same language
- Hand off to a human agent when the customer asks
- Never fabricate listings — only respond with properties actually in the database
- Quote prices in USD with MNT equivalent

## Coding conventions

- Use functional React components with hooks. No class components.
- Use TypeScript for new files. (Existing JSX is fine to keep but new code is TS.)
- One component per file. Component file matches component name in PascalCase.
- Folder structure:
  ```
  /src
    /components       — shared UI primitives (Button, Input, Tag, etc.)
    /features
      /auth           — login, signup, profile
      /listings       — listings CRUD, cards, detail
      /dashboard      — agent dashboard
    /lib
      firebase.ts     — Firebase init + helpers
      schema.ts       — TypeScript types for Listing, Agent
      utils.ts        — formatting helpers
    /pages            — route-level components
    App.tsx
    main.tsx
  ```
- Commit message style: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:` prefixes.
- Always write a one-sentence description at the top of each new file.
- Never commit `.env` files. Use `.env.example` to document required keys.

## Required environment variables

```
# .env.local (frontend — Firebase config from Firebase console)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# .env (chatbot server — Phase 2)
ANTHROPIC_API_KEY=
FACEBOOK_PAGE_ACCESS_TOKEN=
FACEBOOK_VERIFY_TOKEN=
FIREBASE_SERVICE_ACCOUNT=    # JSON, base64-encoded
```

## Build, run, deploy

```bash
# Local development
npm install
npm run dev          # starts Vite on http://localhost:5173

# Production build
npm run build        # outputs to /dist

# Deploy to Firebase Hosting
firebase login
firebase deploy
```

To connect the custom domain `claude.mn` to Firebase Hosting:
1. In Firebase console → Hosting → Add custom domain → enter `claude.mn`
2. Firebase shows DNS records (an A record and a TXT verification record)
3. Add those records at the user's domain registrar
4. Wait 24–48 hours for DNS to propagate and SSL to issue

## How Claude Code should work on this project

- Read this file at the start of every session.
- Before adding a feature, check the Phase 1 / Phase 2 lists above. Don't build Phase 2 features in Phase 1.
- Don't change the design system colors or fonts without asking the user.
- When unsure about Firebase rules or schema changes, **ask before editing**.
- Use `git` consistently. Make small commits with clear messages.
- After implementing a feature, run `npm run build` to verify it compiles before saying "done".
- When adding a new dependency, briefly explain why in the commit message.
- The user is in Mongolia (UTC+8) and may prefer English or Mongolian instructions — match the language they use.
