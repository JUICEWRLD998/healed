// Mirrors src/styles/tokens.css. Change both together. Motion takes SECONDS; CSS takes milliseconds.
export const dur = { micro: 0.12, short: 0.22, long: 0.42 } as const;
export const ease = {
  out: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const;
