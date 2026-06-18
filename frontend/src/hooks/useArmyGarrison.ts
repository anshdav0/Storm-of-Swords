import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getArmy, recruitTroop } from "../api";

export function useArmyGarrison() {
  const queryClient = useQueryClient();

  // Fetch live garrison status values
  const {
    data: army,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["armyData"],
    queryFn: getArmy,
  });

  // Manage training mutation transaction requests
  const recruitMutation = useMutation({
    mutationFn: ({ troopId, qty }: { troopId: number; qty: number }) =>
      recruitTroop(troopId, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["armyData"] });
      queryClient.invalidateQueries({ queryKey: ["villageData"] });
    },
    onError: (err: any) => {
      alert(
        `Garrison training error: ${err.response?.data?.error || err.message}`,
      );
    },
  });

  return {
    armyEntries: army?.data || [],
    isLoading,
    error,
    isTraining: recruitMutation.isPending,
    trainTroop: (troopId: number, qty = 1) =>
      recruitMutation.mutate({ troopId, qty }),
  };
}
