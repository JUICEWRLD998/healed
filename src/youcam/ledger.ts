import type { Feature } from "./types";

// Units per call, measured live in Phase 1 (docs/acceptance-gates.md).
export const UNIT_COST: Record<Feature, number> = { tone: 20, fitzpatrick: 10, skin: 9, render: 1 };

export class Ledger {
  private spent = 0;
  private byFeature: Record<Feature, number> = { tone: 0, fitzpatrick: 0, skin: 0, render: 0 };

  record(feature: Feature): void {
    this.spent += UNIT_COST[feature];
    this.byFeature[feature] += UNIT_COST[feature];
  }

  get total(): number {
    return this.spent;
  }

  snapshot() {
    return { total: this.spent, ...this.byFeature };
  }
}

/** Live pauses when the balance is below the floor. */
export function liveAllowed(balance: number, floor: number): boolean {
  return balance >= floor;
}

/** Per-IP daily cap on live consults. Resets when the UTC day changes. */
export class IpCap {
  private seen = new Map<string, { day: string; n: number }>();
  constructor(
    private readonly max: number,
    private readonly today: () => string = () => new Date().toISOString().slice(0, 10),
  ) {}

  allow(ip: string): boolean {
    const day = this.today();
    const cur = this.seen.get(ip);
    if (!cur || cur.day !== day) {
      this.seen.set(ip, { day, n: 1 });
      return true;
    }
    if (cur.n >= this.max) return false;
    cur.n += 1;
    return true;
  }
}
