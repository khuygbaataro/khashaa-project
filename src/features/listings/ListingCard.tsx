// Tile shown in grids — cover photo + tags overlay, then title / location / price / specs.
import { Bath, Bed, Image as ImageIcon, MapPin, Maximize } from "lucide-react";
import { Tag } from "../../components/Tag";
import { fmtMoney } from "../../lib/utils";
import { palette } from "../../lib/palette";
import type { Agent, Listing } from "../../lib/schema";

interface Props {
  listing: Listing;
  agent?: Agent;
  ownedByMe?: boolean;
  onClick?: () => void;
}

export function ListingCard({ listing, agent, ownedByMe, onClick }: Props) {
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
        <div className="absolute top-3 left-3 flex gap-2">
          <Tag color={listing.type}>
            {listing.type === "sale" ? "For sale" : "For rent"}
          </Tag>
          {ownedByMe ? <Tag>Yours</Tag> : null}
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
        <div className="flex items-baseline justify-between mb-3">
          <div
            className="font-display text-2xl"
            style={{ color: palette.terracotta, fontWeight: 600 }}
          >
            {fmtMoney(listing.price, listing.type)}
          </div>
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
          {agent ? (
            <span className="ml-auto truncate">{agent.name.split(" ")[0]}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
