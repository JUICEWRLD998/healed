// Plain constants kept out of the "use client" module so server pages can import them.
export const STEP_LABEL: Record<string, string> = {
  day0: "Day 0",
  week6: "Week 6",
  year1: "Year 1",
  year2: "Year 2",
  year3: "Year 3",
};

export const DRIFT_TEXT = {
  none: "No colour shift expected",
  cool: "Drifts cool: grey or blue cast",
  warm: "Drifts warm: orange cast",
} as const;
