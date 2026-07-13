import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import type { VillageBuilding, ProducerBuilding } from "../../types";
import { getVillage } from "../../api";
import { useGameDataStore } from "../../gamedata/gameDataStore";
import "./BuildingPanel.css";

interface Props {
  building: VillageBuilding;
  onClose: () => void;
  onUpgrade: (id: number) => void;
  onInstantUpgrade: (id: number) => void;
  onCollect: (id: number) => void;
  onOpenRecruit: () => void;
  onOpenArmy: () => void;
  isUpgrading: boolean;
  isCollecting: boolean;
  isMaxUpgradesReached: boolean;
}

const BUILDING_IDS = {
  BARRACKS: 3,
  ARMOURY: 4,
  ARMY_CAMP: 5,
};

//if you missed the joke in backend here it is in the frontend
const SENTINEL_CUTOFF = new Date("2002-01-01T00:00:00Z").getTime();

function isActiveUpgrade(upgradeStarted: string | null): boolean {
    if (!upgradeStarted) return false;
    return new Date(upgradeStarted).getTime() > SENTINEL_CUTOFF;
}

function parseUpgradeTime(upgradeTime: string): number {
    const match = upgradeTime.trim().match(/^(\d+):(\d+):(\d+)/);
    if (!match) return 0;

    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const seconds = parseInt(match[3]);

    return (hours * 3600 + minutes * 60 + seconds) * 1000;
}

export function BuildingPanel({
  building,
  onClose,
  onUpgrade,
  onInstantUpgrade,
  onCollect,
  onOpenRecruit,
  onOpenArmy,
  isUpgrading,
  isCollecting,
  isMaxUpgradesReached
}: Props) {
  const queryClient = useQueryClient();
  const getBuilding = useGameDataStore((state) => state.getBuilding);
  const staticData = getBuilding(building.building_id);
  const currentLevelData = staticData?.levels.find(
    (l) => l.level === building.level,
  );
  const nextLevelData = staticData?.levels.find(
    (l) => l.level === building.level + 1,
  );
  const { data: villageData } = useQuery({
    queryKey: ["village"],
    queryFn: () => getVillage().then((res) => res.data),
  });
  const gold = villageData?.village.gold ?? 0;
  const iron = villageData?.village.iron ?? 0;

  const canAffordUpgrade = (): boolean => {
    if (!nextLevelData) return false;
    if (building.type === "defense") return gold >= nextLevelData.upgrade_cost && iron >= nextLevelData.upgrade_cost;
    return iron >= nextLevelData.upgrade_cost;
  };

const affordable = canAffordUpgrade();
  const isMaxLevel = building.level >= 3;
  const isProducer = building.type === "producer";
  const producerBuilding = building as ProducerBuilding;
  const canCollect = isProducer && producerBuilding.resource_type !== "none";
  const isBarracksOrArmoury =
    building.building_id === BUILDING_IDS.BARRACKS ||
    building.building_id === BUILDING_IDS.ARMOURY;

  const isArmyCamp = building.building_id === BUILDING_IDS.ARMY_CAMP;

  const activelyUpgrading = isActiveUpgrade(building.upgrade_started);

  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
      if (!activelyUpgrading || !nextLevelData || !building.upgrade_started) {
        return;
    }

      const upgradeMs = parseUpgradeTime(nextLevelData.upgrade_time);
      const startedAt = new Date(building.upgrade_started).getTime();
      const finishesAt = startedAt + upgradeMs;

      const tick = () => {
          const remaining = finishesAt - Date.now();

          if (remaining <= 0) {
              setTimeLeft("Done");
              setTimeout(() => {
                  queryClient.invalidateQueries({ queryKey: ["village"] });
              }, 1000);
              return;
          }

          const totalSecs = Math.ceil(remaining / 1000);
          const mins = Math.floor(totalSecs / 60);
          const secs = totalSecs % 60;
          setTimeLeft(mins > 0 ? `${mins}m ${secs}s` : `${secs}s`);
      };

      tick();
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
  }, [activelyUpgrading, building.upgrade_started, nextLevelData, queryClient]);

  return (
    <div className="building-panel">
      <div className="panel-header">
        <span className="panel-title">{building.building_name}</span>
        <button className="panel-close" onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}>
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
        {/*only for resource-producing buildings */}
        {canCollect && !activelyUpgrading && (
          <button
            className="panel-btn collect"
            onClick={() => onCollect(building.id)}
            disabled={isCollecting}
          >
            {isCollecting ? "Collecting..." : "🪙 Collect Resources"}
          </button>
        )}

        {/*Barracks and Armoury */}
        {isBarracksOrArmoury && !activelyUpgrading && (
          <button className="panel-btn recruit" onClick={onOpenRecruit}>
            ⚔️ Train Troops
          </button>
        )}

        {/*Army Camp */}
        {isArmyCamp && !activelyUpgrading && (
          <button className="panel-btn army" onClick={onOpenArmy}>
            🛡️ View Army
          </button>
        )}

        {/* UPGRADE / COUNTDOWN / MAX LEVEL */}
        {activelyUpgrading ? (
          <div className="panel-upgrading">
            <span>🔨 Upgrading → Lv{building.level + 1}</span>
            <span className="panel-countdown">{timeLeft}</span>
          </div>
        ) : !isMaxLevel && nextLevelData ? (
          <>
            <div
              className="panel-upgrade-cost"
              style={{ color: affordable ? "#94a3b8" : "#ef4444" }}
            >
              {building.type === "defense" ? `🪙 ${nextLevelData.upgrade_cost} ⚔️ ${nextLevelData.upgrade_cost}`: `⚔️ ${nextLevelData.upgrade_cost}`} {!affordable && ""}
            </div>

            <button
              className="panel-btn upgrade"
              onClick={() => onUpgrade(building.id)}
              disabled={isUpgrading || !affordable || isMaxUpgradesReached}
              style={
                !affordable ? { backgroundColor: "#374151", color: "#6b7280", cursor: "not-allowed" } : {}
              }
            >
              {isUpgrading ? "Starting..." : `⬆️ Upgrade → Lv${building.level + 1}`}
            </button>

            <button
              className="panel-btn upgrade"
              onClick={() => onInstantUpgrade(building.id)}
              disabled={isUpgrading}
              style={{
                backgroundColor: isUpgrading ? "#374151" : "#d97706", // Amber color when clickable
                color: isUpgrading ? "#6b7280" : "#ffffff", 
                cursor: isUpgrading ? "not-allowed" : "pointer" 
              }}
            >
              {isUpgrading ? "Starting..." : `⬆️ InstantUpgrade → Lv${building.level + 1}`}
            </button>
          </>
    ) : (
        <div className="panel-maxlevel">✅ Max Level</div>
        )}
      </div>
    </div>
  );
}