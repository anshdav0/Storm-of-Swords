import { useState, useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import { useGameDataStore } from "./gamedata/gameDataStore";
import { LoginPage } from "./pages/LoginPage";
import { VillagePage } from "./pages/VillagePage";
import { ArmyPage } from "./pages/ArmyPage";

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

  if (!isLoggedIn) {
    return <LoginPage />;
  }
  if (!gameDataLoaded) {
    return <div>Loading game data...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-6">
          <span className="font-bold text-amber-500 tracking-wider text-xl">
            Storm of Swords
          </span>
          <nav className="flex gap-4">
            <button
              onClick={() => setCurrentView("village")}
              className={`px-4 py-2 rounded font-semibold transition-colors ${currentView === "village" ? "bg-amber-600 text-slate-950" : "hover:bg-slate-700"}`}
            >
              My Village
            </button>
            <button
              onClick={() => setCurrentView("army")}
              className={`px-4 py-2 rounded font-semibold transition-colors ${currentView === "army" ? "bg-amber-600 text-slate-950" : "hover:bg-slate-700"}`}
            >
              Barracks & Army
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 hidden sm:inline">
            My Lord, <strong className="text-slate-200">{username}</strong>
          </span>
          <button
            onClick={clearAuth}
            className="bg-rose-700 hover:bg-rose-600 px-3 py-1.5 rounded text-sm font-semibold transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4">
        {currentView === "village" && <VillagePage />}
        {currentView === "army" && <ArmyPage />}
      </main>
    </div>
  );
}
