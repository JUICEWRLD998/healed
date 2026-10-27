export type FileRef = { id: string };

export type Tones = {
  skinHex: string;
  lipHex: string;
  browHex: string;
  hairHex: string;
  hairName?: string;
};

/** Raw YouCam raw_score per concern: 1-100, HIGHER = HEALTHIER. Invert before giving it to the engine. */
export type SkinScores = {
  oilinessRaw: number;
  poreRaw: number;
  rednessRaw: number;
  skinType: { whole: string; tZone?: string; uZone?: string };
};

export type Fitzpatrick = 1 | 2 | 3 | 4 | 5 | 6;

/** One Makeup VTO effect object, passed through to the API as is. */
export type MakeupEffect = Record<string, unknown>;

export type RenderResult = { url: string };

export type Feature = "tone" | "fitzpatrick" | "skin" | "render";

export interface YouCam {
  readonly mode: "live" | "replay";
  upload(img: Uint8Array, contentType?: string): Promise<FileRef>;
  faceTones(f: FileRef): Promise<Tones>;
  fitzpatrick(f: FileRef): Promise<Fitzpatrick>;
  skin(f: FileRef): Promise<SkinScores>;
  render(f: FileRef, effects: MakeupEffect[]): Promise<RenderResult>;
  /** Delete every task made on this file, which also deletes the uploaded input (verified Phase 1). */
  remove?(f: FileRef): Promise<void>;
  balance?(): Promise<number>;
}
