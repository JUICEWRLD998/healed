"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { dur, ease } from "@/lib/motion";
import { BROW_PIGMENTS, pigmentsFor } from "@/src/engine/pigments";
import type { Client, Service, Timeline } from "@/src/engine/types";
import { Capture } from "./capture";
import styles from "./flow.module.css";
import { Bottle, DRIFT_TEXT, ModeChip, STEP_LABEL, Stepper, Tile, type Mode, type Phase } from "./ui";

type Slot = "day0" | "week6" | "year1" | "year2" | "year3" | "lighter" | "darker";
type Frames = Partial<Record<Slot, string | "failed">>;

const SERVICES: { id: Service; name: string }[] = [
  { id: "powder_brow", name: "Powder brows" },
  { id: "microblading", name: "Microblading" },
  { id: "lip_blush", name: "Lip blush" },
];
const SIGNAL_MS = 200;

async function post<T>(url: string, body: FormData | object): Promise<T> {
  const isForm = body instanceof FormData;
  const res = await fetch(url, {
    method: "POST",
    body: isForm ? body : JSON.stringify(body),
    headers: isForm ? undefined : { "content-type": "application/json" },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Something went wrong. Try again.");
  return json as T;
}

export function Flow() {
  const [phase, setPhase] = useState<Phase>("snap");
  const [error, setError] = useState<string | null>(null);
  const [fileId, setFileId] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [mode, setMode] = useState<Mode>("live");
  const [reason, setReason] = useState<string | null>(null);
  const [service, setService] = useState<Service>("powder_brow");
  const [pigmentHex, setPigmentHex] = useState(BROW_PIGMENTS[1].hex);
  const [custom, setCustom] = useState("");
  const [modId, setModId] = useState<"warm" | "cool">("warm");
  const [ratio, setRatio] = useState(0);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [frames, setFrames] = useState<Frames>({});
  const [active, setActive] = useState(0);
  const [fixing, setFixing] = useState(false);
  const [consented, setConsented] = useState(false);
  const [deleted, setDeleted] = useState<string | null>(null);
  const userMoved = useRef(false);
  const timers = useRef<number[]>([]);

  const customOk = /^#[0-9a-fA-F]{6}$/.test(custom);
  const chosenHex = customOk ? custom : pigmentHex;

  function clearTimers() {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }
  useEffect(() => () => clearTimers(), []);
  useEffect(() => () => void (photoUrl && URL.revokeObjectURL(photoUrl)), [photoUrl]);

  /** The signature moment: the scrub plays from day 0 to the first drifting step on its own, then hands over. */
  function playScrub(t: Timeline) {
    clearTimers();
    userMoved.current = false;
    const first = t.steps.findIndex((s) => s.drift !== "none");
    const target = first === -1 ? t.steps.length - 1 : first;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setActive(target);
    setActive(0);
    for (let i = 1; i <= target; i += 1) {
      timers.current.push(
        window.setTimeout(() => {
          if (!userMoved.current) setActive(i);
        }, 250 + i * SIGNAL_MS),
      );
    }
  }

  function scrubTo(i: number) {
    userMoved.current = true;
    clearTimers();
    setActive(i);
  }

  async function onPhoto(b: Blob) {
    setError(null);
    setPhotoUrl(URL.createObjectURL(b));
    setPhase("reading");
    try {
      const fd = new FormData();
      fd.append("image", new File([b], "photo.jpg", { type: "image/jpeg" }));
      const r = await post<{ fileId: string; client: Client; mode: Mode; reason: string | null }>("/api/read", fd);
      setFileId(r.fileId);
      setClient(r.client);
      setMode(r.mode);
      setReason(r.reason);
      setPhase("choose");
    } catch (e) {
      setError((e as Error).message);
      setPhase("snap");
    }
  }

  function pickService(s: Service) {
    setService(s);
    setCustom("");
    setPigmentHex(pigmentsFor(s)[s === "lip_blush" ? 0 : 1].hex);
  }

  /** Renders the timeline. `inPlace` keeps the timeline on screen and replaces frames as each one lands. */
  async function age(next?: { ratio: number; modId: "warm" | "cool" }, inPlace = false) {
    setError(null);
    if (inPlace) setFixing(true);
    else setPhase("rendering");
    const r0 = next?.ratio ?? ratio;
    const m0 = next?.modId ?? modId;
    const plan = {
      fileId,
      mode,
      service,
      pigmentHex: chosenHex,
      client,
      modifier: r0 > 0 ? { id: m0, ratio: r0 } : undefined,
    };
    try {
      const r = await post<{ timeline: Timeline; slots: Slot[] }>("/api/render", plan);
      setTimeline(r.timeline);
      if (!inPlace) {
        setFrames({});
        setPhase("timeline");
        playScrub(r.timeline);
      }
      // The timeline is on screen now. The renders run in parallel and each image appears as it lands.
      let left = r.slots.length;
      for (const slot of r.slots) {
        post<{ url: string; mode: Mode; reason: string | null }>("/api/frame", { ...plan, slot })
          .then((f) => {
            setFrames((p) => ({ ...p, [slot]: f.url }));
            if (f.mode === "replay") {
              setMode("replay");
              setReason(f.reason);
            }
          })
          .catch((e: Error) => {
            setFrames((p) => ({ ...p, [slot]: "failed" }));
            setError((cur) => cur ?? e.message);
          })
          .finally(() => {
            left -= 1;
            if (left === 0) setFixing(false);
          });
      }
    } catch (e) {
      setError((e as Error).message);
      setFixing(false);
      if (!inPlace) setPhase("choose");
    }
  }

  function applyModifier(id: "warm" | "cool", amount: number) {
    setModId(id);
    setRatio(amount);
    void age({ ratio: amount, modId: id }, true);
  }

  async function consent() {
    setConsented(true);
    try {
      const r = await post<{ deleted: boolean; note?: string }>("/api/remove", { fileId });
      setDeleted(
        r.deleted
          ? "Your uploaded photo and results were deleted from the analysis service."
          : (r.note ?? "Deletion could not be confirmed."),
      );
    } catch {
      setDeleted("Deletion could not be confirmed. Uploaded data expires on its own within 30 days.");
    }
  }

  function restart() {
    clearTimers();
    setClient(null);
    setTimeline(null);
    setFrames({});
    setConsented(false);
    setDeleted(null);
    setRatio(0);
    setPhotoUrl(null);
    setError(null);
    setPhase("snap");
  }

  const step = timeline?.steps[active];
  const driftStep = timeline?.steps.find((s) => s.drift !== "none");
  const serviceName = SERVICES.find((s) => s.id === service)?.name ?? "";
  const suggest: "warm" | "cool" | null = driftStep ? (driftStep.drift === "cool" ? "warm" : "cool") : null;
  const verdict = step
    ? ratio > 0 && step.drift === "none"
      ? `${STEP_LABEL[step.step]}: corrected with ${Math.round(ratio * 100)}% ${modId} modifier, no colour shift expected`
      : `${STEP_LABEL[step.step]}: ${DRIFT_TEXT[step.drift]}`
    : "";

  return (
    <div className={styles.flow}>
      <Stepper phase={phase} />
      {error && (
        <p className={styles.warn} role="alert">
          {error}
        </p>
      )}

      {phase === "snap" && <Capture onPhoto={(b) => void onPhoto(b)} />}

      {phase === "reading" && (
        <section className={styles.screen} aria-labelledby="reading" aria-live="polite">
          <div className={styles.stage}>
            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Your photo, as taken" />
            )}
            <span className={styles.stageNote}>Your photo, on this device</span>
          </div>
          <div className={styles.side}>
            <h2 id="reading" className={styles.title}>
              Reading your skin
            </h2>
            <p className={styles.hint}>Three analyses run together on the one photo. About 30 seconds.</p>
            <ul className={styles.reading}>
              <li>
                <b>Skin and brow tone</b>
                <span>Reading</span>
                <i />
              </li>
              <li>
                <b>Fitzpatrick type</b>
                <span>Reading</span>
                <i />
              </li>
              <li>
                <b>Skin condition</b>
                <span>Reading</span>
                <i />
              </li>
            </ul>
          </div>
        </section>
      )}

      {(phase === "choose" || phase === "rendering") && client && (
        <section className={styles.screen} aria-labelledby="choose">
          <div className={styles.stage}>
            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Your photo, as taken" />
            )}
            <span className={styles.stageNote}>Original, before any render</span>
          </div>
          <div className={styles.side}>
            <h2 id="choose" className={styles.title}>
              Choose the service and pigment
            </h2>
            <ModeChip mode={mode} reason={reason} />
            <dl className={styles.read}>
              <div>
                <dt>Skin</dt>
                <dd>
                  <i style={{ background: client.skinHex }} />
                  {client.skinHex}
                </dd>
              </div>
              <div>
                <dt>Brows</dt>
                <dd>
                  <i style={{ background: client.browHex }} />
                  {client.browHex}
                </dd>
              </div>
              <div>
                <dt>Lips</dt>
                <dd>
                  <i style={{ background: client.lipHex }} />
                  {client.lipHex}
                </dd>
              </div>
              <div>
                <dt>Fitzpatrick</dt>
                <dd>{client.fitzpatrick}</dd>
              </div>
              <div>
                <dt>Oiliness</dt>
                <dd>{client.oiliness}/100</dd>
              </div>
              <div>
                <dt>Pores</dt>
                <dd>{client.pore}/100</dd>
              </div>
            </dl>
            <fieldset className={styles.group}>
              <legend>Service</legend>
              <div className={styles.segments}>
                {SERVICES.map((s) => (
                  <label key={s.id} className={styles.segment} data-on={service === s.id}>
                    <input type="radio" name="service" checked={service === s.id} onChange={() => pickService(s.id)} />
                    {s.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className={styles.group}>
              <legend>Pigment</legend>
              <div className={styles.bottles}>
                {pigmentsFor(service).map((p) => {
                  const on = !customOk && pigmentHex === p.hex;
                  return (
                    <label key={p.id} className={styles.bottle} data-on={on}>
                      <input
                        type="radio"
                        name="pigment"
                        checked={on}
                        onChange={() => {
                          setCustom("");
                          setPigmentHex(p.hex);
                        }}
                      />
                      <i style={{ background: p.hex }} aria-hidden />
                      <div>
                        <b>{p.name}</b>
                        <span className={styles.num}>{p.hex}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
              <label className={styles.custom}>
                Or type a hex
                <input
                  type="text"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value.trim())}
                  placeholder="#3a3138"
                  maxLength={7}
                  aria-invalid={custom !== "" && !customOk}
                />
              </label>
            </fieldset>
            <button
              className={styles.primary}
              onClick={() => void age()}
              disabled={phase === "rendering" || (custom !== "" && !customOk)}
            >
              {phase === "rendering" ? "Ageing, about 20 seconds" : "Show me healed"}
            </button>
          </div>
        </section>
      )}

      {phase === "timeline" && timeline && step && (
        <section className={styles.screen} aria-labelledby="age">
          <div className={styles.stage}>
            {/* base layer: the client's own photo, so the stage is never empty while a render lands */}
            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" />
            )}
            {timeline.steps.map((s, i) => {
              const u = frames[s.step];
              return u && u !== "failed" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={s.step} className={styles.layer} data-on={i === active} src={u} alt={i === active ? `${STEP_LABEL[s.step]} render` : ""} />
              ) : null;
            })}
            {(() => {
              const u = frames[step.step];
              if (u === "failed")
                return (
                  <div role="img" aria-label={`${STEP_LABEL[step.step]} colour ${step.hex}`} style={{ position: "absolute", inset: 0, background: step.hex, display: "grid", placeItems: "end start" }}>
                    <span className={styles.stageNote}>Render unavailable. Colour estimate shown.</span>
                  </div>
                );
              return !u ? <span className={styles.stageNote}>Rendering this step. Showing your original.</span> : null;
            })()}
          </div>
          <div className={styles.side}>
            <h2 id="age" className={styles.sr}>
              Healed timeline
            </h2>
            <ModeChip mode={mode} reason={reason} />
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={step.step}
                className={styles.year}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: dur.short, ease: ease.out }}
              >
                {STEP_LABEL[step.step]}
              </motion.p>
            </AnimatePresence>
            <div className={styles.verdictRow} aria-live="polite">
              <span className={styles.sr}>{verdict}</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={`${step.drift}-${ratio > 0}`}
                  className={styles.drift}
                  data-drift={step.drift}
                  data-fixed={ratio > 0 && step.drift === "none"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: dur.short, ease: ease.out }}
                >
                  {ratio > 0 && step.drift === "none"
                    ? `Corrected with ${Math.round(ratio * 100)}% ${modId} modifier`
                    : DRIFT_TEXT[step.drift]}
                </motion.span>
              </AnimatePresence>
            </div>
            <p className={styles.band}>
              <span>
                <i className={styles.dot} style={{ background: step.band.lighterHex }} />
                Lighter {step.band.lighterHex} ({step.band.lighterIntensity}%)
              </span>
              <span>
                <i className={styles.dot} style={{ background: step.band.darkerHex }} />
                Darker {step.band.darkerHex} ({step.band.darkerIntensity}%)
              </span>
              <span>A band, not a promise.</span>
            </p>

            <div className={styles.scrub}>
              <div className={styles.scrubTrack}>
                <input
                  type="range"
                  min={0}
                  max={timeline.steps.length - 1}
                  step={1}
                  value={active}
                  onChange={(e) => scrubTo(Number(e.target.value))}
                  aria-label="Time since the procedure"
                  aria-valuetext={STEP_LABEL[step.step]}
                />
              </div>
              <ul className={styles.scrubLabels}>
                {timeline.steps.map((s, i) => (
                  <li key={s.step}>
                    <button data-on={i === active} data-drift={s.drift} aria-label={`${STEP_LABEL[s.step]}: ${DRIFT_TEXT[s.drift]}`} title={DRIFT_TEXT[s.drift]} onClick={() => scrubTo(i)}>
                      {STEP_LABEL[s.step]}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <Bottle
              hex={chosenHex}
              name={serviceName}
              note={`${chosenHex}${ratio > 0 ? `, ${Math.round(ratio * 100)}% ${modId} modifier` : ""}`}
            />
            {suggest && ratio === 0 && (
              <button className={styles.primary} disabled={fixing} onClick={() => applyModifier(suggest, 0.15)}>
                Add {suggest} modifier 15%
              </button>
            )}
            {ratio > 0 && (
              <div className={styles.row}>
                <p className={styles.signed} role="status">
                  {fixing ? "Re-rendering with the modifier" : `${Math.round(ratio * 100)}% ${modId} modifier added`}
                </p>
                <button className={styles.secondary} disabled={fixing} onClick={() => applyModifier(modId, 0)}>
                  Remove modifier
                </button>
              </div>
            )}
            {step.step === "year2" && (
              <div className={styles.pair}>
                <Tile url={frames.lighter} hex={step.band.lighterHex} label="Lighter bound" />
                <Tile url={frames.darker} hex={step.band.darkerHex} label="Darker bound" />
              </div>
            )}
            <div className={styles.row}>
              <button className={styles.secondary} onClick={() => setPhase("choose")}>
                Change pigment
              </button>
              <button className={suggest && ratio === 0 ? styles.secondary : styles.primary} onClick={() => setPhase("done")}>
                Make consult card
              </button>
            </div>
          </div>
        </section>
      )}

      {phase === "done" && timeline && (
        <section className={styles.sheet} aria-labelledby="card">
          <div className={styles.sheetHead}>
            <h2 id="card" className={styles.title}>
              Consult card
            </h2>
            <ModeChip mode={mode} reason={reason} />
          </div>
          <div className={styles.field}>
            <b>Service</b>
            <Bottle
              hex={chosenHex}
              name={serviceName}
              note={`${chosenHex}${ratio > 0 ? `, ${Math.round(ratio * 100)}% ${modId} modifier` : ""}`}
            />
          </div>
          <div className={styles.field}>
            <b>Healed</b>
            <div className={styles.strip}>
              {timeline.steps.map((s) => (
                <Tile key={s.step} url={frames[s.step]} hex={s.hex} label={STEP_LABEL[s.step]} />
              ))}
            </div>
          </div>
          <div className={styles.field}>
            <b>Colour drift</b>
            <ul className={styles.recap}>
              {timeline.steps.map((s) => (
                <li key={s.step}>
                  <b>{STEP_LABEL[s.step]}</b> {DRIFT_TEXT[s.drift]}. Range {s.band.lighterHex} to {s.band.darkerHex}.
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.field}>
            <b>Advice</b>
            <div className={styles.side}>
              {timeline.advice.reasons.map((r) => (
                <p key={r} className={styles.hint}>
                  {r}
                </p>
              ))}
              {timeline.advice.flags.map((f) => (
                <p key={f} className={styles.flag}>
                  {f}
                </p>
              ))}
              <p className={styles.hint}>Cosmetic preview only. Colours are estimates and healed results vary. Not medical advice.</p>
            </div>
          </div>
          <div className={styles.field}>
            <b>Original</b>
            <div className={styles.originalPair}>
              {photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="Original photo" style={{ width: "100%", borderRadius: "var(--radius-md)", aspectRatio: "4 / 5", objectFit: "cover" }} />
              )}
              <p className={styles.hint}>Every render is retouched and smoother than the photo. The original is shown for comparison.</p>
            </div>
          </div>
          <div className={styles.field}>
            <b>Consent</b>
            {!consented ? (
              <label className={styles.consent}>
                <input type="checkbox" onChange={(e) => e.target.checked && void consent()} />I understand these are
                estimates, and I agree to go ahead with this plan.
              </label>
            ) : (
              <p className={styles.signed} aria-live="polite">
                Consent recorded on this page only. {deleted ?? "Deleting your uploaded photo"}
              </p>
            )}
          </div>
          <div className={`${styles.row} ${styles.noprint}`}>
            <button className={styles.primary} onClick={() => window.print()}>
              Print consult card
            </button>
            <button className={styles.secondary} onClick={restart}>
              Start over
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
