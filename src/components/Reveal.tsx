"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** Honours prefers-reduced-motion for every Motion animation below it. */
export function MotionRoot({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/**
 * A short fade-and-rise on page load, in pure CSS: content is always present in the HTML, works
 * without JavaScript, prints, and collapses to instant under prefers-reduced-motion.
 */
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <div className={`reveal ${className}`} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}
