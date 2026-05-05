// Sticky header + nav + footer wrapper used by every authenticated page.
import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Eye, Home, LogOut, Plus } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { palette } from "../lib/palette";
import type { ReactNode } from "react";

interface NavItem {
  to: string;
  label: string;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { to: "/agent", label: "Dashboard", exact: true },
  { to: "/agent/listings/mine", label: "My listings" },
  { to: "/agent/listings", label: "All listings", exact: true },
  { to: "/agent/database", label: "Database" },
  { to: "/agent/profile", label: "Profile" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { currentAgent, signOut } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!currentAgent) return null;

  // The "All listings" tab matches /listings exactly so it doesn't fight with /listings/mine.
  const isActive = (item: NavItem) =>
    item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);

  return (
    <div
      className="min-h-screen font-body"
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
          <Link to="/agent" className="flex items-center gap-2.5">
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

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => {
              const active = isActive(item);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className="font-body text-sm px-3 py-2 rounded-md transition-colors"
                  style={{
                    color: active ? palette.ink : palette.inkSoft,
                    backgroundColor: active ? palette.paper : "transparent",
                    fontWeight: active ? 500 : 400,
                  }}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => nav("/agent/listings/new")}
              className="hidden sm:flex font-body text-sm px-3 py-2 rounded-md items-center gap-1.5 transition-colors"
              style={{
                backgroundColor: palette.terracotta,
                color: "#FFF",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Plus size={14} /> New
            </button>
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex font-body text-xs items-center gap-1.5 px-2 py-2 rounded-md"
              style={{ color: palette.inkSoft }}
              title="Open the public site customers see"
            >
              <Eye size={13} /> Public site
            </Link>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-9 h-9 rounded-full flex items-center justify-center font-display text-xs"
                style={{
                  backgroundColor: palette.ink,
                  color: palette.cream,
                  fontWeight: 500,
                  cursor: "pointer",
                  border: "none",
                }}
              >
                {currentAgent.avatar}
              </button>
              {menuOpen ? (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  ></div>
                  <div
                    className="absolute right-0 top-11 w-56 rounded-md py-1 z-20"
                    style={{
                      backgroundColor: palette.paper,
                      border: `1px solid ${palette.border}`,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div
                      className="px-3 py-2"
                      style={{ borderBottom: `1px solid ${palette.border}` }}
                    >
                      <div
                        className="text-sm font-medium"
                        style={{ color: palette.ink }}
                      >
                        {currentAgent.name}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: palette.inkSoft }}
                      >
                        {currentAgent.email}
                      </div>
                    </div>
                    {NAV.map((item) => (
                      <button
                        key={item.to}
                        onClick={() => {
                          nav(item.to);
                          setMenuOpen(false);
                        }}
                        className="md:hidden block w-full text-left px-3 py-2 text-sm"
                        style={{ color: palette.ink }}
                      >
                        {item.label}
                      </button>
                    ))}
                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        await signOut();
                        nav("/login");
                      }}
                      className="w-full text-left px-3 py-2 text-sm flex items-center gap-2"
                      style={{ color: palette.terracottaDark }}
                    >
                      <LogOut size={13} /> Sign out
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer
        className="max-w-7xl mx-auto px-4 py-8 mt-12 text-xs"
        style={{
          color: palette.inkMuted,
          borderTop: `1px solid ${palette.border}`,
        }}
      >
        Khashaa · Real-estate operating system · v1
      </footer>
    </div>
  );
}
