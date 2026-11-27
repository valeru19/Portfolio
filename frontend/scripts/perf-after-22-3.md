# Perf after 22.3 (wrap «Наверх» + compositor fix)

Created: 2026-11-27T16:03:49.926Z  
Base: http://127.0.0.1:4210/Portfolio/  
Software: true  
Runs: 5 × 8 matrices (viewport × cpu × hash)  
Failures/timeouts: 0  

Focus scenarios: Наверх from 5/6/7, 7→2, 7→3. Raw: `perf-nasp-focus-22-3.json`.

| Scenario | n | avg max | max | runs>100 |
|---|---:|---:|---:|---:|
| Наверх from 5 | 40 | 45.0 | 100 | 0 |
| Наверх from 6 | 40 | 47.9 | 83.3 | 0 |
| Наверх from 7 | 40 | 52.1 | 83.4 | 0 |
| 7→2 | 40 | 49.6 | 99.9 | 0 |
| 7→3 | 40 | 51.7 | 100 | 0 |

## До / после (wrap)

| | Наверх from 7 max | runs>100 |
|---|---:|---:|
| До (reverse, `perf-after-22-2`) | ≤50 мс | 0 |
| Wrap без compositor-fix | 266.8 мс | 40/40 |
| Wrap + forceSolidInstant / без panel will-change | 83.4 мс | 0 |

CDP (до фикса, 1912×1000, `#contacts`): длинные кадры — `ActivateSyncTree` / `PushLayerProperties` (30–38 слоёв) и пачка `RasterTask` на layerId 25/27, не один длинный Layout.

## Приёмка

- После «Наверх» с 7-й: `01 из 07`, hash `#hero`, скриншот 1440×900 = cold hero (0 отличающихся пикселей).
- Во время wrap: `data-panel-view=blur` на второй секции, max live blur ≤ 1.
