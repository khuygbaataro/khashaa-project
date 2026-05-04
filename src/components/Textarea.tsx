// Multi-line counterpart to Input — same focus / border treatment.
import type { TextareaHTMLAttributes } from "react";
import { palette } from "../lib/palette";

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, ...rest }: Props) {
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
      <textarea
        {...rest}
        className="font-body text-[15px] px-3.5 py-2.5 rounded-md outline-none transition-colors resize-none"
        style={{
          backgroundColor: palette.paper,
          color: palette.ink,
          border: `1px solid ${palette.border}`,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = palette.terracotta;
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = palette.border;
          rest.onBlur?.(e);
        }}
      />
    </div>
  );
}
