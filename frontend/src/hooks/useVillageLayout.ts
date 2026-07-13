import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getVillage,
  addBuilding,
  saveLayout,
  upgradeBuilding,
  collectResources,
  instantUpgradeBuilding,
} from "../api";
import type { VillageBuilding, BuildPlacement } from "../types";

export function useVillageLayout() {
  const queryClient = useQueryClient();

  const [shopOpen, setShopOpen] = useState(false);
  const [recruitOpen, setRecruitOpen] = useState(false);
  const [armyOpen, setArmyOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draftBuildings, setDraftBuildings] = useState<
    VillageBuilding[] | null
  >(null);
  const [placingBuilding, setPlacingBuilding] = useState<{
    buildingId: number;
    sizeX: number;
    sizeY: number;
  } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["village"],
    queryFn: () => getVillage().then((res) => res.data),
  });

  const totalBuildings = data ? [
    ...(data.defense_building || []),
    ...(data.storage_building || []),
    ...(data.producer_building || [])
  ] : [];

  const activeUpgradeCount = totalBuildings.filter((b: any) => {
    if (!b.upgrade_started) return false;
    const upgradeTime = new Date(b.upgrade_started).getTime();
    const baselineTime = new Date("2001-09-11T13:46:00Z").getTime();
    return !isNaN(upgradeTime) && upgradeTime !== baselineTime;
  }).length;

  const isMaxUpgradesReached = activeUpgradeCount >= 5;

  const saveLayoutMutation = useMutation({
    mutationFn: saveLayout,
    onSuccess: () => {
      setIsEditMode(false);
      setDraftBuildings(null);
      queryClient.invalidateQueries({ queryKey: ["village"] });
    },
    onError: (err: any) => {
      console.warn("Invalid layout layout sent to server. Reverting to database backup...", err);
      
      setIsEditMode(false);
      setDraftBuildings(null);
      
      queryClient.invalidateQueries({ queryKey: ["village"] });
    },
  });

  const buyBuildingMutation = useMutation({
    mutationFn: ({
      buildingId,
      x,
      y,
      placements,
    }: {
      buildingId: number;
      x: number;
      y: number;
      placements: BuildPlacement[];
    }) => addBuilding(buildingId, x, y, placements),
    onSuccess: () => {
      setPlacingBuilding(null);
      queryClient.invalidateQueries({ queryKey: ["village"] });
    },
    onError: (err: any) =>
      alert(`Purchase Rejected:\n${err.response?.data?.error || err.message}`),
  });

  const upgradeMutation = useMutation({
    mutationFn: (villageBuildingId: number) => {
      if (isMaxUpgradesReached) {
        throw new Error("Maximum of 5 buildings can be upgraded at the same time!");
      }
      return upgradeBuilding(villageBuildingId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["village"] }),
    onError: (err: any) =>
      alert(`Upgrade Failed:\n${err.response?.data?.error || err.message}`),
  });

  const upgradeMutationInstant = useMutation({
    mutationFn: (villageBuildingId: number) =>
      instantUpgradeBuilding(villageBuildingId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["village"] }),
    onError: (err: any) =>
      alert(`Upgrade Failed:\n${err.response?.data?.error || err.message}`),
  });

  const collectMutation = useMutation({
    mutationFn: (villageBuildingId: number) => {
      // determine resource type from the building data
      // we pass the building id but collectResources needs the resource type
      // look it up from cached village data
      const allBuildings = data ? [...data.producer_building] : [];
      const b = allBuildings.find((pb) => pb.id === villageBuildingId);
      const resourceType = (b?.resource_type ?? "gold") as
        | "gold"
        | "iron"
        | "wildfire";
      return collectResources(resourceType);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["village"] }),
    onError: (err: any) =>
      alert(`Collection Failed:\n${err.response?.data?.error || err.message}`),
  });

  const compilePlacements = (sourceList: VillageBuilding[]): BuildPlacement[] =>
    sourceList.map((b) => ({
      village_building_id: b.id,
      x_cor: b.x_cor ?? 0,
      y_cor: b.y_cor ?? 0,
    }));

  return {
    data,
    isLoading,
    error,
    shopOpen,
    setShopOpen,
    recruitOpen,
    setRecruitOpen,
    armyOpen,
    setArmyOpen,
    isEditMode,
    setIsEditMode,
    draftBuildings,
    setDraftBuildings,
    placingBuilding,
    setPlacingBuilding,
    saveLayoutMutation,
    buyBuildingMutation,
    upgradeMutation,
    upgradeMutationInstant,
    isMaxUpgradesReached,
    collectMutation,
    compilePlacements,
  };
}
