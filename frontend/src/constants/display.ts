// Static UI-only mappings — these have no equivalent in the database,
// they exist purely to decide how things look on screen.

export const BUILDING_COLORS: Record<string, number> = {
  defense: 0xe74c3c, // red
  storage: 0x3498db, // blue
  producer: 0x2ecc71, // green
};

export const RESOURCE_ICONS: Record<string, string> = {
  gold: "🪙",
  iron: "⚔️",
  wildfire: "🔥",
  none: "",
};

export const GRID_SIZE = 20; // 20x20 tiles, matches your backend MapSize
export const TILE_PIXELS = 32; // how many screen pixels per tile
