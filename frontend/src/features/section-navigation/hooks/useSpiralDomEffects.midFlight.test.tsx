import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useSpiralDomEffects } from "./useSpiralDomEffects";

describe("useSpiralDomEffects mid-flight", () => {
  it("does not killMotion when only callbacks/theme identity would change", () => {
    const killMotion = vi.fn();
    const setIsSpinning = vi.fn();
    const setTargetIndex = vi.fn();
    const buildSpiral = vi.fn();
    const paintSpiralTransform = vi.fn();
    const markActive = vi.fn();
    const markAccessibleCards = vi.fn();
    const applyColors = vi.fn();
    const settleActivePanel = vi.fn();
    const ensureGsap = vi.fn(async () => null);

    const currentIndexRef = { current: 4 };
    const pendingIndexRef = { current: 0 };
    const spinningFlagRef = { current: true };
    const spinningRef = { current: true };
    const rotationRef = { current: -360 };
    const spiralRef = { current: document.createElement("div") };
    const panelsRef = { current: new Map() };

    const base = {
      isAccessible: false,
      sectionIds: ["hero", "about"] as import("@/shared/content").SectionId[],
      spiralRef,
      panelsRef,
      rotationRef,
      spinningRef,
      currentIndexRef,
      killMotion,
      ensureGsap,
      buildSpiral,
      paintSpiralTransform,
      markActive,
      markAccessibleCards,
      applyColors,
      settleActivePanel,
      setIsSpinning,
      setCurrentIndex: vi.fn(),
      setTargetIndex,
      spinningFlagRef,
      pendingIndexRef,
    };

    const { rerender } = renderHook(
      (props: typeof base) => {
        useSpiralDomEffects(props);
      },
      { initialProps: base },
    );

    const killsAfterMount = killMotion.mock.calls.length;
    expect(killsAfterMount).toBeGreaterThanOrEqual(1);
    // Посадка на pending (цель), не на промежуточный current.
    expect(currentIndexRef.current).toBe(0);
    expect(setTargetIndex).toHaveBeenCalledWith(0);

    killMotion.mockClear();
    setIsSpinning.mockClear();

    // Новые identity колбэков / «смена темы» без смены isAccessible — ход жив.
    rerender({
      ...base,
      killMotion: vi.fn(),
      applyColors: vi.fn(),
      buildSpiral: vi.fn(),
      paintSpiralTransform: vi.fn(),
      markActive: vi.fn(),
      settleActivePanel: vi.fn(),
      ensureGsap: vi.fn(async () => null),
    });

    expect(killMotion).not.toHaveBeenCalled();
    expect(setIsSpinning).not.toHaveBeenCalled();
  });

  it("on accessible mode lands on pending, not mid-index", () => {
    const killMotion = vi.fn();
    const setIsSpinning = vi.fn();
    const setTargetIndex = vi.fn();
    const currentIndexRef = { current: 5 };
    const pendingIndexRef = { current: 0 };
    const spinningFlagRef = { current: true };

    const props = {
      isAccessible: false,
      sectionIds: ["hero", "about", "stack"] as import("@/shared/content").SectionId[],
      spiralRef: { current: document.createElement("div") },
      panelsRef: { current: new Map() },
      rotationRef: { current: -450 },
      spinningRef: { current: true },
      currentIndexRef,
      killMotion,
      ensureGsap: vi.fn(async () => null),
      buildSpiral: vi.fn(),
      paintSpiralTransform: vi.fn(),
      markActive: vi.fn(),
      markAccessibleCards: vi.fn(),
      applyColors: vi.fn(),
      settleActivePanel: vi.fn(),
      setIsSpinning,
      setCurrentIndex: vi.fn(),
      setTargetIndex,
      spinningFlagRef,
      pendingIndexRef,
    };

    const { rerender } = renderHook((p: typeof props) => useSpiralDomEffects(p), {
      initialProps: props,
    });

    killMotion.mockClear();
    setTargetIndex.mockClear();
    currentIndexRef.current = 5;
    pendingIndexRef.current = 0;

    rerender({ ...props, isAccessible: true });

    expect(killMotion).toHaveBeenCalled();
    expect(currentIndexRef.current).toBe(0);
    expect(setTargetIndex).toHaveBeenCalledWith(0);
    expect(spinningFlagRef.current).toBe(false);
  });
});
