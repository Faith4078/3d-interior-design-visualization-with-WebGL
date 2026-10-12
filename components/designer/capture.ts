/** Lets UI outside the <Canvas> grab a PNG of the current 3D view. */
let capture: (() => string) | null = null;

export function registerCapture(fn: (() => string) | null) {
  capture = fn;
}

export function capturePng(): string | null {
  return capture ? capture() : null;
}
