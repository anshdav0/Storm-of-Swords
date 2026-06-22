// Static UI-only mappings — these have no equivalent in the database,
// they exist purely to decide how things look on screen.

export const BUILDING_COLORS: Record<string, number> = {
  defense: 0xe74c3c, // red
  storage: 0x3498db, // blue
  producer: 0x2ecc71, // green
};

export const GRID_SIZE = 20; // 20x20 tiles, matches your backend MapSize
export const TILE_PIXELS = 32; // how many screen pixels per tile


export const BUILDING_IMAGES: Record<string, string> = {
    "Iron Mine":                "/assets/buildings/iron-mine.png",
    "Alchemist Laboratory":     "/assets/buildings/alchemist-lab.png",
    "Barracks":                 "/assets/buildings/baracks.png",
    "Armory (Upgrade Lab)":     "/assets/buildings/armoury.png",
    "Army Camp":                "/assets/buildings/army-camp.png",
    "Scorpion Bolt Launcher":   "/assets/buildings/scorpion.png",
    "Wildfire Catapult":        "/assets/buildings/wildfire-catapult.png",
    "Gold Mine":                "/assets/buildings/gold-mine.png",
    "Gold Storage":             "/assets/buildings/gold-storage.png",
    "Iron Storage":             "/assets/buildings/iron-storage.png",
    "Wildfire Storage":         "/assets/buildings/wildfire-storage.png",
    "Main Castle":              "/assets/buildings/main-castle.png",
};

// Maps troop_id to its PNG filename, same idea.
export const TROOP_IMAGES: Record<number, string> = {
    1:  "/assets/troops/unsullied-footman.png",
    2:  "/assets/troops/unsullied-veteran.png",
    3:  "/assets/troops/dothraki-screamer.png",
    5:  "/assets/troops/man-at-arms.png",
    7:  "/assets/troops/archer.png",
    8:  "/assets/troops/marksman.png",
    9:  "/assets/troops/pyromancer.png",
    10: "/assets/troops/battle-mage.png",
    11: "/assets/troops/dothraki-vanguard.png",
    13: "/assets/troops/westerosi-raider.png",
    14: "/assets/troops/cataphract.png",
    16: "/assets/troops/outrider.png",
};

export const RESOURCE_ICONS: Record<string, string> = {
    gold:     "/assets/Icons/gold.png",
    iron:     "/assets/Icons/iron.png",
    wildfire: "/assets/Icons/wildfire.png",
};

export const UI_ICONS = {
    sword:   "/assets/icons/sword.png",
    hammer:  "/assets/icons/hammer.png",
    shield:  "/assets/icons/shield.png",
    trophy:  "/assets/icons/crown.png",
};

export const FALLBACK_IMAGE = "/assets/buildings/placeholder.png";