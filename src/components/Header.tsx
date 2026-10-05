"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { site } from "@/content/site";

import { openCommandMenu } from "./CommandMenu";
import { Menu, Search } from "./Icons";
import { ThemeToggle } from "./ThemeToggle";

const nav = [
  { href: "/#work", label: "Work" },
  { href: "/#experience", label: "Experience" },
  { href: "/resume", label: "Resume" },
  { href: "/#contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  // The menu is open for the page it was opened on; navigating anywhere closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:pt-4">
      <div
        className={`pointer-events-auto w-full max-w-[1560px] rounded-[22px] border transition-all duration-500 ease-[var(--ease)] ${
          scrolled || open ? "border-line-strong/70 bg-bg/75 shadow-[var(--shadow)] backdrop-blur-xl" : "border-transparent bg-transparent"
        }`}
      >
        <div className="flex h-14 items-center justify-between pl-2.5 pr-2 sm:pl-3">
          <Link href="/" className="group flex items-center gap-2.5 rounded-full pr-2" aria-label="Naman Chordia, home">
            <span className="relative block size-8 overflow-hidden rounded-full ring-1 ring-line-strong transition-transform duration-500 group-hover:scale-105">
              <Image src={site.avatar} alt="" width={64} height={64} className="size-full object-cover" priority />
            </span>
            <span className="text-[15px] font-medium tracking-tight text-fg">
              Naman Chordia
              <span className="ml-2 hidden font-mono text-[11px] font-normal text-subtle md:inline">/ AI &amp; Automation</span>
            </span>
          </Link>

          <nav aria-label="Primary" className="flex items-center gap-1">
            <ul className="hidden items-center sm:flex" onMouseLeave={() => setHovered(null)}>
              {nav.map((item) => (
                <li key={item.href} className="relative">
                  {hovered === item.href && <span aria-hidden="true" className="fade-in absolute inset-0 rounded-full bg-sunk" />}
                  <Link
                    href={item.href}
                    onMouseEnter={() => setHovered(item.href)}
                    className={`relative block rounded-full px-3.5 py-2 text-sm transition-colors hover:text-fg ${pathname === item.href ? "text-fg" : "text-muted"}`}
                    aria-current={pathname === item.href ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={openCommandMenu}
              aria-label="Open command menu"
              title="Command menu (⌘K / Ctrl K)"
              className="group ml-1 flex h-9 items-center gap-2 rounded-full border border-line px-2.5 text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              <Search className="size-4" />
              <kbd className="hidden font-mono text-[11px] text-subtle group-hover:text-muted lg:block">⌘K</kbd>
            </button>
            <ThemeToggle />
            <button
              type="button"
              className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-sunk hover:text-fg sm:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpenOn(open ? null : pathname)}
            >
              {open ? (
                <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              ) : (
                <Menu className="size-[18px]" />
              )}
            </button>
          </nav>
        </div>
        {open && (
          <ul id="mobile-nav" className="fade-in border-t border-line px-2 pb-3 pt-2 sm:hidden">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="block rounded-xl px-3 py-3 text-base text-fg hover:bg-sunk" onClick={() => setOpenOn(null)}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
}
