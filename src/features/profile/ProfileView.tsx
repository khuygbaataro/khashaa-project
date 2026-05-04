// Edit display name + bio. Persists to /agents/{uid}; AuthContext picks up changes via the snapshot in subsequent loads.
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Btn } from "../../components/Btn";
import { Input } from "../../components/Input";
import { Textarea } from "../../components/Textarea";
import { useAuth } from "../auth/AuthContext";
import { updateAgent } from "../../lib/auth";
import { initialsOf } from "../../lib/utils";
import { subscribeToMyListings } from "../../lib/listings";
import { palette } from "../../lib/palette";
import type { Listing } from "../../lib/schema";

export function ProfileView() {
  const { currentAgent, setCurrentAgent } = useAuth();
  const [form, setForm] = useState({
    name: currentAgent?.name ?? "",
    bio: currentAgent?.bio ?? "",
    phone: currentAgent?.phone ?? "",
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [myListings, setMyListings] = useState<Listing[]>([]);

  useEffect(() => {
    if (!currentAgent) return;
    setForm({
      name: currentAgent.name,
      bio: currentAgent.bio,
      phone: currentAgent.phone ?? "",
    });
  }, [currentAgent]);

  useEffect(() => {
    if (!currentAgent) return;
    const unsub = subscribeToMyListings(currentAgent.id, setMyListings);
    return () => unsub();
  }, [currentAgent]);

  if (!currentAgent) return null;

  async function save() {
    if (!currentAgent) return;
    setSaving(true);
    const next = {
      name: form.name.trim() || currentAgent.name,
      bio: form.bio.trim(),
      phone: form.phone.trim() || undefined,
      avatar: initialsOf(form.name.trim() || currentAgent.name),
    };
    try {
      await updateAgent(currentAgent.id, next);
      setCurrentAgent({ ...currentAgent, ...next });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
      alert("Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  const sale = myListings.filter((l) => l.type === "sale").length;
  const rent = myListings.filter((l) => l.type === "rent").length;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 fade-in">
      <h1
        className="font-display text-4xl mb-2"
        style={{ color: palette.ink, fontWeight: 500 }}
      >
        Your profile
      </h1>
      <p className="text-sm mb-8" style={{ color: palette.inkSoft }}>
        How customers will see you in chat conversations.
      </p>

      <div
        className="p-6 rounded-lg mb-6"
        style={{
          backgroundColor: palette.paper,
          border: `1px solid ${palette.border}`,
        }}
      >
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center font-display text-xl"
            style={{
              backgroundColor: palette.ink,
              color: palette.cream,
              fontWeight: 500,
            }}
          >
            {currentAgent.avatar}
          </div>
          <div>
            <div
              className="font-display text-xl"
              style={{ color: palette.ink }}
            >
              {currentAgent.name}
            </div>
            <div className="text-sm" style={{ color: palette.inkSoft }}>
              {currentAgent.email}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Display name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Phone (optional, for Messenger handoff)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+976 9911 1234"
          />
          <Textarea
            label="Bio (shown to customers)"
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Senior agent, 12 years experience…"
          />
          <div className="flex items-center gap-3">
            <Btn onClick={save} disabled={saving} icon={Check}>
              {saving ? "Saving…" : "Save changes"}
            </Btn>
            {saved ? (
              <span
                className="text-sm font-body"
                style={{ color: palette.forest }}
              >
                Saved.
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Listings" value={myListings.length} />
        <Stat label="For sale" value={sale} />
        <Stat label="For rent" value={rent} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="p-4 rounded-lg"
      style={{
        backgroundColor: palette.paper,
        border: `1px solid ${palette.border}`,
      }}
    >
      <div
        className="text-xs uppercase tracking-wider"
        style={{ color: palette.inkSoft }}
      >
        {label}
      </div>
      <div
        className="font-display text-2xl"
        style={{ color: palette.ink, fontWeight: 500 }}
      >
        {value}
      </div>
    </div>
  );
}
