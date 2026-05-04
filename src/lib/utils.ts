// Small formatting + image helpers used across the app.
import type { ListingType } from "./schema";

export function fmtMoney(n: number, type?: ListingType): string {
  const s = "$" + Number(n).toLocaleString("en-US");
  return type === "rent" ? s + "/mo" : s;
}

export function toMillis(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === "number") return ts;
  if (typeof ts === "object" && ts !== null && "toMillis" in ts) {
    return (ts as { toMillis: () => number }).toMillis();
  }
  if (ts instanceof Date) return ts.getTime();
  return 0;
}

export function fmtDate(ts: unknown): string {
  const ms = toMillis(ts);
  if (!ms) return "—";
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return Math.round(diff / 60_000) + "m ago";
  if (diff < 86_400_000) return Math.round(diff / 3_600_000) + "h ago";
  if (diff < 604_800_000) return Math.round(diff / 86_400_000) + "d ago";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0] ?? "")
      .slice(0, 2)
      .join("")
      .toUpperCase() || "??"
  );
}

// Compress an image File to ~maxWidth px JPEG. Returns a Blob ready to upload.
export function compressImage(
  file: File,
  maxWidth = 1000,
  quality = 0.75
): Promise<Blob> {
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
        if (!ctx) return reject(new Error("no canvas context"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) =>
            blob ? resolve(blob) : reject(new Error("compression failed")),
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("image decode failed"));
      img.src = String(e.target?.result ?? "");
    };
    reader.onerror = () => reject(new Error("file read failed"));
    reader.readAsDataURL(file);
  });
}
