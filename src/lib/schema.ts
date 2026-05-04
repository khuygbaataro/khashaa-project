// TypeScript types mirroring the Firestore schema described in CLAUDE.md.
import type { Timestamp } from "firebase/firestore";

export type ListingType = "sale" | "rent";
export type ListingStatus = "active" | "pending" | "sold" | "rented";

export interface Agent {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatar: string;
  phone?: string;
  joinedAt: Timestamp | number;
}

export interface Listing {
  id: string;
  agentId: string;
  title: string;
  type: ListingType;
  price: number;
  currency: "USD";
  location: string;
  district?: string;
  city?: string;
  beds: number;
  baths: number;
  sqm: number;
  photos: string[];
  description: string;
  status: ListingStatus;
  createdAt: Timestamp | number;
  updatedAt: Timestamp | number;
}

export type NewListingInput = Omit<
  Listing,
  "id" | "agentId" | "currency" | "status" | "createdAt" | "updatedAt"
>;

export type ListingPatch = Partial<
  Omit<Listing, "id" | "agentId" | "createdAt">
>;
