// frontend/src/components/shared/AssetIcon.tsx

import { BUILDING_IMAGES, TROOP_IMAGES, FALLBACK_IMAGE } from "../../constants/display";

interface BuildingIconProps {
    buildingName: string;
    alt: string;
    style?: React.CSSProperties;
    className?: string;
}

// Looks up the right PNG by the building's NAME (not its numeric id),
// because not every place in the app that needs to draw a building
// has access to the numeric building_id — but building_name is
// always present everywhere.
export function BuildingIcon({ buildingName, alt, style, className }: BuildingIconProps) {
    const src = BUILDING_IMAGES[buildingName] ?? FALLBACK_IMAGE;
    return <img src={src} alt={alt} style={style} className={className} draggable={false} />;
}

interface TroopIconProps {
    troopId: number;
    alt: string;
    style?: React.CSSProperties;
    className?: string;
}

export function TroopIcon({ troopId, alt, style, className }: TroopIconProps) {
    const src = TROOP_IMAGES[troopId] ?? FALLBACK_IMAGE;
    return <img src={src} alt={alt} style={style} className={className} draggable={false} />;
}