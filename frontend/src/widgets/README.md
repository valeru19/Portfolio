# `widgets` — блоки страницы

Крупные секции лендинга. Собирают `entities` + `features` + `shared/content`, сами почти без низкоуровневой логики.

## Виджеты

| Виджет | Папка |
| --- | --- |
| Шапка | [`header/`](header/README.md) |
| Спираль HUD | [`spiral-nav/`](spiral-nav/README.md) |
| Hero | [`hero/`](hero/README.md) |
| About | [`about/`](about/README.md) |
| Stack | [`stack/`](stack/README.md) |
| Experience | [`experience/`](experience/README.md) |
| Projects | [`projects/`](projects/README.md) |
| Education | [`education/`](education/README.md) |
| Contacts | [`contacts/`](contacts/README.md) |
| Apply | [`apply/`](apply/README.md) |
| Reviews | [`reviews/`](reviews/README.md) |
| Footer | [`footer/`](footer/README.md) |

Порядок секций спирали задаёт `shared/content/sectionIds.ts`; оболочка — `NavSection` из section-navigation.
