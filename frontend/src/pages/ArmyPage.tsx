// pages/ArmyPage.tsx
import { useArmyGarrison } from "../hooks/useArmyGarrison";
import { TroopArmyCard } from "../components/army/TroopArmyCard";

export function ArmyPage() {
  const garrison = useArmyGarrison();

  if (garrison.isLoading) {
    return (
      <div className="text-center text-amber-500 py-12 animate-pulse font-bold">
        Reading Garrison Logs...
      </div>
    );
  }

  if (garrison.error) {
    return (
      <div className="text-center text-rose-500 py-12 font-semibold">
        Failed loading garrison data streams.
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-amber-500 tracking-wide border-b border-slate-800 pb-2">
        Stronghold Garrison
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {garrison.armyEntries.map((entry) => (
          <TroopArmyCard
            key={entry.troop.id}
            entry={entry}
            isTraining={garrison.isTraining}
            onTrain={(id) => garrison.trainTroop(id)}
          />
        ))}

        {garrison.armyEntries.length === 0 && (
          <div className="col-span-2 text-center text-slate-500 text-sm py-12 border border-dashed border-slate-800 rounded-xl">
            No standing army units drafted. Order recruit pools above.
          </div>
        )}
      </div>
    </div>
  );
}
