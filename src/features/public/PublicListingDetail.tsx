// Customer-facing listing page — same layout as the agent detail, minus edit/delete and with a "Contact agent" CTA.
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Image as ImageIcon,
  Loader,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { Tag } from "../../components/Tag";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { palette } from "../../lib/palette";
import { fmtDate, fmtMoney } from "../../lib/utils";
import type { Agent, Listing } from "../../lib/schema";

export function PublicListingDetail() {
  const { id } = useParams();
  const nav = useNavigate();
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
          setError("This listing is no longer available.");
          setListing(null);
        } else {
          const data = snap.data();
          if (data.status !== "active") {
            setError("This listing is no longer available.");
            setListing(null);
          } else {
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
        phone: data.phone ? String(data.phone) : undefined,
        joinedAt: (data.joinedAt as Agent["joinedAt"]) ?? 0,
      });
    });
    return () => unsub();
  }, [listing?.agentId]);

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
          onClick={() => nav("/")}
          className="mt-4 underline text-sm"
          style={{ color: palette.terracotta }}
        >
          Browse other properties
        </button>
      </div>
    );
  }

  const photos = listing.photos.length ? listing.photos : [];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 fade-in">
      <button
        onClick={() => nav(-1)}
        className="font-body text-sm flex items-center gap-1.5 mb-6 hover:underline"
        style={{ color: palette.inkSoft }}
      >
        <ArrowLeft size={14} /> Back to all properties
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
                About this property
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
              className="p-5 rounded-lg"
              style={{
                backgroundColor: palette.cream,
                border: `1px solid ${palette.border}`,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-display text-base"
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
              {agent.bio ? (
                <p
                  className="font-body text-xs leading-relaxed mb-3"
                  style={{ color: palette.inkSoft }}
                >
                  {agent.bio}
                </p>
              ) : null}
              <div className="flex flex-col gap-2">
                {agent.phone ? (
                  <a
                    href={`tel:${agent.phone}`}
                    className="font-body text-sm flex items-center gap-2 px-3 py-2 rounded-md"
                    style={{
                      backgroundColor: palette.terracotta,
                      color: "#FFF",
                    }}
                  >
                    <Phone size={14} /> Call {agent.phone}
                  </a>
                ) : null}
                {agent.email ? (
                  <a
                    href={`mailto:${agent.email}?subject=${encodeURIComponent(
                      "About: " + listing.title
                    )}`}
                    className="font-body text-sm flex items-center gap-2 px-3 py-2 rounded-md"
                    style={{
                      backgroundColor: palette.paper,
                      color: palette.ink,
                      border: `1px solid ${palette.borderStrong}`,
                    }}
                  >
                    <Mail size={14} /> Email {agent.name.split(" ")[0]}
                  </a>
                ) : null}
              </div>
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
