import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { findOpponent, getDefenderVillage, attack } from "../api";
import { useArmyGarrison } from "../hooks/useArmyGarrison";
import { DeployPanel } from "../components/battle/DeployPanel.tsx";
import { BattleCanvas } from "../components/battle/BattleCanvas.tsx";
import { BattleResultPanel } from "../components/battle/BattleResultPanel.tsx";
import type { DeploymentRequest, BattleResponse } from "../types";
import "./BattlePage.css";

type Phase = "search" | "deploy" | "fighting" | "result";

export function BattlePage() {
    const [phase, setPhase] = useState<Phase>("search");
    const [opponentId, setOpponentId] = useState<number | null>(null);
    const [deployment, setDeployment] = useState<DeploymentRequest[]>([]);
    const [battleResult, setBattleResult] = useState<BattleResponse | null>(null);

    const garrison = useArmyGarrison();

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
        queryFn: () => getDefenderVillage(opponentId!).then((res) => res.data),
        enabled: opponentId !== null && phase === "deploy",
    });

    const attackMutation = useMutation({
        mutationFn: () => attack(opponentId!, deployment),
        onSuccess: (res) => {
            setBattleResult(res.data);
            setPhase("fighting");
        },
        onError: (err: any) => {
            alert(err.response?.data?.error || "Attack failed");
        },
    });

    // resets everything back to the start so the player can fight again
    const resetBattle = () => {
        setPhase("search");
        setOpponentId(null);
        setDeployment([]);
        setBattleResult(null);
    };

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
                            onAttack={() => attackMutation.mutate()}
                            isAttacking={attackMutation.isPending}
                            onCancel={resetBattle}
                        />
                    )}
                </>
            )}

            {phase === "fighting" && battleResult && (
                <BattleCanvas
                    input={battleResult.replay_input}
                    events={battleResult.events}
                    onAnimationComplete={() => setPhase("result")}
                />
            )}

            {phase === "result" && battleResult && (
                <BattleResultPanel result={battleResult} onClose={resetBattle} />
            )}
        </div>
    );
}