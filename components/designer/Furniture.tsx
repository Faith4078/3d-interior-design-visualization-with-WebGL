"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { CATALOG, type Part } from "@/lib/catalog";
import { useDesign, type Item } from "@/lib/store";

export const dragState: { id: string | null; dx: number; dz: number } = { id: null, dx: 0, dz: 0 };

function partColor(part: Part, main: string, accent: string) {
  if (part.c === "main") return main;
  if (part.c === "accent") return accent;
  if (part.c === "light") return `#${new THREE.Color(main).lerp(new THREE.Color("#ffffff"), 0.18).getHexString()}`;
  return part.c;
}

function PartMesh({ part, main, accent }: { part: Part; main: string; accent: string }) {
  return (
    <mesh position={part.p} castShadow receiveShadow>
      {part.k === "box" && <boxGeometry args={part.s} />}
      {part.k === "cyl" && <cylinderGeometry args={[part.s[0] / 2, part.s[0] / 2, part.s[1], 24]} />}
      {part.k === "sph" && <sphereGeometry args={[part.s[0] / 2, 24, 18]} />}
      <meshStandardMaterial color={partColor(part, main, accent)} roughness={0.75} metalness={part.c === "accent" ? 0.2 : 0} />
    </mesh>
  );
}

function SelectionBox({ size }: { size: [number, number, number] }) {
  const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(size[0] + 0.06, size[1] + 0.06, size[2] + 0.06)), [size]);
  return (
    <lineSegments geometry={geo} position={[0, size[1] / 2, 0]}>
      <lineBasicMaterial color="#4f8cff" />
    </lineSegments>
  );
}

export function Furniture({ item }: { item: Item }) {
  const def = CATALOG[item.type];
  const selected = useDesign((s) => s.selectedId === item.id);
  const select = useDesign((s) => s.select);
  const get = useThree((s) => s.get);

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    select(item.id);
    // Stop the camera orbiting while the piece is dragged (re-enabled on pointer up).
    const controls = get().controls as unknown as { enabled: boolean } | null;
    if (controls) controls.enabled = false;
    // Offset between grab point and item origin so the piece doesn't jump to the cursor.
    dragState.id = item.id;
    dragState.dx = item.x - e.point.x;
    dragState.dz = item.z - e.point.z;
  };

  return (
    <group position={[item.x, 0, item.z]} rotation={[0, item.rot, 0]} onPointerDown={onDown}>
      {def.parts.map((p, i) => (
        <PartMesh key={i} part={p} main={item.color} accent={def.accent} />
      ))}
      {def.light && <pointLight position={def.light.p} intensity={def.light.intensity} color={def.light.color} distance={7} decay={2} />}
      {selected && <SelectionBox size={def.size} />}
    </group>
  );
}
