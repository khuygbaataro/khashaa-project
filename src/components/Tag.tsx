// Tiny rounded label used for "For sale" / "For rent" / "Yours" badges.
import type { ReactNode } from "react";
import { palette } from "../lib/palette";

type Color = "sale" | "rent" | "neutral";

const COLORS: Record<Color, { bg: string; fg: string }> = {
  sale: { bg: "#E8EFE6", fg: palette.forest },
  rent: { bg: "#EFE3DC", fg: palette.terracottaDark },
  neutral: { bg: palette.cream, fg: palette.inkSoft },
};

export function Tag({
  children,
  color = "neutral",
}: {
  children: ReactNode;
  color?: Color;
}) {
  const c = COLORS[color];
  return (
    <span
      className="font-body text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {children}
    </span>
  );
}
