import type { ReactNode } from "react";

import { cn } from "@/shared/lib";

import styles from "./Container.module.css";

type Props = {
  children: ReactNode;
  className?: string;
};

export function Container({ children, className }: Props) {
  return <div className={cn(styles.container, className)}>{children}</div>;
}
