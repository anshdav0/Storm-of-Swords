import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVillage, addBuilding, saveLayout } from "../api";
import type { VillageBuilding, BuildPlacement } from "../types";

export function useVillageLayout() {
  const queryClient = useQueryClient();
  const [shopOpen, setShopOpen] = useState(false);
  const [recruitOpen, setRecruitOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draftBuildings, setDraftBuildings] = useState<VillageBuilding[] | null>(null);
  const [placingBuilding, setPlacingBuilding] = useState<{ buildingId: number; sizeX: number; sizeY: number } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["village"],
    queryFn: () => getVillage().then((res) => res.data),
  });

  const saveLayoutMutation = useMutation({
    mutationFn: saveLayout,
    onSuccess: () => {
      setIsEditMode(false);
      setDraftBuildings(null);
      queryClient.invalidateQueries({ queryKey: ["village"] });
    },
    onError: (err: any) => alert(`Backend Layout Error:\n${err.response?.data?.error || err.message}`)
  });

  const buyBuildingMutation = useMutation({
    mutationFn: ({ buildingId, x, y, placements }: { buildingId: number; x: number; y: number; placements: BuildPlacement[] }) => 
      addBuilding(buildingId, x, y, placements),
    onSuccess: () => {
      setPlacingBuilding(null);
      queryClient.invalidateQueries({ queryKey: ["village"] });
    },
    onError: (err: any) => alert(`Purchase Rejected:\n${err.response?.data?.error || err.message}`)
  });

  const compilePlacements = (sourceList: VillageBuilding[]): BuildPlacement[] => 
    sourceList.map((b) => ({ village_building_id: b.id, x_cor: b.x_cor ?? 0, y_cor: b.y_cor ?? 0 }));

  return {
    data, isLoading, error,
    shopOpen, setShopOpen,
    recruitOpen, setRecruitOpen,
    isEditMode, setIsEditMode,
    draftBuildings, setDraftBuildings,
    placingBuilding, setPlacingBuilding,
    saveLayoutMutation, buyBuildingMutation,
    compilePlacements,
  };
}