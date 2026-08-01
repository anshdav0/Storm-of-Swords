import { useEffect, useRef, useState } from "react";
import React from 'react';
import type { OpponentBuilding, DeploymentRequest } from "../../types";
import { BuildingIcon, TroopIcon } from "../shared/AssetIcon";
import "./BattleCanvas.css";

const GRID_SIZE = 20;
const TILE_PX = 44;

interface LiveTroop {
    id:      number;
    troopId: number;
    x:       number;
    y:       number;
    hp:      number;
    maxHp:   number;
    dead:    boolean;
    color:   string;
    state:   "idle" | "walking" | "attacking";
}

interface LiveBuilding {
    id:        number;
    x:         number;
    y:         number;
    sizeX:     number;
    sizeY:     number;
    name:      string;
    type:      string;
    hp:        number;
    maxHp:     number;
    destroyed: boolean;
}

interface Props {
    defenderBuildings:   OpponentBuilding[];
    armyEntries:         any[];
    onMidBattleDeploy:   (deployment: DeploymentRequest[]) => void;
    wsBuildings:         LiveBuilding[];
    wsTroops:            LiveTroop[];
    currentTime:         number;
    phase:               "connecting" | "fighting" | "ended" | "error";
    onAnimationComplete: () => void;
}

export function BattleCanvas({
    defenderBuildings,
    armyEntries,
    onMidBattleDeploy,
    wsBuildings,
    wsTroops,
    currentTime,
    phase,
    onAnimationComplete,
}: Props) {
    const [selectedTroopId, setSelectedTroopId] = useState<number | null>(null);
    const [quantities,      setQuantities]       = useState<Record<number, number>>({});

    const endedRef = useRef(false);
    useEffect(() => {
        if (phase === "ended" && !endedRef.current) {
            endedRef.current = true;
            setTimeout(onAnimationComplete, 1200);
        }
    }, [phase, onAnimationComplete]);

    const deployedCounts = wsTroops.reduce((acc, t) => {
        acc[t.troopId] = (acc[t.troopId] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);

    const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (selectedTroopId === null) return;
        
        const entry = armyEntries.find(p => p.troop.id === selectedTroopId);
        if (!entry) return;
        
        const spawned = deployedCounts[selectedTroopId] || 0;
        const totalRemaining = Math.max(0, entry.quantity - spawned);
        
        const desiredQty = quantities[selectedTroopId] || 1;
        const finalQty = Math.min(desiredQty, totalRemaining);
        if (finalQty <= 0) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / TILE_PX);
        const y = Math.floor((e.clientY - rect.top)  / TILE_PX);
        
        onMidBattleDeploy([{ troop_id: selectedTroopId, quantity: finalQty, x, y }]);
    };

    const displayBuildings: LiveBuilding[] = wsBuildings.length > 0
        ? wsBuildings
        : defenderBuildings.map((b) => ({
            id:        b.village_building_id,
            x:         b.x_cor,
            y:         b.y_cor,
            sizeX:     b.size_x,
            sizeY:     b.size_y,
            name:      b.building_name,
            type:      b.building_type,
            hp:        b.current_hp,
            maxHp:     b.current_hp,
            destroyed: false,
        }));

    return (
        <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap", justifyContent: "center" }}>
            {/* ── Main battle grid ── */}
            <div className="battle-canvas-wrapper">
                <div className="battle-time">t = {currentTime.toFixed(1)}s</div>

                <div
                    className="battle-canvas"
                    style={{
                        width:           GRID_SIZE * TILE_PX,
                        height:          GRID_SIZE * TILE_PX,
                        backgroundSize:  `${TILE_PX}px ${TILE_PX}px`,
                    }}
                    onClick={handleGridClick}
                >
                    {displayBuildings.filter((b) => !b.destroyed).map((b) => (
                        <div
                            key={b.id}
                            className="battle-building"
                            style={{
                                left:            b.x * TILE_PX,
                                top:             b.y * TILE_PX,
                                width:           b.sizeX * TILE_PX,
                                height:          b.sizeY * TILE_PX,
                                backgroundColor: b.type === "defense" ? "#e74c3c" : "#3498db",
                                position:        "absolute",
                                display:         "flex",
                                flexDirection:   "column",
                                alignItems:      "center",
                                justifyContent:  "center",
                            }}
                        >
                            <BuildingIcon
                                buildingName={b.name}
                                alt={b.name}
                                style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }}
                            />
                            <div className="battle-hp-bar-bg">
                                <div
                                    className="battle-hp-bar-fill"
                                    style={{ width: `${(b.hp / b.maxHp) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}

                    {wsTroops.filter((t) => !t.dead).map((t) => (
                        <div
                            key={t.id}
                            className={`battle-troop-dot ${
                                t.state === "walking"   ? "animate-walk"   :
                                t.state === "attacking" ? "animate-attack" : ""
                            }`}
                            style={{
                                left:     t.x * TILE_PX,
                                top:      t.y * TILE_PX,
                                position: "absolute",
                            }}
                        >
                            <div className="battle-hp-bar-bg troop-hp-bar">
                                <div
                                    className="battle-hp-bar-fill"
                                    style={{ width: `${Math.max(0, (t.hp / t.maxHp) * 100)}%` }}
                                />
                            </div>
                            <TroopIcon
                                troopId={t.troopId}
                                alt=""
                                style={{
                                    width:      "100%",
                                    height:     "100%",
                                    objectFit:  "contain",
                                    filter:     "drop-shadow(0px 3px 5px rgba(0,0,0,0.5))",
                                }}
                            />
                        </div>
                    ))}
                </div>

                {selectedTroopId && (
                    <p className="deploy-hint" style={{ marginTop: "8px" }}>
                        Click the grid to deploy reinforcements
                    </p>
                )}
            </div>

            {/* ── Mid-battle deploy sidebar ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "220px", maxWidth: "260px" }}>
                <h3 style={{ color: "#f59e0b", fontSize: "14px", margin: 0 }}>⚔️ Reinforcements</h3>

                <div className="deploy-troop-list">
                    {armyEntries.map((entry: any) => {
                        // Dynamically deduct troops already rendered on the simulation canvas
                        const spawned        = deployedCounts[entry.troop.id] || 0;
                        const remainingCount = Math.max(0, entry.quantity - spawned);
                        
                        const qty            = quantities[entry.troop.id] || 1;
                        const isSelected     = selectedTroopId === entry.troop.id;

                        return (
                            <div
                                key={entry.troop.id}
                                className={`deploy-troop-row ${isSelected ? "selected" : ""} ${remainingCount <= 0 ? "exhausted" : ""}`}
                                onClick={() => remainingCount > 0 && setSelectedTroopId(entry.troop.id)}
                                style={{ 
                                    display: "flex", 
                                    alignItems: "center", 
                                    gap: "10px",
                                    opacity: remainingCount <= 0 ? 0.4 : 1,
                                    pointerEvents: remainingCount <= 0 ? "none" : "auto"
                                }}
                            >
                                <div style={{ width: "40px", height: "40px", backgroundColor: "#1e293b", borderRadius: "6px", padding: "2px", flexShrink: 0 }}>
                                    <TroopIcon
                                        troopId={entry.troop.id}
                                        alt=""
                                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                    />
                                </div>

                                <div style={{ flex: 1, fontSize: "11px", color: "#e2e8f0" }}>
                                    {entry.troop.type}
                                    <span style={{ color: "#64748b" }}> ×{remainingCount}</span>
                                </div>

                                <div className="deploy-troop-qty" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => setQuantities((p) => ({ ...p, [entry.troop.id]: Math.max(1, qty - 1) }))}>−</button>
                                    <input
                                        type="number"
                                        value={qty}
                                        onChange={(e) =>
                                            setQuantities((p) => ({
                                                ...p,
                                                [entry.troop.id]: Math.max(1, Math.min(remainingCount, parseInt(e.target.value) || 1)),
                                            }))
                                        }
                                    />
                                    <button onClick={() => setQuantities((p) => ({ ...p, [entry.troop.id]: Math.min(remainingCount, qty + 1) }))}>+</button>
                                </div>
                            </div>
                        );
                    })}

                    {armyEntries.length === 0 && (
                        <div className="deploy-empty">No reserves available</div>
                    )}
                </div>
            </div>
        </div>
    );
}