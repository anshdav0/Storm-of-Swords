//import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getArmy, recruitTroop } from "../api";

export function ArmyPage() {
  const queryClient = useQueryClient();

  // 1. Fetch live deployment values
  const {
    data: army,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["armyData"],
    queryFn: getArmy,
  });

  // 2. Setup training transactional mutator loop
  const recruitMutation = useMutation({
    mutationFn: ({ troopId, qty }: { troopId: number; qty: number }) =>
      recruitTroop(troopId, qty),
    onSuccess: () => {
      // Instantly sync the resource states and army listings
      queryClient.invalidateQueries({ queryKey: ["armyData"] });
      queryClient.invalidateQueries({ queryKey: ["villageData"] });
    },
  });

  if (isLoading)
    return (
      <div className="text-center text-amber-500 py-12 animate-pulse">
        Reading Garrison Logs...
      </div>
    );
  if (error)
    return (
      <div className="text-center text-rose-500 py-12">
        Failed loading garrison.
      </div>
    );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-amber-500 tracking-wide border-b border-slate-800 pb-2">
        Stronghold Garrison
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {army?.data.map((entry) => (
          <div
            key={entry.troop.id}
            className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center shadow-lg"
          >
            <div>
              <h3 className="font-bold text-lg text-slate-200">
                {entry.troop.type}
              </h3>
              <p className="text-xs text-slate-500">
                Tier Level:{" "}
                <span className="text-amber-500 font-bold">
                  {entry.troop.level}
                </span>
              </p>
              <div className="grid grid-cols-2 gap-x-4 text-xs mt-2 text-slate-400">
                {entry.troop.damage > 0 && (
                  <span>
                    Damage:{" "}
                    <strong className="text-slate-200">
                      {entry.troop.damage} DPS
                    </strong>
                  </span>
                )}
                <span>
                  Health:{" "}
                  <strong className="text-slate-200">
                    {entry.troop.hp} HP
                  </strong>
                </span>
                <span>
                  Speed:{" "}
                  <strong className="text-slate-200">
                    {entry.troop.speed}
                  </strong>
                </span>
              </div>
            </div>

            <div className="text-right flex flex-col items-end gap-3">
              <div>
                <span className="text-xs uppercase font-semibold text-slate-500 block">
                  In Barracks
                </span>
                <span className="text-2xl font-black text-slate-100">
                  {entry.quantity}
                </span>
              </div>

              <button
                onClick={() =>
                  recruitMutation.mutate({ troopId: entry.troop.id, qty: 1 })
                }
                disabled={recruitMutation.isPending}
                className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-slate-950 px-3 py-1 rounded text-xs font-extrabold uppercase tracking-wide transition-all"
              >
                Train Unit (+1)
              </button>
            </div>
          </div>
        ))}

        {army?.data.length === 0 && (
          <div className="col-span-2 text-center text-slate-500 text-sm py-8 border border-dashed border-slate-800 rounded-xl">
            No standing army units drafted. Order recruit pools above.
          </div>
        )}
      </div>
    </div>
  );
}
