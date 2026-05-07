# Khashaa — Real Estate Platform

Real estate platform for Mongolia. Agent dashboard + public listings + Messenger AI chatbot. All connected to one Firebase database.

## What's in this repository

- `CLAUDE.md` — **the most important file.** Read this. Claude Code reads it automatically. It explains the whole project.
- `realestate-agent-app.jsx` — working prototype of the agent dashboard (single React file, drop-in)
- `prompts/` — battle-tested prompts to use with Claude Code, organized by phase
- `docs/` — architecture diagrams, database schema, deployment guide

## Quick start with Claude Code

### 1. Install Claude Code

Claude Code is Anthropic's terminal-based AI coding agent. You'll need:
- A Claude Pro account (~$20/month) or higher, **or** an Anthropic Console account with API credits
- Node.js 18+ if you choose the npm install path
- macOS, Linux, or Windows (with WSL or Git for Windows)

**The native installer is the recommended method** — no Node.js required:

```bash
# macOS / Linux
curl -fsSL https://claude.ai/install.sh | bash

# Windows (in PowerShell, not CMD)
irm https://claude.ai/install.ps1 | iex
```

Then verify:
```bash
claude --version
```

(For full installation options including npm and platform-specific notes, see the official docs at <https://docs.claude.com/en/docs/claude-code/overview>.)

### 2. Authenticate

```bash
claude
```

This opens a browser for login. Use the same account that has your Pro/Max/Console subscription.

### 3. Open this project

```bash
cd path/to/khashaa-project
claude
```

Claude Code will automatically read `CLAUDE.md` and understand the project.

### 4. Use the prompts

The `prompts/` folder has ready-to-paste prompts for each step. Start with `prompts/01-bootstrap.md`.

## Project phases

1. **Phase 1: Agent dashboard** — login, listings CRUD, photo upload, real-time DB sync
2. **Phase 1.5: Public listings site** — customers browse without logging in
3. **Phase 2: Messenger AI chatbot** — Facebook integration + Claude API
4. **Phase 3: Polish** — Mongolian language support, MNT pricing, lead inbox

You're starting at Phase 1.

## Recommended workflow

For each new feature:
1. Open the matching prompt in `prompts/`
2. Paste it into Claude Code
3. Let Claude propose changes — review them before approving
4. Test in the browser (`npm run dev`)
5. Commit with a clear message
6. Move to the next prompt

Don't try to do everything in one session. Build piece by piece.

## Domain & deployment

The user owns `claude.mn`. Firebase Hosting will serve both the agent dashboard and (later) the public listings site from this domain. The chatbot server runs separately and is reached via Facebook's webhook URL.

## Need help mid-build?

If Claude Code gets stuck or makes a confusing change, the simplest fix is:
1. `git diff` — see what changed
2. If it's wrong, `git restore .` and try again with a more specific prompt
3. If it's right but incomplete, paste the error message and ask Claude to fix it

The prompts in this repo are designed to give Claude enough context to succeed on the first try, but be ready to iterate.
