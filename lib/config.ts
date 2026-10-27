export type Mode = "live" | "replay";

export const VERSION = "0.1.0";

export function currentMode(): Mode {
  return process.env.HEALED_MODE === "replay" ? "replay" : "live";
}
