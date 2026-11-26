import type { ReactNode } from "react";

import { cn } from "@/shared/lib";

import { useSpiralNavigationApi } from "../hooks/useSpiralNavigationContext";
import { SPIRAL_DOM_ATTR } from "../model/panelStateAttrs";

import { SpiralInfinityTrail } from "./SpiralInfinityTrail";
import styles from "./SpiralStage.module.css";

type Props = {
  children: ReactNode;
};

export function SpiralStage({ children }: Props) {
  const { isAccessible, spiralRef, stageRef } = useSpiralNavigationApi();

  return (
    <main
      id="main"
      ref={(node) => {
        stageRef.current = node;
      }}
      className={cn(styles.stage, isAccessible && styles.stageAccessible)}
      {...{ [SPIRAL_DOM_ATTR.stage]: "" }}
    >
      <div
        ref={(node) => {
          spiralRef.current = node;
        }}
        className={cn(styles.spiral, isAccessible && styles.spiralAccessible)}
        {...{ [SPIRAL_DOM_ATTR.root]: "" }}
      >
        {children}
        <SpiralInfinityTrail />
      </div>
    </main>
  );
}
