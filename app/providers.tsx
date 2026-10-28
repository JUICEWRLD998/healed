"use client";

import { MotionConfig } from "motion/react";

/** Reduced motion at the root: transforms and layout travel are dropped, opacity and colour stay, so the
 *  reduced version is a crossfade that still states the verdict. */
export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
