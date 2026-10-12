"use client";

import { useState } from "react";
import {
  CATALOG,
  FLOOR_PRESETS,
  FLOOR_TYPES,
  FURNITURE_TYPES,
  ITEM_PRESETS,
  WALL_PRESETS,
  type FurnitureDef,
} from "@/lib/catalog";
import { TEMPLATES, useDesign } from "@/lib/store";
import Scene from "./Scene";
import { capturePng } from "./capture";

const card = "rounded-lg border border-white/10 bg-white/[.04] p-3";
const label = "mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-400";
const btn =
  "rounded-md border border-white/10 bg-white/[.06] px-2.5 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-white/[.12] disabled:opacity-40";

function Swatches({ colors, value, onChange }: { colors: string[]; value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {colors.map((c) => (
        <button
          key={c}
          aria-label={`Color ${c}`}
          onClick={() => onChange(c)}
          className={`h-6 w-6 rounded-full border-2 ${value.toLowerCase() === c ? "border-sky-400" : "border-white/20"}`}
          style={{ background: c }}
        />
      ))}
      <input
        type="color"
        aria-label="Custom color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-8 cursor-pointer rounded border border-white/20 bg-transparent p-0"
      />
    </div>
  );
}

function Slider({
  name,
  value,
  min,
  max,
  step,
  unit = "m",
  onChange,
}: {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-xs text-zinc-300">
        <span>{name}</span>
        <span className="tabular-nums text-zinc-400">
          {value.toFixed(step < 1 ? 1 : 0)}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-sky-400"
      />
    </label>
  );
}

function RoomPanel() {
  const room = useDesign((s) => s.room);
  const setRoom = useDesign((s) => s.setRoom);
  const loadTemplate = useDesign((s) => s.loadTemplate);

  return (
    <div className="space-y-3">
      <div className={card}>
        <span className={label}>Templates</span>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(TEMPLATES) as (keyof typeof TEMPLATES)[]).map((t) => (
            <button key={t} className={btn} onClick={() => loadTemplate(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className={`${card} space-y-2`}>
        <span className={label}>Dimensions</span>
        <Slider name="Width" value={room.width} min={2.5} max={12} step={0.1} onChange={(v) => setRoom({ width: v })} />
        <Slider name="Depth" value={room.depth} min={2.5} max={12} step={0.1} onChange={(v) => setRoom({ depth: v })} />
        <Slider name="Height" value={room.height} min={2.2} max={4} step={0.1} onChange={(v) => setRoom({ height: v })} />
        <p className="pt-1 text-xs text-zinc-400">
          Floor area: {(room.width * room.depth).toFixed(1)} m²
        </p>
      </div>
      <div className={card}>
        <span className={label}>Walls</span>
        <Swatches colors={WALL_PRESETS} value={room.wallColor} onChange={(c) => setRoom({ wallColor: c })} />
      </div>
      <div className={card}>
        <span className={label}>Floor</span>
        <div className="mb-2 grid grid-cols-4 gap-1">
          {FLOOR_TYPES.map((f) => (
            <button
              key={f}
              onClick={() => setRoom({ floorType: f, floorColor: FLOOR_PRESETS[f][0] })}
              className={`${btn} capitalize ${room.floorType === f ? "!border-sky-400 !bg-sky-400/20" : ""}`}
            >
              {f}
            </button>
          ))}
        </div>
        <Swatches
          colors={FLOOR_PRESETS[room.floorType]}
          value={room.floorColor}
          onChange={(c) => setRoom({ floorColor: c })}
        />
      </div>
    </div>
  );
}

function FurniturePanel() {
  const addItem = useDesign((s) => s.addItem);
  const groups = new Map<FurnitureDef["category"], (typeof FURNITURE_TYPES)[number][]>();
  for (const t of FURNITURE_TYPES) {
    const cat = CATALOG[t].category;
    groups.set(cat, [...(groups.get(cat) ?? []), t]);
  }
  return (
    <div className="space-y-3">
      {[...groups].map(([cat, types]) => (
        <div key={cat} className={card}>
          <span className={label}>{cat}</span>
          <div className="grid grid-cols-2 gap-1.5">
            {types.map((t) => (
              <button key={t} className={`${btn} flex items-center gap-2 text-left`} onClick={() => addItem(t)}>
                <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: CATALOG[t].color }} />
                <span className="truncate">{CATALOG[t].name}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="text-xs text-zinc-500">Click to add to the room, then drag it into place.</p>
    </div>
  );
}

function SelectedPanel() {
  const items = useDesign((s) => s.items);
  const selectedId = useDesign((s) => s.selectedId);
  const updateItem = useDesign((s) => s.updateItem);
  const removeItem = useDesign((s) => s.removeItem);
  const duplicateItem = useDesign((s) => s.duplicateItem);
  const select = useDesign((s) => s.select);
  const item = items.find((i) => i.id === selectedId);

  if (!item) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-zinc-400">Select a piece in the room, or from the list below.</p>
        <ul className="space-y-1">
          {items.map((it) => (
            <li key={it.id}>
              <button className={`${btn} w-full text-left`} onClick={() => select(it.id)}>
                {CATALOG[it.type].name}
              </button>
            </li>
          ))}
          {items.length === 0 && <li className="text-xs text-zinc-500">The room is empty.</li>}
        </ul>
      </div>
    );
  }

  const def = CATALOG[item.type];
  const deg = Math.round((((item.rot * 180) / Math.PI) % 360 + 360) % 360);
  return (
    <div className="space-y-3">
      <div className={card}>
        <div className="mb-1 text-sm font-semibold text-zinc-100">{def.name}</div>
        <div className="text-xs text-zinc-400">
          {def.size[0]} × {def.size[2]} m footprint, {def.size[1]} m high
        </div>
      </div>
      <div className={card}>
        <span className={label}>Color</span>
        <Swatches colors={ITEM_PRESETS} value={item.color} onChange={(c) => updateItem(item.id, { color: c })} />
      </div>
      <div className={`${card} space-y-2`}>
        <Slider
          name="Rotation"
          unit="°"
          value={deg}
          min={0}
          max={345}
          step={15}
          onChange={(v) => updateItem(item.id, { rot: (v * Math.PI) / 180 })}
        />
        <div className="flex gap-1.5">
          <button className={btn} onClick={() => updateItem(item.id, { rot: item.rot - Math.PI / 2 })}>
            ⟲ 90°
          </button>
          <button className={btn} onClick={() => updateItem(item.id, { rot: item.rot + Math.PI / 2 })}>
            ⟳ 90°
          </button>
        </div>
      </div>
      <div className="flex gap-1.5">
        <button className={btn} onClick={() => duplicateItem(item.id)}>
          Duplicate
        </button>
        <button className={`${btn} !text-red-300`} onClick={() => removeItem(item.id)}>
          Delete
        </button>
        <button className={btn} onClick={() => select(null)}>
          Deselect
        </button>
      </div>
      <p className="text-xs text-zinc-500">Keys: R rotate, D duplicate, Del remove, Esc deselect.</p>
    </div>
  );
}

const TABS = ["Room", "Furniture", "Selected"] as const;
type Tab = (typeof TABS)[number];

export default function Studio() {
  const [tab, setTab] = useState<Tab>("Furniture");
  const view = useDesign((s) => s.view);
  const setView = useDesign((s) => s.setView);
  const snap = useDesign((s) => s.snap);
  const setSnap = useDesign((s) => s.setSnap);
  const clear = useDesign((s) => s.clear);
  const selectedId = useDesign((s) => s.selectedId);
  const count = useDesign((s) => s.items.length);

  // Selecting a piece in the 3D view jumps to its panel.
  const [lastSelected, setLastSelected] = useState<string | null>(null);
  if (selectedId !== lastSelected) {
    setLastSelected(selectedId);
    if (selectedId) setTab("Selected");
  }

  const exportPng = () => {
    const url = capturePng();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = "room-design.png";
    a.click();
  };

  return (
    <div className="flex h-dvh w-full flex-col bg-zinc-950 text-zinc-100 md:flex-row">
      <aside className="flex max-h-[45dvh] w-full shrink-0 flex-col border-b border-white/10 md:max-h-none md:w-80 md:border-b-0 md:border-r">
        <div className="px-4 pb-2 pt-4">
          <h1 className="text-base font-semibold tracking-tight">Room Studio</h1>
          <p className="text-xs text-zinc-400">3D interior design · {count} pieces</p>
        </div>
        <div role="tablist" className="mx-4 mb-3 grid grid-cols-3 rounded-md bg-white/[.05] p-0.5">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded py-1.5 text-xs font-medium ${tab === t ? "bg-sky-500 text-white" : "text-zinc-300 hover:text-white"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {tab === "Room" && <RoomPanel />}
          {tab === "Furniture" && <FurniturePanel />}
          {tab === "Selected" && <SelectedPanel />}
        </div>
      </aside>

      <main className="relative min-h-0 flex-1">
        <Scene />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-center gap-2 p-3">
          <div className="pointer-events-auto flex rounded-md bg-zinc-900/80 p-0.5 backdrop-blur">
            {(["perspective", "top"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded px-3 py-1.5 text-xs font-medium capitalize ${view === v ? "bg-sky-500 text-white" : "text-zinc-300 hover:text-white"}`}
              >
                {v === "top" ? "Top view" : "3D view"}
              </button>
            ))}
          </div>
          <label className="pointer-events-auto flex items-center gap-1.5 rounded-md bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-300 backdrop-blur">
            Snap
            <select
              value={snap}
              onChange={(e) => setSnap(Number(e.target.value))}
              className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-100"
            >
              <option value={0}>Off</option>
              <option value={0.05}>5 cm</option>
              <option value={0.1}>10 cm</option>
              <option value={0.25}>25 cm</option>
              <option value={0.5}>50 cm</option>
            </select>
          </label>
          <div className="pointer-events-auto ml-auto flex gap-2">
            <button className={`${btn} bg-zinc-900/80 backdrop-blur`} onClick={clear}>
              Clear room
            </button>
            <button className={`${btn} !bg-sky-500 hover:!bg-sky-400`} onClick={exportPng}>
              Export PNG
            </button>
          </div>
        </div>
        <p className="pointer-events-none absolute bottom-3 left-3 rounded bg-zinc-900/70 px-2 py-1 text-[11px] text-zinc-400 backdrop-blur">
          Drag furniture to move · drag background to orbit · right-drag to pan · scroll to zoom
        </p>
      </main>
    </div>
  );
}
