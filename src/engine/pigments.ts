import type { Hex, Modifier, Service } from "./types";

// Starter library of generic pigment names and hex values. No brand names (CLAUDE.md invariant). Hex values are
// ASSUMED starting points for the artist's palette, not measured product colours.
export type Pigment = { id: string; name: string; hex: Hex };

export const BROW_PIGMENTS: readonly Pigment[] = [
  { id: "soft-black", name: "Soft black", hex: "#2a2a2e" },
  { id: "cool-dark-brown", name: "Cool dark brown", hex: "#3a3138" },
  { id: "neutral-medium-brown", name: "Neutral medium brown", hex: "#5a463b" },
  { id: "warm-light-brown", name: "Warm light brown", hex: "#8a5e3c" },
];

export const LIP_PIGMENTS: readonly Pigment[] = [
  { id: "nude-rose", name: "Nude rose", hex: "#c48a8a" },
  { id: "coral", name: "Coral", hex: "#e0705a" },
  { id: "berry", name: "Berry", hex: "#8e2f4f" },
  { id: "peach-neutraliser", name: "Peach neutraliser", hex: "#f0a07a" },
];

export const MODIFIERS: readonly Pigment[] = [
  { id: "warm", name: "Warm (orange)", hex: "#d9822b" },
  { id: "cool", name: "Cool (blue)", hex: "#4a6fa5" },
];

export function pigmentsFor(service: Service): readonly Pigment[] {
  return service === "lip_blush" ? LIP_PIGMENTS : BROW_PIGMENTS;
}

export function modifierFor(id: string, ratio: number): Modifier | undefined {
  const m = MODIFIERS.find((x) => x.id === id);
  return m && ratio > 0 ? { hex: m.hex, ratio } : undefined;
}
