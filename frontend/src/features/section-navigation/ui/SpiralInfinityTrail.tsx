import { sectionPaletteForId, type SectionId } from "@/shared/content";
import { useTheme } from "@/shared/theme";

import { useSpiralNavigationApi } from "../hooks/useSpiralNavigationContext";
import { SPIRAL_INFINITY_GHOST_COUNT } from "../model/constants";
import { SPIRAL_DOM_ATTR } from "../model/panelStateAttrs";

import styles from "./SpiralInfinityTrail.module.css";

/**
 * Декоративный хвост спирали: solid-квадраты дальше последней секции.
 * Заливка = `--panel`, рамка = `--border` той же секции.
 * Индекс цвета здесь — стартовый (слот N+i); `paintInfinityGhosts` перекрашивает
 * по абсолютному слоту, чтобы на wrap last→first цвета не прыгали.
 */
export function SpiralInfinityTrail() {
  const { isAccessible, sectionIds } = useSpiralNavigationApi();
  const { theme } = useTheme();

  if (isAccessible || sectionIds.length === 0) return null;

  const n = sectionIds.length;

  return (
    <>
      {Array.from({ length: SPIRAL_INFINITY_GHOST_COUNT }, (_, i) => {
        // Стартовый слот = N+i (пока ring-next не занял N).
        const colorId = sectionIds[(n + i) % n] as SectionId;
        const palette = sectionPaletteForId(theme, colorId);
        return (
          <div
            key={i}
            className={styles.ghost}
            aria-hidden="true"
            {...{ [SPIRAL_DOM_ATTR.ghost]: String(i) }}
            style={{
              background: palette.panel,
              borderColor: palette.border,
              color: palette.border,
            }}
          />
        );
      })}
    </>
  );
}
