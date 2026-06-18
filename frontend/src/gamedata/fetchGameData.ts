import apiClient from "../api/client";
import type { GameData } from "./types";

// Called exactly once, on app load. Hits the one combined endpoint
// that returns every building and troop with all their level stats.
export async function fetchGameData(): Promise<GameData> {
  const response = await apiClient.get<GameData>("/api/gamedata");
  return response.data;
}
