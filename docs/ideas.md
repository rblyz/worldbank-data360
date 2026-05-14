# Ideas

## AI-first SDK

Основной потребитель пакета сегодня — не человек, а LLM-агент (Claude, GPT и др.).

### Что уже есть
- `.explain()` — агент проверяет что запрашивает до fetch
- `.toContext()` — готовая markdown-строка для вставки в промпт без постобработки
- Компактный формат — null-поля вырезаны, токены не тратятся впустую
- Человекочитаемые ошибки — `{ message, suggestion, docsUrl }`

### Что добавить

**1. `client.discover()`** — самодискавери без чтения доки

Агент не читает документацию — он вызывает `discover()` и понимает с чего начать:

```ts
client.discover()
// → { databases: ['WB_WDI', 'WB_GEM', ...], startHere: "client.data('WB_WDI').indicator(...).area(...).from(...).to(...).fetch()", ... }
```

Реализация: один запрос к `/data360/searchv2` за списком баз + статичный справочник по fluent API.

**2. Умные ошибки с подсказками**

Сейчас ошибка при неверном индикаторе — просто `count: 0`. Нужно:

```
// не: count: 0, records: []
// а: "Indicator 'WB_WDI_SP_POP_TOT' not found in WB_WDI.
//     Did you mean 'WB_WDI_SP_POP_TOTL'?
//     Use client.indicators('WB_WDI').fetch() to see all valid IDs."
```

Требует: детект пустого ответа + fuzzy match по списку индикаторов (или просто подсказка как их получить).

**3. MCP-сервер — главный приоритет после базового SDK**

Агенты подключают одной строчкой и сразу видят готовые тулзы:

```json
{ "mcpServers": { "worldbank": { "command": "npx", "args": ["worldbank-data360/mcp"] } } }
```

Тулзы: `query_data`, `search_indicators`, `list_countries`, `explain_query`, `get_disaggregation`.

Отдельный канал дистрибуции помимо npm — агенты подключают MCP напрямую без написания кода.

---

## Анализ конкурентов

Подробный разбор всех найденных npm-пакетов: [docs/mcp-research.md](mcp-research.md)

Ссылки:
- https://www.npmjs.com/package/worldbank-mcp (1.6k downloads/wk — лидер)
- https://www.npmjs.com/package/world-bank-mcp-server
- https://www.npmjs.com/package/pipeworx-mcp-worldbank
- https://www.npmjs.com/package/@data360/mcp-ui (официальный WB React UI)
- https://www.npmjs.com/package/@data360/mcp-viz-core (официальный WB viz core)
- https://www.npmjs.com/package/@tianyuio/worldbank-cli

### worldbank/data360-mcp (официальный Python-сервер)

World Bank сами выпустили MCP-сервер на Python: [github.com/worldbank/data360-mcp](https://github.com/worldbank/data360-mcp).

### Что у них есть

- Один инструмент — `data360_search` (поиск по индикаторам)
- FastMCP + HTTP transport (порт 8000), не stdio
- Pydantic-модели, OData-фильтры для продвинутых запросов
- Примеры с LangGraph multi-agent и LangChain
- Codelist-кэш (маппинг кодов в человекочитаемые названия)

### Что у них НЕТ

- **Нет `get_data`** — LLM находит индикатор но не может сам получить данные
- **Нет автопагинации** — при >1000 записей данные обрезаются
- **Нет `discover()`** — агент не знает с чего начать без подсказки пользователя
- **Нет CLI** — только библиотека
- **Нет npm-пакета** — Python-only, TypeScript-экосистема не покрыта

### Как это меняет стратегию

Аудитории не пересекаются: их пакет в PyPI для Python-агентов, наш в npm для TypeScript-агентов и всего JS/TS-стека. LLM не смотрит на язык — ему важно что инструмент делает.

Наше реальное преимущество — **полный флоу в одном MCP без участия пользователя**:

```
discover → search → get_data (с автопагинацией)
```

Их MCP останавливается на поиске. Наш доходит до данных. Это ключевое отличие для LLM-агентов — они могут ответить на вопрос "какой ВВП Польши с 2000 по 2023?" полностью автономно.

### Инструменты которые нужны в нашем MCP

- `discover` — что вообще есть (базы, количество индикаторов)
- `search_indicators` — найти индикатор по теме
- `get_data` — получить данные (с автопагинацией)
- `get_metadata` — документация по индикатору
- `list_countries` — список стран с кодами (REF_AREA)

Пять инструментов покрывают весь флоу от вопроса до ответа.

---

## Продвижение MCP-сервера

Хостинг не нужен — сервер запускается локально через `npx`, пользователь ничего не поднимает.

### Реестры (высокий ROI, делать в первую очередь)

- **[MCP Registry](https://github.com/modelcontextprotocol/servers)** — официальный список от Anthropic, PR с добавлением своего сервера. Главный источник — Claude Desktop берёт список оттуда.
- **[Smithery.ai](https://smithery.ai)** — каталог MCP серверов, регистрация через форму.
- **[mcp.so](https://mcp.so)** — ещё один агрегатор.

### Сообщества

- Reddit: r/ClaudeAI, r/ChatGPT — пост типа "World Bank data in Claude in one line"
- Twitter/X — Anthropic-комьюнити активно, хайп на MCP сейчас высокий
- Hacker News — оформить как "Show HN"

### Контент

Пост на Medium/dev.to с примером: агент анализирует ВВП стран прямо в Claude без единой строки кода — это хорошо заходит визуально. Скриншот Claude Desktop с реальными данными World Bank сильнее любого текста.

---

## Известные баги данных API (не наши)

### Broken WDI CO₂ indicator
`WB_WDI_EN_ATM_CO2E_PC` — присутствует в результатах поиска с высоким score, но возвращает пустой ответ при запросе данных. Рабочий аналог: `WB_ESG_EN_ATM_CO2E_PC` (база WB_ESG). Данные ESG заканчиваются на 2020 — системный лаг в 2 года.

### HCI не ежегодный
`WB_HCI_HCI` публикуется только в benchmark-годы: 2010, 2018, 2020. Не подходит для временных рядов.

### Китай и расходы на образование
`WB_WDI_SE_XPD_TOTL_GD_ZS` для CHN: данные за 2000–2022 отсутствуют полностью (7 точек в 90-х, одна в 2023). Альтернативный источник нужен.

