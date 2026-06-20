import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { findOpponent, getDefenderVillage, attack } from "../api";
import { useArmyGarrison } from "../hooks/useArmyGarrison";
import { DeployPanel } from "../components/battle/DeployPanel.tsx";
import { BattleCanvas } from "../components/battle/BattleCanvas.tsx";
import { BattleResultPanel } from "../components/battle/BattleResultPanel.tsx";
import type { DeploymentRequest, BattleResponse } from "../types";
import "./BattlePage.css";

// Phase tracks which screen of the battle flow we're showing.
// This is a TypeScript union type — phase can ONLY ever be one
// of these four exact string values, nothing else is allowed.
type Phase = "search" | "deploy" | "fighting" | "result";

export function BattlePage() {
    // useState gives us a value that, when changed via its setter
    // function (setPhase, setOpponentId, etc), causes React to
    // re-render this component automatically.
    const [phase, setPhase] = useState<Phase>("search");
    const [opponentId, setOpponentId] = useState<number | null>(null);
    const [deployment, setDeployment] = useState<DeploymentRequest[]>([]);
    const [battleResult, setBattleResult] = useState<BattleResponse | null>(null);

    // your existing hook that fetches the player's current army
    const garrison = useArmyGarrison();

    // useMutation is for actions that CHANGE something on the server
    // (as opposed to useQuery, which is for just READING data).
    // Finding an opponent is a mutation because each click gives a
    // DIFFERENT random result — it's not "the same data every time"
    // the way a normal fetch would be.
    const findOpponentMutation = useMutation({
        mutationFn: findOpponent,
        onSuccess: (res) => {
            // res.data is the actual OpponentPreview object your
            // Go backend sent back, already typed correctly
            setOpponentId(res.data.player_id);
            setPhase("deploy");
        },
        onError: (err: any) => {
            alert(err.response?.data?.error || "No opponent found");
        },
    });

    // useQuery is for READING data — it fetches automatically when
    // its dependencies change, and "enabled" controls WHEN it's
    // allowed to run at all (we don't want it firing before we
    // even have an opponentId).
    const { data: defenderVillage, isLoading: villageLoading } = useQuery({
        queryKey: ["defenderVillage", opponentId],
        queryFn: () => getDefenderVillage(opponentId!).then((res) => res.data),
        enabled: opponentId !== null && phase === "deploy",
    });

    const attackMutation = useMutation({
        mutationFn: () => attack(opponentId!, deployment),
        onSuccess: (res) => {
            setBattleResult(res.data);
            setPhase("fighting"); // show the animation BEFORE the result screen
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

    // This is JSX — it LOOKS like HTML but it's actually JavaScript.
    // Every {curly brace} section is real JS code being evaluated.
    // {phase === "search" && (...)} means: "only render this block
    // if phase currently equals 'search', otherwise render nothing."
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