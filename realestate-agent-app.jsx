import React, { useState, useEffect, useRef } from "react";
import {
  Home, Plus, LogOut, User, Search, X, Edit3, Trash2, Camera,
  MapPin, Bed, Bath, Maximize, DollarSign, ArrowLeft, Database,
  Image as ImageIcon, Eye, Users, TrendingUp, AlertCircle, Check, Loader
} from "lucide-react";

// ───────────────────────────────────────────────────────────
// Styling: editorial real-estate aesthetic
// Cream backgrounds, terracotta accent, deep forest green for "sold"
// Fraunces serif display + Inter Tight body
// ───────────────────────────────────────────────────────────

const FontStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
    .font-display { font-family: 'Fraunces', Georgia, serif; font-feature-settings: 'ss01'; letter-spacing: -0.02em; }
    .font-body { font-family: 'Inter Tight', system-ui, sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    body { background: #F4EFE6; }
    input::placeholder, textarea::placeholder { color: #A89C8C; }
    .scroll-thin::-webkit-scrollbar { width: 6px; height: 6px; }
    .scroll-thin::-webkit-scrollbar-thumb { background: #D4C7AE; border-radius: 3px; }
    .scroll-thin::-webkit-scrollbar-track { background: transparent; }
    .fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  `}</style>
);

// ───────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────

const palette = {
  cream: "#F4EFE6",
  paper: "#FFFFFF",
  ink: "#1F1A15",
  inkSoft: "#6B6258",
  inkMuted: "#9A8F82",
  terracotta: "#B85540",
  terracottaDark: "#9C4533",
  forest: "#3D5A40",
  border: "#E5DDC9",
  borderStrong: "#D4C7AE",
  warning: "#C68B2A",
};

async function hashPassword(password) {
  const data = new TextEncoder().encode(password + "::salt::realestate");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function compressImage(file, maxWidth = 1000, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(maxWidth / img.width, 1);
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const fmtMoney = (n, type) => {
  const s = "$" + Number(n).toLocaleString();
  return type === "rent" ? s + "/mo" : s;
};

const fmtDate = (ts) => {
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return Math.round(diff / 60000) + "m ago";
  if (diff < 86400000) return Math.round(diff / 3600000) + "h ago";
  if (diff < 604800000) return Math.round(diff / 86400000) + "d ago";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// ───────────────────────────────────────────────────────────
// Storage layer (simulates Firestore for now)
// Same API shape will map 1:1 to Firebase later
// ───────────────────────────────────────────────────────────

const db = {
  async getAgents() {
    try {
      const r = await window.storage.get("agents", true);
      return r ? JSON.parse(r.value) : [];
    } catch { return []; }
  },
  async saveAgents(agents) {
    await window.storage.set("agents", JSON.stringify(agents), true);
  },
  async getListings() {
    try {
      const r = await window.storage.get("listings", true);
      return r ? JSON.parse(r.value) : [];
    } catch { return []; }
  },
  async saveListings(listings) {
    await window.storage.set("listings", JSON.stringify(listings), true);
  },
  async getSession() {
    try {
      const r = await window.storage.get("session_agent_id", false);
      return r ? r.value : null;
    } catch { return null; }
  },
  async setSession(agentId) {
    if (agentId) await window.storage.set("session_agent_id", agentId, false);
    else await window.storage.delete("session_agent_id", false);
  },
};

// Seed demo data on first run
async function seedIfEmpty() {
  const agents = await db.getAgents();
  if (agents.length > 0) return;

  const seedAgents = [
    {
      id: "agent_demo_1",
      name: "Bat-Erdene Ganbold",
      email: "demo@agency.mn",
      passwordHash: await hashPassword("demo1234"),
      bio: "Senior agent, 12 years experience in Ulaanbaatar residential market.",
      avatar: "BG",
      joinedAt: Date.now() - 86400000 * 400,
    },
  ];

  const seedListings = [
    {
      id: "l1",
      agentId: "agent_demo_1",
      title: "Three-bedroom apartment, Sukhbaatar district",
      type: "sale",
      price: 145000,
      currency: "USD",
      location: "Sukhbaatar district, Ulaanbaatar",
      beds: 3, baths: 2, sqm: 92,
      photos: [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=75",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&q=75",
      ],
      description: "Modern apartment near Central Tower, 8th floor. South-facing balcony with city view, underground parking included. Recently renovated kitchen and bathrooms. Walking distance to schools and Naadam plaza.",
      status: "active",
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
    },
    {
      id: "l2",
      agentId: "agent_demo_1",
      title: "Family house with garden, Zaisan",
      type: "sale",
      price: 320000,
      currency: "USD",
      location: "Khan-Uul district, Zaisan, Ulaanbaatar",
      beds: 4, baths: 3, sqm: 220,
      photos: [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=75",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=75",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=75",
      ],
      description: "Detached two-story family home with private garden and mountain views toward Bogd Khan. Garage for two vehicles, fireplace in main living area, traditional ger pad in backyard. Quiet residential street, 15 minutes from city center.",
      status: "active",
      createdAt: Date.now() - 172800000,
      updatedAt: Date.now() - 172800000,
    },
    {
      id: "l3",
      agentId: "agent_demo_1",
      title: "Studio apartment near MUST campus",
      type: "rent",
      price: 450,
      currency: "USD",
      location: "Bayanzurkh district, Ulaanbaatar",
      beds: 1, baths: 1, sqm: 38,
      photos: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=75",
      ],
      description: "Fully furnished studio, ideal for student or young professional. Walking distance to Mongolian University of Science and Technology. Building has 24-hour security and elevator. Utilities included in rent.",
      status: "active",
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000,
    },
  ];

  await db.saveAgents(seedAgents);
  await db.saveListings(seedListings);
}

// ───────────────────────────────────────────────────────────
// UI primitives
// ───────────────────────────────────────────────────────────

const Btn = ({ children, onClick, variant = "primary", icon: Icon, type = "button", disabled, className = "" }) => {
  const styles = {
    primary: { bg: palette.terracotta, color: "#FFF", hoverBg: palette.terracottaDark, border: palette.terracotta },
    secondary: { bg: palette.paper, color: palette.ink, hoverBg: palette.cream, border: palette.borderStrong },
    ghost: { bg: "transparent", color: palette.ink, hoverBg: palette.cream, border: "transparent" },
    danger: { bg: palette.paper, color: "#9C2A2A", hoverBg: "#FBEAEA", border: "#E8B8B8" },
  }[variant];
  const [hover, setHover] = useState(false);
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`font-body inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all ${className}`}
      style={{
        backgroundColor: hover && !disabled ? styles.hoverBg : styles.bg,
        color: styles.color,
        border: `1px solid ${styles.border}`,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};

const Input = ({ label, error, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="font-body text-xs font-medium uppercase tracking-wider" style={{ color: palette.inkSoft }}>{label}</label>}
    <input
      {...props}
      className="font-body text-[15px] px-3.5 py-2.5 rounded-md outline-none transition-colors"
      style={{
        backgroundColor: palette.paper,
        color: palette.ink,
        border: `1px solid ${error ? "#C66" : palette.border}`,
      }}
      onFocus={e => e.target.style.borderColor = palette.terracotta}
      onBlur={e => e.target.style.borderColor = error ? "#C66" : palette.border}
    />
    {error && <span className="font-body text-xs" style={{ color: "#C66" }}>{error}</span>}
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="font-body text-xs font-medium uppercase tracking-wider" style={{ color: palette.inkSoft }}>{label}</label>}
    <textarea
      {...props}
      className="font-body text-[15px] px-3.5 py-2.5 rounded-md outline-none transition-colors resize-none"
      style={{ backgroundColor: palette.paper, color: palette.ink, border: `1px solid ${palette.border}` }}
      onFocus={e => e.target.style.borderColor = palette.terracotta}
      onBlur={e => e.target.style.borderColor = palette.border}
    />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="font-body text-xs font-medium uppercase tracking-wider" style={{ color: palette.inkSoft }}>{label}</label>}
    <select
      {...props}
      className="font-body text-[15px] px-3.5 py-2.5 rounded-md outline-none transition-colors"
      style={{ backgroundColor: palette.paper, color: palette.ink, border: `1px solid ${palette.border}` }}
    >
      {children}
    </select>
  </div>
);

const Tag = ({ children, color = "neutral" }) => {
  const c = {
    sale: { bg: "#E8EFE6", fg: palette.forest },
    rent: { bg: "#EFE3DC", fg: palette.terracottaDark },
    neutral: { bg: palette.cream, fg: palette.inkSoft },
  }[color];
  return (
    <span className="font-body text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ backgroundColor: c.bg, color: c.fg }}>
      {children}
    </span>
  );
};

// ───────────────────────────────────────────────────────────
// Login screen
// ───────────────────────────────────────────────────────────

function LoginScreen({ onAuth }) {
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const agents = await db.getAgents();
      if (mode === "signin") {
        const hash = await hashPassword(form.password);
        const found = agents.find(a => a.email.toLowerCase() === form.email.toLowerCase() && a.passwordHash === hash);
        if (!found) { setError("Email or password is incorrect"); setLoading(false); return; }
        await db.setSession(found.id);
        onAuth(found);
      } else {
        if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
          setError("Name, valid email, and password (6+ chars) required");
          setLoading(false); return;
        }
        if (agents.find(a => a.email.toLowerCase() === form.email.toLowerCase())) {
          setError("An agent with this email already exists");
          setLoading(false); return;
        }
        const passwordHash = await hashPassword(form.password);
        const newAgent = {
          id: "agent_" + Date.now(),
          name: form.name.trim(),
          email: form.email.trim(),
          passwordHash,
          bio: "",
          avatar: form.name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase(),
          joinedAt: Date.now(),
        };
        await db.saveAgents([...agents, newAgent]);
        await db.setSession(newAgent.id);
        onAuth(newAgent);
      }
    } catch (err) {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex font-body" style={{ backgroundColor: palette.cream }}>
      {/* Left: editorial visual */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: palette.ink, color: palette.cream }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm flex items-center justify-center" style={{ backgroundColor: palette.terracotta }}>
            <Home size={18} color="#FFF" />
          </div>
          <span className="font-display text-xl">Khashaa</span>
        </div>
        <div className="space-y-6">
          <div className="font-display text-5xl leading-tight" style={{ fontWeight: 400 }}>
            Listings, agents, and conversations —<br/>
            <em style={{ color: palette.terracotta, fontStyle: "italic" }}>in one place.</em>
          </div>
          <div className="text-sm max-w-md leading-relaxed" style={{ color: "#B5AEA0" }}>
            The agent dashboard for properties that will be searchable through your Messenger chatbot. Add a listing here — it appears live for customers asking the AI about homes.
          </div>
        </div>
        <div className="text-xs uppercase tracking-widest" style={{ color: "#7C7569" }}>
          Real-estate operating system · v1
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-sm flex items-center justify-center" style={{ backgroundColor: palette.terracotta }}>
              <Home size={18} color="#FFF" />
            </div>
            <span className="font-display text-xl" style={{ color: palette.ink }}>Khashaa</span>
          </div>

          <h1 className="font-display text-3xl mb-2" style={{ color: palette.ink, fontWeight: 500 }}>
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm mb-8" style={{ color: palette.inkSoft }}>
            {mode === "signin" ? "Sign in to manage your listings" : "Start adding properties in minutes"}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <Input label="Full name" type="text" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Bat-Erdene Ganbold" />
            )}
            <Input label="Email" type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="agent@agency.mn" />
            <Input label="Password" type="password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder={mode === "signin" ? "Your password" : "At least 6 characters"} />

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-md text-sm" style={{ backgroundColor: "#FBEAEA", color: "#7A2020" }}>
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <Btn type="submit" disabled={loading} className="w-full">
              {loading ? <Loader size={16} className="animate-spin" /> : null}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Btn>
          </form>

          <div className="mt-6 text-sm" style={{ color: palette.inkSoft }}>
            {mode === "signin" ? (
              <>New here?{" "}
                <button onClick={() => { setMode("signup"); setError(""); }}
                  className="underline" style={{ color: palette.terracotta }}>
                  Create an agent account
                </button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button onClick={() => { setMode("signin"); setError(""); }}
                  className="underline" style={{ color: palette.terracotta }}>
                  Sign in
                </button>
              </>
            )}
          </div>

          <div className="mt-8 p-4 rounded-md" style={{ backgroundColor: palette.paper, border: `1px solid ${palette.border}` }}>
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: palette.inkSoft }}>Demo account</div>
            <div className="font-mono text-xs" style={{ color: palette.ink }}>
              demo@agency.mn / demo1234
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Photo uploader
// ───────────────────────────────────────────────────────────

function PhotoUploader({ photos, onChange, max = 8 }) {
  const fileRef = useRef();
  const [busy, setBusy] = useState(false);

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    const remaining = max - photos.length;
    const toProcess = files.slice(0, remaining);
    const compressed = [];
    for (const f of toProcess) {
      try { compressed.push(await compressImage(f, 1000, 0.75)); }
      catch { /* skip bad image */ }
    }
    onChange([...photos, ...compressed]);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function remove(idx) {
    onChange(photos.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="font-body text-xs font-medium uppercase tracking-wider" style={{ color: palette.inkSoft }}>
        Photos ({photos.length}/{max})
      </label>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {photos.map((p, i) => (
          <div key={i} className="relative aspect-square rounded-md overflow-hidden group"
            style={{ border: `1px solid ${palette.border}` }}>
            <img src={p} alt="" className="w-full h-full object-cover" />
            {i === 0 && (
              <div className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-medium rounded"
                style={{ backgroundColor: palette.ink, color: palette.cream }}>
                Cover
              </div>
            )}
            <button type="button" onClick={() => remove(i)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100"
              style={{ backgroundColor: "rgba(0,0,0,0.7)", color: "#FFF" }}>
              <X size={12} />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <button type="button" onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="aspect-square rounded-md flex flex-col items-center justify-center gap-1 transition-colors"
            style={{
              border: `1px dashed ${palette.borderStrong}`,
              backgroundColor: palette.cream,
              color: palette.inkSoft,
              cursor: busy ? "wait" : "pointer",
            }}>
            {busy ? <Loader size={18} className="animate-spin" /> : <Camera size={18} />}
            <span className="text-[10px] uppercase tracking-wider">{busy ? "Uploading" : "Add"}</span>
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
      <span className="text-xs" style={{ color: palette.inkMuted }}>
        Photos are compressed automatically. First photo becomes the cover.
      </span>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Listing form (add + edit)
// ───────────────────────────────────────────────────────────

function ListingForm({ initial, onSave, onCancel, agentId }) {
  const [form, setForm] = useState(initial || {
    title: "", type: "sale", price: "", location: "",
    beds: "", baths: "", sqm: "", description: "", photos: []
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.price || !form.location.trim()) {
      setError("Title, price, and location are required");
      return;
    }
    setSaving(true);
    const listings = await db.getListings();
    const now = Date.now();
    if (initial?.id) {
      const updated = listings.map(l => l.id === initial.id ? { ...l, ...form, price: Number(form.price), beds: Number(form.beds) || 0, baths: Number(form.baths) || 0, sqm: Number(form.sqm) || 0, updatedAt: now } : l);
      await db.saveListings(updated);
    } else {
      const newListing = {
        id: "l_" + now,
        agentId,
        title: form.title.trim(),
        type: form.type,
        price: Number(form.price),
        currency: "USD",
        location: form.location.trim(),
        beds: Number(form.beds) || 0,
        baths: Number(form.baths) || 0,
        sqm: Number(form.sqm) || 0,
        photos: form.photos,
        description: form.description.trim(),
        status: "active",
        createdAt: now,
        updatedAt: now,
      };
      await db.saveListings([newListing, ...listings]);
    }
    setSaving(false);
    onSave();
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 fade-in">
      <button onClick={onCancel} className="font-body text-sm flex items-center gap-1.5 mb-6 hover:underline"
        style={{ color: palette.inkSoft }}>
        <ArrowLeft size={14} /> Back
      </button>

      <h1 className="font-display text-3xl mb-1" style={{ color: palette.ink, fontWeight: 500 }}>
        {initial?.id ? "Edit listing" : "New listing"}
      </h1>
      <p className="text-sm mb-8" style={{ color: palette.inkSoft }}>
        Once saved, this property is immediately searchable in the database the chatbot reads from.
      </p>

      <form onSubmit={submit} className="space-y-5">
        <Input label="Property title" value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="Three-bedroom apartment, Sukhbaatar district" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Listing type" value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="sale">For sale</option>
            <option value="rent">For rent</option>
          </Select>
          <Input label={`Price (USD${form.type === "rent" ? " / month" : ""})`} type="number"
            value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
            placeholder="145000" />
        </div>

        <Input label="Location" value={form.location}
          onChange={e => setForm({ ...form, location: e.target.value })}
          placeholder="Sukhbaatar district, Ulaanbaatar" />

        <div className="grid grid-cols-3 gap-4">
          <Input label="Bedrooms" type="number" value={form.beds}
            onChange={e => setForm({ ...form, beds: e.target.value })} placeholder="3" />
          <Input label="Bathrooms" type="number" value={form.baths}
            onChange={e => setForm({ ...form, baths: e.target.value })} placeholder="2" />
          <Input label="Size (m²)" type="number" value={form.sqm}
            onChange={e => setForm({ ...form, sqm: e.target.value })} placeholder="92" />
        </div>

        <PhotoUploader photos={form.photos} onChange={(photos) => setForm({ ...form, photos })} />

        <Textarea label="Description" rows={4} value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="What makes this property special? Floor, view, parking, neighborhood, recent renovations…" />

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-md text-sm"
            style={{ backgroundColor: "#FBEAEA", color: "#7A2020" }}>
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Btn type="submit" disabled={saving} icon={saving ? null : Check}>
            {saving ? <><Loader size={16} className="animate-spin" /> Saving</> : (initial?.id ? "Save changes" : "Publish listing")}
          </Btn>
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        </div>
      </form>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Listing card + detail
// ───────────────────────────────────────────────────────────

function ListingCard({ listing, agent, onClick, ownedByMe }) {
  const cover = listing.photos?.[0];
  return (
    <div onClick={onClick}
      className="group cursor-pointer fade-in rounded-lg overflow-hidden transition-transform hover:-translate-y-0.5"
      style={{ backgroundColor: palette.paper, border: `1px solid ${palette.border}` }}>
      <div className="aspect-[4/3] relative overflow-hidden" style={{ backgroundColor: palette.cream }}>
        {cover ? (
          <img src={cover} alt={listing.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: palette.inkMuted }}>
            <ImageIcon size={32} />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <Tag color={listing.type}>{listing.type === "sale" ? "For sale" : "For rent"}</Tag>
          {ownedByMe && <Tag>Yours</Tag>}
        </div>
        {listing.photos?.length > 1 && (
          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded text-[11px] font-medium font-body"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#FFF" }}>
            {listing.photos.length} photos
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="font-display text-lg leading-snug mb-1 line-clamp-2" style={{ color: palette.ink, fontWeight: 500 }}>
          {listing.title}
        </div>
        <div className="flex items-center gap-1.5 text-xs mb-3" style={{ color: palette.inkSoft }}>
          <MapPin size={12} /> {listing.location}
        </div>
        <div className="flex items-baseline justify-between mb-3">
          <div className="font-display text-2xl" style={{ color: palette.terracotta, fontWeight: 600 }}>
            {fmtMoney(listing.price, listing.type)}
          </div>
        </div>
        <div className="flex items-center gap-4 pt-3 text-xs" style={{ borderTop: `1px solid ${palette.border}`, color: palette.inkSoft }}>
          <span className="flex items-center gap-1"><Bed size={13} /> {listing.beds}</span>
          <span className="flex items-center gap-1"><Bath size={13} /> {listing.baths}</span>
          <span className="flex items-center gap-1"><Maximize size={13} /> {listing.sqm}m²</span>
          {agent && <span className="ml-auto truncate">{agent.name.split(" ")[0]}</span>}
        </div>
      </div>
    </div>
  );
}

function ListingDetail({ listing, agent, currentAgent, onBack, onEdit, onDelete }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const owned = listing.agentId === currentAgent.id;
  const photos = listing.photos?.length ? listing.photos : [];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 fade-in">
      <button onClick={onBack} className="font-body text-sm flex items-center gap-1.5 mb-6 hover:underline"
        style={{ color: palette.inkSoft }}>
        <ArrowLeft size={14} /> Back to listings
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <div className="aspect-[4/3] rounded-lg overflow-hidden mb-3" style={{ backgroundColor: palette.cream, border: `1px solid ${palette.border}` }}>
            {photos[photoIdx] ? (
              <img src={photos[photoIdx]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ color: palette.inkMuted }}>
                <ImageIcon size={48} />
              </div>
            )}
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scroll-thin">
              {photos.map((p, i) => (
                <button key={i} onClick={() => setPhotoIdx(i)}
                  className="flex-shrink-0 w-20 h-20 rounded overflow-hidden transition-all"
                  style={{
                    border: `2px solid ${i === photoIdx ? palette.terracotta : "transparent"}`,
                    opacity: i === photoIdx ? 1 : 0.6,
                  }}>
                  <img src={p} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="flex gap-2 mb-3">
            <Tag color={listing.type}>{listing.type === "sale" ? "For sale" : "For rent"}</Tag>
            <Tag>Listed {fmtDate(listing.createdAt)}</Tag>
          </div>
          <h1 className="font-display text-3xl leading-tight mb-2" style={{ color: palette.ink, fontWeight: 500 }}>
            {listing.title}
          </h1>
          <div className="flex items-center gap-1.5 text-sm mb-5" style={{ color: palette.inkSoft }}>
            <MapPin size={14} /> {listing.location}
          </div>

          <div className="font-display text-4xl mb-6" style={{ color: palette.terracotta, fontWeight: 600 }}>
            {fmtMoney(listing.price, listing.type)}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6 py-4" style={{ borderTop: `1px solid ${palette.border}`, borderBottom: `1px solid ${palette.border}` }}>
            <div>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: palette.inkSoft }}>Bedrooms</div>
              <div className="font-display text-xl" style={{ color: palette.ink, fontWeight: 500 }}>{listing.beds}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: palette.inkSoft }}>Bathrooms</div>
              <div className="font-display text-xl" style={{ color: palette.ink, fontWeight: 500 }}>{listing.baths}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: palette.inkSoft }}>Size</div>
              <div className="font-display text-xl" style={{ color: palette.ink, fontWeight: 500 }}>{listing.sqm}m²</div>
            </div>
          </div>

          {listing.description && (
            <div className="mb-6">
              <div className="text-xs uppercase tracking-wider mb-2" style={{ color: palette.inkSoft }}>Description</div>
              <p className="font-body text-[15px] leading-relaxed" style={{ color: palette.ink }}>
                {listing.description}
              </p>
            </div>
          )}

          {agent && (
            <div className="p-4 rounded-md flex items-center gap-3 mb-6" style={{ backgroundColor: palette.cream, border: `1px solid ${palette.border}` }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-display text-sm"
                style={{ backgroundColor: palette.ink, color: palette.cream, fontWeight: 500 }}>
                {agent.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs uppercase tracking-wider" style={{ color: palette.inkSoft }}>Listing agent</div>
                <div className="font-body text-sm font-medium truncate" style={{ color: palette.ink }}>{agent.name}</div>
              </div>
            </div>
          )}

          {owned && (
            <div className="flex gap-2">
              <Btn icon={Edit3} onClick={onEdit}>Edit listing</Btn>
              <Btn variant="danger" icon={Trash2} onClick={onDelete}>Delete</Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Listings grid view
// ───────────────────────────────────────────────────────────

function ListingsView({ listings, agents, currentAgent, scope, onListingClick }) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filtered = listings.filter(l => {
    if (scope === "mine" && l.agentId !== currentAgent.id) return false;
    if (filterType !== "all" && l.type !== filterType) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!l.title.toLowerCase().includes(s) && !l.location.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const agentMap = Object.fromEntries(agents.map(a => [a.id, a]));

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl" style={{ color: palette.ink, fontWeight: 500 }}>
            {scope === "mine" ? "My listings" : "All listings"}
          </h1>
          <p className="text-sm mt-1" style={{ color: palette.inkSoft }}>
            {scope === "mine" ? "Properties you have listed" : "The full database — what the chatbot sees"} · {filtered.length} {filtered.length === 1 ? "property" : "properties"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: palette.inkMuted }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search title or location"
              className="font-body text-sm pl-9 pr-3 py-2.5 rounded-md outline-none w-56"
              style={{ backgroundColor: palette.paper, color: palette.ink, border: `1px solid ${palette.border}` }} />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="font-body text-sm px-3 py-2.5 rounded-md outline-none"
            style={{ backgroundColor: palette.paper, color: palette.ink, border: `1px solid ${palette.border}` }}>
            <option value="all">All types</option>
            <option value="sale">For sale</option>
            <option value="rent">For rent</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-lg" style={{ backgroundColor: palette.paper, border: `1px solid ${palette.border}` }}>
          <Home size={32} className="mx-auto mb-3" style={{ color: palette.inkMuted }} />
          <div className="font-display text-xl mb-1" style={{ color: palette.ink }}>No listings found</div>
          <div className="text-sm" style={{ color: palette.inkSoft }}>
            {scope === "mine" ? "Add your first property to get started" : "Try a different search or filter"}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(l => (
            <ListingCard key={l.id} listing={l} agent={agentMap[l.agentId]}
              ownedByMe={l.agentId === currentAgent.id}
              onClick={() => onListingClick(l)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Dashboard
// ───────────────────────────────────────────────────────────

function Dashboard({ listings, currentAgent, onAdd, onListingClick, onViewAll, onViewMine }) {
  const myListings = listings.filter(l => l.agentId === currentAgent.id);
  const myActive = myListings.filter(l => l.status === "active");
  const mySale = myActive.filter(l => l.type === "sale");
  const myRent = myActive.filter(l => l.type === "rent");
  const totalValue = mySale.reduce((s, l) => s + l.price, 0);
  const recent = [...myListings].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);

  const StatCard = ({ label, value, sub, icon: Icon }) => (
    <div className="p-5 rounded-lg" style={{ backgroundColor: palette.paper, border: `1px solid ${palette.border}` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs uppercase tracking-wider" style={{ color: palette.inkSoft }}>{label}</div>
        <Icon size={16} style={{ color: palette.inkMuted }} />
      </div>
      <div className="font-display text-3xl" style={{ color: palette.ink, fontWeight: 500 }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: palette.inkSoft }}>{sub}</div>}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: palette.terracotta }}>
            Welcome back
          </div>
          <h1 className="font-display text-4xl" style={{ color: palette.ink, fontWeight: 500 }}>
            {currentAgent.name.split(" ")[0]}'s dashboard
          </h1>
        </div>
        <Btn icon={Plus} onClick={onAdd}>New listing</Btn>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Active listings" value={myActive.length} sub={`${myListings.length} total`} icon={Home} />
        <StatCard label="For sale" value={mySale.length} sub={fmtMoney(totalValue).replace("/mo", "") + " portfolio"} icon={TrendingUp} />
        <StatCard label="For rent" value={myRent.length} sub="active rentals" icon={Database} />
        <StatCard label="Member since" value={fmtDate(currentAgent.joinedAt).replace(" ago", "")} sub="" icon={User} />
      </div>

      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-2xl" style={{ color: palette.ink, fontWeight: 500 }}>Recent activity</h2>
        <button onClick={onViewMine} className="font-body text-sm hover:underline" style={{ color: palette.terracotta }}>
          View all my listings →
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="text-center py-16 rounded-lg" style={{ backgroundColor: palette.paper, border: `1px solid ${palette.border}` }}>
          <Home size={32} className="mx-auto mb-3" style={{ color: palette.inkMuted }} />
          <div className="font-display text-xl mb-2" style={{ color: palette.ink }}>No listings yet</div>
          <div className="text-sm mb-5" style={{ color: palette.inkSoft }}>Add your first property to get started</div>
          <Btn icon={Plus} onClick={onAdd}>Add listing</Btn>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recent.map(l => (
            <ListingCard key={l.id} listing={l} ownedByMe onClick={() => onListingClick(l)} />
          ))}
        </div>
      )}

      <div className="mt-12 p-6 rounded-lg" style={{ backgroundColor: palette.ink, color: palette.cream }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest mb-2" style={{ color: palette.terracotta }}>Coming next</div>
            <div className="font-display text-2xl" style={{ fontWeight: 500 }}>Phase 2: Messenger chatbot</div>
            <div className="text-sm mt-1" style={{ color: "#B5AEA0" }}>
              The same database powers AI conversations with customers on Facebook Messenger.
            </div>
          </div>
          <button onClick={onViewAll} className="font-body text-sm px-4 py-2.5 rounded-md flex items-center gap-2 transition-colors"
            style={{ backgroundColor: palette.terracotta, color: "#FFF", border: "none", cursor: "pointer" }}>
            <Database size={14} /> See the database the bot will read
          </button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Profile view
// ───────────────────────────────────────────────────────────

function ProfileView({ currentAgent, onUpdate, listings }) {
  const [form, setForm] = useState({ name: currentAgent.name, bio: currentAgent.bio || "" });
  const [saved, setSaved] = useState(false);
  const myListings = listings.filter(l => l.agentId === currentAgent.id);

  async function save() {
    const agents = await db.getAgents();
    const updated = agents.map(a => a.id === currentAgent.id ? {
      ...a,
      name: form.name.trim() || a.name,
      bio: form.bio.trim(),
      avatar: (form.name.trim() || a.name).split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase(),
    } : a);
    await db.saveAgents(updated);
    onUpdate(updated.find(a => a.id === currentAgent.id));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 fade-in">
      <h1 className="font-display text-4xl mb-2" style={{ color: palette.ink, fontWeight: 500 }}>Your profile</h1>
      <p className="text-sm mb-8" style={{ color: palette.inkSoft }}>How customers will see you in chat conversations.</p>

      <div className="p-6 rounded-lg mb-6" style={{ backgroundColor: palette.paper, border: `1px solid ${palette.border}` }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center font-display text-xl"
            style={{ backgroundColor: palette.ink, color: palette.cream, fontWeight: 500 }}>
            {currentAgent.avatar}
          </div>
          <div>
            <div className="font-display text-xl" style={{ color: palette.ink }}>{currentAgent.name}</div>
            <div className="text-sm" style={{ color: palette.inkSoft }}>{currentAgent.email}</div>
          </div>
        </div>

        <div className="space-y-4">
          <Input label="Display name" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
          <Textarea label="Bio (shown to customers)" rows={3} value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })}
            placeholder="Senior agent, 12 years experience…" />
          <div className="flex items-center gap-3">
            <Btn onClick={save} icon={Check}>Save changes</Btn>
            {saved && <span className="text-sm font-body" style={{ color: palette.forest }}>Saved.</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-4 rounded-lg" style={{ backgroundColor: palette.paper, border: `1px solid ${palette.border}` }}>
          <div className="text-xs uppercase tracking-wider" style={{ color: palette.inkSoft }}>Listings</div>
          <div className="font-display text-2xl" style={{ color: palette.ink, fontWeight: 500 }}>{myListings.length}</div>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: palette.paper, border: `1px solid ${palette.border}` }}>
          <div className="text-xs uppercase tracking-wider" style={{ color: palette.inkSoft }}>For sale</div>
          <div className="font-display text-2xl" style={{ color: palette.ink, fontWeight: 500 }}>{myListings.filter(l => l.type === "sale").length}</div>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: palette.paper, border: `1px solid ${palette.border}` }}>
          <div className="text-xs uppercase tracking-wider" style={{ color: palette.inkSoft }}>For rent</div>
          <div className="font-display text-2xl" style={{ color: palette.ink, fontWeight: 500 }}>{myListings.filter(l => l.type === "rent").length}</div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Database viewer (the "Firebase console" view)
// ───────────────────────────────────────────────────────────

function DatabaseView({ listings, agents }) {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4 fade-in">
      <h1 className="font-display text-4xl mb-2" style={{ color: palette.ink, fontWeight: 500 }}>Database</h1>
      <p className="text-sm mb-8" style={{ color: palette.inkSoft }}>
        The same data your Messenger chatbot will query. In production this is Firebase Firestore. Identical schema.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${palette.border}` }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: palette.ink, color: palette.cream }}>
            <span className="font-mono text-xs">/listings</span>
            <span className="font-mono text-xs">{listings.length} docs</span>
          </div>
          <div className="p-4 max-h-[500px] overflow-y-auto scroll-thin font-mono text-[11px] leading-relaxed whitespace-pre-wrap"
            style={{ backgroundColor: palette.paper, color: palette.ink }}>
            {JSON.stringify(listings.map(l => ({ ...l, photos: l.photos?.length ? `[${l.photos.length} photos]` : [] })), null, 2)}
          </div>
        </div>
        <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${palette.border}` }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: palette.ink, color: palette.cream }}>
            <span className="font-mono text-xs">/agents</span>
            <span className="font-mono text-xs">{agents.length} docs</span>
          </div>
          <div className="p-4 max-h-[500px] overflow-y-auto scroll-thin font-mono text-[11px] leading-relaxed whitespace-pre-wrap"
            style={{ backgroundColor: palette.paper, color: palette.ink }}>
            {JSON.stringify(agents.map(a => ({ ...a, passwordHash: "***hidden***" })), null, 2)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// App shell
// ───────────────────────────────────────────────────────────

function AppShell({ currentAgent, onLogout, view, setView, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "myListings", label: "My listings" },
    { id: "allListings", label: "All listings" },
    { id: "database", label: "Database" },
    { id: "profile", label: "Profile" },
  ];

  return (
    <div className="min-h-screen font-body" style={{ backgroundColor: palette.cream }}>
      <header className="sticky top-0 z-20" style={{ backgroundColor: palette.cream, borderBottom: `1px solid ${palette.border}` }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button onClick={() => setView("dashboard")} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm flex items-center justify-center" style={{ backgroundColor: palette.terracotta }}>
              <Home size={16} color="#FFF" />
            </div>
            <span className="font-display text-lg" style={{ color: palette.ink, fontWeight: 500 }}>Khashaa</span>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setView(item.id)}
                className="font-body text-sm px-3 py-2 rounded-md transition-colors"
                style={{
                  color: view === item.id ? palette.ink : palette.inkSoft,
                  backgroundColor: view === item.id ? palette.paper : "transparent",
                  fontWeight: view === item.id ? 500 : 400,
                }}>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => setView("addListing")}
              className="hidden sm:flex font-body text-sm px-3 py-2 rounded-md items-center gap-1.5 transition-colors"
              style={{ backgroundColor: palette.terracotta, color: "#FFF", border: "none", cursor: "pointer" }}>
              <Plus size={14} /> New
            </button>
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)}
                className="w-9 h-9 rounded-full flex items-center justify-center font-display text-xs"
                style={{ backgroundColor: palette.ink, color: palette.cream, fontWeight: 500, cursor: "pointer", border: "none" }}>
                {currentAgent.avatar}
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)}></div>
                  <div className="absolute right-0 top-11 w-56 rounded-md py-1 z-20"
                    style={{ backgroundColor: palette.paper, border: `1px solid ${palette.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
                    <div className="px-3 py-2 border-b" style={{ borderColor: palette.border }}>
                      <div className="text-sm font-medium" style={{ color: palette.ink }}>{currentAgent.name}</div>
                      <div className="text-xs" style={{ color: palette.inkSoft }}>{currentAgent.email}</div>
                    </div>
                    {navItems.map(item => (
                      <button key={item.id} onClick={() => { setView(item.id); setMenuOpen(false); }}
                        className="md:hidden block w-full text-left px-3 py-2 text-sm"
                        style={{ color: palette.ink }}>
                        {item.label}
                      </button>
                    ))}
                    <button onClick={() => { onLogout(); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm flex items-center gap-2"
                      style={{ color: palette.terracottaDark }}>
                      <LogOut size={13} /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="max-w-7xl mx-auto px-4 py-8 mt-12 text-xs" style={{ color: palette.inkMuted, borderTop: `1px solid ${palette.border}` }}>
        Khashaa · Real-estate operating system · v1
      </footer>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Root
// ───────────────────────────────────────────────────────────

export default function App() {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [agents, setAgents] = useState([]);
  const [listings, setListings] = useState([]);
  const [view, setView] = useState("dashboard");
  const [selectedListing, setSelectedListing] = useState(null);
  const [editingListing, setEditingListing] = useState(null);

  async function refreshData() {
    const [a, l] = await Promise.all([db.getAgents(), db.getListings()]);
    setAgents(a); setListings(l);
  }

  useEffect(() => {
    (async () => {
      await seedIfEmpty();
      await refreshData();
      const sessionId = await db.getSession();
      if (sessionId) {
        const a = await db.getAgents();
        const me = a.find(x => x.id === sessionId);
        if (me) setCurrentAgent(me);
      }
      setBootstrapping(false);
    })();
  }, []);

  // Poll for updates every 3s — simulates real-time DB sync.
  // (In production, Firestore onSnapshot replaces this.)
  useEffect(() => {
    if (!currentAgent) return;
    const t = setInterval(refreshData, 3000);
    return () => clearInterval(t);
  }, [currentAgent]);

  async function handleLogout() {
    await db.setSession(null);
    setCurrentAgent(null);
    setView("dashboard");
  }

  async function handleDelete(listing) {
    if (!confirm(`Delete "${listing.title}"? This cannot be undone.`)) return;
    const next = listings.filter(l => l.id !== listing.id);
    await db.saveListings(next);
    await refreshData();
    setSelectedListing(null);
    setView("myListings");
  }

  if (bootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center font-body" style={{ backgroundColor: palette.cream }}>
        <FontStyles />
        <Loader size={24} className="animate-spin" style={{ color: palette.terracotta }} />
      </div>
    );
  }

  if (!currentAgent) {
    return (
      <>
        <FontStyles />
        <LoginScreen onAuth={async (agent) => { setCurrentAgent(agent); await refreshData(); }} />
      </>
    );
  }

  let content;
  if (view === "addListing" || view === "editListing") {
    content = (
      <ListingForm
        initial={view === "editListing" ? editingListing : null}
        agentId={currentAgent.id}
        onSave={async () => { await refreshData(); setEditingListing(null); setView(view === "editListing" ? "myListings" : "myListings"); }}
        onCancel={() => { setEditingListing(null); setView("myListings"); }}
      />
    );
  } else if (selectedListing) {
    const listing = listings.find(l => l.id === selectedListing.id) || selectedListing;
    const agent = agents.find(a => a.id === listing.agentId);
    content = (
      <ListingDetail
        listing={listing} agent={agent} currentAgent={currentAgent}
        onBack={() => setSelectedListing(null)}
        onEdit={() => { setEditingListing(listing); setSelectedListing(null); setView("editListing"); }}
        onDelete={() => handleDelete(listing)}
      />
    );
  } else if (view === "dashboard") {
    content = <Dashboard listings={listings} currentAgent={currentAgent}
      onAdd={() => setView("addListing")}
      onListingClick={setSelectedListing}
      onViewAll={() => setView("database")}
      onViewMine={() => setView("myListings")} />;
  } else if (view === "myListings") {
    content = <ListingsView listings={listings} agents={agents} currentAgent={currentAgent}
      scope="mine" onListingClick={setSelectedListing} />;
  } else if (view === "allListings") {
    content = <ListingsView listings={listings} agents={agents} currentAgent={currentAgent}
      scope="all" onListingClick={setSelectedListing} />;
  } else if (view === "database") {
    content = <DatabaseView listings={listings} agents={agents} />;
  } else if (view === "profile") {
    content = <ProfileView currentAgent={currentAgent} listings={listings}
      onUpdate={(updated) => setCurrentAgent(updated)} />;
  }

  return (
    <>
      <FontStyles />
      <AppShell currentAgent={currentAgent} onLogout={handleLogout} view={view} setView={(v) => { setSelectedListing(null); setView(v); }}>
        {content}
      </AppShell>
    </>
  );
}
