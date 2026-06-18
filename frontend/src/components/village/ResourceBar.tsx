import { useMutation, useQueryClient } from "@tanstack/react-query";
import { collectResources } from "../../api";
import type { Village } from "../../types";

interface Props {
  village: Village;
}

export default function ResourceBar({ village }: Props) {
  const queryClient = useQueryClient();

  // useMutation: for actions that change server state (collecting resources)
  // onSuccess invalidates the village query, which triggers an automatic refetch
  const collectMutation = useMutation({
    mutationFn: (resourceType: "gold" | "iron" | "wildfire") =>
      collectResources(resourceType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["village"] });
    },
  });

  return (
    <div className="resource-bar">
      <div className="resource">
        <span>🪙 {village.gold}</span>
        <button
          onClick={() => collectMutation.mutate("gold")}
          disabled={collectMutation.isPending}
        >
          Collect
        </button>
      </div>

      <div className="resource">
        <span>⚔️ {village.iron}</span>
        <button
          onClick={() => collectMutation.mutate("iron")}
          disabled={collectMutation.isPending}
        >
          Collect
        </button>
      </div>

      <div className="resource">
        <span>🔥 {village.wildfire}</span>
        <button
          onClick={() => collectMutation.mutate("wildfire")}
          disabled={collectMutation.isPending}
        >
          Collect
        </button>
      </div>

      {collectMutation.isError && (
        <div className="error-text">
          {(collectMutation.error as any)?.response?.data?.error ??
            "Collection failed"}
        </div>
      )}
    </div>
  );
}
