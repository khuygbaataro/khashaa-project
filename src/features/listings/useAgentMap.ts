// Streams the /agents collection into a uid -> Agent map for grid views.
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { Agent } from "../../lib/schema";

export function useAgentMap(): Record<string, Agent> {
  const [map, setMap] = useState<Record<string, Agent>>({});
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "agents"), (snap) => {
      const next: Record<string, Agent> = {};
      snap.forEach((d) => {
        const data = d.data();
        next[d.id] = {
          id: d.id,
          name: String(data.name ?? ""),
          email: String(data.email ?? ""),
          bio: String(data.bio ?? ""),
          avatar: String(data.avatar ?? ""),
          phone: data.phone ? String(data.phone) : undefined,
          joinedAt: (data.joinedAt as Agent["joinedAt"]) ?? 0,
        };
      });
      setMap(next);
    });
    return () => unsub();
  }, []);
  return map;
}
