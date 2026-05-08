// Dual-mode photo manager: upload from device (compressed → Firebase Storage) OR paste a URL.
// Device upload requires the project's Firebase Storage to be enabled (Blaze plan on new projects);
// if it fails, falls back gracefully and the user can still use URL paste.
import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader, X } from "lucide-react";
import { uploadPhoto } from "../lib/listings";
import { palette } from "../lib/palette";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  /** Stable id for grouping uploaded files in storage. */
  listingId: string;
  max?: number;
}

function looksLikeImageUrl(s: string): boolean {
  const v = s.trim();
  if (!v) return false;
  if (v.startsWith("/")) return true;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function PhotoUploader({ value, onChange, listingId, max = 8 }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    setError("");
    setInfo("");
    const remaining = max - value.length;
    const toProcess = files.slice(0, remaining);
    const uploaded: string[] = [];
    let storageBlocked = false;
    for (const f of toProcess) {
      try {
        const url = await uploadPhoto(f, listingId);
        uploaded.push(url);
      } catch (err) {
        console.error("upload failed", err);
        const code = (err as { code?: string })?.code ?? "";
        if (code.includes("storage/unauthorized") || code.includes("storage/unknown")) {
          storageBlocked = true;
        }
      }
    }
    if (uploaded.length) onChange([...value, ...uploaded]);
    if (storageBlocked) {
      setError(
        "Device upload requires Firebase Storage (Blaze plan). For now, paste an image URL below — or enable Blaze in your Firebase console."
      );
    } else if (uploaded.length < toProcess.length) {
      setError("Some photos failed to upload. Check your connection and try again.");
    } else if (uploaded.length) {
      setInfo(`${uploaded.length} photo${uploaded.length > 1 ? "s" : ""} uploaded.`);
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function addUrl() {
    const url = input.trim();
    if (!url) return;
    if (!looksLikeImageUrl(url)) {
      setError("That doesn't look like a valid http(s) URL or local /path.");
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
    setInfo("");
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

      {/* Existing previews + a tile to trigger the device picker */}
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
        {value.length < max ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="aspect-square rounded-md flex flex-col items-center justify-center gap-1 transition-colors"
            style={{
              border: `1px dashed ${palette.borderStrong}`,
              backgroundColor: palette.cream,
              color: palette.inkSoft,
              cursor: busy ? "wait" : "pointer",
            }}
          >
            {busy ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <Camera size={18} />
            )}
            <span className="text-[10px] uppercase tracking-wider">
              {busy ? "Uploading" : "Upload"}
            </span>
          </button>
        ) : null}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="hidden"
      />

      {/* Or — paste a public image URL */}
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
                addUrl();
              }
            }}
            placeholder="…or paste an image URL (https://… or /your-photo.jpg)"
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
            onClick={addUrl}
            className="font-body text-sm px-3 py-2.5 rounded-md flex items-center gap-1.5 transition-colors"
            style={{
              backgroundColor: palette.paper,
              color: palette.ink,
              border: `1px solid ${palette.borderStrong}`,
              cursor: "pointer",
            }}
          >
            <ImagePlus size={14} /> Add URL
          </button>
        </div>
      ) : null}

      <span className="text-xs" style={{ color: palette.inkMuted }}>
        Upload from your device or paste a public URL. First photo becomes the cover.
        Device upload needs Firebase Storage — works on Blaze plan.
      </span>
      {info ? (
        <span className="text-xs" style={{ color: palette.forest }}>
          {info}
        </span>
      ) : null}
      {error ? (
        <span className="text-xs" style={{ color: "#C66" }}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
