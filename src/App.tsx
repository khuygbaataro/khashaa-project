// Top-level router.
//   /                    public home — anyone can browse listings
//   /property/:id        public listing detail
//   /login, /signup      agent auth screens
//   /agent/*             agent dashboard, listings CRUD, profile (gated by ProtectedRoute)
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppShell } from "./components/AppShell";
import { PublicLayout } from "./features/public/PublicLayout";
import { PublicHome } from "./features/public/PublicHome";
import { PublicListingDetail } from "./features/public/PublicListingDetail";
import { LoginScreen } from "./features/auth/LoginScreen";
import { SignupScreen } from "./features/auth/SignupScreen";
import { Dashboard } from "./features/dashboard/Dashboard";
import { ListingsView } from "./features/listings/ListingsView";
import { ListingForm } from "./features/listings/ListingForm";
import { ListingDetail } from "./features/listings/ListingDetail";
import { DatabaseView } from "./features/listings/DatabaseView";
import { ProfileView } from "./features/profile/ProfileView";

export default function App() {
  return (
    <Routes>
      {/* Public-facing site */}
      <Route
        path="/"
        element={
          <PublicLayout>
            <PublicHome />
          </PublicLayout>
        }
      />
      <Route
        path="/property/:id"
        element={
          <PublicLayout>
            <PublicListingDetail />
          </PublicLayout>
        }
      />

      {/* Auth */}
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/signup" element={<SignupScreen />} />

      {/* Agent dashboard — gated */}
      <Route
        path="/agent/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/listings" element={<ListingsView scope="all" />} />
                <Route
                  path="/listings/mine"
                  element={<ListingsView scope="mine" />}
                />
                <Route path="/listings/new" element={<ListingForm />} />
                <Route path="/listings/:id" element={<ListingDetail />} />
                <Route path="/listings/:id/edit" element={<ListingForm />} />
                <Route path="/database" element={<DatabaseView />} />
                <Route path="/profile" element={<ProfileView />} />
                <Route path="*" element={<Navigate to="/agent" replace />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* Anything else → public home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
