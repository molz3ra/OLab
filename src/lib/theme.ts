export type ThemePref = "system" | "light" | "dark";
export type Theme = "light" | "dark";

export const THEME_COLORS: Record<Theme, string> = { light: "#faf9f6", dark: "#161714" };

export const isThemePref = (v: unknown): v is ThemePref =>
  v === "system" || v === "light" || v === "dark";

export function resolveTheme(pref: ThemePref, prefersDark: boolean): Theme {
  return pref === "system" ? (prefersDark ? "dark" : "light") : pref;
}

export function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
}
