import type { Metadata } from "next";
import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SAMPLING_RULE } from "@/src/calibration/extract";
import { report, type Pair } from "@/src/calibration/score";
import styles from "../judges/judges.module.css";

export const metadata: Metadata = { title: "Calibration · Healed", description: "How close the healed estimate lands to real healed colour." };
export const dynamic = "force-dynamic";

function load(): Pair[] {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "evidence", "calibration", "pairs.json"), "utf8")) as Pair[];
  } catch {
    return [];
  }
}

export default function Calibration() {
  const pairs = load();
  const r = report(pairs);
  const train = pairs.filter((p) => p.split === "train").length;
  return (
    <main className={styles.main}>
      <header className={styles.head}>
        <Link href="/" className={styles.back}>Healed</Link>
        <h1>Calibration</h1>
        <p>Public fresh-versus-healed photo pairs, measured in CIELAB, scored on a held-out set. Images are not republished.</p>
      </header>
      {r ? (
        <section aria-labelledby="num">
          <h2 id="num">
            On {r.n} held-out pairs, the estimate landed within ΔE {r.engineMean.toFixed(1)} of the real healed colour
          </h2>
          <p className={styles.lead}>
            Assuming fresh = final missed by ΔE {r.naiveMean.toFixed(1)}. The estimate was closer on {r.engineBeatsNaive} of {r.n} pairs.
            ΔE is CIEDE2000 averaged over the pairs. {train} further pairs were used to tune constants and are not scored.
          </p>
        </section>
      ) : (
        <section aria-labelledby="num">
          <h2 id="num">No calibration number yet</h2>
          <p className={styles.lead}>
            {pairs.length} pairs are recorded, none in the held-out set. No figure is shown until there is one, because a number without its denominator would mean nothing.
          </p>
        </section>
      )}
      <section aria-labelledby="method">
        <h2 id="method">Method</h2>
        <p className={styles.lead}>Sampling rule, fixed before measuring: {SAMPLING_RULE}. The extractor is checked against a planted pair of known colours that it must reproduce (see <code>src/calibration/calibration.test.ts</code>).</p>
      </section>
    </main>
  );
}
