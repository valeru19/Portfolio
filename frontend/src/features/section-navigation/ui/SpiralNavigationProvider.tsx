import type { ReactNode } from "react";

import type { SectionId } from "@/shared/content";

import { useSpiralNavigation } from "../hooks/useSpiralNavigation";
import { SpiralNavigationContext } from "../model/navigationContext";

type Props = {
  sectionIds: SectionId[];
  children: ReactNode;
};

export function SpiralNavigationProvider({ sectionIds, children }: Props) {
  const value = useSpiralNavigation({ sectionIds });
  return (
    <SpiralNavigationContext.Provider value={value}>{children}</SpiralNavigationContext.Provider>
  );
}
