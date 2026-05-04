// Native select with the same label + cream styling as Input/Textarea.
import type { ReactNode, SelectHTMLAttributes } from "react";
import { palette } from "../lib/palette";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export function Select({ label, children, ...rest }: Props) {
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
      <select
        {...rest}
        className="font-body text-[15px] px-3.5 py-2.5 rounded-md outline-none transition-colors"
        style={{
          backgroundColor: palette.paper,
          color: palette.ink,
          border: `1px solid ${palette.border}`,
        }}
      >
        {children}
      </select>
    </div>
  );
}
