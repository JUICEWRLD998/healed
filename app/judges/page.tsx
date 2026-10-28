import type { Metadata } from "next";
import Link from "next/link";
import { LIVE_RECORDED_CLIENT } from "@/lib/sample";
import { renderTimeline } from "@/src/engine/timeline";
import { ModeChip, STEP_LABEL, DRIFT_TEXT } from "../ui";
import { BreakPanel } from "./break-panel";
import styles from "./judges.module.css";

export const metadata: Metadata = {
  title: "Healed for judges",
  description: "A 90-second walkthrough on the real engine, and a panel that tries to break it.",
};

const PIGMENT = "#5a463b";

export default function Judges() {
  const c = LIVE_RECORDED_CLIENT;
  const t = renderTimeline(c, { service: "powder_brow", pigmentHex: PIGMENT });

  return (
    <main className={styles.main}>
      <header className={styles.head}>
        <h1>Healed, in 90 seconds</h1>
        <p>No login. Every number below is computed by the same engine the consult uses.</p>
        <ModeChip mode="replay" reason="This walkthrough uses one recorded consult. Your own face runs Live" />
      </header>

      <ol className={styles.steps}>
        <li>
          <h2>1. A client is read</h2>
          <p>
            Skin, brow and lip colour, Fitzpatrick type and skin concerns come from one photo. Here: Fitzpatrick{" "}
            <span className={styles.num}>{c.fitzpatrick}</span>, oiliness <span className={styles.num}>{c.oiliness}/100</span>, brow{" "}
            <span className={styles.num}>{c.browHex}</span>.
          </p>
        </li>
        <li>
          <h2>2. A pigment is chosen</h2>
          <p className={styles.swatchRow}>
            <i style={{ background: PIGMENT }} aria-hidden /> Neutral medium brown, powder brows.
          </p>
        </li>
        <li>
          <h2>3. The engine ages it</h2>
          <p>Fresh pigment is not the final colour. Each step shows a lighter and a darker bound, never one confident answer.</p>
          <div className={styles.timeline}>
            {t.steps.map((s) => (
              <figure key={s.step}>
                <div className={styles.bandStrip} aria-hidden>
                  <i style={{ background: s.band.lighterHex }} />
                  <i style={{ background: s.hex }} />
                  <i style={{ background: s.band.darkerHex }} />
                </div>
                <figcaption>
                  <b>{STEP_LABEL[s.step]}</b>
                  <span className={styles.num}>{s.colorIntensity}% strength</span>
                  <span data-drift={s.drift}>{DRIFT_TEXT[s.drift]}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </li>
        <li>
          <h2>4. The tool pushes back when it should</h2>
          <p>Try to break it below. Each case calls the production function, not a canned message.</p>
        </li>
      </ol>

      <BreakPanel />

      <section className={styles.cta}>
        <h2>Try it with your own face</h2>
        <p>Live uses your photo for this consult only. It is not saved on our server and the analysis copy is deleted afterwards.</p>
        <Link href="/" className={styles.go}>
          Start a Live consult
        </Link>
      </section>
    </main>
  );
}
