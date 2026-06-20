import type { BattleResponse } from "../../types";
import "./BattleResultPanel.css";

interface Props {
    result:  BattleResponse;
    onClose: () => void;
}

export function BattleResultPanel({ result, onClose }: Props) {
    return (
        <div className="battle-result">
            <h2>Battle Complete</h2>

            <div className="battle-stars">
                {[1, 2, 3].map((n) => (
                    <span key={n} className={n <= result.stars_earned ? "star filled" : "star"}>
                        ★
                    </span>
                ))}
            </div>

            <div className="battle-result-row">
                <span>🏆 Trophies</span>
                <span className="positive">+{result.trophies_gained}</span>
            </div>
            <div className="battle-result-row">
                <span>🪙 Gold Looted</span>
                <span className="positive">+{result.gold_looted}</span>
            </div>
            <div className="battle-result-row">
                <span>⚔️ Iron Looted</span>
                <span className="positive">+{result.iron_looted}</span>
            </div>
            {result.wildfire_looted > 0 && (
                <div className="battle-result-row">
                    <span>🔥 Wildfire Looted</span>
                    <span className="positive">+{result.wildfire_looted}</span>
                </div>
            )}

            <button className="battle-result-close" onClick={onClose}>
                Return to Battle Menu
            </button>
        </div>
    );
}