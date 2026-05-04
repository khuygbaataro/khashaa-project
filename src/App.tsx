// Top-level router. Public auth screens at /login and /signup; everything else is gated by ProtectedRoute and wrapped in AppShell.
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppShell } from "./components/AppShell";
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
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/signup" element={<SignupScreen />} />

      <Route
        path="/*"
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
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
