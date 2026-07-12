import { useEffect, useRef, useState } from "react";
import type { BattleInput, BattleEvent } from "../../types";
import { BuildingIcon } from "../shared/AssetIcon";
import "./BattleCanvas.css";

interface Props {
    input:                BattleInput;
    events:               BattleEvent[];
    onAnimationComplete:  () => void;
}

const GRID_SIZE = 20;
const TILE_PX = 44;
// how many milliseconds of REAL TIME pass per SIMULATED second.
// Lower this to speed up playback, raise it to slow down.
const PLAYBACK_SPEED = 1000;


interface LiveTroop {
    id:    number;
    x:     number;
    y:     number;
    hp:    number;
    maxHp: number;
    dead:  boolean;
    color: string;
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

function getTroopColor(troopName: string): string {
    if (!troopName) return "#f59e0b"; // fallback amber
    let hash = 0;
    for (let i = 0; i < troopName.length; i++) {
        hash = troopName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 85%, 60%)`;
}

export function BattleCanvas({ input, events, onAnimationComplete }: Props) {
    
    const [buildings, setBuildings] = useState<LiveBuilding[]>(() =>
        input.defender_snapshot.map((b) => ({
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
        }))
    );

    const [troops, setTroops] = useState<LiveTroop[]>(() => {
        const list: LiveTroop[] = [];
        let id = 0;
        
        for (const d of input.attacker_deployment) {
            const startingHp = d.hp;
            const uniqueColor = getTroopColor(d.troop_type);

            for (let i = 0; i < d.quantity; i++) {
                list.push({id: id++, x: d.x, y: d.y, hp: startingHp, maxHp: startingHp, dead: false, color: uniqueColor});
            }
        }
        return list;
    });

    
    const eventIndexRef = useRef(0);
    const [currentTime, setCurrentTime] = useState(0);

    
    useEffect(() => {
        if (events.length === 0) {
            onAnimationComplete();
            return;
        }

        const maxTime = events[events.length - 1].t;

        
        const interval = setInterval(() => {
            setCurrentTime((prev) => {
                const next = prev + 1;

                
                while (
                    eventIndexRef.current < events.length &&
                    events[eventIndexRef.current].t <= next
                ) {
                    applyEvent(events[eventIndexRef.current]);
                    eventIndexRef.current++;
                }

                if (next >= maxTime) {
                    clearInterval(interval);
                    setTimeout(onAnimationComplete, 600);
                }

                return next;
            });
        }, PLAYBACK_SPEED);

        
        return () => clearInterval(interval);
    }, [events]);

    
    const applyEvent = (e: BattleEvent) => {
        switch (e.type) {
            case "troop_moved":
                setTroops((prev) =>
                    prev.map((t) =>
                        t.id === e.troop_instance_id ? { ...t, x: e.to_x!, y: e.to_y! } : t
                    )
                );
                break;
            case "troop_damaged":
                setTroops((prev) =>
                    prev.map((t) =>
                        t.id === e.troop_instance_id && e.hp_left !== undefined
                            ? { ...t, hp: e.hp_left } 
                            : t
                    )
                );
                break;
            case "troop_died":
                setTroops((prev) =>
                    prev.map((t) => (t.id === e.troop_instance_id ? { ...t, dead: true } : t))
                );
                break;
            case "building_damaged":
                setBuildings((prev) =>
                    prev.map((b) =>
                        b.id === e.village_building_id ? { ...b, hp: e.hp_left! } : b
                    )
                );
                break;
            case "building_destroyed":
                setBuildings((prev) =>
                    prev.map((b) =>
                        b.id === e.village_building_id ? { ...b, destroyed: true, hp: 0 } : b
                    )
                );
                break;
        }
    };

    return (
        <div className="battle-canvas-wrapper">
            <div className="battle-time">t = {currentTime}s</div>
            <div
                className="battle-canvas"
                style={{ width: GRID_SIZE * TILE_PX, height: GRID_SIZE * TILE_PX, backgroundSize: `${TILE_PX}px ${TILE_PX}px` }}
            >
                {buildings.filter((b) => !b.destroyed).map((b) => (
                    <div
                        key={b.id}
                        className="battle-building"
                        style={{
                            left:            b.x * TILE_PX,
                            top:             b.y * TILE_PX,
                            width:           b.sizeX * TILE_PX,
                            height:          b.sizeY * TILE_PX,
                            backgroundColor: b.type === "defense" ? "#e74c3c" : "#3498db",
                            position: "absolute",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center"
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

                {troops.filter((t) => !t.dead).map((t) => (
                    <div
                        key={t.id}
                        className="battle-troop-dot"
                        style={{ 
                            left: t.x * TILE_PX + (TILE_PX / 2 - 6), 
                            top: t.y * TILE_PX + (TILE_PX / 2 - 6),
                            position: "absolute",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            backgroundColor: t.color 
                        }}
                >
                    <div className="battle-hp-bar-bg troop-hp-bar">
                        <div
                            className="battle-hp-bar-fill"
                            style={{ width: `${Math.max(0, (t.hp / t.maxHp) * 100)}%` }}
                        />
                    </div>
                </div>
                ))}
            </div>
        </div>
);
}