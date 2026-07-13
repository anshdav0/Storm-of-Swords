import React, { useState, useRef, useEffect } from "react";
import type { VillageBuilding } from "../../types";
import { BuildingPanel } from "./BuildingPanel";
import { BuildingIcon } from "../shared/AssetIcon";
import "./villageGrid.css";
import "./BuildingPanel.css";

interface Props {
  buildings: VillageBuilding[];
  isEditMode: boolean;
  placingBuilding: { buildingId: number; sizeX: number; sizeY: number } | null;
  onLocalBuildingsChange: (updated: VillageBuilding[]) => void;
  onConfirmNewPlacement: (x: number, y: number) => void;
  onUpgrade: (id: number) => void;
  onInstantUpgrade: (id: number) => void;
  onCollect: (id: number) => void;
  onOpenRecruit: () => void;
  onOpenArmy: () => void;
  isUpgrading: boolean;
  isCollecting: boolean;
  isMaxUpgradesReached: boolean;
}

const GRID_SIZE = 20;
const TILE_PX = 44;

const TYPE_COLORS: Record<string, string> = {
  defense: "#e74c3c",
  storage: "#3498db",
  producer: "#2ecc71",
};

export function VillageGrid({
  buildings,
  isEditMode,
  placingBuilding,
  onLocalBuildingsChange,
  onConfirmNewPlacement,
  onUpgrade,
  onInstantUpgrade,
  onCollect,
  onOpenRecruit,
  onOpenArmy,
  isUpgrading,
  isCollecting,
  isMaxUpgradesReached,
}: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [previewCoords, setPreviewCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedBuilding, setSelectedBuilding] =
    useState<VillageBuilding | null>(null);

  const [readyToCollect, setReadyToCollect] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const initialReadyStates: Record<number, boolean> = {};
    buildings.forEach((b) => {
      const nameLower = (b.building_name || "").toLowerCase();
      const isArmyOrBarracks = 
        nameLower.includes("arm") || nameLower.includes("barrack") || b.level == 0;

      if (b.type === "producer" && !isArmyOrBarracks) {
        initialReadyStates[b.id] = true;
      }
    });
    setReadyToCollect(initialReadyStates);
  }, []);

  const getTileCoords = (e: React.MouseEvent) => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / TILE_PX);
    const y = Math.floor((e.clientY - rect.top) / TILE_PX);
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) return { x, y };
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getTileCoords(e);
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
    if (placingBuilding && previewCoords) {
      onConfirmNewPlacement(previewCoords.x, previewCoords.y);
      setPreviewCoords(null);
      return;
    }
    setSelectedBuilding(null);
  };

  const handleBuildingClick = (
    e: React.MouseEvent,
    building: VillageBuilding,
  ) => {
    if (isEditMode || placingBuilding) return;
    e.stopPropagation();
    setSelectedBuilding((prev) => (prev?.id === building.id ? null : building));
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

        const isSelected = selectedBuilding?.id === building.id;
        const isProductionReady = readyToCollect[building.id] && !isEditMode;

        return (
          <div
            key={building.id}
            onClick={(e) => handleBuildingClick(e, building)}
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
              backgroundColor: TYPE_COLORS[building.type] ?? "#888",
              border: isSelected ? "2px solid #f59e0b" : isProductionReady ? "2px solid #2ecc71" : "1px solid rgba(0,0,0,0.3)",
              boxShadow: isSelected  ? "0 0 10px rgba(245,158,11,0.6)" : isProductionReady ? "0 0 14px rgba(46, 204, 113, 0.7)" : "none",
              zIndex: isSelected ? 50 : 1,
              color: "#fff",
              fontSize: "11px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "2px",
              cursor: isEditMode ? "grab" : "pointer",
              userSelect: "none",
            }}
          >
            <BuildingIcon
              buildingName={building.building_name}
              alt={building.building_name}
              style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }}
            />

            {isProductionReady && (
              <div style={{
                position: "absolute",
                top: "-12px",
                right: "-12px",
                backgroundColor: "#2ecc71",
                color: "white",
                borderRadius: "50%",
                width: "22px",
                height: "22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                zIndex: 10
              }}>
                💰
              </div>
            )}
 
            {isSelected && !isEditMode && (
              <BuildingPanel
                building={building}
                onClose={() => setSelectedBuilding(null)}
                onUpgrade={(id) => {
                  onUpgrade(id);
                  setSelectedBuilding(null);
                }}
                onInstantUpgrade={(id) => {
                  onInstantUpgrade(id);
                  setSelectedBuilding(null);
                }}
                onCollect={(id) => {
                  setReadyToCollect((prev) => ({ ...prev, [id]: false }));
                  onCollect(id);
                  setSelectedBuilding(null);

                  const nameLower = (building.building_name || "").toLowerCase();
                  const isArmyOrBarracks = 
                    nameLower.includes("arm") || nameLower.includes("barrack") || building.level == 0;

                  if (!isArmyOrBarracks) {
                    setTimeout(() => {
                      setReadyToCollect((prev) => ({ ...prev, [id]: true }));
                    }, 5000);
                  }
                }}
                onOpenRecruit={() => {
                  onOpenRecruit();
                  setSelectedBuilding(null);
                }}
                onOpenArmy={() => {
                  onOpenArmy();
                  setSelectedBuilding(null);
                }}
                isUpgrading={isUpgrading}
                isCollecting={isCollecting}
                isMaxUpgradesReached={isMaxUpgradesReached}
              />
            )}
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