"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./flow.module.css";

const MAX_W = 1280;
const MIN_BRIGHT = 70;
const MAX_BRIGHT = 215;

/** Mean luma of the frame, 0-255. The one capture check we can make without a face detector. */
function brightness(c: HTMLCanvasElement): number {
  const g = c.getContext("2d")!;
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let sum = 0;
  let n = 0;
  for (let i = 0; i < d.length; i += 16) {
    sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    n += 1;
  }
  return sum / n;
}

function toCanvas(src: CanvasImageSource, w: number, h: number): HTMLCanvasElement {
  const scale = Math.min(1, MAX_W / w);
  const c = document.createElement("canvas");
  c.width = Math.round(w * scale);
  c.height = Math.round(h * scale);
  c.getContext("2d")!.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

const toBlob = (c: HTMLCanvasElement) => new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.9));

export function Capture({ onPhoto }: { onPhoto: (b: Blob) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [cam, setCam] = useState<"off" | "on" | "denied">("off");
  const [warn, setWarn] = useState<string | null>(null);

  const stop = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);
  useEffect(() => stop, [stop]);

  async function start() {
    setWarn(null);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 } },
        audio: false,
      });
      setCam("on");
      requestAnimationFrame(() => {
        if (video.current) {
          video.current.srcObject = stream.current;
          void video.current.play();
        }
      });
    } catch {
      setCam("denied");
    }
  }

  async function finish(c: HTMLCanvasElement) {
    const b = brightness(c);
    if (b < MIN_BRIGHT) return setWarn("Too dark. Face a window or a lamp and try again.");
    if (b > MAX_BRIGHT) return setWarn("Too bright or washed out. Step out of direct light and try again.");
    const out = await toBlob(c);
    if (!out) return setWarn("The photo could not be read. Try again.");
    stop();
    setCam("off");
    onPhoto(out);
  }

  function snap() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    void finish(toCanvas(v, v.videoWidth, v.videoHeight));
  }

  async function pick(file: File | undefined) {
    if (!file) return;
    setWarn(null);
    try {
      const bmp = await createImageBitmap(file);
      void finish(toCanvas(bmp, bmp.width, bmp.height));
    } catch {
      setWarn("That file is not a photo this browser can read. Use a JPEG or PNG.");
    }
  }

  return (
    <section className={styles.screen} aria-labelledby="snap">
      <div className={styles.stage}>
        {cam === "on" && <video ref={video} playsInline muted aria-label="Camera preview" />}
        {/* The brow-mapping string line: nose wing, inner corner, arch, tail. A framing guide only; it is never
            drawn over a render, because a line that misses the brow would be a false claim. */}
        <svg className={`${styles.guideSvg} ${cam === "on" ? styles.guideOn : ""}`} viewBox="0 0 100 125" aria-hidden>
          <g fill="none" stroke="currentColor" strokeWidth="0.5" vectorEffect="non-scaling-stroke">
            <ellipse cx="50" cy="62" rx="31" ry="42" strokeDasharray="2 2" opacity="0.6" />
            <path d="M50 24 V102" opacity="0.35" />
            <path d="M30 54 H70" opacity="0.35" />
            <path d="M33 54 Q38 50 43 54 Q38 57 33 54 M57 54 Q62 50 67 54 Q62 57 57 54" opacity="0.7" />
            {/* three-point string line, drawn from the nose wing on each side */}
            <path d="M44 82 L43 44 M44 82 L35 41 M44 82 L28 46" />
            <path d="M56 82 L57 44 M56 82 L65 41 M56 82 L72 46" />
            <g fill="currentColor" stroke="none">
              <circle cx="43" cy="44" r="1.1" />
              <circle cx="35" cy="41" r="1.1" />
              <circle cx="28" cy="46" r="1.1" />
              <circle cx="57" cy="44" r="1.1" />
              <circle cx="65" cy="41" r="1.1" />
              <circle cx="72" cy="46" r="1.1" />
              <circle cx="44" cy="82" r="1.1" />
              <circle cx="56" cy="82" r="1.1" />
            </g>
          </g>
        </svg>
      </div>
      <div className={styles.side}>
        <h2 id="snap" className={styles.title}>
          Snap one straight-on photo
        </h2>
        <p className={styles.hint}>
          Look at the camera with the face filling most of the frame, in even, soft light. Brows must be clear of hair.
        </p>
        <div className={styles.row}>
          {cam !== "on" ? (
            <button className={styles.primary} onClick={start}>
              Use camera
            </button>
          ) : (
            <button className={styles.primary} onClick={snap}>
              Take photo
            </button>
          )}
          <label className={styles.secondary}>
            Upload a photo
            <input type="file" accept="image/jpeg,image/png" className={styles.sr} onChange={(e) => void pick(e.target.files?.[0])} />
          </label>
        </div>
        <p className={styles.hint}>Your photo is not saved on our server, and the analysis copy is deleted after the consult.</p>
        {cam === "denied" && (
          <p className={styles.warn} role="alert">
            Camera blocked. Upload a front-facing photo instead.
          </p>
        )}
        {warn && (
          <p className={styles.warn} role="alert">
            {warn}
          </p>
        )}
      </div>
    </section>
  );
}
