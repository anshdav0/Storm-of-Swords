import apiClient from "./client";
import type {
  AuthResponse,
  VillageResponse,
  BuildPlacement,
  ArmyEntry,
  RecruitResult,
  CollectResult,
} from "../types";

// Auth
export const register = (username: string, password: string) =>
  apiClient.post<AuthResponse>("/register", { username, password });

export const login = (username: string, password: string) =>
  apiClient.post<AuthResponse>("/login", { username, password });

// Village
export const getVillage = () => apiClient.get<VillageResponse>("/api/village");

export const saveLayout = (placements: BuildPlacement[]) =>
  apiClient.post("/api/village/changelayout", { placements });

export const addBuilding = (
  building_id: number,
  x_cor: number,
  y_cor: number,
  placements: BuildPlacement[],
) =>
  apiClient.post("/api/village/buildings", {
    building_id,
    x_cor,
    y_cor,
    placements,
  });

export const upgradeBuilding = (villageBuildingId: number) =>
  apiClient.post(`/api/village/buildings/${villageBuildingId}/upgrade`);

export const collectResources = (resourceType: "gold" | "iron" | "wildfire") =>
  apiClient.post<CollectResult>(`/api/village/collect/${resourceType}`);

// Army
export const getArmy = () => apiClient.get<ArmyEntry[]>("/api/army");

export const recruitTroop = (troop_id: number, quantity: number) =>
  apiClient.post<RecruitResult>("/api/army/recruit", { troop_id, quantity });
