import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recruitTroop } from "../../api";
import "./TroopRecruitMenu.css";

// Hardcoded static metadata catalog aligned with your unlock rules order
const TROOP_CATALOG = [
  { id: 1, name: "Vanguard Footman", unlocksAt: "Barracks Lvl 1", baseColor: "#475569" },
  { id: 2, name: "Dothraki Rider", unlocksAt: "Barracks Lvl 2", baseColor: "#b45309" },
  { id: 3, name: "Ironborn Staffman", unlocksAt: "Barracks Lvl 3", baseColor: "#0369a1" },
];

interface Props {
  onClose: () => void;
  barracksLevel: number;
  armouryLevel: number;
}

export function TroopRecruitMenu({ onClose, barracksLevel, armouryLevel }: Props) {
  const queryClient = useQueryClient();
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [expandedTroopId, setExpandedTroopId] = useState<number | null>(null);

  const recruitMutation = useMutation({
    mutationFn: ({ troopId, qty }: { troopId: number; qty: number }) => recruitTroop(troopId, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["army"] });
      queryClient.invalidateQueries({ queryKey: ["village"] });
      alert("Troops added to barracks queue successfully!");
    },
    onError: (err: any) => {
      alert(`Recruitment Failed: ${err.response?.data?.error || err.message}`);
    },
  });

  const handleQtyChange = (id: number, val: number) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, val) }));
  };

  const handleRecruit = (troopId: number) => {
    const qty = quantities[troopId] || 1;
    recruitMutation.mutate({ troopId, qty });
  };

  return (
    <div className="recruit-overlay" onClick={onClose}>
      <div className="recruit-popup" onClick={(e) => e.stopPropagation()}>
        <div className="recruit-header">
          <h2>Garrison Barracks — Train Troops</h2>
          <button className="recruit-close" onClick={onClose}>×</button>
        </div>

        <div className="recruit-list-horizontal">
          {TROOP_CATALOG.map((troop) => {
            const isExpanded = expandedTroopId === troop.id;
            const qty = quantities[troop.id] || 1;

            // Simple frontend checking to flag locking bounds before backend network checks
            const isLocked = 
              (troop.id === 2 && barracksLevel < 2) || 
              (troop.id === 3 && barracksLevel < 3);

            return (
              <div 
                key={troop.id} 
                className={`recruit-card ${isExpanded ? "expanded" : ""} ${isLocked ? "card-locked" : ""}`}
              >
                {/* Visual Placeholder Graphic Block */}
                <div className="recruit-card-img" style={{ backgroundColor: troop.baseColor }}>
                  {isLocked ? "🔒 Locked" : "🛡️ Ready"}
                </div>

                <div className="recruit-card-main-info">
                  <div className="recruit-card-title">{troop.name}</div>
                  <div className="recruit-card-req text-slate-400 text-xs">{troop.unlocksAt}</div>
                </div>

                {/* Inline Animated Details Section toggled on demand */}
                <div className={`recruit-card-details ${isExpanded ? "show-details" : ""}`}>
                  <div className="stats-row"><span>⚔️ DPS Target:</span> <span>Scaled</span></div>
                  <div className="stats-row"><span>❤️ Vitality HP:</span> <span>Scaled</span></div>
                  <div className="stats-row"><span>🏠 Housing Capacity:</span> <span>1 Space</span></div>
                </div>

                <div className="recruit-card-actions">
                  <button 
                    className="details-toggle-btn"
                    onClick={() => setExpandedTroopId(isExpanded ? null : troop.id)}
                  >
                    {isExpanded ? "Collapse ▲" : "Stats Details ▼"}
                  </button>

                  {!isLocked ? (
                    <>
                      <div className="qty-selector">
                        <button onClick={() => handleQtyChange(troop.id, qty - 1)}>-</button>
                        <input 
                          type="number" 
                          value={qty} 
                          onChange={(e) => handleQtyChange(troop.id, parseInt(e.target.value) || 1)}
                        />
                        <button onClick={() => handleQtyChange(troop.id, qty + 1)}>+</button>
                      </div>
                      <button 
                        className="recruit-buy-btn"
                        onClick={() => handleRecruit(troop.id)}
                        disabled={recruitMutation.isPending}
                      >
                        Train
                      </button>
                    </>
                  ) : (
                    <div className="lock-notice">Upgrade Barracks</div>
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