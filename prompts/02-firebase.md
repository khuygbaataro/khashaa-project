# Prompt 02 — Wire up Firebase

> Run this after Prompt 01 succeeds and you've created your Firebase project in the Firebase console.

---

Before pasting this prompt, the user has done the following manually:
- Created a Firebase project at <https://console.firebase.google.com>
- Enabled Authentication → Email/Password sign-in
- Created a Firestore database in production mode (region: choose closest, e.g. `asia-east1` for Mongolia)
- Created a Firebase Storage bucket
- Copied the web app config and pasted the values into `.env.local`

Now do the following:

1. Create `src/lib/firebase.ts` that initializes Firebase using the env vars and exports:
   - `auth` (from `getAuth`)
   - `db` (from `getFirestore`)
   - `storage` (from `getStorage`)

2. Create `src/lib/schema.ts` with TypeScript interfaces matching the database schema from `CLAUDE.md`. Specifically `Agent` and `Listing` types. Use Firestore `Timestamp` type for date fields.

3. Create `src/lib/listings.ts` with these helpers:
   - `subscribeToListings(callback)` — uses `onSnapshot` to stream all active listings to the callback. Returns an unsubscribe function.
   - `subscribeToMyListings(agentId, callback)` — same but filtered by agentId
   - `createListing(data)` — adds a new listing document, returns the new id
   - `updateListing(id, data)` — updates an existing listing
   - `deleteListing(id)` — deletes
   - `uploadPhoto(file, listingId)` — compresses to ~1000px JPEG, uploads to Firebase Storage at `listings/{listingId}/{timestamp}.jpg`, returns the download URL

4. Create `src/lib/auth.ts` with:
   - `signUp(email, password, name)` — creates a Firebase Auth user AND creates a matching `/agents/{uid}` document
   - `signIn(email, password)` — wraps `signInWithEmailAndPassword`
   - `signOutUser()` — wraps `signOut`
   - `onAuthChange(callback)` — wraps `onAuthStateChanged`, returns the current Agent doc (not just the Firebase user)

5. Create `firestore.rules` at the project root with the security rules from the "Database schema" section of `CLAUDE.md`. Specifically:
   - Anyone can read listings where `status == "active"`
   - Only authenticated users can create listings, and the listing's `agentId` must equal `request.auth.uid`
   - Only the owning agent can update or delete their listing
   - Agent profiles are readable by any authenticated user, writable only by the owner

6. Create `storage.rules` allowing authenticated users to upload to `listings/{listingId}/*` and anyone to read.

7. Add a `firebase.json` configured for hosting (`dist` as public dir, SPA rewrite to `/index.html`), Firestore, and Storage. Add a `.firebaserc` template.

8. Verify: write a tiny test in `src/lib/firebase.ts` (or a separate scratch file) that connects, then remove it.

9. Commit: `feat: wire up Firebase auth, firestore, storage with security rules`

After this, the foundation talks to Firebase but there's still no UI. The next prompt builds the auth screens.
