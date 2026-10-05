"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useId, useMemo, useState } from "react";

import { resume, site, work } from "@/content/site";

import { ArrowRight, ArrowUpRight, Copy, Download, FileText, GitHub, LinkedIn, Mail, Moon, Phone, Search, Sparkle } from "./Icons";
import { copyText } from "./Interactive";
import { toggleTheme } from "./ThemeToggle";

type Item = { id: string; group: string; label: string; hint?: string; icon: ReactNode; run: () => void; keywords?: string };

const OPEN_EVENT = "open-command-menu";
const DIALOG_ID = "command-menu";
const INPUT_ID = "command-menu-input";

const dialogEl = () => document.getElementById(DIALOG_ID) as HTMLDialogElement | null;

export function openCommandMenu() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/**
 * ⌘K / Ctrl+K menu: jump anywhere, copy the email, call, download the resume, switch theme.
 * Built on <dialog> (focus trap, Escape, inert background) with a combobox + listbox inside.
 */
export function CommandMenu() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();

  const close = useCallback(() => dialogEl()?.close(), []);
  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );
  const openTab = useCallback(
    (href: string) => {
      close();
      window.open(href, "_blank", "noopener,noreferrer");
    },
    [close],
  );

  const items: Item[] = useMemo(
    () => [
      { id: "work", group: "Navigate", label: "Selected work", icon: <Sparkle />, run: () => go("/#work") },
      { id: "experience", group: "Navigate", label: "Experience", icon: <ArrowRight />, run: () => go("/#experience") },
      { id: "contact", group: "Navigate", label: "Contact", icon: <Mail />, run: () => go("/#contact") },
      { id: "resume-page", group: "Navigate", label: "Resume", icon: <FileText />, run: () => go("/resume") },
      ...work.map((w) => ({
        id: w.slug,
        group: "Case studies",
        label: w.title,
        hint: w.kicker.split(" · ")[1],
        icon: <ArrowRight />,
        run: () => go(`/work/${w.slug}`),
        keywords: w.stack.join(" "),
      })),
      { id: "copy-email", group: "Contact", label: "Copy email address", hint: site.email, icon: <Copy />, run: () => (close(), copyText(site.email, "Email copied")) },
      { id: "email", group: "Contact", label: "Send an email", icon: <Mail />, run: () => (close(), (window.location.href = `mailto:${site.email}`)) },
      { id: "call", group: "Contact", label: "Call", hint: site.phone, icon: <Phone />, run: () => (close(), (window.location.href = site.phoneHref)) },
      { id: "copy-phone", group: "Contact", label: "Copy phone number", hint: site.phone, icon: <Copy />, run: () => (close(), copyText(site.phone, "Phone number copied")) },
      { id: "linkedin", group: "Links", label: "LinkedIn", icon: <LinkedIn />, run: () => openTab(site.linkedin) },
      { id: "github", group: "Links", label: "GitHub", icon: <GitHub />, run: () => openTab(site.github) },
      {
        id: "download",
        group: "Links",
        label: "Download resume (PDF)",
        icon: <Download />,
        run: () => {
          close();
          const a = document.createElement("a");
          a.href = resume.file;
          a.download = "";
          a.click();
        },
      },
      { id: "theme", group: "Preferences", label: "Toggle light / dark theme", icon: <Moon />, run: () => (close(), toggleTheme()) },
    ],
    [close, go, openTab],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => `${i.label} ${i.group} ${i.hint ?? ""} ${i.keywords ?? ""}`.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    const show = () => {
      const d = dialogEl();
      if (!d || d.open) return;
      setQuery("");
      setActive(0);
      d.showModal();
      requestAnimationFrame(() => document.getElementById(INPUT_ID)?.focus());
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialogEl()?.open) close();
        else show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, show);
    };
  }, [close]);

  const current = results[Math.min(active, results.length - 1)];

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (results.length ? (a + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (results.length ? (a - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter" && current) {
      e.preventDefault();
      current.run();
    }
  }

  const groups: { name: string; items: { item: Item; index: number }[] }[] = [];
  results.forEach((item, index) => {
    const g = groups.at(-1);
    if (g && g.name === item.group) g.items.push({ item, index });
    else groups.push({ name: item.group, items: [{ item, index }] });
  });
  return (
    <dialog
      id={DIALOG_ID}
      aria-label="Command menu"
      className="cmdk m-auto mt-[12vh] w-[min(640px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-line-strong bg-elev p-0 text-fg shadow-[0_40px_120px_-20px_rgb(0_0_0/0.7)] backdrop:bg-transparent"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search className="size-[18px] shrink-0 text-subtle" />
        <input
          id={INPUT_ID}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={current ? `${listId}-${current.id}` : undefined}
          aria-label="Search pages and actions"
          placeholder="Search pages, projects, actions…"
          className="h-14 w-full bg-transparent text-[15px] text-fg outline-none placeholder:text-subtle focus-visible:outline-none"
        />
        <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px] text-subtle sm:block">esc</kbd>
      </div>
      <div id={listId} role="listbox" aria-label="Results" className="max-h-[min(420px,60vh)] overflow-y-auto p-2">
        {results.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted">No matches. Try “voice”, “resume” or “email”.</p>}
        {groups.map((g) => {
          const labelId = `${listId}-${g.name.replace(/\W+/g, "-").toLowerCase()}`;
          return (
            <ul key={g.name} role="group" aria-labelledby={labelId}>
              <li role="presentation" id={labelId} className="px-3 pb-1.5 pt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">
                {g.name}
              </li>
              {g.items.map(({ item, index }) => {
                const selected = item === current;
                return (
                  <li
                    key={item.id}
                    id={`${listId}-${item.id}`}
                    role="option"
                    aria-selected={selected}
                    onMouseMove={() => setActive(index)}
                    onClick={() => item.run()}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] transition-colors ${
                      selected ? "bg-sunk text-fg" : "text-muted"
                    }`}
                  >
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-lg border [&>svg]:size-4 ${selected ? "border-accent/50 text-accent" : "border-line text-subtle"}`}
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.hint && <span className="hidden truncate font-mono text-xs text-subtle sm:block">{item.hint}</span>}
                    {selected && <ArrowUpRight className="size-4 text-subtle" />}
                  </li>
                );
              })}
            </ul>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-line px-4 py-2.5 font-mono text-[11px] text-subtle">
        <span>↑↓ to move · ↵ to select</span>
        <span>⌘K / Ctrl K</span>
      </div>
    </dialog>
  );
}
