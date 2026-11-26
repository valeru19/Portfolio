# `features/section-navigation` — спиральная навигация

Главная фича лендинга: секции стоят на золотой спирали (φ), переходы крутит GSAP, есть режим обычного скролла (accessible), палитры и blur неактивных панелей.

## Подпапки

| Папка                       | Роль                                                      |
| --------------------------- | --------------------------------------------------------- |
| [`hooks/`](hooks/README.md) | React-хуки: навигация, motion, панели, колесо/клавиши/тач |
| [`lib/`](lib/README.md)     | GSAP-loader, transform, blur, палитры на DOM              |
| [`model/`](model/README.md) | Геометрия φ, константы, индексы, wheel-lock, attrs        |
| [`ui/`](ui/README.md)       | Stage, NavSection, HUD, ModeToggle, Provider              |

## Файл

- **`index.ts`** — публичный API фичи (провайдер, хуки, `NavSection`, mode toggle и т.д.) для виджетов/`App`.

## Поток данных (кратко)

```
SpiralNavigationProvider
  └─ useSpiralNavigation
       ├─ useAccessibleMode
       ├─ useSpiralPanels   (markActive, colors, blur idle)
       ├─ useSpiralMotion   (GSAP tween, blur crossfade)
       ├─ useSpiralDomEffects (resize, mode switch)
       └─ useWheelStep / useTouchStep / useKeyboardStep
```

Секции страницы оборачиваются в `NavSection` и регистрируют DOM в `panelsRef`.
