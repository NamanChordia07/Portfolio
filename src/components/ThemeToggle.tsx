"use client";

import { useSyncExternalStore } from "react";

import { Moon, Sun } from "./Icons";

export type Theme = "light" | "dark";

/** Dark is the designed default; light applies only when chosen (and is remembered). */
export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribe(onChange: () => void) {
  window.addEventListener("themechange", onChange);
  return () => window.removeEventListener("themechange", onChange);
}

export function setTheme(next: Theme) {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {
    /* storage can be unavailable (private mode); the choice still applies to this page */
  }
  window.dispatchEvent(new Event("themechange"));
}

export function toggleTheme() {
  setTheme(currentTheme() === "dark" ? "light" : "dark");
}

export function useTheme() {
  return useSyncExternalStore<Theme | null>(subscribe, currentTheme, () => null);
}

export function ThemeToggle() {
  const theme = useTheme();
  const label = theme === "light" ? "Switch to dark theme" : "Switch to light theme";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-sunk hover:text-fg"
    >
      {theme === "light" ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
    </button>
  );
}

/** Runs before paint: applies a stored theme (default dark) and flags that JavaScript is running. */
export const themeScript = `(function(){var d=document.documentElement;d.dataset.js="";try{var t=localStorage.getItem("theme");d.dataset.theme=t==="light"?"light":"dark";}catch(e){d.dataset.theme="dark";}})();`;
