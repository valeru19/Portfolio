import { content } from "@/shared/content";
import { useT } from "@/shared/i18n";

import {
  useSpiralNavigationApi,
  useSpiralNavigationContext,
} from "../hooks/useSpiralNavigationContext";

import styles from "./ModeToggle.module.css";

export function ModeToggle() {
  const t = useT();
  const { isAccessible, toggleAccessible } = useSpiralNavigationApi();
  const { modeTransitionPhase } = useSpiralNavigationContext();
  const busy = modeTransitionPhase !== "idle";
  const label = isAccessible ? t(content.spiral.accessibleOff) : t(content.spiral.accessibleOn);

  return (
    <button
      type="button"
      className={styles.btn}
      onClick={toggleAccessible}
      aria-pressed={isAccessible}
      aria-busy={busy || undefined}
      disabled={busy}
    >
      {label}
    </button>
  );
}
