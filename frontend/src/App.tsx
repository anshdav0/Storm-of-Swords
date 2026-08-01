import { useEffect, type JSX } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useGameDataStore } from "./gamedata/gameDataStore";
import { LoginPage } from "./pages/LoginPage";
import { VillagePage } from "./pages/VillagePage";
import { ArmyPage } from "./pages/ArmyPage";
import { BattlePage } from "./pages/BattlePage";
import "./App.css";

function RequireAuth({ children }: { children: JSX.Element }) {
  const { isLoggedIn } = useAuthStore();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function GameShell({ children }: { children: React.ReactNode }) {
  const { clearAuth, username } = useAuthStore();
  const gameDataLoaded = useGameDataStore((state) => state.loaded);
  const loadGameData = useGameDataStore((state) => state.load);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  if (!gameDataLoaded) {
    return <div className="loading-screen">Loading game data...</div>;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-logo">⚔️ Storm of Swords</span>

        <nav className="app-nav">
          <button
            className={`nav-btn ${isActive("/village") ? "active" : ""}`}
            onClick={() => navigate("/village")}
          >
            My Village
          </button>
          <button
            className={`nav-btn ${isActive("/army") ? "active" : ""}`}
            onClick={() => navigate("/army")}
          >
            Barracks & Army
          </button>
          <button
            className={`nav-btn ${isActive("/battle") ? "active" : ""}`}
            onClick={() => navigate("/battle")}
          >
            Battle
          </button>
        </nav>

        <div className="app-user">
          <span className="app-username">
            My Lord, <strong>{username}</strong>
          </span>
          <button
            className="signout-btn"
            onClick={() => {
              clearAuth();
              navigate("/login");
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="app-main">{children}</main>
    </div>
  );
}

export default function App() {
  const { isLoggedIn } = useAuthStore();

  return (
    <Routes>
      <Route
        path="/login"
        element={isLoggedIn ? <Navigate to="/village" replace /> : <LoginPage />}
      />

      <Route
        path="/village"
        element={
          <RequireAuth>
            <GameShell>
              <VillagePage />
            </GameShell>
          </RequireAuth>
        }
      />
      <Route
        path="/army"
        element={
          <RequireAuth>
            <GameShell>
              <ArmyPage />
            </GameShell>
          </RequireAuth>
        }
      />
      <Route
        path="/battle"
        element={
          <RequireAuth>
            <GameShell>
              <BattlePage />
            </GameShell>
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to={isLoggedIn ? "/village" : "/login"} replace />} />
    </Routes>
  );
}