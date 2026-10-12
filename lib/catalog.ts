export type Vec3 = [number, number, number];

/** A primitive that makes up a piece of furniture. Positions are relative to the item's floor-level center. */
export type Part = {
  k: "box" | "cyl" | "sph";
  /** center position (y measured from the floor) */
  p: Vec3;
  /** box: width/height/depth. cyl: diameter/height. sph: diameter. */
  s: Vec3;
  /** "main" follows the item color, "light" is a lighter shade of it, "accent" is a fixed wood/metal tone, otherwise a literal color */
  c: "main" | "light" | "accent" | string;
};

export type FurnitureType =
  | "sofa"
  | "armchair"
  | "chair"
  | "diningTable"
  | "coffeeTable"
  | "bed"
  | "bookshelf"
  | "wardrobe"
  | "desk"
  | "tvStand"
  | "rug"
  | "plant"
  | "floorLamp";

export type FurnitureDef = {
  name: string;
  category: "Seating" | "Tables" | "Bedroom" | "Storage" | "Decor";
  /** footprint width, height, depth in metres */
  size: Vec3;
  color: string;
  accent: string;
  parts: Part[];
  light?: { p: Vec3; intensity: number; color: string };
};

const WOOD = "#8b6b4a";
const DARK = "#2a2a2e";
const METAL = "#b8bcc4";

const legs = (x: number, z: number, h: number, t = 0.06, c = "accent"): Part[] =>
  [
    [-x, z],
    [x, z],
    [-x, -z],
    [x, -z],
  ].map(([lx, lz]) => ({ k: "box", p: [lx, h / 2, lz], s: [t, h, t], c }) as Part);

export const CATALOG: Record<FurnitureType, FurnitureDef> = {
  sofa: {
    name: "Sofa",
    category: "Seating",
    size: [2.0, 0.9, 0.9],
    color: "#5b7c99",
    accent: DARK,
    parts: [
      { k: "box", p: [0, 0.25, 0], s: [2.0, 0.3, 0.9], c: "main" },
      { k: "box", p: [0, 0.65, -0.35], s: [2.0, 0.5, 0.2], c: "main" },
      { k: "box", p: [-0.9, 0.45, 0.05], s: [0.2, 0.4, 0.8], c: "main" },
      { k: "box", p: [0.9, 0.45, 0.05], s: [0.2, 0.4, 0.8], c: "main" },
      { k: "box", p: [-0.4, 0.48, 0.1], s: [0.78, 0.14, 0.66], c: "light" },
      { k: "box", p: [0.4, 0.48, 0.1], s: [0.78, 0.14, 0.66], c: "light" },
      ...legs(0.9, 0.38, 0.1, 0.06, DARK),
    ],
  },
  armchair: {
    name: "Armchair",
    category: "Seating",
    size: [0.9, 0.85, 0.85],
    color: "#c9a27a",
    accent: DARK,
    parts: [
      { k: "box", p: [0, 0.25, 0], s: [0.9, 0.3, 0.85], c: "main" },
      { k: "box", p: [0, 0.62, -0.33], s: [0.9, 0.5, 0.18], c: "main" },
      { k: "box", p: [-0.4, 0.45, 0.05], s: [0.15, 0.35, 0.7], c: "main" },
      { k: "box", p: [0.4, 0.45, 0.05], s: [0.15, 0.35, 0.7], c: "main" },
      ...legs(0.38, 0.36, 0.1, 0.06, DARK),
    ],
  },
  chair: {
    name: "Dining chair",
    category: "Seating",
    size: [0.45, 0.9, 0.45],
    color: "#a07850",
    accent: WOOD,
    parts: [
      { k: "box", p: [0, 0.45, 0], s: [0.45, 0.05, 0.45], c: "main" },
      { k: "box", p: [0, 0.7, -0.21], s: [0.45, 0.4, 0.04], c: "main" },
      ...legs(0.19, 0.19, 0.43, 0.04),
    ],
  },
  diningTable: {
    name: "Dining table",
    category: "Tables",
    size: [1.6, 0.75, 0.9],
    color: "#b08a62",
    accent: WOOD,
    parts: [
      { k: "box", p: [0, 0.73, 0], s: [1.6, 0.05, 0.9], c: "main" },
      ...legs(0.72, 0.38, 0.7, 0.07),
    ],
  },
  coffeeTable: {
    name: "Coffee table",
    category: "Tables",
    size: [1.0, 0.4, 0.6],
    color: "#7a5c43",
    accent: METAL,
    parts: [
      { k: "box", p: [0, 0.38, 0], s: [1.0, 0.04, 0.6], c: "main" },
      { k: "box", p: [0, 0.12, 0], s: [0.9, 0.03, 0.5], c: "main" },
      ...legs(0.45, 0.25, 0.36, 0.04),
    ],
  },
  bed: {
    name: "Bed",
    category: "Bedroom",
    size: [1.7, 1.0, 2.15],
    color: "#e8e4dc",
    accent: WOOD,
    parts: [
      { k: "box", p: [0, 0.2, 0.02], s: [1.7, 0.3, 2.1], c: "accent" },
      { k: "box", p: [0, 0.45, 0.05], s: [1.6, 0.2, 2.0], c: "main" },
      { k: "box", p: [0, 0.55, 0.55], s: [1.62, 0.04, 0.9], c: "#6d7f9a" },
      { k: "box", p: [-0.4, 0.6, -0.75], s: [0.6, 0.12, 0.38], c: "#ffffff" },
      { k: "box", p: [0.4, 0.6, -0.75], s: [0.6, 0.12, 0.38], c: "#ffffff" },
      { k: "box", p: [0, 0.5, -1.06], s: [1.7, 1.0, 0.08], c: "accent" },
    ],
  },
  bookshelf: {
    name: "Bookshelf",
    category: "Storage",
    size: [0.9, 1.8, 0.3],
    color: "#9a7653",
    accent: "#c0392b",
    parts: [
      { k: "box", p: [-0.43, 0.9, 0], s: [0.04, 1.8, 0.3], c: "main" },
      { k: "box", p: [0.43, 0.9, 0], s: [0.04, 1.8, 0.3], c: "main" },
      { k: "box", p: [0, 0.9, -0.14], s: [0.9, 1.8, 0.02], c: "main" },
      ...[0.02, 0.45, 0.9, 1.35, 1.78].map(
        (y) => ({ k: "box", p: [0, y, 0], s: [0.9, 0.04, 0.3], c: "main" }) as Part,
      ),
      { k: "box", p: [-0.25, 0.6, 0], s: [0.3, 0.26, 0.2], c: "#c0392b" },
      { k: "box", p: [0.15, 0.6, 0], s: [0.25, 0.22, 0.2], c: "#2e86c1" },
      { k: "box", p: [0.0, 1.06, 0], s: [0.5, 0.26, 0.2], c: "#27ae60" },
      { k: "box", p: [0.2, 1.51, 0], s: [0.3, 0.24, 0.2], c: "#f1c40f" },
    ],
  },
  wardrobe: {
    name: "Wardrobe",
    category: "Storage",
    size: [1.2, 2.0, 0.6],
    color: "#d8d2c6",
    accent: METAL,
    parts: [
      { k: "box", p: [0, 1.0, 0], s: [1.2, 2.0, 0.6], c: "main" },
      { k: "box", p: [0, 1.0, 0.301], s: [0.01, 1.9, 0.01], c: DARK },
      { k: "box", p: [-0.08, 1.0, 0.31], s: [0.02, 0.3, 0.02], c: "accent" },
      { k: "box", p: [0.08, 1.0, 0.31], s: [0.02, 0.3, 0.02], c: "accent" },
    ],
  },
  desk: {
    name: "Desk",
    category: "Tables",
    size: [1.4, 1.1, 0.7],
    color: "#e0d6c4",
    accent: DARK,
    parts: [
      { k: "box", p: [0, 0.74, 0], s: [1.4, 0.04, 0.7], c: "main" },
      ...legs(0.65, 0.3, 0.72, 0.05),
      { k: "box", p: [0, 0.95, -0.15], s: [0.55, 0.32, 0.02], c: DARK },
      { k: "box", p: [0, 0.8, -0.15], s: [0.06, 0.08, 0.06], c: DARK },
    ],
  },
  tvStand: {
    name: "TV stand",
    category: "Storage",
    size: [1.5, 1.0, 0.4],
    color: "#4a4038",
    accent: DARK,
    parts: [
      { k: "box", p: [0, 0.22, 0], s: [1.5, 0.44, 0.4], c: "main" },
      { k: "box", p: [0, 0.75, 0], s: [1.1, 0.62, 0.04], c: "#111114" },
      { k: "box", p: [0, 0.5, 0], s: [0.25, 0.06, 0.12], c: DARK },
    ],
  },
  rug: {
    name: "Rug",
    category: "Decor",
    size: [2.2, 0.02, 1.5],
    color: "#b5524a",
    accent: DARK,
    parts: [
      { k: "box", p: [0, 0.01, 0], s: [2.2, 0.02, 1.5], c: "main" },
      { k: "box", p: [0, 0.022, 0], s: [1.9, 0.01, 1.2], c: "light" },
    ],
  },
  plant: {
    name: "Plant",
    category: "Decor",
    size: [0.5, 1.2, 0.5],
    color: "#3f8f52",
    accent: "#b0623f",
    parts: [
      { k: "cyl", p: [0, 0.2, 0], s: [0.38, 0.4, 0.38], c: "accent" },
      { k: "sph", p: [0, 0.65, 0], s: [0.5, 0.5, 0.5], c: "main" },
      { k: "sph", p: [0.12, 0.95, 0.05], s: [0.4, 0.4, 0.4], c: "main" },
      { k: "sph", p: [-0.1, 1.05, -0.05], s: [0.3, 0.3, 0.3], c: "main" },
    ],
  },
  floorLamp: {
    name: "Floor lamp",
    category: "Decor",
    size: [0.4, 1.6, 0.4],
    color: "#f5e6b8",
    accent: METAL,
    parts: [
      { k: "cyl", p: [0, 0.015, 0], s: [0.3, 0.03, 0.3], c: "accent" },
      { k: "cyl", p: [0, 0.75, 0], s: [0.03, 1.5, 0.03], c: "accent" },
      { k: "cyl", p: [0, 1.45, 0], s: [0.38, 0.28, 0.38], c: "main" },
    ],
    light: { p: [0, 1.4, 0], intensity: 6, color: "#ffd9a0" },
  },
};

export const FURNITURE_TYPES = Object.keys(CATALOG) as FurnitureType[];

export const FLOOR_TYPES = ["wood", "tile", "concrete", "carpet"] as const;
export type FloorType = (typeof FLOOR_TYPES)[number];

export const WALL_PRESETS = ["#f2ede4", "#d9e2ea", "#e6d5c3", "#c9d6c3", "#e7c9c9", "#3d4a5c"];
export const FLOOR_PRESETS: Record<FloorType, string[]> = {
  wood: ["#b98b5e", "#8a5a3b", "#d8b98c", "#5c4033"],
  tile: ["#d9d9d9", "#b7c0c7", "#ece3d3", "#555b61"],
  concrete: ["#9a9a9a", "#7d7f82", "#b8b4ad"],
  carpet: ["#8c8f93", "#6d7a8a", "#a89c8a", "#4a4f57"],
};
export const ITEM_PRESETS = [
  "#5b7c99",
  "#c9a27a",
  "#b08a62",
  "#e8e4dc",
  "#3f8f52",
  "#b5524a",
  "#2f3640",
  "#d6a5a5",
];
