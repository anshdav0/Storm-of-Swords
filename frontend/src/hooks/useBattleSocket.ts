import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "../store/authStore";
import type { DeploymentRequest, OpponentBuilding, BattleEvent } from "../types";

export type BattleSocketPhase = "connecting" | "fighting" | "ended" | "error";

export interface LiveTroop {
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

export interface LiveBuilding {
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

export interface BattleResult {
    starsEarned:    number;
    trophiesGained: number;
    goldLooted:     number;
    ironLooted:     number;
    wildfireLooted: number;
    battleId:       number;
}

function getTroopColor(troopName: string): string {
    if (!troopName) return "#f59e0b";
    let hash = 0;
    for (let i = 0; i < troopName.length; i++) {
        hash = troopName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 85%, 60%)`;
}

export function useBattleSocket(
    defenderID:        number | null,
    initialDeployment: DeploymentRequest[],
    defenderBuildings: OpponentBuilding[],
) {
    const token = useAuthStore((s) => s.token);

    const [phase,        setPhase]       = useState<BattleSocketPhase>("connecting");
    const [buildings,    setBuildings]   = useState<LiveBuilding[]>([]);
    const [troops,       setTroops]      = useState<LiveTroop[]>([]);
    const [result,       setResult]      = useState<BattleResult | null>(null);
    const [currentTime,  setCurrentTime] = useState(0);

    const wsRef = useRef<WebSocket | null>(null);

    // apply one event — mirrors BattleCanvas's old applyEvent exactly
    const applyEvent = useCallback((e: BattleEvent) => {
        const targetId = e.troop_instance_id ?? 0;

        switch (e.type) {
            case "troop_deployed":
                // 🛡️ Filter out the malformed ghost event that lacks a troop type identifier
                if (e.troop_id === undefined) return;

                setTroops((prev) => {
                    if (prev.some((t) => t.id === targetId)) return prev;
                    
                    return [...prev, {
                        id:      targetId,
                        troopId: e.troop_id as number,
                        x:       e.to_x!,
                        y:       e.to_y!,
                        hp:      100,
                        maxHp:   100,
                        dead:    false,
                        color:   getTroopColor(String(e.troop_id)),
                        state:   "idle" as const,
                    }];
                });
                break;

            case "troop_moved":
                setTroops((prev) =>
                    prev.map((t) =>
                        t.id === targetId
                            ? { ...t, x: e.to_x!, y: e.to_y!, state: "walking" as const }
                            : t
                    )
                );
                break;

            case "troop_damaged":
                setTroops((prev) =>
                    prev.map((t) =>
                        t.id === targetId && e.hp_left !== undefined
                            ? { ...t, hp: e.hp_left }
                            : t
                    )
                );
                break;

            case "troop_died":
                setTroops((prev) =>
                    prev.map((t) =>
                        t.id === targetId ? { ...t, dead: true, state: "idle" as const } : t
                    )
                );
                break;

            case "building_damaged":
                setBuildings((prev) =>
                    prev.map((b) =>
                        b.id === e.village_building_id ? { ...b, hp: e.hp_left! } : b
                    )
                );
                setTroops((prev) =>
                    prev.map((t) =>
                        t.id === targetId ? { ...t, state: "attacking" as const } : t
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
    }, []);

    useEffect(() => {
        if (!defenderID || !token) return;

        // initialize buildings from scout data immediately so the grid
        // renders before the first tick events arrive from the server
        setBuildings(defenderBuildings.map((b) => ({
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
        })));

        // initialize troops from initial deployment so they appear
        // immediately at their spawn points before the first tick
        const initialTroops: LiveTroop[] = [];
        let instanceId = 0;
        for (const d of initialDeployment) {
            // fetch hp from army entries if available — use 100 as fallback
            for (let i = 0; i < d.quantity; i++) {
                initialTroops.push({
                    id:      instanceId++,
                    troopId: d.troop_id,
                    x:       d.x,
                    y:       d.y,
                    hp:      100,
                    maxHp:   100,
                    dead:    false,
                    color:   getTroopColor(String(d.troop_id)),
                    state:   "idle",
                });
            }
        }
        setTroops(initialTroops);

       // Dynamically switch the port to 8080 while keeping the correct host name/protocol
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const hostName = window.location.hostname; // Extracts just "localhost" or the domain

        const wsURL    = `${protocol}//${hostName}:8080/ws/battle?token=${token}`;
        const ws       = new WebSocket(wsURL);
        wsRef.current  = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({
                type:        "start",
                defender_id: defenderID,
                deployment:  initialDeployment,
            }));
            setPhase("fighting");
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);

            if (msg.type === "tick") {
                setCurrentTime(msg.tick);
                for (const e of msg.events) {
                    applyEvent(e);
                }
            } else if (msg.type === "battle_end") {
                setResult({
                    starsEarned:    msg.stars_earned,
                    trophiesGained: msg.trophies_gained,
                    goldLooted:     msg.gold_looted,
                    ironLooted:     msg.iron_looted,
                    wildfireLooted: msg.wildfire_looted,
                    battleId:       msg.battle_id,
                });
                setPhase("ended");
            } else if (msg.error) {
                console.error("WS battle error:", msg.error);
                setPhase("error");
            }
        };

        ws.onerror = () => setPhase("error");
        ws.onclose = () => {
            if (wsRef.current === ws) wsRef.current = null;
        };

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, [defenderID, token]);

    const sendDeploy = useCallback((deployment: DeploymentRequest[]) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type:       "deploy",
                deployment,
            }));
        }
    }, []);

    return { phase, buildings, troops, result, currentTime, sendDeploy };
}