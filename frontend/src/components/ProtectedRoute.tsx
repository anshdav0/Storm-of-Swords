import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

// Wraps any route that requires login.
// If not logged in, redirect to /login instead of rendering the page.
// Outlet renders whatever child route matched (Village, Army, Battle).
export default function ProtectedRoute() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
