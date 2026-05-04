// Multi-photo grid that compresses + uploads to Firebase Storage and reports back the resulting download URLs.
import { useRef, useState } from "react";
import { Camera, Loader, X } from "lucide-react";
import { uploadPhoto } from "../lib/listings";
import { palette } from "../lib/palette";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  listingId: string; // pass a stable id so files group under listings/{id}/...
  max?: number;
}

export function PhotoUploader({ value, onChange, listingId, max = 8 }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    setError("");
    const remaining = max - value.length;
    const toProcess = files.slice(0, remaining);
    const uploaded: string[] = [];
    for (const f of toProcess) {
      try {
        const url = await uploadPhoto(f, listingId);
        uploaded.push(url);
      } catch (err) {
        console.error("upload failed", err);
        setError(
          "One or more photos could not be uploaded. Check your connection and try again."
        );
      }
    }
    if (uploaded.length) onChange([...value, ...uploaded]);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
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
            <img src={p} alt="" className="w-full h-full object-cover" />
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
              {busy ? "Uploading" : "Add"}
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
      <span className="text-xs" style={{ color: palette.inkMuted }}>
        Photos are compressed automatically. First photo becomes the cover.
      </span>
      {error ? (
        <span className="text-xs" style={{ color: "#C66" }}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
