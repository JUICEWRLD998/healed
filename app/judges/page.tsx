import type { Metadata } from "next";
import Link from "next/link";
import { currentMode } from "@/lib/config";
import { renderTimeline } from "@/src/engine/timeline";
import { modifierFor } from "@/src/engine/pigments";
import { DRIFT_TEXT, STEP_LABEL } from "../labels";
import { ModeChip } from "../ui";
import { BreakPanel } from "./panel";
import styles from "./judges.module.css";

export const metadata: Metadata = { title: "For judges · Healed", description: "A 90-second case on recorded renders, then your own face." };
export const dynamic = "force-dynamic";

// The sample client is the same fixed one the break-it panel uses. Values are ASSUMED, not a real person.
const CLIENT = {
  skinHex: "#c68e6b", browHex: "#4a3a30", lipHex: "#b5706b", hairHex: "#3b2f2a",
  fitzpatrick: 3 as const, oiliness: 30, pore: 30, redness: 20,
};

export default function Judges() {
  const mode = currentMode();
  const bare = renderTimeline(CLIENT, { service: "powder_brow", pigmentHex: "#2a2a2e" });
  const fixed = renderTimeline(CLIENT, { service: "powder_brow", pigmentHex: "#2a2a2e", modifier: modifierFor("warm", 0.15) });
  const pairs = [
    { name: "Cool soft black, no modifier", t: bare },
    { name: "With 15% warm modifier", t: fixed },
  ];

  return (
    <main className={styles.main}>
      <header className={styles.head}>
        <Link href="/" className={styles.back}>Healed</Link>
        <h1>For judges</h1>
        <p>No login. Phone sized. The case below runs the real engine on a fixed sample client.</p>
        <ModeChip mode="replay" reason={mode === "live" ? "This sample uses no photo and spends no units." : undefined} />
      </header>

      <section aria-labelledby="case">
        <h2 id="case">The 90-second case</h2>
        <ol className={styles.steps}>
          <li><b>Snap.</b> A guided front-facing selfie. Nothing is saved on our server.</li>
          <li><b>Read.</b> Three YouCam analyses on one photo: skin and brow tone, Fitzpatrick, skin condition.</li>
          <li><b>Choose.</b> Powder brows with a cool soft black pigment on warm skin.</li>
          <li><b>Age.</b> The engine ages the colour to week 6 and years 1 to 3. Below is its own output.</li>
          <li><b>Correct.</b> Add a 15% warm modifier and the drift warning clears.</li>
          <li><b>Consent.</b> The consult card, with the client&apos;s tick. Then the upload is deleted.</li>
        </ol>
        <div className={styles.pairs}>
          {pairs.map(({ name, t }) => (
            <div key={name} className={styles.card}>
              <h3>{name}</h3>
              <ul>
                {t.steps.map((s) => (
                  <li key={s.step}>
                    <i style={{ background: s.hex }} aria-hidden />
                    <b>{STEP_LABEL[s.step]}</b>
                    <span className={styles.hex}>{s.hex}</span>
                    <span data-drift={s.drift}>{DRIFT_TEXT[s.drift]}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className={styles.cta}>
          <Link href="/" className={styles.primary}>Try it with your own face</Link>
          <span>Live mode. About 46 units per consult; if the budget is low, a recorded consult runs instead and says so.</span>
        </p>
      </section>

      <section aria-labelledby="break">
        <h2 id="break">Try to break it</h2>
        <p className={styles.lead}>Five bad inputs. Each runs production code and shows the result. The tag says what is verified.</p>
        <BreakPanel />
      </section>
    </main>
  );
}
