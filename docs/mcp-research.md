# MCP Competitor Research

## Summary

| Package | Type | API | Tools | Downloads/wk | Published |
|---|---|---|---|---|---|
| `worldbank-mcp` | MCP server | WB v2 | 7 | 1,672 | 2026-03-01 |
| `world-bank-mcp-server` | MCP server | WB v2 | 10 | 7 | 2026-03-31 |
| `pipeworx-mcp-worldbank` | MCP stub → remote | WB v2 | 4 | 7 | 2026-04-01 |
| `@data360/mcp-ui` | React UI renderer | — | — | 117 | 2026-04-28 |
| `@data360/mcp-viz-core` | TS utility lib | — | — | 79 | 2026-04-28 |
| `@tianyuio/worldbank-cli` | CLI (no MCP) | WB v2 | 6 cmds | 11 | 2026-03-19 |

**Key gap:** все JS/TS пакеты используют `api.worldbank.org/v2` (WDI). Никто не покрывает `data360api.worldbank.org` — наш эксклюзив в npm-экосистеме.

---

## `worldbank-mcp` — лидер по загрузкам

- npm: https://www.npmjs.com/package/worldbank-mcp
- GitHub: github.com/tianyuio/worldbank-mcp
- 1,672 downloads/wk — лидирует только за счёт возраста (первый пакет в нише)
- 7 инструментов, сгруппированных по доменам: `get-economic-data`, `get-social-data`, `get-education-data`, `get-health-data`, `get-countries`, `get-country-info`, `search-indicators`
- Проблема: домен-бакеты с фиксированными enum-индикаторами — негибко. Произвольный код индикатора через эти тулзы передать неудобно
- Зависимости: axios + zod + commander (тяжелее всех в этой нише)
- Нет Data360, нет disaggregation, нет автопагинации

## `world-bank-mcp-server` — самый полный из v2-серверов

- npm: https://www.npmjs.com/package/world-bank-mcp-server
- GitHub: github.com/bhayanak/worldbank-mcp-server
- 10 инструментов: включая `wb_compare_countries`, `wb_get_timeseries` со sparkline, `wb_get_regional_data`, `wb_list_topics`
- LRU-кэш встроен, Vitest тесты, tsup сборка — технически аккуратный
- Бонус: VS Code extension для авторегистрации сервера
- Нет Data360, нет disaggregation

## `pipeworx-mcp-worldbank` — remote-заглушка

- npm: https://www.npmjs.com/package/pipeworx-mcp-worldbank
- Не локальный сервер — проксирует на `https://gateway.pipeworx.io/worldbank/mcp`
- 4 тулзы: `get_country`, `get_indicator`, `get_population` (shortcut), `get_gdp` (shortcut)
- `main` указывает на `.ts` файл без сборки — локально не запустить
- По сути реклама Pipeworx-гейтвея

## `@data360/mcp-ui` + `@data360/mcp-viz-core` — официальные World Bank UI-компоненты

- npm: https://www.npmjs.com/package/@data360/mcp-ui
- npm: https://www.npmjs.com/package/@data360/mcp-viz-core
- Не MCP-серверы — React/TS рендереры для вывода из Python Data360 MCP
- `mcp-viz-core`: framework-agnostic ядро с `prepareSpec`, WB Vega-Lite тема, ноль зависимостей
- `mcp-ui`: React 18+ компоненты с Vega-Lite чартами в World Bank стиле, экспорт в картинку
- Сигнал: официальный WB-тим строит viz-layer поверх MCP — значит визуализация данных будет востребована

## `@tianyuio/worldbank-cli` — CLI без MCP

- npm: https://www.npmjs.com/package/@tianyuio/worldbank-cli
- Тот же автор что `worldbank-mcp` (tianyuio)
- Команда `wb`: countries, country, indicators, data, income-levels, regions, aliases
- Поддерживает CSV/JSON/table output, `--latest` для последнего значения
- Нет зависимостей, нет сборки — просто `src/cli.js` напрямую
- Нет MCP, нет Data360

---

## Выводы

1. **Наша ниша свободна**: ни один JS/TS пакет не работает с Data360 API — только Python-сервер от самого World Bank
2. **Главный конкурент по загрузкам** (`worldbank-mcp`) технически слабее: фиксированные домен-бакеты, axios, нет disaggregation
3. **Архитектура**: все делают `get_data(indicator, country)` — мы можем дать `search → discover → get_data` полным флоу в одном сервере
4. **Viz-сигнал**: официальный WB строит Vega-Lite рендерер для MCP — можно учесть при дизайне инструментов (возвращать данные в формате удобном для чарта)
5. **Дистрибуция**: `worldbank-mcp` стартовал в Aug 2025 и набрал 1.6k/wk — рынок есть
