import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { findOpponent, getDefenderVillage } from "../api";
import { useArmyGarrison } from "../hooks/useArmyGarrison";
import { useBattleSocket } from "../hooks/useBattleSocket";
import { DeployPanel } from "../components/battle/DeployPanel";
import { BattleCanvas } from "../components/battle/BattleCanvas";
import { BattleResultPanel } from "../components/battle/BattleResultPanel";
import type { DeploymentRequest, OpponentBuilding } from "../types";
import "./BattlePage.css";

type Phase = "search" | "deploy" | "fighting" | "result";

export function BattlePage() {
    const [phase,             setPhase]            = useState<Phase>("search");
    const [opponentId,        setOpponentId]       = useState<number | null>(null);
    const [deployment,        setDeployment]       = useState<DeploymentRequest[]>([]);
    const [defenderBuildings, setDefenderBuildings] = useState<OpponentBuilding[]>([]);
    const [fightStarted,      setFightStarted]     = useState(false);

    const garrison = useArmyGarrison();

    // WebSocket hook — only activates once fightStarted = true
    const battle = useBattleSocket(
        fightStarted ? opponentId : null,
        deployment,
        defenderBuildings,
    );

    const findOpponentMutation = useMutation({
        mutationFn: findOpponent,
        onSuccess: (res) => {
            setOpponentId(res.data.player_id);
            setPhase("deploy");
        },
        onError: (err: any) => {
            alert(err.response?.data?.error || "No opponent found");
        },
    });

    const { data: defenderVillage, isLoading: villageLoading } = useQuery({
        queryKey: ["defenderVillage", opponentId],
        queryFn:  () => getDefenderVillage(opponentId!).then((res) => res.data),
        enabled:  opponentId !== null && phase === "deploy",
    });

    const handleAttack = () => {
        if (!defenderVillage) return;
        setDefenderBuildings(defenderVillage);
        setFightStarted(true);
        setPhase("fighting");
    };

    const resetBattle = () => {
        setPhase("search");
        setOpponentId(null);
        setDeployment([]);
        setDefenderBuildings([]);
        setFightStarted(false);
    };

    // build a BattleResponse-shaped object for BattleResultPanel
    // from the WebSocket result so we don't need to change that component
    const battleResponseForResult = battle.result ? {
        battle_id:       battle.result.battleId,
        stars_earned:    battle.result.starsEarned,
        trophies_gained: battle.result.trophiesGained,
        gold_looted:     battle.result.goldLooted,
        iron_looted:     battle.result.ironLooted,
        wildfire_looted: battle.result.wildfireLooted,
        events:          [] as any,
        replay_input:    { defender_snapshot: [], attacker_deployment: [] } as any,
    } : null;

    return (
        <div className="battle-page">
            {phase === "search" && (
                <div className="battle-search">
                    <h2>Find a Target</h2>
                    <button
                        className="battle-search-btn"
                        onClick={() => findOpponentMutation.mutate()}
                        disabled={findOpponentMutation.isPending}
                    >
                        {findOpponentMutation.isPending ? "Searching..." : "⚔️ Find Opponent"}
                    </button>
                </div>
            )}

            {phase === "deploy" && (
                <>
                    {villageLoading && <div>Scouting village...</div>}
                    {defenderVillage && (
                        <DeployPanel
                            armyEntries={garrison.armyEntries}
                            defenderBuildings={defenderVillage}
                            deployment={deployment}
                            onDeploymentChange={setDeployment}
                            onAttack={handleAttack}
                            isAttacking={false}
                            onCancel={resetBattle}
                        />
                    )}
                </>
            )}

            {phase === "fighting" && (
                <>
                    {battle.phase === "connecting" && (
                        <div style={{ color: "#f59e0b", padding: "40px" }}>Connecting to battle server...</div>
                    )}
                    {battle.phase === "error" && (
                        <div style={{ color: "#ef4444", padding: "40px" }}>
                            Connection failed. <button onClick={resetBattle}>Go back</button>
                        </div>
                    )}
                    {(battle.phase === "fighting" || battle.phase === "ended") && (
                        <BattleCanvas
                            defenderBuildings={defenderBuildings}
                            armyEntries={garrison.armyEntries}
                            onMidBattleDeploy={battle.sendDeploy}
                            wsBuildings={battle.buildings}
                            wsTroops={battle.troops}
                            currentTime={battle.currentTime}
                            phase={battle.phase}
                            onAnimationComplete={() => setPhase("result")}
                        />
                    )}
                </>
            )}

            {phase === "result" && battleResponseForResult && (
                <BattleResultPanel
                    result={battleResponseForResult}
                    onClose={resetBattle}
                   // onWatchAgain={() => setPhase("fighting")}
                />
            )}
        </div>
    );
}