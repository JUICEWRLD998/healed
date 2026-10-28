"use client";

import { useState } from "react";
import type { Hex } from "@/src/engine/types";
import styles from "./flow.module.css";

export type Mode = "live" | "replay";
export type Phase = "snap" | "reading" | "choose" | "rendering" | "timeline" | "done";

export const STEP_LABEL: Record<string, string> = {
  day0: "Day 0",
  week6: "Week 6",
  year1: "Year 1",
  year2: "Year 2",
  year3: "Year 3",
};

export const DRIFT_TEXT = {
  none: "No colour shift expected",
  cool: "Drifts cool: grey or blue cast",
  warm: "Drifts warm: orange cast",
} as const;

const STEPS: { id: Phase[]; name: string }[] = [
  { id: ["snap"], name: "Snap" },
  { id: ["reading"], name: "Read" },
  { id: ["choose", "rendering"], name: "Choose" },
  { id: ["timeline"], name: "Age" },
  { id: ["done"], name: "Consent" },
];

export function Stepper({ phase }: { phase: Phase }) {
  const at = STEPS.findIndex((s) => s.id.includes(phase));
  return (
    <ol className={styles.stepper} aria-label="Consult steps">
      {STEPS.map((s, i) => (
        <li key={s.name} data-state={i < at ? "done" : i === at ? "now" : "next"} aria-current={i === at ? "step" : undefined}>
          <span className={styles.stepNo}>{i + 1}</span>
          {s.name}
        </li>
      ))}
    </ol>
  );
}

export function ModeChip({ mode, reason }: { mode: Mode; reason?: string | null }) {
  return (
    <p className={styles.mode} data-mode={mode}>
      <strong>{mode === "live" ? "Live" : "Replay"}</strong>
      <span>
        {mode === "live"
          ? "Renders made from your photo just now"
          : `Recorded renders, not your photo${reason && reason !== "Replay mode is set." ? `. ${reason}` : ""}`}
      </span>
    </p>
  );
}

/** One pigment bottle label: swatch disc, generic name, hex. */
export function Bottle({
  hex,
  name,
  note,
  on,
  children,
}: {
  hex: Hex;
  name: string;
  note?: string;
  on?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={styles.bottle} data-on={on}>
      <i style={{ background: hex }} aria-hidden />
      <div>
        <b>{name}</b>
        <span className={styles.num}>{note ?? hex}</span>
      </div>
      {children}
    </div>
  );
}

/** A render tile that falls back to a labelled colour swatch while the render lands, or if it fails. */
export function Tile({ url, hex, label }: { url?: string; hex: Hex; label: string }) {
  const [broken, setBroken] = useState(false);
  const bad = url === "failed" || broken;
  return (
    <figure className={styles.tile}>
      <div className={styles.tileImg} style={{ background: hex }}>
        {url && !bad && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={`${label} render`} onError={() => setBroken(true)} loading="lazy" />
        )}
        {(url === undefined || bad) && (
          <span>{url === undefined ? "Rendering" : "Unavailable"}</span>
        )}
      </div>
      <figcaption>{label}</figcaption>
    </figure>
  );
}
