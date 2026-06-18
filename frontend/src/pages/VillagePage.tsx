// pages/VillagePage.tsx
import { useVillageLayout } from "../hooks/useVillageLayout";
import { VillageGrid } from "../components/village/VillageGrid";
import { VillageHeader } from "../components/village/VillageHeader";
import { BuildingShop } from "../components/village/BuildingShop";
import { TroopRecruitMenu } from "../components/village/TroopRecruitMenu";

export function VillagePage() {
  const layout = useVillageLayout();

  if (layout.isLoading) return <div>Loading layout elements...</div>;
  if (layout.error || !layout.data) return <div>Failed to load layout grids.</div>;

  const serverBuildings = [
    ...layout.data.defense_building,
    ...layout.data.storage_building,
    ...layout.data.producer_building,
  ];

  const currentBuildings = layout.isEditMode && layout.draftBuildings ? layout.draftBuildings : serverBuildings;
  const barracksLevel = layout.data.producer_building?.find(b => b.building_id === 3)?.level || 1;
  const armouryLevel = layout.data.defense_building?.find(b => b.building_id === 4)?.level || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <VillageHeader
        gold={layout.data.village.gold}
        iron={layout.data.village.iron}
        wildfire={layout.data.village.wildfire}
        isEditMode={layout.isEditMode}
        isSaving={layout.saveLayoutMutation.isPending}
        isPlacing={!!layout.placingBuilding}
        onStartEdit={() => { layout.setDraftBuildings(JSON.parse(JSON.stringify(serverBuildings))); layout.setIsEditMode(true); }}
        onSaveEdit={() => layout.saveLayoutMutation.mutate(layout.compilePlacements(layout.draftBuildings || []))}
        onCancelEdit={() => { layout.setIsEditMode(false); layout.setDraftBuildings(null); }}
        onOpenShop={() => layout.setShopOpen(true)}
        onOpenRecruit={() => layout.setRecruitOpen(true)}
        onCancelPlacement={() => layout.setPlacingBuilding(null)}
      />

      <VillageGrid
        buildings={currentBuildings}
        isEditMode={layout.isEditMode}
        placingBuilding={layout.placingBuilding}
        onLocalBuildingsChange={(updated) => layout.setDraftBuildings(updated)}
        onConfirmNewPlacement={(x, y) => {
          if (layout.placingBuilding) {
            layout.buyBuildingMutation.mutate({
              buildingId: layout.placingBuilding.buildingId,
              x, y,
              placements: layout.compilePlacements(serverBuildings),
            });
          }
        }}
      />

      {layout.shopOpen && (
        <BuildingShop
          onClose={() => layout.setShopOpen(false)}
          onSelect={(buildingId, sizeX, sizeY) => {
            layout.setPlacingBuilding({ buildingId, sizeX, sizeY });
            layout.setShopOpen(false);
          }}
        />
      )}

      {layout.recruitOpen && (
        <TroopRecruitMenu onClose={() => layout.setRecruitOpen(false)} barracksLevel={barracksLevel} armouryLevel={armouryLevel} />
      )}
    </div>
  );
}