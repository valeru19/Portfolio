import { sectionPaletteForId, type SectionId } from "@/shared/content";
import { useTheme } from "@/shared/theme";

import { useSpiralNavigationApi } from "../hooks/useSpiralNavigationContext";
import { SPIRAL_INFINITY_GHOST_COUNT } from "../model/constants";
import { SPIRAL_DOM_ATTR } from "../model/panelStateAttrs";

import styles from "./SpiralInfinityTrail.module.css";

/**
 * Декоративный хвост спирали: solid-квадраты дальше последней секции,
 * цвета — основные `--panel` карточек по кругу.
 */
export function SpiralInfinityTrail() {
  const { isAccessible, sectionIds } = useSpiralNavigationApi();
  const { theme } = useTheme();

  if (isAccessible || sectionIds.length === 0) return null;

  return (
    <>
      {Array.from({ length: SPIRAL_INFINITY_GHOST_COUNT }, (_, i) => {
        const colorId = sectionIds[i % sectionIds.length] as SectionId;
        const panel = sectionPaletteForId(theme, colorId).panel;
        return (
          <div
            key={i}
            className={styles.ghost}
            aria-hidden="true"
            {...{ [SPIRAL_DOM_ATTR.ghost]: String(i) }}
            style={{ background: panel, borderColor: panel }}
          />
        );
      })}
    </>
  );
}
