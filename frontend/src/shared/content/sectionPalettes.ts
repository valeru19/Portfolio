import { ALL_SECTION_IDS, type SectionId } from "./sectionIds";

export type SectionPalette = {
  bg: string;
  fg: string;
  panel: string;
  accent: string;
  accentInk: string;
  border: string;
  muted: string;
};

/**
 * Order matches ALL_SECTION_IDS (hero → contacts, 9 slots).
 * Look up by section id — not by visible spiral index — so hiding reviews/apply
 * does not shift contacts onto the reviews palette.
 */
export const SECTION_PALETTE_DARK: readonly SectionPalette[] = [
  {
    bg: "#121516",
    fg: "#eef3f1",
    panel: "#181c1d",
    accent: "#5bb8a8",
    accentInk: "#062824",
    border: "#dfe8e5",
    muted: "#93a09c",
  },
  // about — warm dark (never paper-white in dark theme)
  {
    bg: "#1c1814",
    fg: "#f4efe8",
    panel: "#26211c",
    accent: "#e0a078",
    accentInk: "#1c140e",
    border: "#e8ddd0",
    muted: "#b0a498",
  },
  {
    bg: "#4f8f7a",
    fg: "#071f18",
    panel: "#4f8f7a",
    accent: "#dff5ec",
    accentInk: "#071f18",
    border: "#0d2a22",
    muted: "#1f3d33",
  },
  {
    bg: "#141820",
    fg: "#eef1f6",
    panel: "#1a1f2a",
    accent: "#7aa2ff",
    accentInk: "#0b1220",
    border: "#d5dceb",
    muted: "#97a3b6",
  },
  // projects — warm dark
  {
    bg: "#2a1f1e",
    fg: "#f8eeea",
    panel: "#352826",
    accent: "#e08a8a",
    accentInk: "#2a1414",
    border: "#f0ddd8",
    muted: "#b89b96",
  },
  {
    bg: "#5c6b9a",
    fg: "#0e1428",
    panel: "#5c6b9a",
    accent: "#e6eaf8",
    accentInk: "#0e1428",
    border: "#121830",
    muted: "#1d2540",
  },
  {
    bg: "#171814",
    fg: "#f2f1ea",
    panel: "#1e1f1a",
    accent: "#c4b46a",
    accentInk: "#1a180c",
    border: "#ece9dc",
    muted: "#a3a090",
  },
  // apply — cool dark
  {
    bg: "#152029",
    fg: "#e7eef3",
    panel: "#1a2833",
    accent: "#5a9ec4",
    accentInk: "#0c1822",
    border: "#c5d4e0",
    muted: "#8aa0b0",
  },
  // contacts — deep terracotta (not paper-white)
  {
    bg: "#3a2418",
    fg: "#fff6ec",
    panel: "#4a2e1c",
    accent: "#e0b089",
    accentInk: "#1f130c",
    border: "#e8c9a8",
    muted: "#c4a080",
  },
];

export const SECTION_PALETTE_LIGHT: readonly SectionPalette[] = [
  {
    bg: "#f0efec",
    fg: "#1a1a1a",
    panel: "#fafaf8",
    accent: "#1a8a7c",
    accentInk: "#ffffff",
    border: "#1a1a1a",
    muted: "#66706d",
  },
  {
    bg: "#1c1916",
    fg: "#f4efe8",
    panel: "#26211c",
    accent: "#e0a078",
    accentInk: "#1c140e",
    border: "#f0e8df",
    muted: "#b0a498",
  },
  {
    bg: "#2f6f5f",
    fg: "#f3fbf8",
    panel: "#2f6f5f",
    accent: "#b8e6d6",
    accentInk: "#0d2a22",
    border: "#0f2a22",
    muted: "#d5ebe3",
  },
  {
    bg: "#f7f8fb",
    fg: "#151922",
    panel: "#ffffff",
    accent: "#3f6fd6",
    accentInk: "#ffffff",
    border: "#151922",
    muted: "#5f6b7d",
  },
  {
    bg: "#2a1f1e",
    fg: "#f8eeea",
    panel: "#352826",
    accent: "#e08a8a",
    accentInk: "#2a1414",
    border: "#f0ddd8",
    muted: "#b89b96",
  },
  {
    bg: "#e8ebf5",
    fg: "#161b2c",
    panel: "#f4f6fb",
    accent: "#4a5f9a",
    accentInk: "#ffffff",
    border: "#161b2c",
    muted: "#5c6680",
  },
  {
    bg: "#1a1b16",
    fg: "#f2f1ea",
    panel: "#24251f",
    accent: "#d2c37a",
    accentInk: "#1a180c",
    border: "#ece9dc",
    muted: "#a8a592",
  },
  {
    bg: "#f4f8fb",
    fg: "#152029",
    panel: "#ffffff",
    accent: "#3d7ea6",
    accentInk: "#ffffff",
    border: "#152029",
    muted: "#5c6b76",
  },
  {
    bg: "#a86b3e",
    fg: "#fff8f1",
    panel: "#a86b3e",
    accent: "#ffe7d2",
    accentInk: "#2a160c",
    border: "#2a160c",
    muted: "#f0d8c4",
  },
];

export function paletteForTheme(theme: "dark" | "light"): readonly SectionPalette[] {
  return theme === "light" ? SECTION_PALETTE_LIGHT : SECTION_PALETTE_DARK;
}

/** Palette for a full-list index (0 = hero … 8 = contacts). */
export function sectionPaletteAt(theme: "dark" | "light", index: number): SectionPalette {
  const list = paletteForTheme(theme);
  const safeIndex = Math.min(Math.max(index, 0), list.length - 1);
  return list[safeIndex];
}

/** Palette for a section id — stable when some sections are hidden from the spiral. */
export function sectionPaletteForId(theme: "dark" | "light", sectionId: SectionId): SectionPalette {
  const index = ALL_SECTION_IDS.indexOf(sectionId);
  return sectionPaletteAt(theme, index < 0 ? 0 : index);
}
