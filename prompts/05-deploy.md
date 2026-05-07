# Prompt 05 — Deploy to claude.mn

> Run this once Phase 1 features are working locally.

---

The user owns the domain `claude.mn` and wants to deploy the agent dashboard there.

Walk me through Firebase Hosting deployment step by step. Specifically:

1. Confirm `firebase.json` is configured correctly:
   - `hosting.public` = `dist`
   - SPA rewrite: all paths → `/index.html`
   - Cache headers: long-lived for `/assets/*`, no-cache for `index.html`
   - Firestore rules and Storage rules pointing at `firestore.rules` and `storage.rules`

2. Tell me to run these commands in order:
   ```
   npm install -g firebase-tools     # if not already installed
   firebase login
   firebase use --add                # select the Firebase project
   npm run build
   firebase deploy
   ```

3. After deploy, the app is live at `<project-id>.web.app`. Test it works there.

4. Now connect the custom domain `claude.mn`:
   - Go to Firebase Console → Hosting → Add custom domain → enter `claude.mn`
   - Firebase shows two records: a TXT record for verification and an A record (or two) for hosting
   - Add those at the user's domain registrar (where they bought claude.mn)
   - Wait for verification (usually 15 min – 1 hour)
   - Firebase auto-provisions a free SSL certificate (24–48 hours)

5. Also walk me through:
   - Setting up the `www.claude.mn` redirect to apex `claude.mn`
   - Adding the production domain to Firebase Auth → Authorized domains, otherwise login fails on the custom domain
   - Adding production env vars (the `VITE_FIREBASE_*` values are already baked into the build, but confirm with me)

6. Set up a simple GitHub Actions workflow (`.github/workflows/deploy.yml`) that:
   - Triggers on push to `main`
   - Runs `npm install`, `npm run build`
   - Deploys to Firebase using `FirebaseExtended/action-hosting-deploy@v0`
   - Requires the user to add `FIREBASE_SERVICE_ACCOUNT` as a GitHub secret

7. Commit: `chore: production deployment config and CI`

After this, every push to main auto-deploys to claude.mn.

## Manual checklist for the user (give this to me as a final summary)

- [ ] DNS records added at registrar
- [ ] DNS verification passed in Firebase
- [ ] SSL certificate issued (24–48h)
- [ ] `claude.mn` and `www.claude.mn` both load the app
- [ ] Login works on the custom domain (auth domain authorized)
- [ ] Test creating a listing on production
- [ ] GitHub Actions deploys on push
