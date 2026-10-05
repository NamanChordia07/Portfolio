"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { useRef } from "react";

import type { Job } from "@/content/site";

import { ReadMore } from "./Effects";
import { Reveal } from "./Reveal";

/** Roles as one vertical timeline; the accent line fills as you scroll through it. */
export function Timeline({ jobs }: { jobs: Job[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });
  const rows = jobs.flatMap((job) => job.roles.map((role) => ({ job, role })));

  return (
    <div className="relative">
      <div aria-hidden="true" className="absolute bottom-3 left-[7px] top-3 w-px bg-line md:left-[200px]" />
      <motion.div
        aria-hidden="true"
        style={{ scaleY }}
        className="absolute bottom-3 left-[7px] top-3 w-px origin-top bg-gradient-to-b from-accent via-accent to-accent/20 md:left-[200px]"
      />
      <ol ref={ref} className="relative space-y-3">
        {rows.map(({ job, role }, i) => (
          <Reveal as="li" key={`${job.company}-${role.title}`} delay={0.04 * i} className="group relative grid gap-1 pl-9 md:grid-cols-[200px_1fr] md:gap-0 md:pl-0">
            <span
              aria-hidden="true"
              className="absolute left-[3px] top-[30px] size-[9px] rounded-full border-2 border-accent bg-bg transition-all duration-300 group-hover:scale-150 group-hover:bg-accent group-hover:shadow-[0_0_14px_var(--accent)] md:left-[196px]"
            />
            <div className="pt-6 md:pr-10 md:text-right">
              <p className="font-mono text-xs text-subtle">{role.dates}</p>
              <p className="mt-1 hidden text-sm text-muted md:block">{job.company.replace(" (a SAS company)", "")}</p>
            </div>
            <div className="spot rounded-2xl border border-transparent p-5 transition-colors duration-300 group-hover:border-line group-hover:bg-elev/50 sm:p-6 md:ml-8">
              <h3 className="text-lg font-semibold tracking-[-0.01em] text-fg">{role.title}</h3>
              <p className="mt-0.5 text-sm text-muted">
                {job.company} · {job.location}
              </p>
              <div className="mt-4">
                <ReadMore as="ul" className="space-y-2.5 text-[15px] leading-relaxed text-muted">
                  {role.points.map((p) => (
                    <li key={p} className="flex gap-3">
                      <span className="mt-[11px] h-px w-3 shrink-0 bg-accent" aria-hidden="true" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ReadMore>
              </div>
            </div>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
