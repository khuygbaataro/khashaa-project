// Editorial button with primary / secondary / ghost / danger variants. Inline-styled to match the cream + terracotta palette exactly.
import { useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { palette } from "../lib/palette";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: LucideIcon;
  children?: ReactNode;
}

const STYLES: Record<
  Variant,
  { bg: string; color: string; hoverBg: string; border: string }
> = {
  primary: {
    bg: palette.terracotta,
    color: "#FFF",
    hoverBg: palette.terracottaDark,
    border: palette.terracotta,
  },
  secondary: {
    bg: palette.paper,
    color: palette.ink,
    hoverBg: palette.cream,
    border: palette.borderStrong,
  },
  ghost: {
    bg: "transparent",
    color: palette.ink,
    hoverBg: palette.cream,
    border: "transparent",
  },
  danger: {
    bg: palette.paper,
    color: "#9C2A2A",
    hoverBg: "#FBEAEA",
    border: "#E8B8B8",
  },
};

export function Btn({
  variant = "primary",
  icon: Icon,
  children,
  className = "",
  disabled,
  type = "button",
  ...rest
}: Props) {
  const s = STYLES[variant];
  const [hover, setHover] = useState(false);
  return (
    <button
      type={type}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...rest}
      className={`font-body inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all ${className}`}
      style={{
        backgroundColor: hover && !disabled ? s.hoverBg : s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}
