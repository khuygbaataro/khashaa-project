// Gate around the authenticated app — shows a loader while auth resolves, then either renders children or redirects to /login.
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { palette } from "../lib/palette";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { currentAgent, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: palette.cream }}
      >
        <Loader
          size={24}
          className="animate-spin"
          style={{ color: palette.terracotta }}
        />
      </div>
    );
  }

  if (!currentAgent) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
