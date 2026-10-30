import { formatHex } from "culori";
import { lab } from "../engine/colour";
import type { Hex } from "../engine/types";

export type Rgba = { width: number; height: number; data: Uint8ClampedArray | Uint8Array };
export type Rect = { x: number; y: number; w: number; h: number };

// Sampling rule (fixed before any pair is measured, so it cannot be tuned on the results):
// take every pixel in the rectangle, convert each to CIELAB, drop pixels with L* under 8 or over 97 (shadow and
// blown highlight), and return the per-channel MEDIAN in CIELAB as a hex. Median resists hair strokes and glare.
export const SAMPLING_RULE = "median CIELAB of pixels with 8 <= L* <= 97 inside one fixed rectangle";
const L_MIN = 8;
const L_MAX = 97;

function median(v: number[]): number {
  const s = [...v].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function regionHex(img: Rgba, r: Rect): Hex {
  const x0 = Math.max(0, Math.floor(r.x));
  const y0 = Math.max(0, Math.floor(r.y));
  const x1 = Math.min(img.width, Math.ceil(r.x + r.w));
  const y1 = Math.min(img.height, Math.ceil(r.y + r.h));
  const L: number[] = [];
  const A: number[] = [];
  const B: number[] = [];
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const i = (y * img.width + x) * 4;
      if (img.data[i + 3] < 255) continue;
      const hex = formatHex({ mode: "rgb", r: img.data[i] / 255, g: img.data[i + 1] / 255, b: img.data[i + 2] / 255 });
      const c = lab(hex);
      if (c.l < L_MIN || c.l > L_MAX) continue;
      L.push(c.l);
      A.push(c.a);
      B.push(c.b);
    }
  }
  if (L.length === 0) throw new Error("no usable pixels in region");
  return formatHex({ mode: "lab", l: median(L), a: median(A), b: median(B) });
}
