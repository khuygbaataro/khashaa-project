// Full property page with photo carousel, details, agent card, and edit/delete actions for the owner.
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit3,
  Image as ImageIcon,
  Loader,
  MapPin,
  Trash2,
} from "lucide-react";
import { Btn } from "../../components/Btn";
import { Tag } from "../../components/Tag";
import { useAuth } from "../auth/AuthContext";
import { deleteListing, getListing } from "../../lib/listings";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { palette } from "../../lib/palette";
import { fmtDate, fmtMoney } from "../../lib/utils";
import type { Agent, Listing } from "../../lib/schema";

export function ListingDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { currentAgent } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const unsub = onSnapshot(
      doc(db, "listings", id),
      (snap) => {
        if (!snap.exists()) {
          setError("Listing not found.");
          setListing(null);
        } else {
          const data = snap.data();
          setListing({
            id: snap.id,
            agentId: String(data.agentId ?? ""),
            title: String(data.title ?? ""),
            type: data.type === "rent" ? "rent" : "sale",
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
            status:
              (data.status as Listing["status"] | undefined) ?? "active",
            createdAt: data.createdAt as Listing["createdAt"],
            updatedAt: data.updatedAt as Listing["updatedAt"],
          });
          setError("");
        }
        setLoading(false);
      },
      () => {
        setError("Could not load listing.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [id]);

  // Pull listing agent profile for the agent card.
  useEffect(() => {
    if (!listing?.agentId) return;
    const unsub = onSnapshot(doc(db, "agents", listing.agentId), (snap) => {
      if (!snap.exists()) {
        setAgent(null);
        return;
      }
      const data = snap.data();
      setAgent({
        id: snap.id,
        name: String(data.name ?? ""),
        email: String(data.email ?? ""),
        bio: String(data.bio ?? ""),
        avatar: String(data.avatar ?? ""),
        joinedAt: (data.joinedAt as Agent["joinedAt"]) ?? 0,
      });
    });
    return () => unsub();
  }, [listing?.agentId]);

  async function handleDelete() {
    if (!listing) return;
    const ok = confirm(
      `Delete "${listing.title}"? This cannot be undone.`
    );
    if (!ok) return;
    try {
      // Fallback to id from id param when listing.id isn't set yet.
      await deleteListing(listing.id || id || "");
      nav("/listings/mine");
    } catch (err) {
      console.error(err);
      alert("Could not delete the listing. Please try again.");
    }
  }

  // Fallback to a one-shot fetch if the snapshot listener errored but we still have an id.
  useEffect(() => {
    if (!error || !id) return;
    getListing(id)
      .then((l) => {
        if (l) {
          setListing(l);
          setError("");
        }
      })
      .catch(() => {});
  }, [error, id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-16 px-4 flex justify-center">
        <Loader
          size={24}
          className="animate-spin"
          style={{ color: palette.terracotta }}
        />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-5xl mx-auto py-16 px-4 text-center">
        <p className="text-sm" style={{ color: palette.inkSoft }}>
          {error || "Listing unavailable."}
        </p>
        <button
          onClick={() => nav(-1)}
          className="mt-4 underline text-sm"
          style={{ color: palette.terracotta }}
        >
          Go back
        </button>
      </div>
    );
  }

  const owned = !!currentAgent && listing.agentId === currentAgent.id;
  const photos = listing.photos.length ? listing.photos : [];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 fade-in">
      <button
        onClick={() => nav(-1)}
        className="font-body text-sm flex items-center gap-1.5 mb-6 hover:underline"
        style={{ color: palette.inkSoft }}
      >
        <ArrowLeft size={14} /> Back to listings
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <div
            className="aspect-[4/3] rounded-lg overflow-hidden mb-3"
            style={{
              backgroundColor: palette.cream,
              border: `1px solid ${palette.border}`,
            }}
          >
            {photos[photoIdx] ? (
              <img
                src={photos[photoIdx]}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ color: palette.inkMuted }}
              >
                <ImageIcon size={48} />
              </div>
            )}
          </div>
          {photos.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto scroll-thin">
              {photos.map((p, i) => (
                <button
                  key={p + i}
                  onClick={() => setPhotoIdx(i)}
                  className="flex-shrink-0 w-20 h-20 rounded overflow-hidden transition-all"
                  style={{
                    border: `2px solid ${
                      i === photoIdx ? palette.terracotta : "transparent"
                    }`,
                    opacity: i === photoIdx ? 1 : 0.6,
                  }}
                >
                  <img src={p} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-2">
          <div className="flex gap-2 mb-3">
            <Tag color={listing.type}>
              {listing.type === "sale" ? "For sale" : "For rent"}
            </Tag>
            <Tag>Listed {fmtDate(listing.createdAt)}</Tag>
          </div>
          <h1
            className="font-display text-3xl leading-tight mb-2"
            style={{ color: palette.ink, fontWeight: 500 }}
          >
            {listing.title}
          </h1>
          <div
            className="flex items-center gap-1.5 text-sm mb-5"
            style={{ color: palette.inkSoft }}
          >
            <MapPin size={14} /> {listing.location}
          </div>

          <div
            className="font-display text-4xl mb-6"
            style={{ color: palette.terracotta, fontWeight: 600 }}
          >
            {fmtMoney(listing.price, listing.type)}
          </div>

          <div
            className="grid grid-cols-3 gap-3 mb-6 py-4"
            style={{
              borderTop: `1px solid ${palette.border}`,
              borderBottom: `1px solid ${palette.border}`,
            }}
          >
            <Stat label="Bedrooms" value={listing.beds} />
            <Stat label="Bathrooms" value={listing.baths} />
            <Stat label="Size" value={`${listing.sqm}m²`} />
          </div>

          {listing.description ? (
            <div className="mb-6">
              <div
                className="text-xs uppercase tracking-wider mb-2"
                style={{ color: palette.inkSoft }}
              >
                Description
              </div>
              <p
                className="font-body text-[15px] leading-relaxed whitespace-pre-line"
                style={{ color: palette.ink }}
              >
                {listing.description}
              </p>
            </div>
          ) : null}

          {agent ? (
            <div
              className="p-4 rounded-md flex items-center gap-3 mb-6"
              style={{
                backgroundColor: palette.cream,
                border: `1px solid ${palette.border}`,
              }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center font-display text-sm"
                style={{
                  backgroundColor: palette.ink,
                  color: palette.cream,
                  fontWeight: 500,
                }}
              >
                {agent.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-xs uppercase tracking-wider"
                  style={{ color: palette.inkSoft }}
                >
                  Listing agent
                </div>
                <div
                  className="font-body text-sm font-medium truncate"
                  style={{ color: palette.ink }}
                >
                  {agent.name}
                </div>
              </div>
            </div>
          ) : null}

          {owned ? (
            <div className="flex gap-2">
              <Btn icon={Edit3} onClick={() => nav(`/listings/${listing.id}/edit`)}>
                Edit listing
              </Btn>
              <Btn variant="danger" icon={Trash2} onClick={handleDelete}>
                Delete
              </Btn>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div
        className="text-xs uppercase tracking-wider mb-1"
        style={{ color: palette.inkSoft }}
      >
        {label}
      </div>
      <div
        className="font-display text-xl"
        style={{ color: palette.ink, fontWeight: 500 }}
      >
        {value}
      </div>
    </div>
  );
}
