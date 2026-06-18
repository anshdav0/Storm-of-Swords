

interface Props {
  gold: number;
  iron: number;
  wildfire: number;
  isEditMode: boolean;
  isSaving: boolean;
  isPlacing: boolean;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onOpenShop: () => void;
  onOpenRecruit: () => void;
  onCancelPlacement: () => void;
}

export function VillageHeader({
  gold, iron, wildfire, isEditMode, isSaving, isPlacing,
  onStartEdit, onSaveEdit, onCancelEdit, onOpenShop, onOpenRecruit, onCancelPlacement
}: Props) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "640px" }}>
      <div style={{ display: "flex", gap: "24px", fontSize: "14px" }}>
        <span>🪙 {gold}</span>
        <span>⚔️ {iron}</span>
        <span>🔥 {wildfire}</span>
      </div>

      <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
        {!isEditMode && !isPlacing && (
          <>
            <button onClick={onStartEdit} style={btnStyle("#2c3e50")}>🛠️ Move Mode</button>
            <button onClick={onOpenRecruit} style={btnStyle("#1e3a8a")}>⚔️ Train Army</button>
            <button onClick={onOpenShop} style={btnStyle("#d4af37", "#111")}>🛒 Shop</button>
          </>
        )}

        {isEditMode && (
          <>
            <button onClick={onSaveEdit} disabled={isSaving} style={btnStyle("#27ae60")}>
              {isSaving ? "Validating..." : "💾 Save Layout"}
            </button>
            <button onClick={onCancelEdit} style={btnStyle("#c0392b")}>❌ Cancel</button>
          </>
        )}

        {isPlacing && (
          <button onClick={onCancelPlacement} style={btnStyle("#7f8c8d")}>Cancel Shop Placement</button>
        )}
      </div>
    </div>
  );
}

const btnStyle = (bg: string, color = "#fff") => ({
  padding: "6px 12px", backgroundColor: bg, color, border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" as const
});