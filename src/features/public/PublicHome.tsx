// Customer-facing landing — editorial hero, search + type filter, real-time grid of active listings.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bath, Bed, Image as ImageIcon, MapPin, Maximize, Search } from "lucide-react";
import { Tag } from "../../components/Tag";
import { useAgentMap } from "../listings/useAgentMap";
import { subscribeToListings } from "../../lib/listings";
import { palette } from "../../lib/palette";
import { fmtMoney } from "../../lib/utils";
import type { Listing } from "../../lib/schema";

export function PublicHome() {
  const nav = useNavigate();
  const agents = useAgentMap();
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "sale" | "rent">("all");

  useEffect(() => {
    const unsub = subscribeToListings(setListings);
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (filterType !== "all" && l.type !== filterType) return false;
      if (search) {
        const s = search.toLowerCase();
        if (
          !l.title.toLowerCase().includes(s) &&
          !l.location.toLowerCase().includes(s)
        )
          return false;
      }
      return true;
    });
  }, [listings, filterType, search]);

  return (
    <div className="fade-in">
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundColor: palette.ink,
          color: palette.cream,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div
            className="text-xs uppercase tracking-widest mb-3"
            style={{ color: palette.terracotta }}
          >
            Real estate in Mongolia
          </div>
          <h1
            className="font-display leading-tight mb-4"
            style={{
              fontWeight: 400,
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            }}
          >
            Find a home in <br />
            Ulaanbaatar that{" "}
            <em
              style={{ color: palette.terracotta, fontStyle: "italic" }}
            >
              fits.
            </em>
          </h1>
          <p
            className="text-base md:text-lg max-w-xl leading-relaxed"
            style={{ color: "#B5AEA0" }}
          >
            Apartments and houses across the city, listed by trusted local
            agents. Browse properties, then get in touch — no account needed.
          </p>
        </div>
      </section>

      {/* Search bar */}
      <section className="max-w-7xl mx-auto px-4 -mt-7 md:-mt-8 relative z-10">
        <div
          className="rounded-lg p-3 md:p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3"
          style={{
            backgroundColor: palette.paper,
            border: `1px solid ${palette.border}`,
            boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
          }}
        >
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: palette.inkMuted }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by neighborhood, district, or title"
              className="w-full font-body text-[15px] pl-10 pr-3 py-3 rounded-md outline-none"
              style={{
                backgroundColor: palette.cream,
                color: palette.ink,
                border: `1px solid ${palette.border}`,
              }}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value as "all" | "sale" | "rent")
            }
            className="font-body text-[15px] px-3 py-3 rounded-md outline-none md:w-44"
            style={{
              backgroundColor: palette.cream,
              color: palette.ink,
              border: `1px solid ${palette.border}`,
            }}
          >
            <option value="all">All types</option>
            <option value="sale">For sale</option>
            <option value="rent">For rent</option>
          </select>
        </div>
      </section>

      {/* Listings grid */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-baseline justify-between mb-6">
          <h2
            className="font-display text-2xl md:text-3xl"
            style={{ color: palette.ink, fontWeight: 500 }}
          >
            {filtered.length} {filtered.length === 1 ? "property" : "properties"}
          </h2>
          <span className="text-xs" style={{ color: palette.inkSoft }}>
            Updated in real-time
          </span>
        </div>

        {filtered.length === 0 ? (
          <div
            className="text-center py-16 rounded-lg"
            style={{
              backgroundColor: palette.paper,
              border: `1px solid ${palette.border}`,
            }}
          >
            <ImageIcon
              size={32}
              className="mx-auto mb-3"
              style={{ color: palette.inkMuted }}
            />
            <div
              className="font-display text-xl mb-1"
              style={{ color: palette.ink }}
            >
              No properties yet
            </div>
            <div className="text-sm" style={{ color: palette.inkSoft }}>
              {search || filterType !== "all"
                ? "Try a different search or filter"
                : "Agents will be adding properties soon — check back later"}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((l) => (
              <PublicCard
                key={l.id}
                listing={l}
                agentName={agents[l.agentId]?.name}
                onClick={() => nav(`/property/${l.id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PublicCard({
  listing,
  agentName,
  onClick,
}: {
  listing: Listing;
  agentName?: string;
  onClick: () => void;
}) {
  const cover = listing.photos?.[0];
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer fade-in rounded-lg overflow-hidden transition-transform hover:-translate-y-0.5"
      style={{
        backgroundColor: palette.paper,
        border: `1px solid ${palette.border}`,
      }}
    >
      <div
        className="aspect-[4/3] relative overflow-hidden"
        style={{ backgroundColor: palette.cream }}
      >
        {cover ? (
          <img
            src={cover}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ color: palette.inkMuted }}
          >
            <ImageIcon size={32} />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Tag color={listing.type}>
            {listing.type === "sale" ? "For sale" : "For rent"}
          </Tag>
        </div>
        {listing.photos && listing.photos.length > 1 ? (
          <div
            className="absolute bottom-3 right-3 px-2 py-0.5 rounded text-[11px] font-medium font-body"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#FFF" }}
          >
            {listing.photos.length} photos
          </div>
        ) : null}
      </div>
      <div className="p-4">
        <div
          className="font-display text-lg leading-snug mb-1 line-clamp-2"
          style={{ color: palette.ink, fontWeight: 500 }}
        >
          {listing.title}
        </div>
        <div
          className="flex items-center gap-1.5 text-xs mb-3"
          style={{ color: palette.inkSoft }}
        >
          <MapPin size={12} /> {listing.location}
        </div>
        <div
          className="font-display text-2xl mb-3"
          style={{ color: palette.terracotta, fontWeight: 600 }}
        >
          {fmtMoney(listing.price, listing.type)}
        </div>
        <div
          className="flex items-center gap-4 pt-3 text-xs"
          style={{
            borderTop: `1px solid ${palette.border}`,
            color: palette.inkSoft,
          }}
        >
          <span className="flex items-center gap-1">
            <Bed size={13} /> {listing.beds}
          </span>
          <span className="flex items-center gap-1">
            <Bath size={13} /> {listing.baths}
          </span>
          <span className="flex items-center gap-1">
            <Maximize size={13} /> {listing.sqm}m²
          </span>
          {agentName ? (
            <span className="ml-auto truncate">{agentName.split(" ")[0]}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
