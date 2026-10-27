import { join } from "node:path";
import { IpCap, liveAllowed } from "./ledger";
import { createRealYouCam } from "./real";
import { createReplayYouCam } from "./replay";
import type { YouCam } from "./types";

export type Config = {
  apiKey: string;
  baseUrl: string;
  mode: "live" | "replay";
  floor: number;
  capPerIp: number;
};

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  return {
    apiKey: env.YOUCAM_API_KEY ?? "",
    baseUrl: env.YOUCAM_BASE_URL ?? "https://yce-api-01.makeupar.com",
    mode: env.HEALED_MODE === "replay" ? "replay" : "live",
    floor: Number(env.LIVE_UNIT_FLOOR ?? 150),
    capPerIp: Number(env.LIVE_CAP_PER_IP_PER_DAY ?? 3),
  };
}

export const PAUSE_MESSAGE = "Live paused to protect the demo budget; showing a recorded consult";

/** Pure decision: live only when configured live, the key exists, the balance clears the floor and the IP is under its cap. */
export function chooseMode(input: {
  configured: "live" | "replay";
  hasKey: boolean;
  balance: number | null;
  floor: number;
  ipAllowed: boolean;
}): { mode: "live" | "replay"; reason?: string } {
  if (input.configured === "replay") return { mode: "replay", reason: "Replay mode is set." };
  if (!input.hasKey) return { mode: "replay", reason: "No service key is configured." };
  if (!input.ipAllowed) return { mode: "replay", reason: "Daily live limit reached for this address." };
  if (input.balance === null || !liveAllowed(input.balance, input.floor)) return { mode: "replay", reason: PAUSE_MESSAGE };
  return { mode: "live" };
}

const real = new Map<string, ReturnType<typeof createRealYouCam>>();
export const ipCap = new IpCap(loadConfig().capPerIp);

/** Server-only entry point. Routes call this and never touch the key. */
export async function getYouCam(ip: string, cfg: Config = loadConfig()): Promise<{ yc: YouCam; reason?: string }> {
  const replay = () => createReplayYouCam(join(process.cwd(), "fixtures", "replay"));
  if (cfg.mode === "replay" || !cfg.apiKey) return { yc: replay(), reason: chooseMode({ configured: cfg.mode, hasKey: !!cfg.apiKey, balance: null, floor: cfg.floor, ipAllowed: true }).reason };

  let adapter = real.get(cfg.apiKey);
  if (!adapter) {
    adapter = createRealYouCam({ apiKey: cfg.apiKey, baseUrl: cfg.baseUrl });
    real.set(cfg.apiKey, adapter);
  }
  const balance = (await adapter.balance?.().catch(() => null)) ?? null;
  const pick = chooseMode({ configured: cfg.mode, hasKey: true, balance, floor: cfg.floor, ipAllowed: ipCap.allow(ip) });
  return pick.mode === "live" ? { yc: adapter } : { yc: replay(), reason: pick.reason };
}
