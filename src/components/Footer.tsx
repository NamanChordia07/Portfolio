import Link from "next/link";

import { site } from "@/content/site";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-3 px-4 py-10 text-sm text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {new Date().getFullYear()} {site.name}. Numbers with a dotted underline show their source on hover.
        </p>
        <ul className="flex gap-5">
          <li>
            <a className="hover:text-fg" href={site.github} rel="noopener noreferrer" target="_blank">
              GitHub
            </a>
          </li>
          <li>
            <a className="hover:text-fg" href={site.linkedin} rel="noopener noreferrer" target="_blank">
              LinkedIn
            </a>
          </li>
          <li>
            <Link className="hover:text-fg" href="/resume">
              Resume
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
