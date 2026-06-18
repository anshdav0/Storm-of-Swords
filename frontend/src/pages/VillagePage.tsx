import { useVillageLayout } from "../hooks/useVillageLayout";
import { VillageGrid } from "../components/village/VillageGrid";
import { VillageHeader } from "../components/village/VillageHeader";
import { BuildingShop } from "../components/village/BuildingShop";
import { TroopRecruitMenu } from "../components/village/TroopRecruitMenu";
import { ArmyPage } from "./ArmyPage";

export function VillagePage() {
  const layout = useVillageLayout();

  if (layout.isLoading) return <div>Loading village...</div>;
  if (layout.error || !layout.data) return <div>Failed to load village.</div>;

  const serverBuildings = [
    ...layout.data.defense_building,
    ...layout.data.storage_building,
    ...layout.data.producer_building,
  ];

  const currentBuildings =
    layout.isEditMode && layout.draftBuildings
      ? layout.draftBuildings
      : serverBuildings;

  const barracksLevel =
    layout.data.producer_building.find((b) => b.building_id === 3)?.level ?? 0;
  const armouryLevel =
    layout.data.producer_building.find((b) => b.building_id === 4)?.level ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <VillageHeader
        gold={layout.data.village.gold}
        iron={layout.data.village.iron}
        wildfire={layout.data.village.wildfire}
        isEditMode={layout.isEditMode}
        isSaving={layout.saveLayoutMutation.isPending}
        isPlacing={!!layout.placingBuilding}
        onStartEdit={() => {
          layout.setDraftBuildings(JSON.parse(JSON.stringify(serverBuildings)));
          layout.setIsEditMode(true);
        }}
        onSaveEdit={() =>
          layout.saveLayoutMutation.mutate(
            layout.compilePlacements(layout.draftBuildings ?? []),
          )
        }
        onCancelEdit={() => {
          layout.setIsEditMode(false);
          layout.setDraftBuildings(null);
        }}
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
              x,
              y,
              placements: layout.compilePlacements(serverBuildings),
            });
          }
        }}
        onUpgrade={(id) => layout.upgradeMutation.mutate(id)}
        onCollect={(id) => layout.collectMutation.mutate(id)}
        onOpenRecruit={() => layout.setRecruitOpen(true)}
        onOpenArmy={() => layout.setArmyOpen(true)}
        isUpgrading={layout.upgradeMutation.isPending}
        isCollecting={layout.collectMutation.isPending}
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
        <TroopRecruitMenu
          onClose={() => layout.setRecruitOpen(false)}
          barracksLevel={barracksLevel}
          armouryLevel={armouryLevel}
        />
      )}

      {layout.armyOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
          }}
          onClick={() => layout.setArmyOpen(false)}
        >
          <div
            style={{
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "900px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "12px",
              }}
            >
              <button
                onClick={() => layout.setArmyOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  fontSize: "22px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
            <ArmyPage />
          </div>
        </div>
      )}
    </div>
  );
}
