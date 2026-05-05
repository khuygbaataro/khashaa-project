// Personal landing — welcome header, four stat cards, recent activity grid, and a teaser for Phase 2.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Database,
  Home,
  Plus,
  TrendingUp,
  User,
  type LucideIcon,
} from "lucide-react";
import { Btn } from "../../components/Btn";
import { ListingCard } from "../listings/ListingCard";
import { useAuth } from "../auth/AuthContext";
import { subscribeToMyListings } from "../../lib/listings";
import { fmtDate, fmtMoney } from "../../lib/utils";
import { palette } from "../../lib/palette";
import type { Listing } from "../../lib/schema";

export function Dashboard() {
  const nav = useNavigate();
  const { currentAgent } = useAuth();
  const [myListings, setMyListings] = useState<Listing[]>([]);

  useEffect(() => {
    if (!currentAgent) return;
    const unsub = subscribeToMyListings(currentAgent.id, setMyListings);
    return () => unsub();
  }, [currentAgent]);

  if (!currentAgent) return null;

  const myActive = myListings.filter((l) => l.status === "active");
  const mySale = myActive.filter((l) => l.type === "sale");
  const myRent = myActive.filter((l) => l.type === "rent");
  const totalValue = mySale.reduce((s, l) => s + l.price, 0);
  const recent = [...myListings].slice(0, 4);
  const firstName = currentAgent.name.split(" ")[0] || currentAgent.name;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div
            className="text-xs uppercase tracking-widest mb-2"
            style={{ color: palette.terracotta }}
          >
            Welcome back
          </div>
          <h1
            className="font-display text-4xl"
            style={{ color: palette.ink, fontWeight: 500 }}
          >
            {firstName}'s dashboard
          </h1>
        </div>
        <Btn icon={Plus} onClick={() => nav("/agent/listings/new")}>
          New listing
        </Btn>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Active listings"
          value={myActive.length}
          sub={`${myListings.length} total`}
          icon={Home}
        />
        <StatCard
          label="For sale"
          value={mySale.length}
          sub={`${fmtMoney(totalValue)} portfolio`}
          icon={TrendingUp}
        />
        <StatCard
          label="For rent"
          value={myRent.length}
          sub="active rentals"
          icon={Database}
        />
        <StatCard
          label="Member since"
          value={fmtDate(currentAgent.joinedAt).replace(" ago", "")}
          icon={User}
        />
      </div>

      <div className="flex items-baseline justify-between mb-4">
        <h2
          className="font-display text-2xl"
          style={{ color: palette.ink, fontWeight: 500 }}
        >
          Recent activity
        </h2>
        <button
          onClick={() => nav("/agent/listings/mine")}
          className="font-body text-sm hover:underline"
          style={{ color: palette.terracotta }}
        >
          View all my listings →
        </button>
      </div>

      {recent.length === 0 ? (
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
            className="font-display text-xl mb-2"
            style={{ color: palette.ink }}
          >
            No listings yet
          </div>
          <div className="text-sm mb-5" style={{ color: palette.inkSoft }}>
            Add your first property to get started
          </div>
          <Btn icon={Plus} onClick={() => nav("/agent/listings/new")}>
            Add listing
          </Btn>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recent.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              ownedByMe
              onClick={() => nav(`/agent/listings/${l.id}`)}
            />
          ))}
        </div>
      )}

      <div
        className="mt-12 p-6 rounded-lg"
        style={{ backgroundColor: palette.ink, color: palette.cream }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div
              className="text-xs uppercase tracking-widest mb-2"
              style={{ color: palette.terracotta }}
            >
              Coming next
            </div>
            <div
              className="font-display text-2xl"
              style={{ fontWeight: 500 }}
            >
              Phase 2: Messenger chatbot
            </div>
            <div className="text-sm mt-1" style={{ color: "#B5AEA0" }}>
              The same database powers AI conversations with customers on
              Facebook Messenger.
            </div>
          </div>
          <button
            onClick={() => nav("/agent/database")}
            className="font-body text-sm px-4 py-2.5 rounded-md flex items-center gap-2 transition-colors"
            style={{
              backgroundColor: palette.terracotta,
              color: "#FFF",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Database size={14} /> See the database the bot will read
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
}) {
  return (
    <div
      className="p-5 rounded-lg"
      style={{
        backgroundColor: palette.paper,
        border: `1px solid ${palette.border}`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="text-xs uppercase tracking-wider"
          style={{ color: palette.inkSoft }}
        >
          {label}
        </div>
        <Icon size={16} style={{ color: palette.inkMuted }} />
      </div>
      <div
        className="font-display text-3xl"
        style={{ color: palette.ink, fontWeight: 500 }}
      >
        {value}
      </div>
      {sub ? (
        <div className="text-xs mt-1" style={{ color: palette.inkSoft }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
}
