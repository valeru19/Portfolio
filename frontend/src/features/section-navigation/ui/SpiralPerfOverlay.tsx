import { useEffect, useRef, useState } from "react";

import { SPIRAL_FLIP_DURATION_MS } from "../model/constants";

import styles from "./SpiralPerfOverlay.module.css";

type FrameStats = {
  maxMs: number;
  over50: number;
  frames: number;
};

function readPerfFlag(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("perf") !== "1") return false;
  // DEV или явный VITE_PERF=1
  return Boolean(import.meta.env.DEV) || import.meta.env.VITE_PERF === "1";
}

/**
 * Оверлей `?perf=1`: max frame за последний ход и счётчик >50ms.
 * В консоль — таблица по сценариям (ручной прогон на GPU).
 */
export function SpiralPerfOverlay() {
  const [enabled] = useState(readPerfFlag);
  const [stats, setStats] = useState<FrameStats>({ maxMs: 0, over50: 0, frames: 0 });
  const sessionRef = useRef<{ label: string; deltas: number[] }[]>([]);
  const spinDeltasRef = useRef<number[]>([]);
  const lastRef = useRef(0);
  const spinningRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    let raf = 0;
    const tick = (now: number) => {
      if (lastRef.current) {
        const d = now - lastRef.current;
        if (spinningRef.current && d < 2000) {
          spinDeltasRef.current.push(d);
        }
      }
      lastRef.current = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const kindRef = { current: "step" };
    const onMutate = () => {
      const on = document.body.classList.contains("is-spinning");
      const kind = document.body.dataset.spinKind || "step";
      if (on && !spinningRef.current) {
        spinDeltasRef.current = [];
        spinningRef.current = true;
        kindRef.current = kind;
      } else if (!on && spinningRef.current) {
        spinningRef.current = false;
        const deltas = spinDeltasRef.current.slice();
        const maxMs = deltas.length ? Math.max(...deltas) : 0;
        const over50 = deltas.filter((x) => x > 50).length;
        setStats({ maxMs: Number(maxMs.toFixed(1)), over50, frames: deltas.length });
        const kindLabel = kindRef.current === "nasp" ? "Наверх" : kindRef.current;
        const label = `${kindLabel}#${sessionRef.current.length + 1}`;
        sessionRef.current.push({ label, deltas });
        console.table(
          sessionRef.current.map((row) => {
            const max = row.deltas.length ? Math.max(...row.deltas) : 0;
            const avg = row.deltas.length
              ? row.deltas.reduce((a, b) => a + b, 0) / row.deltas.length
              : 0;
            return {
              scenario: row.label,
              frames: row.deltas.length,
              avgMs: Number(avg.toFixed(2)),
              maxMs: Number(max.toFixed(2)),
              over50: row.deltas.filter((x) => x > 50).length,
              over100: row.deltas.filter((x) => x > 100).length,
            };
          }),
        );
      } else if (on) {
        kindRef.current = kind;
      }
    };

    const mo = new MutationObserver(onMutate);
    mo.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "data-spin-kind"],
    });

    console.info(
      `[perf] overlay on. Flip duration const=${SPIRAL_FLIP_DURATION_MS}ms. Flip and check console.table.`,
    );

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
    };
  }, [enabled]);

  if (!enabled) return null;

  const naspRows = sessionRef.current.filter((r) => r.label.startsWith("Наверх"));
  const stepRows = sessionRef.current.filter((r) => !r.label.startsWith("Наверх"));
  const maxOf = (rows: typeof sessionRef.current) =>
    rows.reduce((m, r) => Math.max(m, r.deltas.length ? Math.max(...r.deltas) : 0), 0);

  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <div className={styles.title}>perf</div>
      <div>last max {stats.maxMs.toFixed(1)} ms</div>
      <div>&gt;50ms ×{stats.over50}</div>
      <div>frames {stats.frames}</div>
      <div>Наверх max {maxOf(naspRows).toFixed(1)}</div>
      <div>step max {maxOf(stepRows).toFixed(1)}</div>
    </div>
  );
}
