// "Firebase console" view — pretty-printed JSON of /listings and /agents, the same data the chatbot will query.
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { palette } from "../../lib/palette";

type Row = Record<string, unknown> & { id: string };

function maskListing(row: Row): Row {
  const photos = (row.photos as unknown[] | undefined) ?? [];
  return {
    ...row,
    photos: photos.length ? `[${photos.length} photos]` : [],
  } as Row;
}

function maskAgent(row: Row): Row {
  const out: Row = { ...row };
  if ("passwordHash" in out) out.passwordHash = "***hidden***";
  return out;
}

export function DatabaseView() {
  const [listings, setListings] = useState<Row[]>([]);
  const [agents, setAgents] = useState<Row[]>([]);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "listings"), (snap) => {
      setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Row)));
    });
    const u2 = onSnapshot(collection(db, "agents"), (snap) => {
      setAgents(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Row)));
    });
    return () => {
      u1();
      u2();
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 fade-in">
      <h1
        className="font-display text-4xl mb-2"
        style={{ color: palette.ink, fontWeight: 500 }}
      >
        Database
      </h1>
      <p className="text-sm mb-8" style={{ color: palette.inkSoft }}>
        The same data your Messenger chatbot will query. This is your live
        Firestore content. Identical schema.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel
          path="/listings"
          docs={listings.length}
          json={JSON.stringify(listings.map(maskListing), null, 2)}
        />
        <Panel
          path="/agents"
          docs={agents.length}
          json={JSON.stringify(agents.map(maskAgent), null, 2)}
        />
      </div>
    </div>
  );
}

function Panel({
  path,
  docs,
  json,
}: {
  path: string;
  docs: number;
  json: string;
}) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: `1px solid ${palette.border}` }}
    >
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: palette.ink, color: palette.cream }}
      >
        <span className="font-mono text-xs">{path}</span>
        <span className="font-mono text-xs">{docs} docs</span>
      </div>
      <div
        className="p-4 max-h-[500px] overflow-y-auto scroll-thin font-mono text-[11px] leading-relaxed whitespace-pre-wrap"
        style={{ backgroundColor: palette.paper, color: palette.ink }}
      >
        {json}
      </div>
    </div>
  );
}
