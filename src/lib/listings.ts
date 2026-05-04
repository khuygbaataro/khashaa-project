// Firestore + Storage CRUD helpers for the /listings collection.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { db, storage } from "./firebase";
import type { Listing, ListingPatch, NewListingInput } from "./schema";
import { compressImage } from "./utils";

const LISTINGS = "listings";

function rowToListing(id: string, data: Record<string, unknown>): Listing {
  return {
    id,
    agentId: String(data.agentId ?? ""),
    title: String(data.title ?? ""),
    type: (data.type === "rent" ? "rent" : "sale") as Listing["type"],
    price: Number(data.price ?? 0),
    currency: "USD",
    location: String(data.location ?? ""),
    district: data.district ? String(data.district) : undefined,
    city: data.city ? String(data.city) : undefined,
    beds: Number(data.beds ?? 0),
    baths: Number(data.baths ?? 0),
    sqm: Number(data.sqm ?? 0),
    photos: Array.isArray(data.photos) ? (data.photos as string[]) : [],
    description: String(data.description ?? ""),
    status: (data.status as Listing["status"]) ?? "active",
    createdAt: (data.createdAt as Listing["createdAt"]) ?? 0,
    updatedAt: (data.updatedAt as Listing["updatedAt"]) ?? 0,
  };
}

export function subscribeToListings(
  callback: (listings: Listing[]) => void,
  onError?: (err: Error) => void
): () => void {
  // Public/agent view: only active listings, newest first.
  const q = query(
    collection(db, LISTINGS),
    where("status", "==", "active"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => rowToListing(d.id, d.data()));
      callback(rows);
    },
    (err) => onError?.(err)
  );
}

export function subscribeToMyListings(
  agentId: string,
  callback: (listings: Listing[]) => void,
  onError?: (err: Error) => void
): () => void {
  // Agent's own listings, all statuses.
  const q = query(
    collection(db, LISTINGS),
    where("agentId", "==", agentId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => rowToListing(d.id, d.data()))),
    (err) => onError?.(err)
  );
}

export async function getListing(id: string): Promise<Listing | null> {
  const snap = await getDoc(doc(db, LISTINGS, id));
  return snap.exists() ? rowToListing(snap.id, snap.data()) : null;
}

export async function createListing(
  agentId: string,
  data: NewListingInput
): Promise<string> {
  const ref = await addDoc(collection(db, LISTINGS), {
    ...data,
    agentId,
    currency: "USD",
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateListing(
  id: string,
  patch: ListingPatch
): Promise<void> {
  await updateDoc(doc(db, LISTINGS, id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteListing(id: string): Promise<void> {
  // Best-effort: remove storage folder by deleting any URLs we recorded.
  // (Storage rules also let only the owner delete.)
  await deleteDoc(doc(db, LISTINGS, id));
}

// Compresses, uploads, and returns the public download URL.
export async function uploadPhoto(
  file: File,
  listingId: string
): Promise<string> {
  const blob = await compressImage(file, 1000, 0.75);
  const path = `listings/${listingId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.jpg`;
  const r = storageRef(storage, path);
  await uploadBytes(r, blob, { contentType: "image/jpeg" });
  return getDownloadURL(r);
}

export async function deletePhotoByUrl(url: string): Promise<void> {
  try {
    // Firebase download URLs include the encoded path between /o/ and ?
    const m = url.match(/\/o\/([^?]+)/);
    if (!m) return;
    const path = decodeURIComponent(m[1]);
    await deleteObject(storageRef(storage, path));
  } catch {
    // best-effort, swallow
  }
}
