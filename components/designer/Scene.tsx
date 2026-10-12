"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three/examples/jsm/controls/OrbitControls.js";
import { useDesign, type Room as RoomState } from "@/lib/store";
import { Furniture, dragState } from "./Furniture";
import { makeFloorTexture } from "./textures";
import { registerCapture } from "./capture";

function Floor({ room }: { room: RoomState }) {
  const select = useDesign((s) => s.select);
  const maxAniso = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const tex = useMemo(
    () => makeFloorTexture(room.floorType, room.floorColor, room.width, room.depth, maxAniso),
    [room.floorType, room.floorColor, room.width, room.depth, maxAniso],
  );
  useEffect(() => () => tex.dispose(), [tex]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onPointerDown={() => select(null)}>
      <planeGeometry args={[room.width, room.depth]} />
      <meshStandardMaterial map={tex} roughness={room.floorType === "tile" ? 0.35 : 0.85} />
    </mesh>
  );
}

/**
 * Walls are single-sided planes facing into the room, so a wall is automatically
 * invisible when the camera orbits to its outside - a built-in "cutaway" view.
 */
function Walls({ room }: { room: RoomState }) {
  const { width: w, depth: d, height: h, wallColor } = room;
  const walls: { pos: [number, number, number]; rotY: number; len: number }[] = [
    { pos: [0, h / 2, -d / 2], rotY: 0, len: w },
    { pos: [0, h / 2, d / 2], rotY: Math.PI, len: w },
    { pos: [-w / 2, h / 2, 0], rotY: Math.PI / 2, len: d },
    { pos: [w / 2, h / 2, 0], rotY: -Math.PI / 2, len: d },
  ];
  return (
    <group>
      {walls.map((wall, i) => (
        <group key={i} position={wall.pos} rotation={[0, wall.rotY, 0]}>
          <mesh receiveShadow>
            <planeGeometry args={[wall.len, h]} />
            <meshStandardMaterial color={wallColor} roughness={0.95} />
          </mesh>
          {/* baseboard */}
          <mesh position={[0, -h / 2 + 0.05, 0.012]} receiveShadow>
            <boxGeometry args={[wall.len, 0.1, 0.024]} />
            <meshStandardMaterial color="#fafafa" roughness={0.6} />
          </mesh>
        </group>
      ))}
      <WindowFrame room={room} />
    </group>
  );
}

function WindowFrame({ room }: { room: RoomState }) {
  const ww = Math.min(1.8, room.width * 0.4);
  const wh = Math.min(1.3, room.height * 0.5);
  const y = room.height * 0.55;
  const z = -room.depth / 2 + 0.01;
  return (
    <group position={[room.width * 0.25, y, z]}>
      <mesh>
        <planeGeometry args={[ww, wh]} />
        <meshBasicMaterial color="#bfe3ff" />
      </mesh>
      {[
        { p: [0, wh / 2, 0.02] as const, s: [ww + 0.1, 0.06, 0.05] as const },
        { p: [0, -wh / 2, 0.02] as const, s: [ww + 0.1, 0.06, 0.05] as const },
        { p: [-ww / 2, 0, 0.02] as const, s: [0.06, wh, 0.05] as const },
        { p: [ww / 2, 0, 0.02] as const, s: [0.06, wh, 0.05] as const },
        { p: [0, 0, 0.02] as const, s: [0.03, wh, 0.03] as const },
        { p: [0, 0, 0.02] as const, s: [ww, 0.03, 0.03] as const },
      ].map((b, i) => (
        <mesh key={i} position={[...b.p]}>
          <boxGeometry args={[...b.s]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  );
}

/** Large invisible plane just under the floor that turns pointer movement into furniture drags. */
function DragPlane() {
  const moveItem = useDesign((s) => s.moveItem);
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragState.id) return;
    moveItem(dragState.id, e.point.x + dragState.dx, e.point.z + dragState.dz);
  };
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} visible={false} onPointerMove={onMove}>
      <planeGeometry args={[200, 200]} />
    </mesh>
  );
}

function CameraRig() {
  const view = useDesign((s) => s.view);
  const width = useDesign((s) => s.room.width);
  const depth = useDesign((s) => s.room.depth);
  const height = useDesign((s) => s.room.height);
  const get = useThree((s) => s.get);

  useEffect(() => {
    const { camera, controls, size } = get();
    const cam = camera as THREE.PerspectiveCamera;
    if (view === "top") {
      const aspect = size.width / size.height;
      const tan = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
      const dist = (Math.max(depth / 2, width / 2 / aspect) / tan) * 1.5;
      cam.position.set(0, dist, 0.001);
      (controls as unknown as OrbitControlsImpl | null)?.target.set(0, 0, 0);
    } else {
      const span = Math.max(width, depth);
      cam.position.set(span * 0.55, height + span * 0.8, span * 1.15);
      (controls as unknown as OrbitControlsImpl | null)?.target.set(0, 0.6, 0);
    }
    cam.lookAt((controls as unknown as OrbitControlsImpl | null)?.target ?? new THREE.Vector3());
    (controls as unknown as OrbitControlsImpl | null)?.update();
  }, [view, width, depth, height, get]);

  return null;
}

function Interaction() {
  const get = useThree((s) => s.get);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    registerCapture(() => {
      gl.render(scene, camera);
      return gl.domElement.toDataURL("image/png");
    });
    return () => registerCapture(null);
  }, [gl, scene, camera]);

  useEffect(() => {
    // End a furniture drag wherever the pointer is released.
    const up = () => {
      dragState.id = null;
      const controls = get().controls as unknown as OrbitControlsImpl | null;
      if (controls) controls.enabled = true;
    };
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [get]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA")) return;
      const { selectedId, removeItem, updateItem, items, duplicateItem, select } = useDesign.getState();
      if (!selectedId) return;
      const it = items.find((i) => i.id === selectedId);
      if (!it) return;
      if (e.key === "Delete" || e.key === "Backspace") removeItem(selectedId);
      else if (e.key === "r" || e.key === "R") updateItem(selectedId, { rot: it.rot + (e.shiftKey ? -1 : 1) * (Math.PI / 2) });
      else if (e.key === "d" || e.key === "D") duplicateItem(selectedId);
      else if (e.key === "Escape") select(null);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}

export default function Scene() {
  const room = useDesign((s) => s.room);
  const items = useDesign((s) => s.items);
  const view = useDesign((s) => s.view);
  const span = Math.max(room.width, room.depth);

  return (
    <Canvas shadows camera={{ fov: 45, near: 0.1, far: 100, position: [5, 6, 8] }} dpr={[1, 2]}>
      <color attach="background" args={["#1a1c21"]} />
      <hemisphereLight args={["#ffffff", "#8a7a6a", 0.7]} />
      <directionalLight
        position={[span * 0.5, room.height * 2.2 + 2, span * 0.4]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-span}
        shadow-camera-right={span}
        shadow-camera-top={span}
        shadow-camera-bottom={-span}
        shadow-camera-near={0.5}
        shadow-camera-far={span * 4}
        shadow-bias={-0.0004}
      />

      <Floor room={room} />
      <Walls room={room} />
      <DragPlane />
      {items.map((it) => (
        <Furniture key={it.id} item={it} />
      ))}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.12}
        enableRotate={view !== "top"}
        minDistance={2}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.05}
      />
      <CameraRig />
      <Interaction />
    </Canvas>
  );
}
