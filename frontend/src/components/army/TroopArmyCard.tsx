// components/army/TroopArmyCard.tsx
import { useState } from "react";
import type { ArmyEntry } from "../../types";
import "./TroopArmyCard.css"; // 🎯 Import the CSS styles directly

interface Props {
  entry: ArmyEntry;
  isTraining: boolean;
  onTrain: (id: number) => void;
}

const TROOP_COLORS: Record<string, string> = {
  Dothraki: "#b45309",
  Ironborn: "#0369a1",
  Vanguard: "#475569",
};

export function TroopArmyCard({ entry, isTraining, onTrain }: Props) {
  const [showStats, setShowStats] = useState(false);

  if (!entry || !entry.troop) {
    return (
      <div style={{ color: "#64748b", fontSize: "12px" }}>Loading unit...</div>
    );
  }

  const { troop, quantity } = entry;

  const matchColor = Object.keys(TROOP_COLORS).find((k) =>
    troop.type?.includes(k),
  );
  const cardColor = matchColor ? TROOP_COLORS[matchColor] : "#334155";

  return (
    <div className="army-card">
      {/* Left Column Content Elements Group */}
      <div className="army-card-left">
        <div
          className="army-card-graphic"
          style={{ backgroundColor: cardColor }}
        >
          ⚔️
        </div>

        <div className="army-card-meta">
          <div className="army-card-title-row">
            <h3 className="army-card-name">{troop.type || "Unknown Unit"}</h3>
            <span className="army-card-level">Lvl {troop.level ?? 1}</span>
          </div>

          <button
            onClick={() => setShowStats(!showStats)}
            className="army-card-toggle"
          >
            {showStats ? "Hide Attributes ▲" : "View Attributes ▼"}
          </button>

          {/* Pure CSS toggle logic container */}
          <div
            className="army-card-stats"
            style={{
              maxHeight: showStats ? "100px" : "0px",
              opacity: showStats ? 1 : 0,
              overflow: "hidden",
              transition: "all 0.2s ease-in-out",
            }}
          >
            {(troop.damage ?? 0) > 0 && (
              <span>
                Damage: <strong>{troop.damage} DPS</strong>
              </span>
            )}
            <span>
              Health: <strong>{troop.hp ?? 0} HP</strong>
            </span>
            <span>
              Speed: <strong>{troop.speed ?? 0}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Right Column Queue Action Elements Group */}
      <div className="army-card-right">
        <div>
          <span className="garrison-label">Active Garrison</span>
          <span className="garrison-count">{quantity ?? 0}</span>
        </div>

        <button
          onClick={() => onTrain(troop.id)}
          disabled={isTraining}
          className="army-train-btn"
        >
          Train (+1)
        </button>
      </div>
    </div>
  );
}
