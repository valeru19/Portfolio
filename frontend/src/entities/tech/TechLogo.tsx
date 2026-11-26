import { assetUrl } from "@/shared/lib";

import styles from "./TechLogo.module.css";

type Props = {
  id: string;
  name: string;
  src: string;
  compact?: boolean;
};

export function TechLogo({ id, name, src, compact = false }: Props) {
  return (
    <div className={compact ? styles.tileCompact : styles.tile} data-logo={id}>
      <img
        src={assetUrl(src)}
        alt=""
        width={72}
        height={44}
        decoding="async"
        loading="lazy"
      />
      <span>{name}</span>
    </div>
  );
}
