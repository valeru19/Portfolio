import { useLayoutEffect, useRef, type MouseEvent, type ReactNode } from "react";

import type { SectionId } from "@/shared/content";
import { cn } from "@/shared/lib";

import { useSpiralNavigationApi } from "../hooks/useSpiralNavigationContext";
import { SPIRAL_DOM_ATTR } from "../model/panelStateAttrs";

import styles from "./NavSection.module.css";

type Props = {
  id: SectionId;
  children: ReactNode;
  className?: string;
  "aria-labelledby"?: string;
};

/**
 * Оболочка секции. Одна DOM-ветка для spiral и accessible —
 * смена режима меняет только className, без remount children (иначе фриз).
 */
export function NavSection({ id, children, className, ...aria }: Props) {
  // Только API-контекст — не подписан на currentIndex, не ре-рендерится на каждый land.
  const { isAccessible, registerPanel, goTo, sectionIds, currentIndexRef } =
    useSpiralNavigationApi();
  const sectionRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sectionIndex = sectionIds.indexOf(id);

  // layout: DomEffects читает panels map в том же кадре смены режима.
  useLayoutEffect(() => {
    if (!sectionRef.current || !scrollRef.current) return;
    return registerPanel(id, sectionRef.current, scrollRef.current);
  }, [registerPanel, id]);

  const onSectionClick = (event: MouseEvent<HTMLElement>) => {
    if (isAccessible) return;
    if (sectionIndex < 0 || sectionIndex === currentIndexRef.current) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("a,button,input,textarea,select,label,form")) return;
    goTo(sectionIndex);
  };

  return (
    // Клик по панели = переход (спираль); клавиатура — точки HUD и стрелки/Page.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- см. комментарий выше
    <section
      ref={sectionRef}
      id={id}
      className={cn(isAccessible ? styles.accessibleSection : styles.spiralSection, className)}
      {...{ [SPIRAL_DOM_ATTR.section]: "" }}
      onClick={onSectionClick}
      {...aria}
    >
      {/*
        Контент резкий; blur — статичная backdrop-вуаль с opacity.
        В accessible вуаль passthrough (см. CSS).
      */}
      <div className={styles.panelFrame}>
        <div
          ref={scrollRef}
          className={cn(styles.panelScroll, isAccessible && styles.accessibleCardBody)}
          {...{ [SPIRAL_DOM_ATTR.scroll]: "" }}
        >
          {children}
        </div>
        <img
          className={styles.panelBake}
          alt=""
          aria-hidden="true"
          decoding="async"
          draggable={false}
          {...{ [SPIRAL_DOM_ATTR.bake]: "" }}
        />
        <div
          className={styles.panelFrostFill}
          aria-hidden="true"
          {...{ [SPIRAL_DOM_ATTR.frostFill]: "" }}
        />
        <div
          className={styles.panelBlurVeil}
          aria-hidden="true"
          {...{
            [SPIRAL_DOM_ATTR.blurVeil]: "",
            [SPIRAL_DOM_ATTR.blurLayer]: "",
          }}
        />
      </div>
    </section>
  );
}
