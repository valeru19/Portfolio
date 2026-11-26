import { useEffect, useRef, useState } from "react";

import { SPIRAL_FLIP_DURATION_MS } from "../model/constants";
import { PANEL_VIEW_MS } from "../lib/panelLayerAnimator";

import styles from "./SpiralPerfOverlay.module.css";

type FrameStats = {
  maxMs: number;
  over50: number;
  over100: number;
  frames: number;
  startDelayMs: number | null;
};

type SessionRow = {
  label: string;
  deltas: number[];
  startDelayMs: number | null;
};

function readPerfFlag(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("perf") !== "1") return false;
  return Boolean(import.meta.env.DEV) || import.meta.env.VITE_PERF === "1";
}

/** Окно после посадки: fade вида + 500 мс. */
const POST_LAND_MS = PANEL_VIEW_MS + 500;

/**
 * Оверлей `?perf=1`: кадры хода + после посадки, задержка старта.
 * В консоль — таблица по сценариям (ручной прогон на GPU).
 *
 * Ходы для проверки: ArrowDown, ArrowUp, HUD-точки, «Наверх» с 7-й секции,
 * прерывание (вниз→вверх / Наверх во время шага).
 */
export function SpiralPerfOverlay() {
  const [enabled] = useState(readPerfFlag);
  const [stats, setStats] = useState<FrameStats>({
    maxMs: 0,
    over50: 0,
    over100: 0,
    frames: 0,
    startDelayMs: null,
  });
  const sessionRef = useRef<SessionRow[]>([]);
  const spinDeltasRef = useRef<number[]>([]);
  const lastRef = useRef(0);
  const spinningRef = useRef(false);
  const clickAtRef = useRef(0);
  const spinStartAtRef = useRef(0);
  const postTimerRef = useRef(0);
  const recordingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    let raf = 0;
    const tick = (now: number) => {
      if (lastRef.current) {
        const d = now - lastRef.current;
        if (recordingRef.current && d < 2000) {
          spinDeltasRef.current.push(d);
        }
      }
      lastRef.current = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const kindRef = { current: "step" };

    const finishSession = () => {
      recordingRef.current = false;
      const deltas = spinDeltasRef.current.slice();
      const maxMs = deltas.length ? Math.max(...deltas) : 0;
      const over50 = deltas.filter((x) => x > 50).length;
      const over100 = deltas.filter((x) => x > 100).length;
      const startDelayMs =
        spinStartAtRef.current && clickAtRef.current
          ? Number((spinStartAtRef.current - clickAtRef.current).toFixed(1))
          : null;
      setStats({
        maxMs: Number(maxMs.toFixed(1)),
        over50,
        over100,
        frames: deltas.length,
        startDelayMs,
      });
      const kindLabel = kindRef.current === "nasp" ? "Наверх" : kindRef.current;
      const label = `${kindLabel}#${sessionRef.current.length + 1}`;
      sessionRef.current.push({ label, deltas, startDelayMs });
      console.table(
        sessionRef.current.map((row) => {
          const max = row.deltas.length ? Math.max(...row.deltas) : 0;
          const avg = row.deltas.length
            ? row.deltas.reduce((a, b) => a + b, 0) / row.deltas.length
            : 0;
          const sorted = [...row.deltas].sort((a, b) => a - b);
          const p95 = sorted.length
            ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
            : 0;
          return {
            scenario: row.label,
            frames: row.deltas.length,
            avgMs: Number(avg.toFixed(2)),
            p95Ms: Number(p95.toFixed(2)),
            maxMs: Number(max.toFixed(2)),
            over50: row.deltas.filter((x) => x > 50).length,
            over100: row.deltas.filter((x) => x > 100).length,
            startDelayMs: row.startDelayMs,
          };
        }),
      );
    };

    const onMutate = () => {
      const on = document.body.classList.contains("is-spinning");
      const kind = document.body.dataset.spinKind || "step";
      if (on && !spinningRef.current) {
        if (postTimerRef.current) {
          window.clearTimeout(postTimerRef.current);
          postTimerRef.current = 0;
        }
        spinDeltasRef.current = [];
        spinningRef.current = true;
        recordingRef.current = true;
        kindRef.current = kind;
        spinStartAtRef.current = performance.now();
        if (!clickAtRef.current) clickAtRef.current = spinStartAtRef.current;
      } else if (!on && spinningRef.current) {
        spinningRef.current = false;
        // Продолжаем писать кадры до конца fade + 500 мс.
        postTimerRef.current = window.setTimeout(() => {
          postTimerRef.current = 0;
          finishSession();
          clickAtRef.current = 0;
        }, POST_LAND_MS);
      } else if (on) {
        kindRef.current = kind;
      }
    };

    const markClick = () => {
      clickAtRef.current = performance.now();
    };
    document.addEventListener("pointerdown", markClick, true);
    document.addEventListener("keydown", markClick, true);

    const mo = new MutationObserver(onMutate);
    mo.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "data-spin-kind"],
    });

    console.info(
      `[perf] overlay on. flip=${SPIRAL_FLIP_DURATION_MS}ms view=${PANEL_VIEW_MS}ms postLand=${POST_LAND_MS}ms. Ходы: ↓ ↑ HUD «Наверх» прерывание.`,
    );

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      document.removeEventListener("pointerdown", markClick, true);
      document.removeEventListener("keydown", markClick, true);
      if (postTimerRef.current) window.clearTimeout(postTimerRef.current);
    };
  }, [enabled]);

  if (!enabled) return null;

  const naspRows = sessionRef.current.filter((r) => r.label.startsWith("Наверх"));
  const stepRows = sessionRef.current.filter((r) => !r.label.startsWith("Наверх"));
  const maxOf = (rows: SessionRow[]) =>
    rows.reduce((m, r) => Math.max(m, r.deltas.length ? Math.max(...r.deltas) : 0), 0);

  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <div className={styles.title}>perf</div>
      <div>last max {stats.maxMs.toFixed(1)} ms</div>
      <div>&gt;50ms ×{stats.over50}</div>
      <div>&gt;100ms ×{stats.over100}</div>
      <div>frames {stats.frames}</div>
      <div>start {stats.startDelayMs != null ? `${stats.startDelayMs} ms` : "—"}</div>
      <div>Наверх max {maxOf(naspRows).toFixed(1)}</div>
      <div>step max {maxOf(stepRows).toFixed(1)}</div>
    </div>
  );
}
