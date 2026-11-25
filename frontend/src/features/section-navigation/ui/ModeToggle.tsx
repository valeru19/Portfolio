import { content } from "@/shared/content";
import { useT } from "@/shared/i18n";

import { useSpiralNavigationContext } from "../hooks/useSpiralNavigationContext";

import styles from "./ModeToggle.module.css";

export function ModeToggle() {
  const t = useT();
  const { isAccessible, toggleAccessible } = useSpiralNavigationContext();
  const label = isAccessible ? t(content.spiral.accessibleOff) : t(content.spiral.accessibleOn);

  return (
    <button
      type="button"
      className={styles.btn}
      onClick={toggleAccessible}
      aria-pressed={isAccessible}
    >
      {label}
    </button>
  );
}
