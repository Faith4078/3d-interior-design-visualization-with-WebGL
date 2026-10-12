import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CATALOG, type FloorType, type FurnitureType } from "./catalog";

export type Room = {
  width: number;
  depth: number;
  height: number;
  wallColor: string;
  floorType: FloorType;
  floorColor: string;
};

export type Item = {
  id: string;
  type: FurnitureType;
  x: number;
  z: number;
  /** rotation around the vertical axis, radians */
  rot: number;
  color: string;
};

export type ViewMode = "perspective" | "top";

type State = {
  room: Room;
  items: Item[];
  selectedId: string | null;
  view: ViewMode;
  snap: number;
  setRoom: (patch: Partial<Room>) => void;
  addItem: (type: FurnitureType) => void;
  updateItem: (id: string, patch: Partial<Omit<Item, "id" | "type">>) => void;
  moveItem: (id: string, x: number, z: number) => void;
  removeItem: (id: string) => void;
  duplicateItem: (id: string) => void;
  select: (id: string | null) => void;
  setView: (v: ViewMode) => void;
  setSnap: (s: number) => void;
  loadTemplate: (name: keyof typeof TEMPLATES) => void;
  clear: () => void;
};

const uid = () => Math.random().toString(36).slice(2, 10);

/** Half extents of an item's rotated footprint. */
export function footprint(type: FurnitureType, rot: number) {
  const [w, , d] = CATALOG[type].size;
  const c = Math.abs(Math.cos(rot));
  const s = Math.abs(Math.sin(rot));
  return { hx: (c * w + s * d) / 2, hz: (s * w + c * d) / 2 };
}

export function clampToRoom(room: Room, type: FurnitureType, rot: number, x: number, z: number) {
  const { hx, hz } = footprint(type, rot);
  const mx = Math.max(0, room.width / 2 - hx);
  const mz = Math.max(0, room.depth / 2 - hz);
  return {
    x: Math.min(mx, Math.max(-mx, x)),
    z: Math.min(mz, Math.max(-mz, z)),
  };
}

export function snapTo(v: number, step: number) {
  return step > 0 ? Math.round(v / step) * step : v;
}

const mk = (type: FurnitureType, x: number, z: number, rot = 0, color?: string): Item => ({
  id: uid(),
  type,
  x,
  z,
  rot,
  color: color ?? CATALOG[type].color,
});

const LIVING_ROOM: Room = {
  width: 6,
  depth: 5,
  height: 2.7,
  wallColor: "#f2ede4",
  floorType: "wood",
  floorColor: "#b98b5e",
};

const BEDROOM: Room = {
  width: 4.5,
  depth: 4,
  height: 2.6,
  wallColor: "#d9e2ea",
  floorType: "carpet",
  floorColor: "#a89c8a",
};

export const TEMPLATES = {
  "Living room": {
    room: LIVING_ROOM,
    items: () => [
      mk("rug", 0, 0.3),
      mk("sofa", 0, 1.8, Math.PI),
      mk("coffeeTable", 0, 0.4),
      mk("armchair", -1.9, 0.3, Math.PI / 2),
      mk("tvStand", 0, -2.2),
      mk("bookshelf", 2.5, -2.3),
      mk("plant", -2.5, -2.1),
      mk("floorLamp", 2.6, 1.9),
      mk("diningTable", 1.6, 1.1, 0),
    ],
  },
  Bedroom: {
    room: BEDROOM,
    items: () => [
      mk("rug", 0, 0.6, 0, "#6d7f9a"),
      mk("bed", 0, -0.85),
      mk("wardrobe", -1.5, 1.7, Math.PI),
      mk("desk", 1.45, 1.45, Math.PI),
      mk("chair", 1.45, 0.75, 0),
      mk("plant", 1.9, -1.6),
      mk("floorLamp", -1.2, -1.7),
    ],
  },
  Studio: {
    room: { ...LIVING_ROOM, width: 5, depth: 4, wallColor: "#e6d5c3", floorType: "concrete" as const, floorColor: "#9a9a9a" },
    items: () => [
      mk("bed", -1.4, -1.0, 0, "#c9d6c3"),
      mk("desk", 1.5, -1.6, 0),
      mk("chair", 1.5, -0.95, Math.PI),
      mk("sofa", 1.2, 1.5, Math.PI),
      mk("plant", -2.1, 1.5),
    ],
  },
};

export const useDesign = create<State>()(
  persist(
    (set, get) => ({
      room: LIVING_ROOM,
      items: TEMPLATES["Living room"].items(),
      selectedId: null,
      view: "perspective",
      snap: 0.1,

      setRoom: (patch) =>
        set((s) => {
          const room = { ...s.room, ...patch };
          const items = s.items.map((it) => ({ ...it, ...clampToRoom(room, it.type, it.rot, it.x, it.z) }));
          return { room, items };
        }),

      addItem: (type) =>
        set((s) => {
          const item = mk(type, 0, 0);
          return { items: [...s.items, item], selectedId: item.id };
        }),

      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((it) => {
            if (it.id !== id) return it;
            const next = { ...it, ...patch };
            return { ...next, ...clampToRoom(s.room, next.type, next.rot, next.x, next.z) };
          }),
        })),

      moveItem: (id, x, z) => {
        const { room, snap, items } = get();
        const it = items.find((i) => i.id === id);
        if (!it) return;
        const c = clampToRoom(room, it.type, it.rot, snapTo(x, snap), snapTo(z, snap));
        if (c.x === it.x && c.z === it.z) return;
        set({ items: items.map((i) => (i.id === id ? { ...i, ...c } : i)) });
      },

      removeItem: (id) =>
        set((s) => ({
          items: s.items.filter((i) => i.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        })),

      duplicateItem: (id) =>
        set((s) => {
          const src = s.items.find((i) => i.id === id);
          if (!src) return s;
          const copy = { ...src, id: uid(), ...clampToRoom(s.room, src.type, src.rot, src.x + 0.4, src.z + 0.4) };
          return { items: [...s.items, copy], selectedId: copy.id };
        }),

      select: (id) => set({ selectedId: id }),
      setView: (view) => set({ view }),
      setSnap: (snap) => set({ snap }),

      loadTemplate: (name) => {
        const t = TEMPLATES[name];
        set({ room: t.room, items: t.items(), selectedId: null });
      },

      clear: () => set({ items: [], selectedId: null }),
    }),
    {
      name: "room-designer-v1",
      partialize: (s) => ({ room: s.room, items: s.items, snap: s.snap }),
    },
  ),
);
