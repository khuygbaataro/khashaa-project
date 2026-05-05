// Create / edit form for a property. Loads existing listing in edit mode and writes through Firestore.
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader } from "lucide-react";
import { Btn } from "../../components/Btn";
import { Input } from "../../components/Input";
import { Textarea } from "../../components/Textarea";
import { Select } from "../../components/Select";
import { InlineError } from "../../components/InlineError";
import { PhotoUploader } from "../../components/PhotoUploader";
import { useAuth } from "../auth/AuthContext";
import {
  createListing,
  getListing,
  updateListing,
} from "../../lib/listings";
import { palette } from "../../lib/palette";
import type { Listing, ListingType } from "../../lib/schema";

interface FormState {
  title: string;
  type: ListingType;
  price: string;
  location: string;
  district: string;
  city: string;
  beds: string;
  baths: string;
  sqm: string;
  description: string;
  photos: string[];
}

const EMPTY: FormState = {
  title: "",
  type: "sale",
  price: "",
  location: "",
  district: "",
  city: "Ulaanbaatar",
  beds: "",
  baths: "",
  sqm: "",
  description: "",
  photos: [],
};

function fromListing(l: Listing): FormState {
  return {
    title: l.title,
    type: l.type,
    price: String(l.price),
    location: l.location,
    district: l.district ?? "",
    city: l.city ?? "Ulaanbaatar",
    beds: String(l.beds),
    baths: String(l.baths),
    sqm: String(l.sqm),
    description: l.description,
    photos: l.photos,
  };
}

export function ListingForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const nav = useNavigate();
  const { currentAgent } = useAuth();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(editing);

  // Stable id for grouping photo uploads, even when creating a brand-new listing.
  const draftId = useMemo(
    () => id ?? "draft-" + Math.random().toString(36).slice(2, 10),
    [id]
  );

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getListing(id)
      .then((l) => {
        if (cancelled) return;
        if (l) setForm(fromListing(l));
        else setError("Listing not found.");
      })
      .catch(() => setError("Could not load listing."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!currentAgent) return;
    if (!form.title.trim() || !form.price || !form.location.trim()) {
      setError("Title, price, and location are required.");
      return;
    }
    setSaving(true);
    try {
      const data = {
        title: form.title.trim(),
        type: form.type,
        price: Number(form.price),
        location: form.location.trim(),
        district: form.district.trim(),
        city: form.city.trim() || "Ulaanbaatar",
        beds: Number(form.beds) || 0,
        baths: Number(form.baths) || 0,
        sqm: Number(form.sqm) || 0,
        photos: form.photos,
        description: form.description.trim(),
      };
      if (id) {
        await updateListing(id, data);
        nav(`/agent/listings/${id}`);
      } else {
        const newId = await createListing(currentAgent.id, data);
        nav(`/agent/listings/${newId}`);
      }
    } catch (err) {
      console.error(err);
      setError("Could not save. Please try again.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 flex justify-center">
        <Loader
          size={24}
          className="animate-spin"
          style={{ color: palette.terracotta }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 fade-in">
      <button
        onClick={() => nav(-1)}
        className="font-body text-sm flex items-center gap-1.5 mb-6 hover:underline"
        style={{ color: palette.inkSoft }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <h1
        className="font-display text-3xl mb-1"
        style={{ color: palette.ink, fontWeight: 500 }}
      >
        {editing ? "Edit listing" : "New listing"}
      </h1>
      <p className="text-sm mb-8" style={{ color: palette.inkSoft }}>
        Once saved, this property is immediately searchable in the database the
        chatbot reads from.
      </p>

      <form onSubmit={submit} className="space-y-5">
        <Input
          label="Property title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Three-bedroom apartment, Sukhbaatar district"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Listing type"
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value as ListingType })
            }
          >
            <option value="sale">For sale</option>
            <option value="rent">For rent</option>
          </Select>
          <Input
            label={`Price (USD${form.type === "rent" ? " / month" : ""})`}
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="145000"
          />
        </div>

        <Input
          label="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="Sukhbaatar district, Ulaanbaatar"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="District"
            value={form.district}
            onChange={(e) => setForm({ ...form, district: e.target.value })}
            placeholder="Sukhbaatar"
          />
          <Input
            label="City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="Ulaanbaatar"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Bedrooms"
            type="number"
            value={form.beds}
            onChange={(e) => setForm({ ...form, beds: e.target.value })}
            placeholder="3"
          />
          <Input
            label="Bathrooms"
            type="number"
            value={form.baths}
            onChange={(e) => setForm({ ...form, baths: e.target.value })}
            placeholder="2"
          />
          <Input
            label="Size (m²)"
            type="number"
            value={form.sqm}
            onChange={(e) => setForm({ ...form, sqm: e.target.value })}
            placeholder="92"
          />
        </div>

        <PhotoUploader
          value={form.photos}
          listingId={draftId}
          onChange={(photos) => setForm({ ...form, photos })}
        />

        <Textarea
          label="Description"
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="What makes this property special? Floor, view, parking, neighborhood, recent renovations…"
        />

        {error ? <InlineError message={error} /> : null}

        <div className="flex items-center gap-3 pt-2">
          <Btn type="submit" disabled={saving} icon={saving ? undefined : Check}>
            {saving ? (
              <>
                <Loader size={16} className="animate-spin" /> Saving
              </>
            ) : editing ? (
              "Save changes"
            ) : (
              "Publish listing"
            )}
          </Btn>
          <Btn variant="ghost" onClick={() => nav(-1)}>
            Cancel
          </Btn>
        </div>
      </form>
    </div>
  );
}
