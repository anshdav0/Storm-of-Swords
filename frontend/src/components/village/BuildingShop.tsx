// components/village/BuildingShop.tsx
import { useGameDataStore } from "../../gamedata/gameDataStore";
import { useQuery } from "@tanstack/react-query";
import { getVillage } from "../../api";
import { BuildingIcon } from "../shared/AssetIcon";
import "./BuildingShop.css";

interface Props {
  onClose: () => void;
  onSelect: (buildingId: number, sizeX: number, sizeY: number) => void;
}

const TYPE_COLORS: Record<string, string> = {
  defense: "#e74c3c",
  storage: "#3498db",
  producer: "#2ecc71",
};

export function BuildingShop({ onClose, onSelect }: Props) {
  const buildings = useGameDataStore((state) => state.getAllBuildings());

  // Exclude Main Castle (id=12)
  const purchasable = buildings.filter((b) => b.building_id !== 12);


  const { data: villageData } = useQuery({
        queryKey: ["village"],
        queryFn: () => getVillage().then((res) => res.data),
    });

  const gold     = villageData?.village.gold     ?? 0;
  const iron     = villageData?.village.iron     ?? 0;

  const canAfford = (type: string, cost: number): boolean => {
      if (type === "defense") return gold >= cost && iron >= cost;
      return iron >= cost;
  };

  const ownedCounts: Record<number, number> = {};
  if (villageData) {
    const allOwned = [
      ...villageData.defense_building,
      ...villageData.storage_building,
      ...villageData.producer_building,
    ];
    for (const b of allOwned) {
      ownedCounts[b.building_id] = (ownedCounts[b.building_id] ?? 0) + 1;
    }
  }

  const atMaxCount = (buildingId: number, maxAllowed: number): boolean => {
      return (ownedCounts[buildingId] ?? 0) >= maxAllowed;
  };

  const resourceLabel = (type: string, cost: number): string => {
      if (type === "defense") return `🪙 ${cost} ⚔️ ${cost}`;
      return `⚔️ ${cost}`;
  };

  return (
    <div className="shop-overlay" onClick={onClose}>
      <div className="shop-popup" onClick={(e) => e.stopPropagation()}>
        <div className="shop-header">
          <h2>Build Menu</h2>
          <button className="shop-close" onClick={onClose}>×</button>
        </div>

        {/* Horizontal sliding item wrapper panel */}
        <div className="shop-list-horizontal">
          {purchasable.map((entry) => {
            const level1 = entry.levels.find((l) => l.level === 1);
            if (!level1) return null;

            const affordable = canAfford(entry.type, level1.upgrade_cost);
            const maxedOut     = atMaxCount(entry.building_id, entry.max_no_allowed);
            const canBuild     = affordable && !maxedOut;
            const disableReason: string | null = maxedOut ? `Max ${entry.max_no_allowed} owned` : !affordable ? "Can't Afford" : null;
            
            return (
              <div key={entry.building_id} className={`shop-card ${disableReason !== null ? "shop-card-disabled" : ""}`}>
                {/* Visual Placeholder Square Box Image */}
                <div 
                  className="shop-card-image-square"
                  style={{ backgroundColor: TYPE_COLORS[entry.type] ?? "#475569" }}
                >
                  <BuildingIcon
                    buildingName={entry.building_name}
                    alt={entry.building_name}
                    style={{ width: "100%", height: "100%", objectFit: "contain",
                      opacity: affordable ? 1 : 0.4,
                     }}
                  />
                </div>

                <div className="shop-card-info">
                  <div className="shop-card-name">{entry.building_name}</div>
                  <div className="shop-card-size">
                    📏 Size: {entry.size_x}×{entry.size_y}
                  </div>
                  <div className="shop-card-limit">
                    📋 Owned:{" "}
                    <span style={{
                      color: maxedOut ? "#ef4444" : "#f59e0b",
                      fontWeight: "bold"
                    }}>
                      {ownedCounts[entry.building_id] ?? 0} / {entry.max_no_allowed}
                    </span>
                  </div>
                  <div className="shop-card-cost"
                  style={{ color: affordable && !maxedOut ? "#e2e8f0" : "#ef4444" }}>
                    {!maxedOut && resourceLabel(entry.type, level1.upgrade_cost)}
                  </div>
                </div>

                <button
                  className="shop-card-buy-btn"
                  disabled={!canBuild}
                  onClick={() => onSelect(entry.building_id, entry.size_x, entry.size_y)}
                  style={
                    !canBuild ? { backgroundColor: "#374151", color: "#6b7280", cursor: "not-allowed" } : {}
                    }
                >
                  {disableReason ?? "Build"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
