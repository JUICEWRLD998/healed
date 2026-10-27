import { converter, differenceCiede2000, formatHex, parse } from "culori";
import type { Hex } from "./types";

const toLab = converter("lab");
const toLrgb = converter("lrgb");

function must<T>(v: T | undefined, hex: string): T {
  if (v === undefined) throw new Error(`invalid colour: ${hex}`);
  return v;
}

export function normHex(hex: Hex): Hex {
  return formatHex(must(parse(hex), hex));
}

export function lab(hex: Hex): { l: number; a: number; b: number } {
  const c = toLab(must(parse(hex), hex));
  return { l: c.l, a: c.a, b: c.b };
}

export function hexFromLab(c: { l: number; a: number; b: number }): Hex {
  return formatHex({ mode: "lab", l: c.l, a: c.a, b: c.b });
}

// Mix in linear RGB. An approximation of subtractive pigment mixing (ASSUMED, not a physical pigment model).
export function mixLinear(a: Hex, b: Hex, t: number): Hex {
  if (t <= 0) return normHex(a);
  if (t >= 1) return normHex(b);
  const x = toLrgb(must(parse(a), a));
  const y = toLrgb(must(parse(b), b));
  return formatHex({
    mode: "lrgb",
    r: x.r * (1 - t) + y.r * t,
    g: x.g * (1 - t) + y.g * t,
    b: x.b * (1 - t) + y.b * t,
  });
}

export function deltaE(a: Hex, b: Hex): number {
  return differenceCiede2000()(must(parse(a), a), must(parse(b), b));
}
