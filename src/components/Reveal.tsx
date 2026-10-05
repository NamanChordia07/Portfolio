"use client";

import { MotionConfig } from "motion/react";
import { type CSSProperties, type ElementType, type ReactNode, useEffect, useRef } from "react";

/** Honours prefers-reduced-motion for every Motion animation below it. */
export function MotionRoot({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/**
 * Marks an element with data-inview while it is on screen. `once` keeps the mark after the first
 * sighting (scroll reveals); without it the mark toggles, which pauses looping visuals off screen.
 */
function useInView<T extends HTMLElement>(once: boolean, rootMargin = "0px 0px -8% 0px") {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.dataset.inview = "";
          if (once) io.disconnect();
        } else if (!once) {
          delete el.dataset.inview;
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, rootMargin]);
  return ref;
}

/**
 * Fades and lifts its children in the first time they scroll into view. Without JavaScript, in
 * print and under prefers-reduced-motion the content is simply there (see globals.css).
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: ElementType;
}) {
  const ref = useInView<HTMLElement>(true);
  return (
    <Tag ref={ref} data-reveal="" className={className} style={{ "--d": `${delay}s` } as CSSProperties}>
      {children}
    </Tag>
  );
}

/** Wraps a looping decorative visual so its CSS animations only run while it is visible. */
export function LiveVisual({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useInView<HTMLDivElement>(false, "0px");
  return (
    <div ref={ref} data-anim="" className={className}>
      {children}
    </div>
  );
}
