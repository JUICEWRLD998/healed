"use client";

import { useState } from "react";
import { BROW_PIGMENTS, MODIFIERS, pigmentsFor } from "@/src/engine/pigments";
import type { Client, Service, Timeline } from "@/src/engine/types";
import { Capture } from "./capture";
import styles from "./flow.module.css";

type Mode = "live" | "replay";
type Slot = "day0" | "week6" | "year1" | "year2" | "year3" | "lighter" | "darker";
type Frames = Partial<Record<Slot, string | "failed">>;
type Phase = "snap" | "reading" | "choose" | "rendering" | "timeline" | "done";

const STEP_LABEL: Record<string, string> = {
  day0: "Day 0",
  week6: "Week 6",
  year1: "Year 1",
  year2: "Year 2",
  year3: "Year 3",
};
const SERVICES: { id: Service; name: string }[] = [
  { id: "powder_brow", name: "Powder brows" },
  { id: "microblading", name: "Microblading" },
  { id: "lip_blush", name: "Lip blush" },
];
const DRIFT_TEXT = {
  none: "No colour shift expected",
  cool: "Drifts cool: grey or blue cast",
  warm: "Drifts warm: orange cast",
} as const;

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

function ModeChip({ mode, reason }: { mode: Mode; reason?: string | null }) {
  return (
    <p className={styles.mode} data-mode={mode}>
      <strong>{mode === "live" ? "LIVE" : "REPLAY"}</strong>
      {mode === "live"
        ? " renders made from your photo just now"
        : ` recorded renders, not your photo${reason ? `. ${reason}` : ""}`}
    </p>
  );
}

function Frame({ url, hex, label }: { url?: string; hex: string; label: string }) {
  const [broken, setBroken] = useState(false);
  const waiting = url === undefined;
  return (
    <figure className={styles.frame}>
      {waiting || broken || url === "failed" ? (
        <div className={styles.swatch} style={{ background: hex }} role="img" aria-label={`${label} colour ${hex}`}>
          <span>{waiting ? "Rendering your photo…" : "Render unavailable. Colour estimate shown."}</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={`${label} render`} onError={() => setBroken(true)} />
      )}
      <figcaption>{label}</figcaption>
    </figure>
  );
}

export function Flow() {
  const [phase, setPhase] = useState<Phase>("snap");
  const [error, setError] = useState<string | null>(null);
  const [fileId, setFileId] = useState("");
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
  const [consented, setConsented] = useState(false);
  const [deleted, setDeleted] = useState<string | null>(null);

  async function onPhoto(b: Blob) {
    setError(null);
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

  const customOk = /^#[0-9a-fA-F]{6}$/.test(custom);
  const chosenHex = customOk ? custom : pigmentHex;

  async function age() {
    setError(null);
    setPhase("rendering");
    const plan = {
      fileId,
      mode,
      service,
      pigmentHex: chosenHex,
      client,
      modifier: ratio > 0 ? { id: modId, ratio } : undefined,
    };
    try {
      const r = await post<{ timeline: Timeline; slots: Slot[] }>("/api/render", plan);
      setTimeline(r.timeline);
      setFrames({});
      setActive(0);
      setPhase("timeline");
      // The timeline is on screen now. The 7 renders run in parallel and each image appears as it lands.
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
          });
      }
    } catch (e) {
      setError((e as Error).message);
      setPhase("choose");
    }
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
    setClient(null);
    setTimeline(null);
    setFrames({});
    setConsented(false);
    setDeleted(null);
    setRatio(0);
    setError(null);
    setPhase("snap");
  }

  const step = timeline?.steps[active];
  const url = step ? frames[step.step] : undefined;
  const bandStep = timeline?.steps.find((s) => s.step === "year2");

  return (
    <div className={styles.flow}>
      {error && (
        <p className={styles.warn} role="alert">
          {error}
        </p>
      )}

      {phase === "snap" && <Capture onPhoto={(b) => void onPhoto(b)} />}

      {phase === "reading" && (
        <section className={styles.card} aria-live="polite">
          <h2>2. Read</h2>
          <p className={styles.hint}>Reading skin tone, undertone and skin type. About 30 seconds.</p>
        </section>
      )}

      {(phase === "choose" || phase === "rendering") && client && (
        <section className={styles.card} aria-labelledby="choose">
          <h2 id="choose">3. Choose</h2>
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
            {SERVICES.map((s) => (
              <label key={s.id} className={styles.chip} data-on={service === s.id}>
                <input type="radio" name="service" checked={service === s.id} onChange={() => pickService(s.id)} />
                {s.name}
              </label>
            ))}
          </fieldset>
          <fieldset className={styles.group}>
            <legend>Pigment</legend>
            {pigmentsFor(service).map((p) => (
              <label key={p.id} className={styles.chip} data-on={!customOk && pigmentHex === p.hex}>
                <input
                  type="radio"
                  name="pigment"
                  checked={!customOk && pigmentHex === p.hex}
                  onChange={() => {
                    setCustom("");
                    setPigmentHex(p.hex);
                  }}
                />
                <i style={{ background: p.hex }} />
                {p.name}
              </label>
            ))}
            <label className={styles.custom}>
              Or type a hex
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value.trim())}
                placeholder="#3a3138"
                maxLength={7}
                aria-invalid={custom !== "" && !customOk}
              />
            </label>
          </fieldset>
          <fieldset className={styles.group}>
            <legend>Colour corrector (modifier)</legend>
            {MODIFIERS.map((m) => (
              <label key={m.id} className={styles.chip} data-on={modId === m.id}>
                <input
                  type="radio"
                  name="mod"
                  checked={modId === m.id}
                  onChange={() => setModId(m.id as "warm" | "cool")}
                />
                <i style={{ background: m.hex }} />
                {m.name}
              </label>
            ))}
            <label className={styles.custom}>
              Amount: {Math.round(ratio * 100)}%
              <input
                type="range"
                min={0}
                max={0.3}
                step={0.05}
                value={ratio}
                onChange={(e) => setRatio(Number(e.target.value))}
              />
            </label>
          </fieldset>
          <button
            className={styles.primary}
            onClick={() => void age()}
            disabled={phase === "rendering" || (custom !== "" && !customOk)}
          >
            {phase === "rendering" ? "Ageing… about 20 seconds" : "Show me healed"}
          </button>
        </section>
      )}

      {phase === "timeline" && timeline && step && (
        <section className={styles.card} aria-labelledby="age">
          <h2 id="age">4. Age</h2>
          <ModeChip mode={mode} reason={reason} />
          <div className={styles.tabs} role="tablist" aria-label="Time since the procedure">
            {timeline.steps.map((s, i) => (
              <button
                key={s.step}
                role="tab"
                aria-selected={i === active}
                className={styles.tab}
                data-on={i === active}
                onClick={() => setActive(i)}
              >
                {STEP_LABEL[s.step]}
              </button>
            ))}
          </div>
          <Frame url={url} hex={step.hex} label={STEP_LABEL[step.step]} />
          <p className={styles.drift} data-drift={step.drift}>
            {DRIFT_TEXT[step.drift]}
          </p>
          <p className={styles.hint}>
            Estimated range at {STEP_LABEL[step.step]}: lighter {step.band.lighterHex} ({step.band.lighterIntensity}%)
            to darker {step.band.darkerHex} ({step.band.darkerIntensity}%). A band, not a promise.
          </p>
          {bandStep && step.step === bandStep.step && (
            <div className={styles.pair}>
              <Frame url={frames.lighter} hex={step.band.lighterHex} label="Lighter bound" />
              <Frame url={frames.darker} hex={step.band.darkerHex} label="Darker bound" />
            </div>
          )}
          <div className={styles.row}>
            <button className={styles.secondary} onClick={() => setPhase("choose")}>
              Change pigment
            </button>
            <button className={styles.primary} onClick={() => setPhase("done")}>
              Make consult card
            </button>
          </div>
        </section>
      )}

      {phase === "done" && timeline && (
        <section className={styles.card} aria-labelledby="card">
          <h2 id="card">5. Consult card</h2>
          <ModeChip mode={mode} reason={reason} />
          <p>
            <strong>{SERVICES.find((s) => s.id === service)?.name}</strong> in{" "}
            <i className={styles.dot} style={{ background: chosenHex }} />
            {chosenHex}
            {ratio > 0 && (
              <>
                , {Math.round(ratio * 100)}% {MODIFIERS.find((m) => m.id === modId)?.name.toLowerCase()} corrector
              </>
            )}
          </p>
          <ul className={styles.list}>
            {timeline.steps.map((s) => (
              <li key={s.step}>
                <b>{STEP_LABEL[s.step]}</b> {DRIFT_TEXT[s.drift]}. Range {s.band.lighterHex} to {s.band.darkerHex}.
              </li>
            ))}
          </ul>
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
          <p className={styles.hint}>
            Cosmetic preview only. Colours are estimates and healed results vary. Not medical advice.
          </p>
          {!consented ? (
            <label className={styles.consent}>
              <input type="checkbox" onChange={(e) => e.target.checked && void consent()} />I understand these are
              estimates, and I agree to go ahead with this plan.
            </label>
          ) : (
            <p className={styles.hint} aria-live="polite">
              Consent recorded on this page only. {deleted ?? "Deleting your uploaded photo…"}
            </p>
          )}
          <button className={styles.secondary} onClick={restart}>
            Start over
          </button>
        </section>
      )}
    </div>
  );
}
