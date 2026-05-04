# Khashaa — Phase 1 handoff

The agent dashboard is fully built. The code talks to Firebase, but Firebase itself only works once you create the project and paste in the config keys. Three things only **you** can do; everything else is finished.

## What's done

- Vite + React 18 + TypeScript + Tailwind CSS bootstrapped
- Editorial design system applied — Fraunces / Inter Tight / cream + terracotta
- Firebase wiring: `auth`, Firestore (`/agents`, `/listings`), Storage
- Firestore + Storage security rules matching the schema in `CLAUDE.md`
- Auth screens (login + signup) with friendly error mapping
- Listings CRUD with multi-photo upload (auto-compressed to ~1000 px JPEG)
- Real-time sync — every list view subscribes through `onSnapshot`
- Dashboard, "My listings", "All listings", database viewer, profile editor
- Single-page-app routing via react-router
- Firebase Hosting config (`firebase.json`) with SPA rewrite + cache headers

`npm run build` → ✓ compiles cleanly.

## Three things you need to do

### 1. Create the Firebase project

Go to <https://console.firebase.google.com> → Add project → name it `khashaa` (or anything). Once it exists:

1. **Authentication** → Get started → enable **Email/Password**.
2. **Firestore Database** → Create database → **Production mode** → region `asia-east1` (closest to Mongolia).
3. **Storage** → Get started → keep the default rules for now (we'll deploy ours).
4. **Project Settings** (⚙ icon) → **Your apps** → Web app (`</>`) → register app called `khashaa-web`. Copy the config object.

### 2. Drop the config into `.env.local`

Copy `.env.example` to `.env.local` and fill in the six values from step 4 above:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=khashaa-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=khashaa-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=khashaa-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
```

Also edit `.firebaserc` and replace `REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID` with the same `projectId`.

### 3. Run it

```powershell
npm run dev
```

Open <http://localhost:5173>. Click **Create an agent account**, sign up, and you should land on the dashboard with zero listings. Add one — it should appear immediately in "My listings" and "All listings".

## Deploy when ready (Phase 1 → claude.mn)

```powershell
npm install -g firebase-tools
firebase login
firebase deploy
```

That deploys hosting + Firestore rules + Storage rules in one go.

To connect `claude.mn`:

1. Firebase Console → **Hosting** → **Add custom domain** → `claude.mn`.
2. Add the TXT and A records Firebase shows you at your domain registrar.
3. Wait 15 min – 1 hour for verification, 24–48 hours for SSL.
4. **Authentication** → **Settings** → **Authorized domains** → add `claude.mn` (otherwise login breaks on the live domain).

## File layout

```
src/
  components/        Btn, Input, Textarea, Select, Tag, InlineError,
                     PhotoUploader, ProtectedRoute, AppShell
  features/
    auth/            AuthContext, AuthLayout, LoginScreen, SignupScreen
    dashboard/       Dashboard
    listings/        ListingsView, ListingCard, ListingDetail, ListingForm,
                     DatabaseView, useAgentMap
    profile/         ProfileView
  lib/               firebase.ts, schema.ts, listings.ts, auth.ts,
                     palette.ts, utils.ts
  App.tsx, main.tsx, index.css, vite-env.d.ts
firestore.rules, storage.rules, firebase.json, .firebaserc
```

## What's next (per CLAUDE.md)

- **Phase 1.5** — public listings site at the same domain (no login, just browse)
- **Phase 2** — Node + Express chatbot server, Facebook Messenger webhook, Claude Sonnet 4.5 wired to read `/listings`

Both are out of scope for this commit.
