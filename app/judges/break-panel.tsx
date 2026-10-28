"use client";

import { useState } from "react";
import type { BreakId, BreakResult } from "@/lib/breakit";
import styles from "./judges.module.css";

const CASES: { id: BreakId; label: string }[] = [
  { id: "no-face", label: "No face, or a tiny face" },
  { id: "two-faces", label: "Two faces" },
  { id: "oily-microblading", label: "Microblading on oily skin" },
  { id: "cool-black", label: "A cool black pigment" },
  { id: "low-budget", label: "Unit budget below the floor" },
];

export function BreakPanel() {
  const [out, setOut] = useState<Partial<Record<BreakId, BreakResult | "error">>>({});
  const [busy, setBusy] = useState<BreakId | null>(null);

  async function run(id: BreakId) {
    setBusy(id);
    try {
      const r = await fetch(`/api/breakit?id=${id}`);
      const body = r.ok ? ((await r.json()) as BreakResult) : ("error" as const);
      setOut((o) => ({ ...o, [id]: body }));
    } catch {
      setOut((o) => ({ ...o, [id]: "error" }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="break" className={styles.panel}>
      <h2 id="break">Try to break it</h2>
      <ul>
        {CASES.map(({ id, label }) => {
          const r = out[id];
          return (
            <li key={id}>
              <button type="button" onClick={() => void run(id)} disabled={busy === id} className={styles.run}>
                {label}
              </button>
              <div aria-live="polite">
                {r === "error" && <p className={styles.bad}>That case could not run. Try again.</p>}
                {r && r !== "error" && (
                  <div className={styles.result}>
                    <p>
                      <b>{r.input}</b>
                    </p>
                    <p>{r.outcome}</p>
                    {r.detail && (
                      <ul>
                        {r.detail.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    )}
                    <small>
                      {r.source}
                      {r.observedLive ? "" : ". Response code matched by keyword, UNVERIFIED against a live response"}
                    </small>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
