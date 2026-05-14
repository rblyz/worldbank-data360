# Ideas

## CLI для ручного тестирования

Сейчас чтобы дёрнуть SDK из терминала нужно писать громоздкий `node --input-type=module << 'EOF' ... EOF`.

Идея: `scripts/wb.ts` — минимальный CLI поверх `WorldBankClient`.

```bash
npx tsx scripts/wb.ts countries
npx tsx scripts/wb.ts data WB_WDI --indicator WB_WDI_SP_POP_TOTL --area POL --from 2020 --to 2023
npx tsx scripts/wb.ts search poverty --top 5
npx tsx scripts/wb.ts indicators WB_WDI
```

Вывод — JSON в stdout, можно пайпить в `jq`.

Альтернатива полегче: добавить `"repl": "node --input-type=module"` в `package.json` scripts — тогда хотя бы `npm run repl << 'EOF' ... EOF`.

---

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
