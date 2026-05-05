// URL-based photo manager (no Firebase Storage needed — keeps the app on the free Spark plan).
// Paste an image URL, see a preview, reorder by removing. First photo is the cover.
import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { palette } from "../lib/palette";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  /** Unused with URL-paste, kept for API parity with the file-upload version. */
  listingId?: string;
  max?: number;
}

function looksLikeImageUrl(s: string): boolean {
  const v = s.trim();
  if (!v) return false;
  // Local path served from /public — e.g. /house1.jpg
  if (v.startsWith("/")) return true;
  // Remote URL
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function PhotoUploader({ value, onChange, max = 8 }: Props) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  function add() {
    const url = input.trim();
    if (!url) return;
    if (!looksLikeImageUrl(url)) {
      setError("That doesn't look like a valid http(s) URL.");
      return;
    }
    if (value.includes(url)) {
      setError("That photo is already added.");
      return;
    }
    if (value.length >= max) {
      setError(`Maximum ${max} photos.`);
      return;
    }
    onChange([...value, url]);
    setInput("");
    setError("");
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        className="font-body text-xs font-medium uppercase tracking-wider"
        style={{ color: palette.inkSoft }}
      >
        Photos ({value.length}/{max})
      </label>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {value.map((p, i) => (
          <div
            key={p + i}
            className="relative aspect-square rounded-md overflow-hidden group"
            style={{ border: `1px solid ${palette.border}` }}
          >
            <img
              src={p}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = "0.3";
              }}
            />
            {i === 0 ? (
              <div
                className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-medium rounded"
                style={{ backgroundColor: palette.ink, color: palette.cream }}
              >
                Cover
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100"
              style={{ backgroundColor: "rgba(0,0,0,0.7)", color: "#FFF" }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {value.length < max ? (
        <div className="flex gap-2 mt-1">
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Paste image URL or /your-photo.jpg from public folder"
            className="flex-1 font-body text-[14px] px-3.5 py-2.5 rounded-md outline-none transition-colors"
            style={{
              backgroundColor: palette.paper,
              color: palette.ink,
              border: `1px solid ${palette.border}`,
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = palette.terracotta)
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = palette.border)
            }
          />
          <button
            type="button"
            onClick={add}
            className="font-body text-sm px-3 py-2.5 rounded-md flex items-center gap-1.5 transition-colors"
            style={{
              backgroundColor: palette.terracotta,
              color: "#FFF",
              border: "none",
              cursor: "pointer",
            }}
          >
            <ImagePlus size={14} /> Add
          </button>
        </div>
      ) : null}

      <span className="text-xs" style={{ color: palette.inkMuted }}>
        Paste a public image URL. First photo becomes the cover. Direct upload
        comes in Phase 1.5 (needs Firebase paid plan).
      </span>
      {error ? (
        <span className="text-xs" style={{ color: "#C66" }}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
