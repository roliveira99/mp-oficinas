import type { Theme } from "@/types/theme";
import { DEFAULT_THEME, THEME_KEY } from "@/types/theme";
import { migrateStorageKey } from "@/lib/brand";

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  migrateStorageKey("theme");
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

export function saveTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

export function getInitialTheme(): Theme {
  const stored = getStoredTheme();
  if (stored) return stored;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return DEFAULT_THEME;
}
