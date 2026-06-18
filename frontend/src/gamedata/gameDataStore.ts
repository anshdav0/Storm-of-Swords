import { create } from "zustand";
import type { GameData, BuildingStatic, TroopStatic } from "./types";
import { fetchGameData } from "./fetchGameData";

interface GameDataState {
  data: GameData | null;
  loaded: boolean;
  loading: boolean;
  error: string | null;

  // call once on app start
  load: () => Promise<void>;

  // typed getters — every component reads through these,
  // never reaches into `data` directly
  getBuilding: (buildingId: number) => BuildingStatic | undefined;
  getTroop: (troopId: number) => TroopStatic | undefined;
  getAllBuildings: () => BuildingStatic[];
  getAllTroops: () => TroopStatic[];
}

export const useGameDataStore = create<GameDataState>((set, get) => ({
  data: null,
  loaded: false,
  loading: false,
  error: null,

  load: async () => {
    // avoid re-fetching if already loaded or currently loading
    if (get().loaded || get().loading) return;

    set({ loading: true, error: null });
    try {
      const data = await fetchGameData();
      set({ data, loaded: true, loading: false });
    } catch (err) {
      set({ error: "Failed to load game data", loading: false });
    }
  },

  getBuilding: (buildingId) =>
    get().data?.buildings.find((b) => b.building_id === buildingId),

  getTroop: (troopId) => get().data?.troops.find((t) => t.troop_id === troopId),

  getAllBuildings: () => get().data?.buildings ?? [],

  getAllTroops: () => get().data?.troops ?? [],
}));
