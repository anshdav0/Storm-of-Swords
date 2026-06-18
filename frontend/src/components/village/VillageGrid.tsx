import React, { useState, useRef } from "react";
import type { VillageBuilding } from "../../types";
import "./villageGrid.css";

interface Props {
  buildings: VillageBuilding[];
  isEditMode: boolean;
  placingBuilding: { buildingId: number; sizeX: number; sizeY: number } | null;
  onLocalBuildingsChange: (updated: VillageBuilding[]) => void;
  onConfirmNewPlacement: (x: number, y: number) => void;
}

const GRID_SIZE = 20;
const TILE_PX = 32;

export function VillageGrid({
  buildings,
  isEditMode,
  placingBuilding,
  onLocalBuildingsChange,
  onConfirmNewPlacement,
}: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [previewCoords, setPreviewCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const getTileCoordinates = (e: React.MouseEvent) => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / TILE_PX);
    const y = Math.floor((e.clientY - rect.top) / TILE_PX);

    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      return { x, y };
    }
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getTileCoordinates(e);
    if (!coords) return;

    if (placingBuilding) {
      setPreviewCoords(coords);
    } else if (isEditMode && activeDragId !== null) {
      const updated = buildings.map((b) =>
        b.id === activeDragId ? { ...b, x_cor: coords.x, y_cor: coords.y } : b,
      );
      onLocalBuildingsChange(updated);
    }
  };

  const handleGridClick = () => {
    // If clicking down inside a cell block while placing a shop item
    if (placingBuilding && previewCoords) {
      onConfirmNewPlacement(previewCoords.x, previewCoords.y);
      setPreviewCoords(null);
    }
  };

  return (
    <div
      ref={gridRef}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setActiveDragId(null)}
      onClick={handleGridClick}
      style={{
        width: GRID_SIZE * TILE_PX,
        height: GRID_SIZE * TILE_PX,
        backgroundSize: `${TILE_PX}px ${TILE_PX}px`,
        position: "relative",
        backgroundColor: "#0f172a",
        backgroundImage:
          "linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)",
        cursor: placingBuilding ? "crosshair" : isEditMode ? "grab" : "default",
      }}
    >
      {buildings.map((building) => {
        if (building.x_cor === null || building.y_cor === null) return null;
        return (
          <div
            key={building.id}
            onMouseDown={(e) => {
              if (!isEditMode) return;
              e.stopPropagation();
              setActiveDragId(building.id);
            }}
            style={{
              position: "absolute",
              left: building.x_cor * TILE_PX,
              top: building.y_cor * TILE_PX,
              width: building.size_x * TILE_PX,
              height: building.size_y * TILE_PX,
              backgroundColor:
                building.type === "defense"
                  ? "#e74c3c"
                  : building.type === "storage"
                    ? "#3498db"
                    : "#2ecc71",
              border: "1px solid rgba(0,0,0,0.3)",
              color: "#fff",
              fontSize: "11px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {building.building_name}
          </div>
        );
      })}

      {placingBuilding && previewCoords && (
        <div
          style={{
            position: "absolute",
            left: previewCoords.x * TILE_PX,
            top: previewCoords.y * TILE_PX,
            width: placingBuilding.sizeX * TILE_PX,
            height: placingBuilding.sizeY * TILE_PX,
            backgroundColor: "#d97706",
            border: "2px dashed #f59e0b",
            opacity: 0.5,
            zIndex: 100,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
