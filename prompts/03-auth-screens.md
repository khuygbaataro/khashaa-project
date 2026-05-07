# Prompt 03 — Auth screens (login + signup)

> Run this after Firebase is wired up.

---

I've already built a working prototype of the agent dashboard in a single file called `realestate-agent-app.jsx` (in this folder or shared with you separately). It demonstrates the exact visual design I want — the editorial real-estate aesthetic with Fraunces serif, cream background, terracotta accent. **Match that design language precisely.** The prototype uses an in-memory storage layer; we are now replacing that with Firebase.

Build the authentication screens:

1. Create `src/features/auth/LoginScreen.tsx` — a full-page split layout:
   - Left half (hidden on mobile): dark `ink` background with the Khashaa logo, the headline "Listings, agents, and conversations — *in one place.*" using Fraunces, and a subtle footer line
   - Right half: the form (email + password, "Sign in" button, link to "Create an agent account")

2. Create `src/features/auth/SignupScreen.tsx` — same layout but with a name field added, button says "Create account", link goes back to sign in

3. Create `src/features/auth/AuthContext.tsx` — a React context that:
   - Subscribes to `onAuthChange`
   - Exposes `currentAgent`, `loading`, and `signOut` to the rest of the app
   - Wraps the entire app in `main.tsx`

4. Create `src/components/ProtectedRoute.tsx` — a wrapper that redirects to `/login` if not authenticated, or shows a centered `Loader` icon while auth state is loading

5. Set up routing in `App.tsx` using `react-router-dom`:
   - `/login` → LoginScreen
   - `/signup` → SignupScreen
   - `/*` (everything else) → ProtectedRoute that wraps the rest of the app
   - For now, the protected area shows a placeholder dashboard saying "Welcome, {agent.name}" with a sign-out button

6. Use the same primitive components from the prototype:
   - `Btn` with variants `primary`, `secondary`, `ghost`, `danger`
   - `Input` with label and error state
   - Same hover/focus styling — terracotta border on focus

7. Handle errors gracefully — show inline error messages with the `AlertCircle` icon and a soft red background, never alert dialogs

8. After signup, automatically create the matching `/agents/{uid}` document with the schema fields, then redirect to dashboard

9. Test the full flow: signup → see name on dashboard → sign out → sign in again with same credentials

10. Commit: `feat: agent auth screens with login, signup, protected routes`

When you're done, give me the URL to test (`http://localhost:5173`) and tell me what to verify.
