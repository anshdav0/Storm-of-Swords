import { useState } from "react";
import type { ArmyEntry, OpponentBuilding, DeploymentRequest } from "../../types";
import "./DeployPanel.css";

// Props is the standard name for "what data this component needs
// to be given by its parent in order to work." Every value here
// MUST be passed in by BattlePage.tsx when it renders <DeployPanel ... />
interface Props {
    armyEntries:        ArmyEntry[];
    defenderBuildings:  OpponentBuilding[];
    deployment:         DeploymentRequest[];
    onDeploymentChange: (d: DeploymentRequest[]) => void;
    onAttack:           () => void;
    isAttacking:        boolean;
    onCancel:           () => void;
}

const GRID_SIZE = 20;
const TILE_PX = 24;

export function DeployPanel({
    armyEntries,
    defenderBuildings,
    deployment,
    onDeploymentChange,
    onAttack,
    isAttacking,
    onCancel,
}: Props) {

    const [selectedTroopId, setSelectedTroopId] = useState<number | null>(null);

    const [quantities, setQuantities] = useState<Record<number, number>>({});

    const handleQtyChange = (troopId: number, val: number, max: number) => {
        // Math.max/Math.min together clamp the value so it can
        // never go below 0 or above how many troops the player owns
        const clamped = Math.max(0, Math.min(max, val));
        setQuantities((prev) => ({ ...prev, [troopId]: clamped }));
    };

    // fires whenever the player clicks anywhere on the grid
    const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (selectedTroopId === null) return;
        const qty = quantities[selectedTroopId] || 0;
        if (qty <= 0) return;

        // convert the raw pixel click position into a grid tile coordinate
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / TILE_PX);
        const y = Math.floor((e.clientY - rect.top) / TILE_PX);

        const filtered = deployment.filter((d) => d.troop_id !== selectedTroopId);
        onDeploymentChange([...filtered, { troop_id: selectedTroopId, quantity: qty, x, y }]);
    };

    const totalDeployed = deployment.reduce((sum, d) => sum + d.quantity, 0);

    return (
        <div className="deploy-panel">
            <div className="deploy-grid-side">
                <h3>Target Village</h3>
                <div
                    className="deploy-grid"
                    style={{ width: GRID_SIZE * TILE_PX, height: GRID_SIZE * TILE_PX }}
                    onClick={handleGridClick}
                >
                    {defenderBuildings.map((b) => (
                        <div
                            key={b.village_building_id}
                            className="deploy-building"
                            style={{
                                left: b.x_cor * TILE_PX,
                                top: b.y_cor * TILE_PX,
                                width: b.size_x * TILE_PX,
                                height: b.size_y * TILE_PX,
                                backgroundColor: b.building_type === "defense" ? "#e74c3c" : "#3498db",
                            }}
                        >
                            {b.building_name}
                        </div>
                    ))}

                    {deployment.map((d) => (
                        <div
                            key={d.troop_id}
                            className="deploy-marker"
                            style={{ left: d.x * TILE_PX, top: d.y * TILE_PX }}
                        >
                            {d.quantity}
                        </div>
                    ))}
                </div>
                <p className="deploy-hint">
                    {selectedTroopId
                        ? "Click on the grid to place your troops"
                        : "Select a troop below, then click the grid"}
                </p>
            </div>

            <div className="deploy-army-side">
                <h3>Your Army</h3>
                <div className="deploy-troop-list">
                    {armyEntries.map((entry) => {
                        const qty = quantities[entry.troop.id] || 0;
                        const isSelected = selectedTroopId === entry.troop.id;
                        return (
                            <div
                                key={entry.troop.id}
                                className={`deploy-troop-row ${isSelected ? "selected" : ""}`}
                                onClick={() => setSelectedTroopId(entry.troop.id)}
                            >
                                <div className="deploy-troop-name">
                                    {entry.troop.type} <span className="deploy-troop-have">×{entry.quantity}</span>
                                </div>
                                {/* stopPropagation prevents clicking the +/- buttons
                                    from ALSO triggering the row's onClick (which would
                                    re-select the troop unnecessarily) */}
                                <div className="deploy-troop-qty" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => handleQtyChange(entry.troop.id, qty - 1, entry.quantity)}>−</button>
                                    <input
                                        type="number"
                                        value={qty}
                                        onChange={(e) =>
                                            handleQtyChange(entry.troop.id, parseInt(e.target.value) || 0, entry.quantity)
                                        }
                                    />
                                    <button onClick={() => handleQtyChange(entry.troop.id, qty + 1, entry.quantity)}>+</button>
                                </div>
                            </div>
                        );
                    })}
                    {armyEntries.length === 0 && (
                        <div className="deploy-empty">No troops available. Recruit some first.</div>
                    )}
                </div>

                <div className="deploy-actions">
                    <button className="deploy-cancel-btn" onClick={onCancel}>Cancel</button>
                    <button
                        className="deploy-attack-btn"
                        onClick={onAttack}
                        disabled={totalDeployed === 0 || isAttacking}
                    >
                        {isAttacking ? "Attacking..." : `⚔️ Attack (${totalDeployed} troops)`}
                    </button>
                </div>
            </div>
        </div>
    );
}