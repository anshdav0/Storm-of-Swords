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
const TILE_PX = 24;
// how many milliseconds of REAL TIME pass per SIMULATED second.
// Lower this to speed up playback, raise it to slow down.
const PLAYBACK_SPEED = 1000;


interface LiveTroop {
    id:   number;
    x:    number;
    y:    number;
    dead: boolean;
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
            for (let i = 0; i < d.quantity; i++) {
                list.push({ id: id++, x: d.x, y: d.y, dead: false });
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
                style={{ width: GRID_SIZE * TILE_PX, height: GRID_SIZE * TILE_PX }}
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
                        style={{ left: t.x * TILE_PX, top: t.y * TILE_PX }}
                    />
                ))}
            </div>
        </div>
    );
}