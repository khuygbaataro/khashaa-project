# How to use these prompts with Claude Code

These prompts are designed to be **pasted into Claude Code one at a time**. Each one builds on the previous. Don't skip ahead.

## The order

| # | Prompt | What it does | Time |
|---|--------|--------------|------|
| 01 | `01-bootstrap.md` | Create empty Vite + React + Tailwind project | 5 min |
| 02 | `02-firebase.md` | Wire up Firebase Auth + Firestore + Storage | 15 min |
| 03 | `03-auth-screens.md` | Build login + signup UI | 20 min |
| 04 | `04-listings-crud.md` | Build listings, photos, dashboard, profile | 60 min |
| 05 | `05-deploy.md` | Deploy to claude.mn | 30 min + DNS wait |
| 06 | `06-messenger-chatbot.md` | Phase 2: Messenger AI chatbot | 90 min |

## How to run a prompt

1. Open your terminal in the project folder
2. Run `claude` to start Claude Code
3. Open the prompt file (e.g. `prompts/01-bootstrap.md`)
4. **Copy the entire contents** (everything below the `---`) and paste into Claude Code
5. Claude Code will propose changes — read them, then accept

## Tips for a smooth ride

**Always have `CLAUDE.md` in the project root.** Claude Code reads it automatically every session. It contains the schema, design system, and conventions. Without it, Claude has to guess.

**One prompt = one feature.** Don't combine. If something feels too big, split it. The cost of running another prompt is small; the cost of half-broken code is large.

**Review before approving.** When Claude shows a diff, actually read it. If a file change looks wrong (e.g. it's modifying the design system without you asking), reject it and refine your prompt.

**Test after each prompt.** Run the app, click around, find issues immediately. If you wait until prompt 06, debugging will be painful.

**Commit after each successful prompt.** That way you can `git restore` if the next prompt makes things worse.

**Ask Claude to explain.** If you're unsure why a file is structured a certain way, ask: *"Explain the structure of `src/lib/listings.ts` and why each function exists."* Claude Code answers questions about code as well as it writes code.

## When prompts go wrong

If Claude Code does something unexpected:

1. `git diff` — see exactly what changed
2. If it's wrong: `git restore .` and rephrase the prompt with more specifics
3. If it's mostly right but has a bug: paste the error and ask Claude to fix it
4. If Claude is going in circles: start a new Claude Code session (sometimes the conversation context drifts)

## Customizing the prompts

These prompts are a starting point. Feel free to:
- Change "Khashaa" to whatever you name your business
- Adjust the design system colors in `CLAUDE.md` (Claude will respect them)
- Add more fields to the Listing schema (e.g. parking, year built, balcony) — just update both `CLAUDE.md` and the schema before running prompts

## Useful one-off prompts

A few extra prompts to keep handy:

### Add a new field to listings
> Add a `parking` boolean field to the Listing schema. Update `src/lib/schema.ts`, the Firestore security rules if needed, the ListingForm (checkbox), the ListingCard (small icon if true), and the ListingDetail (in the stats grid). Don't forget to update CLAUDE.md.

### Add Mongolian language toggle
> Add an `i18n` system using react-i18next. Wrap all UI strings. Provide English and Mongolian translations. Add a language toggle in the AppShell header. Save the choice to localStorage.

### Add MNT currency
> Add a currency toggle (USD / MNT). When MNT is selected, fetch the exchange rate from a public API once per session and convert all prices. Show both currencies on the listing detail page.

### Build the public listings site
> Build a separate set of routes under `/browse` that don't require auth. Customers can search and view listings but cannot edit. Reuse the ListingCard and ListingDetail components but hide the edit/delete buttons. Add SEO meta tags using react-helmet-async.

### Add an admin role
> Add a `role` field to agents (`agent` | `admin`). Admins can edit any listing, not just their own. Update the security rules. Add a `/admin` route that's only visible to admins, showing a flat list of all agents and their listing counts.

## What's NOT in these prompts (intentionally)

- **No Stripe / payments.** Real estate transactions don't happen online.
- **No SMS.** Email + Messenger is enough for v1.
- **No mobile app.** A responsive web app on a phone browser is sufficient.
- **No analytics dashboard.** Add it later when you have traffic.

Keep it simple. Ship Phase 1. Then iterate.
