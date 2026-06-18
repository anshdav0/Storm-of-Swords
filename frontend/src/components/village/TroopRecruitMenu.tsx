import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recruitTroop } from "../../api";
import { useGameDataStore } from "../../gamedata/gameDataStore";
import "./TroopRecruitMenu.css";

interface Props {
  onClose: () => void;
  barracksLevel: number;
  armouryLevel: number;
}

export function TroopRecruitMenu({
  onClose,
  barracksLevel,
  armouryLevel,
}: Props) {
  const queryClient = useQueryClient();
  const troops = useGameDataStore((state) => state.getAllTroops());

  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const recruitMutation = useMutation({
    mutationFn: ({ troopId, qty }: { troopId: number; qty: number }) =>
      recruitTroop(troopId, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["armyData"] });
      queryClient.invalidateQueries({ queryKey: ["village"] });
    },
    onError: (err: any) => {
      alert(`Recruitment Failed: ${err.response?.data?.error || err.message}`);
    },
  });

  const handleQtyChange = (id: number, val: number) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, val) }));
  };

  // mirrors backend rules in RecruitTroop exactly
  const checkLocked = (troopType: string, minUnlock: number): string | null => {
    if (armouryLevel < minUnlock) {
      return `Armoury Lv${minUnlock} required`;
    }
    if (troopType.includes("Dothraki") && barracksLevel < 2) {
      return "Barracks Lv2 required";
    }
    if (troopType.includes("Staff") && barracksLevel < 3) {
      return "Barracks Lv3 required";
    }
    return null; // null means unlocked
  };

  return (
    <div className="recruit-overlay" onClick={onClose}>
      <div className="recruit-popup" onClick={(e) => e.stopPropagation()}>
        <div className="recruit-header">
          <h2>Garrison Barracks — Train Troops</h2>
          <button className="recruit-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="recruit-list-horizontal">
          {troops.map((troop) => {
            const level1 = troop.levels.find((l) => l.level === 1);
            if (!level1) return null;

            const lockReason = checkLocked(
              troop.type,
              level1.unlocks_at_building_level,
            );
            const isLocked = lockReason !== null;
            const isExpanded = expandedId === troop.troop_id;
            const qty = quantities[troop.troop_id] || 1;

            return (
              <div
                key={troop.troop_id}
                className={`recruit-card ${isExpanded ? "expanded" : ""} ${isLocked ? "card-locked" : ""}`}
              >
                <div
                  className="recruit-card-img"
                  style={{ backgroundColor: "#1e293b" }}
                >
                  <span style={{ fontSize: "24px" }}>
                    {isLocked ? "🔒" : "⚔️"}
                  </span>
                </div>

                <div className="recruit-card-main-info">
                  <div className="recruit-card-title">{troop.type}</div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                      marginTop: "4px",
                    }}
                  >
                    🏠 {troop.housing_space} space
                  </div>
                </div>

                <div
                  className={`recruit-card-details ${isExpanded ? "show-details" : ""}`}
                >
                  <div className="stats-row">
                    <span>❤️ HP:</span>
                    <span>{level1.hp}</span>
                  </div>
                  <div className="stats-row">
                    <span>⚔️ DMG:</span>
                    <span>{level1.damage}</span>
                  </div>
                  <div className="stats-row">
                    <span>💨 Speed:</span>
                    <span>{troop.speed}</span>
                  </div>
                  <div className="stats-row">
                    <span>🪙 Gold:</span>
                    <span>{troop.cost_gold}</span>
                  </div>
                  <div className="stats-row">
                    <span>⚒️ Iron:</span>
                    <span>{troop.cost_iron}</span>
                  </div>
                  {troop.cost_wildfire > 0 && (
                    <div className="stats-row">
                      <span>🔥 Wildfire:</span>
                      <span>{troop.cost_wildfire}</span>
                    </div>
                  )}
                </div>

                <div className="recruit-card-actions">
                  <button
                    className="details-toggle-btn"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : troop.troop_id)
                    }
                  >
                    {isExpanded ? "Collapse ▲" : "Stats ▼"}
                  </button>

                  {!isLocked ? (
                    <>
                      <div className="qty-selector">
                        <button
                          onClick={() =>
                            handleQtyChange(troop.troop_id, qty - 1)
                          }
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={qty}
                          onChange={(e) =>
                            handleQtyChange(
                              troop.troop_id,
                              parseInt(e.target.value) || 1,
                            )
                          }
                        />
                        <button
                          onClick={() =>
                            handleQtyChange(troop.troop_id, qty + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="recruit-buy-btn"
                        onClick={() =>
                          recruitMutation.mutate({
                            troopId: troop.troop_id,
                            qty,
                          })
                        }
                        disabled={recruitMutation.isPending}
                      >
                        Train
                      </button>
                    </>
                  ) : (
                    <div className="lock-notice">{lockReason}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
