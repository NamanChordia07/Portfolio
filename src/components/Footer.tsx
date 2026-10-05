import Link from "next/link";

import { site } from "@/content/site";

import { GitHub, LinkedIn, Mail, Phone } from "./Icons";
import { LocalTime } from "./Interactive";

const socials = [
  { href: site.github, label: "GitHub", icon: GitHub, external: true },
  { href: site.linkedin, label: "LinkedIn", icon: LinkedIn, external: true },
  { href: `mailto:${site.email}`, label: "Email", icon: Mail, external: false },
  { href: site.phoneHref, label: "Phone", icon: Phone, external: false },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line">
      <div className="mx-auto max-w-[1560px] px-4 pt-14 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-3xl text-fg">
              Open to <em>new things.</em>
            </p>
            <p className="mt-2 max-w-sm text-sm text-muted">{site.openTo}</p>
          </div>
          <ul className="flex gap-2">
            {socials.map(({ href, label, icon: Icon, external }) => (
              <li key={label}>
                <a
                  href={href}
                  aria-label={label}
                  title={label}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="grid size-11 place-items-center rounded-full border border-line text-muted transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:text-accent"
                >
                  <Icon className="size-[18px]" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p
        aria-hidden="true"
        className="mx-auto mt-10 max-w-[1560px] select-none px-4 text-center font-display text-[clamp(3.5rem,15.5vw,13rem)] leading-[0.82] tracking-[-0.04em] text-transparent sm:px-6"
        style={{ WebkitTextStroke: "1px var(--line-strong)" }}
      >
        Naman Chordia
      </p>
      <div className="mx-auto flex max-w-[1560px] flex-col gap-3 px-4 py-6 font-mono text-xs text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <p>
          © {new Date().getFullYear()} {site.name} · Pune, India · <LocalTime />
        </p>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span>Underlined numbers show their source</span>
          <Link href="/resume" className="hover:text-fg">
            Resume
          </Link>
          <a href="#main" className="hover:text-fg">
            Back to top ↑
          </a>
        </p>
      </div>
    </footer>
  );
}
