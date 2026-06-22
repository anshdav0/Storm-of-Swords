// components/village/BuildingShop.tsx
import { useGameDataStore } from "../../gamedata/gameDataStore";
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

  return (
    <div className="shop-overlay" onClick={onClose}>
      <div className="shop-popup" onClick={(e) => e.stopPropagation()}>
        <div className="shop-header">
          <h2>Build Menu</h2>
          <button className="shop-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Horizontal sliding item wrapper panel */}
        <div className="shop-list-horizontal">
          {purchasable.map((entry) => {
            const level1 = entry.levels.find((l) => l.level === 1);
            if (!level1) return null;

            return (
              <div key={entry.building_id} className="shop-card">
                {/* Visual Placeholder Square Box Image */}
                <div 
                  className="shop-card-image-square"
                  style={{ backgroundColor: TYPE_COLORS[entry.type] ?? "#475569" }}
                >
                  <BuildingIcon
                    buildingName={entry.building_name}
                    alt={entry.building_name}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </div>

                <div className="shop-card-info">
                  <div className="shop-card-name">{entry.building_name}</div>
                  <div className="shop-card-size">
                    📏 Size: {entry.size_x}×{entry.size_y}
                  </div>
                  <div className="shop-card-limit">
                    📋 Max Allowed:{" "}
                    <span className="font-bold text-amber-500">
                      {entry.max_no_allowed}
                    </span>
                  </div>
                  <div className="shop-card-cost">
                    🪙/⚔️ {level1.upgrade_cost}
                  </div>
                </div>

                <button
                  className="shop-card-buy-btn"
                  onClick={() =>
                    onSelect(entry.building_id, entry.size_x, entry.size_y)
                  }
                >
                  Build
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
