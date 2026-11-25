import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";

import type { SectionId } from "@/shared/content";
import { cn } from "@/shared/lib";

import { useSpiralNavigationContext } from "../hooks/useSpiralNavigationContext";
import { SPIRAL_DOM_ATTR } from "../model/panelStateAttrs";

import styles from "./NavSection.module.css";

type Props = {
  id: SectionId;
  children: ReactNode;
  className?: string;
  "aria-labelledby"?: string;
};

/** Section shell that registers with spiral navigation (panel + inner scroll). */
export function NavSection({ id, children, className, ...aria }: Props) {
  const { isAccessible, registerPanel, goTo, currentIndex, sectionIds } =
    useSpiralNavigationContext();
  const sectionRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sectionIndex = sectionIds.indexOf(id);

  useEffect(() => {
    if (!sectionRef.current || !scrollRef.current) return;
    return registerPanel(id, sectionRef.current, scrollRef.current);
  }, [registerPanel, id]);

  const onSectionClick = (event: MouseEvent<HTMLElement>) => {
    if (isAccessible) return;
    if (sectionIndex < 0 || sectionIndex === currentIndex) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("a,button,input,textarea,select,label,form")) return;
    goTo(sectionIndex);
  };

  if (isAccessible) {
    return (
      <section
        ref={sectionRef}
        id={id}
        className={cn(styles.accessibleSection, className)}
        {...aria}
      >
        <div ref={scrollRef}>{children}</div>
      </section>
    );
  }

  return (
    // Click-to-jump matches legacy; keyboard uses HUD dots + arrow/page keys.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- see comment above
    <section
      ref={sectionRef}
      id={id}
      className={cn(styles.spiralSection, className)}
      {...{ [SPIRAL_DOM_ATTR.section]: "" }}
      onClick={onSectionClick}
      {...aria}
    >
      <div ref={scrollRef} className={styles.panelScroll}>
        {children}
      </div>
    </section>
  );
}
