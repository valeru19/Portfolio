import type { ReactNode } from "react";

import styles from "./Tag.module.css";

type Props = {
  children: ReactNode;
  logoSrc?: string;
  logoAlt?: string;
  logoId?: string;
};

export function Tag({ children, logoSrc, logoAlt = "", logoId }: Props) {
  return (
    <span className={styles.tag} data-logo={logoId}>
      {logoSrc ? <img src={logoSrc} alt={logoAlt} width={16} height={16} /> : null}
      {children}
    </span>
  );
}
