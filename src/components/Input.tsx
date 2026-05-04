// Cream-themed input with label, error state, and terracotta focus border.
import type { InputHTMLAttributes } from "react";
import { palette } from "../lib/palette";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, ...rest }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label
          className="font-body text-xs font-medium uppercase tracking-wider"
          style={{ color: palette.inkSoft }}
        >
          {label}
        </label>
      ) : null}
      <input
        {...rest}
        className="font-body text-[15px] px-3.5 py-2.5 rounded-md outline-none transition-colors"
        style={{
          backgroundColor: palette.paper,
          color: palette.ink,
          border: `1px solid ${error ? "#C66" : palette.border}`,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = palette.terracotta;
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? "#C66" : palette.border;
          rest.onBlur?.(e);
        }}
      />
      {error ? (
        <span className="font-body text-xs" style={{ color: "#C66" }}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
