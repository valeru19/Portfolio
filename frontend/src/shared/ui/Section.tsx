import type { ReactNode } from "react";

import { cn } from "@/shared/lib";

import styles from "./Section.module.css";

type Props = {
  id: string;
  children: ReactNode;
  className?: string;
  "aria-labelledby"?: string;
};

export function Section({ id, children, className, ...aria }: Props) {
  return (
    <section id={id} className={cn(styles.section, className)} {...aria}>
      {children}
    </section>
  );
}
