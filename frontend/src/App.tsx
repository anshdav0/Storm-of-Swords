import { useState, useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import { useGameDataStore } from "./gamedata/gameDataStore";
import { LoginPage } from "./pages/LoginPage";
import { VillagePage } from "./pages/VillagePage";
import { ArmyPage } from "./pages/ArmyPage";
import "./App.css";

export default function App() {
  const { isLoggedIn, clearAuth, username } = useAuthStore();
  const [currentView, setCurrentView] = useState<"village" | "army">("village");
  const gameDataLoaded = useGameDataStore((state) => state.loaded);
  const loadGameData = useGameDataStore((state) => state.load);

  useEffect(() => {
    if (isLoggedIn) {
      loadGameData();
    }
  }, [isLoggedIn, loadGameData]);

  if (!isLoggedIn) return <LoginPage />;

  if (!gameDataLoaded) {
    return <div className="loading-screen">Loading game data...</div>;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-logo">⚔️ Storm of Swords</span>

        <nav className="app-nav">
          <button
            className={`nav-btn ${currentView === "village" ? "active" : ""}`}
            onClick={() => setCurrentView("village")}
          >
            My Village
          </button>
          <button
            className={`nav-btn ${currentView === "army" ? "active" : ""}`}
            onClick={() => setCurrentView("army")}
          >
            Barracks & Army
          </button>
        </nav>

        <div className="app-user">
          <span className="app-username">
            My Lord, <strong>{username}</strong>
          </span>
          <button className="signout-btn" onClick={clearAuth}>
            Sign Out
          </button>
        </div>
      </header>

      <main className="app-main">
        {currentView === "village" && <VillagePage />}
        {currentView === "army" && <ArmyPage />}
      </main>
    </div>
  );
}
