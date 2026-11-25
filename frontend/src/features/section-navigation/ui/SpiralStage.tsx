import type { ReactNode } from "react";

import { cn } from "@/shared/lib";

import { useSpiralNavigationContext } from "../hooks/useSpiralNavigationContext";
import { SPIRAL_DOM_ATTR } from "../model/panelStateAttrs";

import styles from "./SpiralStage.module.css";

type Props = {
  children: ReactNode;
};

export function SpiralStage({ children }: Props) {
  const { isAccessible, spiralRef, stageRef } = useSpiralNavigationContext();

  return (
    <main
      id="main"
      ref={(node) => {
        stageRef.current = node;
      }}
      className={cn(styles.stage, isAccessible && styles.stageAccessible)}
    >
      <div
        ref={(node) => {
          spiralRef.current = node;
        }}
        className={cn(styles.spiral, isAccessible && styles.spiralAccessible)}
        {...{ [SPIRAL_DOM_ATTR.root]: "" }}
      >
        {children}
      </div>
    </main>
  );
}
