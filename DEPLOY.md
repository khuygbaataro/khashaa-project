# Deploy Khashaa for free using GitHub

End-to-end recipe to get the agent dashboard + public listings site + Messenger chatbot all running on free tiers, auto-deploying on every push to `main`.

## What you'll have when you're done

| Piece | Hosted on | Cost | Auto-deploy |
|---|---|---|---|
| Frontend (`claude.mn` agent dashboard + public site) | Firebase Hosting | $0 | GitHub Actions on push to main |
| Chatbot server (Messenger webhook) | Render free tier | $0 | Render watches your repo |
| Database / Auth / Storage | Firebase Spark plan | $0 | n/a |

The chatbot server **spins down after ~15 min idle** on Render's free plan. The first message after a quiet period takes ~30 seconds to wake up; subsequent messages are instant. To get an always-on instance, upgrade to Render's $7/mo Starter plan, or move to Cloud Run (also has a generous free tier but requires a credit card).

## Pre-flight: don't leak secrets

Before pushing anything to GitHub, make sure these are clean:

- [ ] `chatbot-server/.env` exists with your real keys — gitignored, never pushed
- [ ] `chatbot-server/.env.example` has only blank placeholders — pushed safely
- [ ] No `service-account*.json` files anywhere in the working tree
- [ ] If a real key was ever in `.env.example`, rotate it: Firebase Console → Service accounts → delete the old key → generate a new one

Run this to triple-check what would be pushed:

```powershell
git status
git diff --cached
```

If you see `private_key` or `BEGIN PRIVATE KEY` anywhere in the diff, **stop** and remove it before committing.

## 1. Create the GitHub repo

```powershell
# In khashaa-project/
gh auth login                # if you have GitHub CLI
gh repo create khashaa-project --private --source=. --remote=origin --push
```

Or manually:
1. <https://github.com/new> → name `khashaa-project` → **Private** → Create
2. From the project folder:
   ```powershell
   git remote add origin https://github.com/YOUR_USERNAME/khashaa-project.git
   git branch -M main
   git push -u origin main
   ```

**Recommend Private** — your `firestore.rules`, `firebase.json`, and project layout aren't sensitive on their own, but private keeps you safer if you accidentally commit a key.

## 2. Deploy the chatbot server to Render (free)

1. Go to <https://render.com> → sign up with GitHub (free, no card)
2. Click **New** → **Blueprint**
3. Pick the `khashaa-project` repo → click **Connect**
4. Render auto-detects `render.yaml` and shows the `khashaa-chatbot` service
5. Click **Apply** — Render starts building, but will pause asking for env vars

In the service's **Environment** tab, paste these values (these match what's in your local `chatbot-server/.env`):

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your `sk-ant-...` from console.anthropic.com |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | From Meta Dev Console → Messenger → "Generate Token" |
| `FACEBOOK_APP_SECRET` | Meta Dev Console → App Settings → Basic → "App Secret" |
| `FACEBOOK_VERIFY_TOKEN` | Any random string you pick (also paste this into Meta's webhook UI) |
| `FIREBASE_SERVICE_ACCOUNT` | Paste the **raw JSON** of your service-account file as a single line |
| `PUBLIC_SITE_URL` | `https://claude.mn` (or temporarily your Firebase hosting URL until DNS lands) |

After the env vars are set, Render finishes the build and gives you a stable URL like:

```
https://khashaa-chatbot.onrender.com
```

**Your Facebook callback URL is now:**

```
https://khashaa-chatbot.onrender.com/webhook
```

Paste that into Meta Dev Console → Messenger → Webhooks → **Callback URL**, with the same **Verify Token** you set above. Subscribe to `messages` and `messaging_postbacks`. Subscribe your Page.

## 3. Deploy the frontend to Firebase Hosting (free)

The repo already includes `.github/workflows/firebase-hosting.yml`. To activate it:

### a. Generate a deploy service account for GitHub Actions

```powershell
firebase login                                         # one time
firebase init hosting:github
```

Answer the prompts:
- Project: `un-property`
- Repo: `YOUR_USERNAME/khashaa-project`
- Set up workflow on PR? **No**
- Set up workflow on merge to main? **Yes** → workflow file already exists, just confirm

This automatically creates a service account in your Firebase project and adds a secret named `FIREBASE_SERVICE_ACCOUNT_UN_PROPERTY` to your GitHub repo.

### b. Add the Vite build secrets to GitHub

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Add:

| Secret name | Value (copy from `.env.local`) |
|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `un-property.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `un-property` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `un-property.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `180697524065` |
| `VITE_FIREBASE_APP_ID` | `1:180697524065:web:47fbd44ad1d2a9bd0d8720` |

(These values are baked into the public JS bundle — they're not secrets in the cryptographic sense, but storing them as Actions secrets keeps the workflow file portable.)

### c. Push to main

```powershell
git push
```

Watch the Actions tab in GitHub. The workflow installs deps, runs `npm run build`, and deploys to Firebase Hosting. After ~2 minutes your app is live at:

```
https://un-property.web.app
https://un-property.firebaseapp.com
```

### d. (Optional) Connect claude.mn

In Firebase Console → **Hosting** → **Add custom domain** → `claude.mn`. Add the DNS records Firebase shows at your registrar. Then in **Authentication** → **Settings** → **Authorized domains**, add `claude.mn` so login works on the custom domain.

SSL takes 24–48h to provision. The Firebase URL works immediately.

## 4. Daily workflow

```powershell
# Make changes
# ...
git add .
git commit -m "feat: add district filter"
git push
```

That's it. Both the frontend and chatbot redeploy automatically on the next push to `main`.

## Troubleshooting

**Render build fails on `npm install`** — open the Render logs. If you see ENOENT on `tsconfig.json`, double-check `rootDir: chatbot-server` is in `render.yaml`.

**Frontend deploys but login is broken on the live URL** — Firebase Auth → Settings → Authorized domains → add the domain.

**Webhook verification fails** — the `FACEBOOK_VERIFY_TOKEN` value in Meta Dev Console must EXACTLY match the `FACEBOOK_VERIFY_TOKEN` env var in Render. Whitespace counts.

**Webhook accepts events but Claude never replies** — open Render logs. Most common: bad `ANTHROPIC_API_KEY`, or `FIREBASE_SERVICE_ACCOUNT` JSON has unescaped newlines. Re-paste it as a single line.

**Render service sleeps and customers wait 30 seconds** — that's the free tier. Either upgrade to Render Starter ($7/mo, always-on), or move to Google Cloud Run (free tier is generous but requires a credit card to enable).
