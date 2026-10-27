export type Hex = string;

export type Client = {
  skinHex: Hex;
  browHex: Hex;
  lipHex: Hex;
  hairHex: Hex; // Facial Color Tones
  fitzpatrick: 1 | 2 | 3 | 4 | 5 | 6; // Fitzpatrick
  oiliness: number;
  pore: number;
  redness: number; // Skin Analysis ui_score 0-100
};

export type Service = "powder_brow" | "microblading" | "lip_blush";
export type Modifier = { hex: Hex; ratio: number }; // ratio 0-0.3
export type Choice = { service: Service; pigmentHex: Hex; modifier?: Modifier };
export type Step = "day0" | "week6" | "year1" | "year2" | "year3";
export type Drift = "none" | "cool" | "warm";

export type StepRender = {
  step: Step;
  hex: Hex; // colour passed to Makeup VTO
  colorIntensity: number; // 0-100
  definition?: number; // brows only, 0-100
  transparencyIntensity?: number; // lips only, 0-100
  band: { lighterHex: Hex; darkerHex: Hex; lighterIntensity: number; darkerIntensity: number };
  drift: Drift; // the warning chip
};

export type Advice = { technique: Service; reasons: string[]; flags: string[] };

export type Timeline = { steps: StepRender[]; advice: Advice };
