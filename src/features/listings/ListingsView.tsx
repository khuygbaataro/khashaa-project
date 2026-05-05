// Grid of listings with search + type filter. Two scopes — "all" or "mine" — both subscribed to Firestore in real time.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Search } from "lucide-react";
import { ListingCard } from "./ListingCard";
import { useAuth } from "../auth/AuthContext";
import {
  subscribeToListings,
  subscribeToMyListings,
} from "../../lib/listings";
import { useAgentMap } from "./useAgentMap";
import { palette } from "../../lib/palette";
import type { Listing } from "../../lib/schema";

interface Props {
  scope: "all" | "mine";
}

export function ListingsView({ scope }: Props) {
  const nav = useNavigate();
  const { currentAgent } = useAuth();
  const agents = useAgentMap();
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "sale" | "rent">("all");

  useEffect(() => {
    if (!currentAgent) return;
    const unsub =
      scope === "mine"
        ? subscribeToMyListings(currentAgent.id, setListings)
        : subscribeToListings(setListings);
    return () => unsub();
  }, [scope, currentAgent]);

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
    <div className="max-w-7xl mx-auto py-8 px-4 fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1
            className="font-display text-4xl"
            style={{ color: palette.ink, fontWeight: 500 }}
          >
            {scope === "mine" ? "My listings" : "All listings"}
          </h1>
          <p className="text-sm mt-1" style={{ color: palette.inkSoft }}>
            {scope === "mine"
              ? "Properties you have listed"
              : "The full database — what the chatbot sees"}{" "}
            · {filtered.length}{" "}
            {filtered.length === 1 ? "property" : "properties"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: palette.inkMuted }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or location"
              className="font-body text-sm pl-9 pr-3 py-2.5 rounded-md outline-none w-56"
              style={{
                backgroundColor: palette.paper,
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
            className="font-body text-sm px-3 py-2.5 rounded-md outline-none"
            style={{
              backgroundColor: palette.paper,
              color: palette.ink,
              border: `1px solid ${palette.border}`,
            }}
          >
            <option value="all">All types</option>
            <option value="sale">For sale</option>
            <option value="rent">For rent</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="text-center py-16 rounded-lg"
          style={{
            backgroundColor: palette.paper,
            border: `1px solid ${palette.border}`,
          }}
        >
          <Home
            size={32}
            className="mx-auto mb-3"
            style={{ color: palette.inkMuted }}
          />
          <div
            className="font-display text-xl mb-1"
            style={{ color: palette.ink }}
          >
            No listings found
          </div>
          <div className="text-sm" style={{ color: palette.inkSoft }}>
            {scope === "mine"
              ? "Add your first property to get started"
              : "Try a different search or filter"}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              agent={agents[l.agentId]}
              ownedByMe={!!currentAgent && l.agentId === currentAgent.id}
              onClick={() => nav(`/agent/listings/${l.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
