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
    <section className={styles.card} aria-labelledby="snap">
      <h2 id="snap">1. Snap</h2>
      <p className={styles.hint}>
        Look straight at the camera. The face should fill most of the width. Use even, soft light.
      </p>
      {cam === "on" && (
        <div className={styles.viewfinder}>
          <video ref={video} playsInline muted aria-label="Camera preview" />
          <div className={styles.guide} aria-hidden />
        </div>
      )}
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
          <input type="file" accept="image/jpeg,image/png" hidden onChange={(e) => void pick(e.target.files?.[0])} />
        </label>
      </div>
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
    </section>
  );
}
