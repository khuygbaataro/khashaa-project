// Shared split layout for /login and /signup. Dark editorial column on the left, form on the right.
import type { ReactNode } from "react";
import { Home } from "lucide-react";
import { palette } from "../../lib/palette";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen flex font-body"
      style={{ backgroundColor: palette.cream }}
    >
      <div
        className="hidden md:flex md:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: palette.ink, color: palette.cream }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-sm flex items-center justify-center"
            style={{ backgroundColor: palette.terracotta }}
          >
            <Home size={18} color="#FFF" />
          </div>
          <span className="font-display text-xl">Khashaa</span>
        </div>
        <div className="space-y-6">
          <div
            className="font-display text-5xl leading-tight"
            style={{ fontWeight: 400 }}
          >
            Listings, agents, and conversations —<br />
            <em
              style={{ color: palette.terracotta, fontStyle: "italic" }}
            >
              in one place.
            </em>
          </div>
          <div
            className="text-sm max-w-md leading-relaxed"
            style={{ color: "#B5AEA0" }}
          >
            The agent dashboard for properties that will be searchable through
            your Messenger chatbot. Add a listing here — it appears live for
            customers asking the AI about homes.
          </div>
        </div>
        <div
          className="text-xs uppercase tracking-widest"
          style={{ color: "#7C7569" }}
        >
          Real-estate operating system · v1
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex items-center gap-3 mb-8">
            <div
              className="w-9 h-9 rounded-sm flex items-center justify-center"
              style={{ backgroundColor: palette.terracotta }}
            >
              <Home size={18} color="#FFF" />
            </div>
            <span
              className="font-display text-xl"
              style={{ color: palette.ink }}
            >
              Khashaa
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
