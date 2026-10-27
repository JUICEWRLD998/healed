import { createHash } from "node:crypto";

export function hashBytes(b: Uint8Array): string {
  return createHash("sha256").update(b).digest("hex");
}

/** Key = image hash + feature + parameter JSON. Parameters are serialised with sorted keys. */
export function cacheKey(imageHash: string, feature: string, params: unknown): string {
  return createHash("sha256").update(`${imageHash}|${feature}|${stable(params)}`).digest("hex");
}

function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object")
    return `{${Object.keys(v as object)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  return JSON.stringify(v);
}

/** In-memory cache with a TTL and in-flight de-duplication. Signed result URLs live 2 h, so callers pass a shorter TTL. */
export class TtlCache<T> {
  private store = new Map<string, { at: number; value: Promise<T> }>();
  constructor(
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  delete(key: string): void {
    this.store.delete(key);
  }

  get(key: string, make: () => Promise<T>): Promise<T> {
    const hit = this.store.get(key);
    if (hit && this.now() - hit.at < this.ttlMs) return hit.value;
    const value = make();
    this.store.set(key, { at: this.now(), value });
    value.catch(() => this.store.delete(key));
    return value;
  }
}
