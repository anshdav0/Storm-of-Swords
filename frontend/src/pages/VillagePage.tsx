import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVillage, addBuilding, saveLayout } from "../api";
import { VillageGrid } from "../components/village/VillageGrid";
import { BuildingShop } from "../components/village/BuildingShop";
import { TroopRecruitMenu } from "../components/village/TroopRecruitMenu";
import type { VillageBuilding, BuildPlacement } from "../types";

export function VillagePage() {
  const queryClient = useQueryClient();
  const [shopOpen, setShopOpen] = useState(false);
  const [recruitOpen, setRecruitOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draftBuildings, setDraftBuildings] = useState<
    VillageBuilding[] | null
  >(null);

  // Tracks active building purchases selected from shop menu panel
  const [placingBuilding, setPlacingBuilding] = useState<{
    buildingId: number;
    sizeX: number;
    sizeY: number;
  } | null>(null);

  // 1. Fetch live village state from backend
  const { data, isLoading, error } = useQuery({
    queryKey: ["village"],
    queryFn: () => getVillage().then((res) => res.data),
  });

  // 2. Batch layout layout modification updater save mutation
  const saveLayoutMutation = useMutation({
    mutationFn: saveLayout,
    onSuccess: () => {
      setIsEditMode(false);
      setDraftBuildings(null);
      queryClient.invalidateQueries({ queryKey: ["village"] });
    },
    onError: (err: any) => {
      const serverErr =
        err.response?.data?.error ||
        "Layout validation rejected by server matrix.";
      alert(`Backend Layout Error:\n${serverErr}`);
    },
  });

  // 3. Purchase placement execution mutation loop
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
    onError: (err: any) => {
      const serverErr =
        err.response?.data?.error || "Purchase transaction failed.";
      alert(`Purchase Rejected:\n${serverErr}`);
      setPlacingBuilding(null);
    },
  });

  if (isLoading)
    return <div className="p-4 text-slate-400">Loading layout elements...</div>;
  if (error)
    return (
      <div className="p-4 text-rose-500">Failed to load layout grids.</div>
    );
  if (!data) return null;

  const barracksLevel = data.producer_building?.find(b => b.building_id === 3)?.level || 1;
  const armouryLevel = data.defense_building?.find(b => b.building_id === 4)?.level || 1;

  const serverBuildings: VillageBuilding[] = [
    ...data.defense_building,
    ...data.storage_building,
    ...data.producer_building,
  ];

  const currentBuildings =
    isEditMode && draftBuildings ? draftBuildings : serverBuildings;

  // Compiles exact up-to-date matrix tracking maps for backend validation calls
  const compilePlacementsArray = (
    sourceList: VillageBuilding[],
  ): BuildPlacement[] => {
    return sourceList.map((b) => ({
      village_building_id: b.id,
      x_cor: b.x_cor ?? 0,
      y_cor: b.y_cor ?? 0,
    }));
  };

  // Layout Actions Handlers
  const handleCancelEditing = () => {
    setIsEditMode(false);
    setDraftBuildings(null);
  };

  const handleSaveEditing = () => {
    if (!draftBuildings) return;
    const placements = compilePlacementsArray(draftBuildings);
    saveLayoutMutation.mutate(placements);
  };

  const handlePlaceNewBuilding = (x: number, y: number) => {
    if (!placingBuilding) return;

    // Build the complete snapshot array of the current server village layout
    const placements = compilePlacementsArray(serverBuildings);

    buyBuildingMutation.mutate({
      buildingId: placingBuilding.buildingId,
      x,
      y,
      placements,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "640px",
        }}
      >
        <div style={{ display: "flex", gap: "24px", fontSize: "14px" }}>
          <span>🪙 {data.village.gold}</span>
          <span>⚔️ {data.village.iron}</span>
          <span>🔥 {data.village.wildfire}</span>
        </div>

        <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
          {/* Scenario A: Completely Normal Mode (Not Editing, Not Placing Shop items) */}
          {!isEditMode && !placingBuilding && (
            <>
              <button
                onClick={() => {
                  setDraftBuildings(
                    JSON.parse(JSON.stringify(serverBuildings)),
                  );
                  setIsEditMode(true);
                }}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#2c3e50",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                🛠️ Move Mode
              </button>

              {/* 🛠️ 3. Added the interactive training shortcut launcher */}
              <button
                onClick={() => setRecruitOpen(true)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#1e3a8a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                ⚔️ Train Army
              </button>

              <button
                onClick={() => setShopOpen(true)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#d4af37",
                  color: "#111",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                🛒 Shop
              </button>
            </>
          )}

          {/* Scenario B: Edit/Layout Mode Active — Show Save & Cancel buttons */}
          {isEditMode && (
            <>
              <button
                onClick={handleSaveEditing}
                disabled={saveLayoutMutation.isPending}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#27ae60",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                {saveLayoutMutation.isPending
                  ? "Validating..."
                  : "💾 Save Layout"}
              </button>
              <button
                onClick={handleCancelEditing}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#c0392b",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ❌ Cancel
              </button>
            </>
          )}

          {/* Scenario C: Actively Placing a New Building From Shop */}
          {placingBuilding && (
            <button
              onClick={() => setPlacingBuilding(null)}
              style={{
                padding: "6px 12px",
                backgroundColor: "#7f8c8d",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Cancel Shop Placement
            </button>
          )}
        </div>
      </div>

      <VillageGrid
        buildings={currentBuildings}
        isEditMode={isEditMode}
        placingBuilding={placingBuilding}
        onLocalBuildingsChange={(updated) => setDraftBuildings(updated)}
        onConfirmNewPlacement={handlePlaceNewBuilding}
      />

      {shopOpen && (
        <BuildingShop
          onClose={() => setShopOpen(false)}
          onSelect={(buildingId, sizeX, sizeY) => {
            setPlacingBuilding({ buildingId, sizeX, sizeY });
            setShopOpen(false);
          }}
        />
      )}

      {/* 🛠️ 4. Conditional overlay for the training popup window configuration */}
      {recruitOpen && (
        <TroopRecruitMenu
          onClose={() => setRecruitOpen(false)}
          barracksLevel={barracksLevel}
          armouryLevel={armouryLevel}
        />
      )}

    </div>
  );
}
