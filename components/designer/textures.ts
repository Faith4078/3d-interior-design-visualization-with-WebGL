import * as THREE from "three";
import type { FloorType } from "@/lib/catalog";

/** Deterministic pseudo-random so textures don't change between renders. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function shade(hex: string, amount: number) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amount);
  return `#${c.getHexString()}`;
}

/**
 * Builds a seamless 1m x 1m floor texture. Repeat it width x depth times to cover a room.
 */
export function makeFloorTexture(type: FloorType, color: string, repeatX: number, repeatY: number, anisotropy = 8) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rand = rng(type.length * 977 + 13);

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  if (type === "wood") {
    const planks = 5;
    const h = size / planks;
    for (let i = 0; i < planks; i++) {
      const offset = rand() * size;
      for (const dx of [0, -size]) {
        ctx.fillStyle = shade(color, (rand() - 0.5) * 0.1);
        ctx.fillRect(dx + offset, i * h, size, h);
        // grain
        for (let g = 0; g < 14; g++) {
          ctx.strokeStyle = shade(color, (rand() - 0.5) * 0.12);
          ctx.globalAlpha = 0.35;
          ctx.lineWidth = 1 + rand();
          const gy = i * h + rand() * h;
          ctx.beginPath();
          ctx.moveTo(dx + offset, gy);
          ctx.lineTo(dx + offset + size, gy + (rand() - 0.5) * 3);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      // plank seams
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, i * h, size, 2);
      ctx.fillRect(offset % size, i * h, 2, h);
    }
  } else if (type === "tile") {
    const n = 2;
    const t = size / n;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        ctx.fillStyle = shade(color, (rand() - 0.5) * 0.05);
        ctx.fillRect(x * t, y * t, t, t);
      }
    }
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    for (let i = 0; i < n; i++) {
      ctx.fillRect(i * t, 0, 3, size);
      ctx.fillRect(0, i * t, size, 3);
    }
  } else {
    // concrete & carpet: speckle noise
    const img = ctx.getImageData(0, 0, size, size);
    const strength = type === "carpet" ? 26 : 18;
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (rand() - 0.5) * strength;
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  return tex;
}
