# Prompt 04 — Listings CRUD with photo upload

> The biggest prompt. Run this after auth works end-to-end.

---

Build the full listings feature, matching the design of `realestate-agent-app.jsx`. Use Firebase for everything — no in-memory storage.

## Components to build

### 1. `src/components/PhotoUploader.tsx`
- Accepts `value: string[]` (existing photo URLs) and `onChange: (urls: string[]) => void`
- Shows a grid of photo previews + an "Add" tile
- On file select: compresses each image client-side to ~1000px wide JPEG at 0.75 quality, then uploads to Firebase Storage via `uploadPhoto()` from `src/lib/listings.ts`
- First photo gets a "Cover" badge in the top-left
- Hover any photo to reveal a delete X in the top-right
- Maximum 8 photos
- Show a loading spinner on the "Add" tile while uploading

### 2. `src/features/listings/ListingForm.tsx`
- Used for both creating and editing
- Props: `initial?: Listing` (if present → edit mode), `onSave: () => void`, `onCancel: () => void`
- Fields: title, type (sale/rent), price, location, beds, baths, sqm, photos, description
- Validation: title, price, location are required
- "Publish listing" button (or "Save changes" in edit mode) calls `createListing` or `updateListing`
- After save, calls `onSave()` which navigates back to "My listings"

### 3. `src/features/listings/ListingCard.tsx`
- Props: `listing: Listing`, `agent?: Agent`, `ownedByMe: boolean`, `onClick: () => void`
- 4:3 aspect ratio cover photo at top, with type tag and "Yours" tag overlaid on the photo
- Below: title (Fraunces, line-clamp-2), location with MapPin icon, price in terracotta Fraunces 2xl, then beds/baths/sqm row separated by a thin top border
- Hover: subtle scale transform on the photo, card lifts slightly with `hover:-translate-y-0.5`

### 4. `src/features/listings/ListingDetail.tsx`
- 5-column grid on desktop (3 photos / 2 details), stacked on mobile
- Left: large 4:3 cover, thumbnail strip below for selecting other photos
- Right: tags, title, location, price, stats grid (beds/baths/sqm), description, agent card, edit + delete buttons (only if owned)

### 5. `src/features/listings/ListingsView.tsx`
- Two modes via prop `scope: "mine" | "all"`
- Header with title, search input (filters by title or location, case-insensitive), type filter dropdown
- Grid: 1 col mobile, 2 col tablet, 3 col desktop
- Empty state when no listings match
- Subscribe to listings via `subscribeToListings` or `subscribeToMyListings` — must update in real-time when other agents add/edit/delete

### 6. `src/features/dashboard/Dashboard.tsx`
- Welcome header with agent first name
- 4 stat cards: Active listings, For sale (with portfolio total value), For rent, Member since
- "Recent activity" section: 4 most recent of agent's own listings as cards
- Bottom callout block (dark `ink` background, terracotta heading): "Coming next: Phase 2 Messenger chatbot" with a button to view the database

### 7. `src/features/listings/DatabaseView.tsx`
- Two side-by-side cards: `/listings` and `/agents` collections
- Each shows a header bar with the path and document count
- Below: monospace JSON dump (pretty-printed, scrollable) — for `/agents`, mask `passwordHash` as `"***hidden***"` if present, and for listings replace the photos array with `"[N photos]"` to keep it readable

### 8. `src/features/profile/ProfileView.tsx`
- Shows the current agent's avatar, name, email
- Editable name and bio fields
- "Save changes" button updates `/agents/{uid}` doc
- Stats grid: Listings, For sale, For rent

## Routing

Update `App.tsx`:
- `/` → Dashboard
- `/listings` → ListingsView (scope="all")
- `/listings/mine` → ListingsView (scope="mine")
- `/listings/new` → ListingForm
- `/listings/:id` → ListingDetail
- `/listings/:id/edit` → ListingForm (load existing first)
- `/database` → DatabaseView
- `/profile` → ProfileView
- All wrapped in ProtectedRoute and a shared AppShell with header + nav

## App shell

Build `src/components/AppShell.tsx`:
- Sticky header on cream background, 1px bottom border
- Left: Khashaa logo + name (links to dashboard)
- Center (desktop only): nav tabs — Dashboard, My listings, All listings, Database, Profile. Active tab has paper background and ink text.
- Right: "+ New" terracotta button, then avatar circle that opens a dropdown with profile info, mobile nav links, and Sign out

## Important details

- Use Firestore `onSnapshot` for all list views so changes are real-time — when one agent adds a listing, others see it immediately
- Show a `Loader` spinner during async operations
- Confirm before delete with `confirm()` dialog (good enough for v1)
- Format prices with `toLocaleString()` and append `/mo` for rentals
- Format relative dates: "just now", "5m ago", "2h ago", "3d ago", or "Mar 15, 2026"
- Keep the editorial design language consistent with the prototype — same terracotta, same Fraunces, same generous spacing

## When done

1. Test the full flow: create a listing with 3 photos → see it appear → edit it → delete it
2. Open a second browser window, log in as a different agent, verify real-time sync works
3. Build with `npm run build` and confirm zero errors
4. Commit: `feat: full listings CRUD with multi-photo upload and real-time sync`
5. Tell me what to test and what's left for Phase 1.5
