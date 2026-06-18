import type { VillageBuilding, ProducerBuilding } from "../../types";
import { useGameDataStore } from "../../gamedata/gameDataStore";
import "./BuildingPanel"

interface Props {
  building: VillageBuilding;
  onClose: () => void;
  onUpgrade: (id: number) => void;
  onCollect: (id: number) => void;
  onOpenRecruit: () => void;
  onOpenArmy: () => void;
  isUpgrading: boolean;
  isCollecting: boolean;
}

const BUILDING_IDS = {
  BARRACKS: 3,
  ARMOURY: 4,
  ARMY_CAMP: 5,
};

export function BuildingPanel({
  building,
  onClose,
  onUpgrade,
  onCollect,
  onOpenRecruit,
  onOpenArmy,
  isUpgrading,
  isCollecting,
}: Props) {
  const getBuilding = useGameDataStore((state) => state.getBuilding);
  const staticData = getBuilding(building.building_id);
  const currentLevelData = staticData?.levels.find(
    (l) => l.level === building.level,
  );
  const nextLevelData = staticData?.levels.find(
    (l) => l.level === building.level + 1,
  );

  const isMaxLevel = building.level >= 3;

  // producer buildings that actually produce a resource
  // (Barracks and Armoury have resource_type 'none' so they don't show collect)
  const isProducer = building.type === "producer";
  const producerBuilding = building as ProducerBuilding;
  const canCollect = isProducer && producerBuilding.resource_type !== "none";

  const isBarracksOrArmoury =
    building.building_id === BUILDING_IDS.BARRACKS ||
    building.building_id === BUILDING_IDS.ARMOURY;

  const isArmyCamp = building.building_id === BUILDING_IDS.ARMY_CAMP;

  return (
    <div className="building-panel">
      <div className="panel-header">
        <span className="panel-title">{building.building_name}</span>
        <button className="panel-close" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="panel-level">
        Level {building.level} / 3 &nbsp;·&nbsp; HP {building.current_hp}
      </div>

      {/* DETAIL SECTION — always shown */}
      {currentLevelData && (
        <div className="panel-details">
          {currentLevelData.damage_per_sec != null &&
            currentLevelData.damage_per_sec > 0 && (
              <div className="panel-stat">
                <span>⚔️ DPS</span>
                <span>{currentLevelData.damage_per_sec}</span>
              </div>
            )}
          {currentLevelData.range != null && currentLevelData.range > 0 && (
            <div className="panel-stat">
              <span>🎯 Range</span>
              <span>{currentLevelData.range}</span>
            </div>
          )}
          {currentLevelData.capacity != null &&
            currentLevelData.capacity > 0 && (
              <div className="panel-stat">
                <span>📦 Capacity</span>
                <span>{currentLevelData.capacity}</span>
              </div>
            )}
          {currentLevelData.production_rate != null &&
            currentLevelData.production_rate > 0 && (
              <div className="panel-stat">
                <span>⏱ Rate</span>
                <span>{currentLevelData.production_rate}/s</span>
              </div>
            )}
          {currentLevelData.production_cap != null &&
            currentLevelData.production_cap > 0 && (
              <div className="panel-stat">
                <span>🪣 Cap</span>
                <span>{currentLevelData.production_cap}</span>
              </div>
            )}
        </div>
      )}

      <div className="panel-actions">
        {/* COLLECT — only for resource-producing buildings */}
        {canCollect && (
          <button
            className="panel-btn collect"
            onClick={() => onCollect(building.id)}
            disabled={isCollecting}
          >
            {isCollecting ? "Collecting..." : "🪙 Collect Resources"}
          </button>
        )}

        {/* TRAIN TROOPS — Barracks and Armoury */}
        {isBarracksOrArmoury && (
          <button className="panel-btn recruit" onClick={onOpenRecruit}>
            ⚔️ Train Troops
          </button>
        )}

        {/* VIEW ARMY — Army Camp */}
        {isArmyCamp && (
          <button className="panel-btn army" onClick={onOpenArmy}>
            🛡️ View Army
          </button>
        )}

        {/* UPGRADE */}
        {!isMaxLevel && nextLevelData ? (
          <button
            className="panel-btn upgrade"
            onClick={() => onUpgrade(building.id)}
            disabled={isUpgrading}
          >
            {isUpgrading
              ? "Upgrading..."
              : `⬆️ Upgrade → Lv${building.level + 1}  (🪙/⚔️ ${nextLevelData.upgrade_cost})`}
          </button>
        ) : (
          <div className="panel-maxlevel">✅ Max Level</div>
        )}
      </div>
    </div>
  );
}
