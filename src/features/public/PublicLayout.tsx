// Wrapper for the public-facing pages — minimal cream header + footer, no avatar dropdown.
import { Link } from "react-router-dom";
import { ArrowRight, Home } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import { palette } from "../../lib/palette";

export function PublicLayout({ children }: { children: ReactNode }) {
  const { currentAgent } = useAuth();
  return (
    <div
      className="min-h-screen font-body flex flex-col"
      style={{ backgroundColor: palette.cream }}
    >
      <header
        className="sticky top-0 z-20"
        style={{
          backgroundColor: palette.cream,
          borderBottom: `1px solid ${palette.border}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-sm flex items-center justify-center"
              style={{ backgroundColor: palette.terracotta }}
            >
              <Home size={16} color="#FFF" />
            </div>
            <span
              className="font-display text-lg"
              style={{ color: palette.ink, fontWeight: 500 }}
            >
              Khashaa
            </span>
          </Link>

          <Link
            to={currentAgent ? "/agent" : "/login"}
            className="font-body text-sm flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors"
            style={{ color: palette.terracotta }}
          >
            {currentAgent ? "Agent dashboard" : "Agent sign in"}
            <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer
        className="max-w-7xl mx-auto px-4 py-8 mt-12 text-xs w-full"
        style={{
          color: palette.inkMuted,
          borderTop: `1px solid ${palette.border}`,
        }}
      >
        <div className="flex flex-col sm:flex-row justify-between gap-2">
          <span>Khashaa · Real estate in Mongolia</span>
          <span>
            Are you an agent?{" "}
            <Link
              to={currentAgent ? "/agent" : "/login"}
              className="underline"
              style={{ color: palette.terracotta }}
            >
              {currentAgent ? "Open dashboard" : "Sign in"}
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
