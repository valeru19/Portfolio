# Шаг 22 — итоговая приёмка (software Chrome)

Base: `perf-after-22-final.json` / `.md`  
Failures/timeouts: **0**  
onProgress на 7→4 (8 прогонов, 1912×1000): max **50.1 мс** — вклад незаметен, без изменений.

## Цель «нет кадров >100 мс»

**Не достигнута полностью.** Global max **133.4 мс**.

Сценарии с max>100 (все по **1 из 5** прогонов, соседние шаги):

| Scenario | max | runs>100 |
|---|---:|---:|
| 1440×900 cpu1 hash=none 1→0 | 133.4 | 1 |
| 1912×1000 cpu4 hash=none 3→2 | 133.3 | 1 |
| 1912×1000 cpu4 hash=contacts 3→2 | 116.7 | 1 |
| 1912×1000 cpu1 hash=none 3→2 | 116.6 | 1 |
| 1912×1000 cpu1 hash=contacts 3→2 | 116.6 | 1 |

«Наверх» / circle-Наверх / 7→2 / 7→3 / 7→4 / spring: max ≤ **100 мс**, runs>100 = **0** (см. таблицы focus + final).

## Программный рендеринг ≠ GPU ноутбука

Замеры — Chromium headless, `--disable-gpu` / SwiftShader. На Google Chrome Windows с GPU цифры могут отличаться.

### Короткая инструкция для проверки на ноутбуке

1. `chrome://gpu` — WebGL/Rasterization статус, ANGLE.
2. Масштаб Windows 125–150%, питание от батареи и от сети — по 1 прогону.
3. Открыть сайт с `?perf=1`, DevTools → Performance, 3× «Наверх» с последней секции, переход по точкам 7→2, смена темы во время хода.
4. Смотреть Long tasks / Frames / Raster — слои панелей hero/about при wrap.
