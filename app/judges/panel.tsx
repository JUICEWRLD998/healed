"use client";

import { useState } from "react";
import type { BreakId, BreakResult } from "@/src/judges/breakit";
import styles from "./judges.module.css";

const CASES: { id: BreakId; label: string }[] = [
  { id: "tiny-face", label: "Tiny face" },
  { id: "two-faces", label: "Two faces" },
  { id: "oily-microblading", label: "Microblading, oily skin" },
  { id: "cool-black", label: "Cool black pigment" },
  { id: "low-budget", label: "Budget below floor" },
];

export function BreakPanel() {
  const [res, setRes] = useState<Record<string, BreakResult>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(id: BreakId) {
    setBusy(id);
    setErr(null);
    try {
      const r = await fetch(`/api/breakit?id=${id}`);
      if (!r.ok) throw new Error("The case could not run. Try again.");
      const body = (await r.json()) as BreakResult;
      setRes((p) => ({ ...p, [id]: body }));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <ol className={styles.cases}>
      {CASES.map((c, i) => {
        const r = res[c.id];
        return (
          <li key={c.id}>
            <div className={styles.caseHead}>
              <span className={styles.no}>{i + 1}</span>
              <b>{c.label}</b>
              <button className={styles.run} onClick={() => void run(c.id)} disabled={busy === c.id}>
                {busy === c.id ? "Running" : r ? "Run again" : "Run"}
              </button>
            </div>
            {r && (
              <div className={styles.out} aria-live="polite">
                <p className={styles.input}>{r.input}</p>
                <p className={styles.outcome}>{r.outcome}</p>
                {r.detail && <p className={styles.detail}>{r.detail}</p>}
                <p className={styles.tag} data-v={r.verified}>
                  {r.verified} · {r.path === "upstream-code" ? "upstream code supplied" : "production code"}
                </p>
              </div>
            )}
          </li>
        );
      })}
      {err && (
        <li role="alert" className={styles.err}>
          {err}
        </li>
      )}
    </ol>
  );
}
