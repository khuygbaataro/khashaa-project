// Read-only Firestore queries the chatbot uses to ground its responses.
// Filters happen in-memory because Firestore rejects multi-field range/inequality combos.
import { db } from "./firebaseAdmin.js";

export interface Listing {
  id: string;
  agentId: string;
  title: string;
  type: "sale" | "rent";
  price: number;
  location: string;
  district?: string;
  city?: string;
  beds: number;
  baths: number;
  sqm: number;
  photos: string[];
  description: string;
  status: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
}

function toListing(id: string, data: FirebaseFirestore.DocumentData): Listing {
  return {
    id,
    agentId: String(data.agentId ?? ""),
    title: String(data.title ?? ""),
    type: data.type === "rent" ? "rent" : "sale",
    price: Number(data.price ?? 0),
    location: String(data.location ?? ""),
    district: data.district ? String(data.district) : undefined,
    city: data.city ? String(data.city) : undefined,
    beds: Number(data.beds ?? 0),
    baths: Number(data.baths ?? 0),
    sqm: Number(data.sqm ?? 0),
    photos: Array.isArray(data.photos) ? (data.photos as string[]) : [],
    description: String(data.description ?? ""),
    status: String(data.status ?? "active"),
  };
}

function toAgent(id: string, data: FirebaseFirestore.DocumentData): Agent {
  return {
    id,
    name: String(data.name ?? ""),
    email: String(data.email ?? ""),
    phone: data.phone ? String(data.phone) : undefined,
    bio: data.bio ? String(data.bio) : undefined,
  };
}

export interface SearchFilters {
  type?: "sale" | "rent";
  max_price_usd?: number;
  min_price_usd?: number;
  min_beds?: number;
  district?: string;
  query?: string;
}

export async function searchListings(
  filters: SearchFilters,
  limit = 5
): Promise<Listing[]> {
  // Pull all active listings; filter + rank in memory. Fine for thousands of docs.
  const snap = await db
    .collection("listings")
    .where("status", "==", "active")
    .get();

  const all = snap.docs.map((d) => toListing(d.id, d.data()));
  const q = (filters.query ?? "").toLowerCase().trim();
  const district = (filters.district ?? "").toLowerCase().trim();

  const filtered = all.filter((l) => {
    if (filters.type && l.type !== filters.type) return false;
    if (filters.max_price_usd != null && l.price > filters.max_price_usd)
      return false;
    if (filters.min_price_usd != null && l.price < filters.min_price_usd)
      return false;
    if (filters.min_beds != null && l.beds < filters.min_beds) return false;
    if (district) {
      const hay = `${l.district ?? ""} ${l.location}`.toLowerCase();
      if (!hay.includes(district)) return false;
    }
    if (q) {
      const hay = `${l.title} ${l.location} ${l.description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // Cheapest first when a max budget is set, otherwise newest-ish (just by price desc as a proxy).
  if (filters.max_price_usd != null) filtered.sort((a, b) => a.price - b.price);
  return filtered.slice(0, limit);
}

export async function getListing(id: string): Promise<Listing | null> {
  const snap = await db.collection("listings").doc(id).get();
  if (!snap.exists) return null;
  const l = toListing(snap.id, snap.data() ?? {});
  if (l.status !== "active") return null;
  return l;
}

export async function getAgent(id: string): Promise<Agent | null> {
  const snap = await db.collection("agents").doc(id).get();
  if (!snap.exists) return null;
  return toAgent(snap.id, snap.data() ?? {});
}

export interface SellerLeadInput {
  name: string;
  phone?: string;
  property_type: "sale" | "rent";
  location: string;
  beds?: number;
  description?: string;
  source: "messenger";
  fbPsid: string;
}

export interface HandoffLeadInput {
  name?: string;
  phone?: string;
  about: string;
  source: "messenger";
  fbPsid: string;
}

export async function createLead(
  payload: SellerLeadInput | HandoffLeadInput,
  kind: "seller" | "handoff"
): Promise<string> {
  const ref = await db.collection("leads").add({
    ...payload,
    kind,
    status: "new",
    createdAt: new Date(),
  });
  return ref.id;
}
