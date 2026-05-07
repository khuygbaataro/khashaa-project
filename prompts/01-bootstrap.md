# Prompt 01 — Bootstrap the project

> Paste this into Claude Code in an empty folder where you want the project to live.
> Make sure `CLAUDE.md` is already in the folder so Claude can read it.

---

Read `CLAUDE.md` first to understand the project. Then bootstrap a new Vite + React + TypeScript + Tailwind CSS project in this directory.

Specifically:

1. Initialize a Vite project with the `react-ts` template
2. Install and configure Tailwind CSS following the official Vite + Tailwind setup
3. Install these additional dependencies:
   - `firebase` (latest)
   - `lucide-react` (for icons)
   - `react-router-dom` (for routing)
4. Set up the folder structure exactly as described in the "Coding conventions" section of `CLAUDE.md`
5. Create a `.env.example` listing all the `VITE_FIREBASE_*` variables, and add `.env.local` to `.gitignore`
6. Configure Tailwind with the custom colors from the design system in `CLAUDE.md`:
   - `cream: #F4EFE6`, `paper: #FFFFFF`, `ink: #1F1A15`, `inkSoft: #6B6258`, `terracotta: #B85540`, `forest: #3D5A40`, `border: #E5DDC9`
7. Add the Google Fonts (Fraunces, Inter Tight, JetBrains Mono) via `index.html`
8. Configure `font-display`, `font-body`, `font-mono` utility classes in Tailwind config
9. Replace the default Vite splash page with a simple placeholder that says "Khashaa" using the Fraunces display font on the cream background, just to verify the design system works
10. Initialize a git repo with a sensible `.gitignore` and make the first commit: `chore: bootstrap Vite + React + TS + Tailwind + Firebase`

After everything is set up, run `npm run dev` to make sure it starts without errors, then summarize what was created and what's in the next prompt.

Do NOT yet:
- Set up Firebase Auth or Firestore
- Build any listings UI
- Add login screens

Just get the foundation right.
