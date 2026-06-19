import { storageKey } from "@/lib/brand";

export type Theme = "light" | "dark";

export const THEME_KEY = storageKey("theme");
export const DEFAULT_THEME: Theme = "dark";
