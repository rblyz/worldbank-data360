# worldbank

TypeScript SDK and CLI for the [World Bank Data360 API](https://data360api.worldbank.org). Fluent interface, automatic pagination, AI-first design.

No API key required — the API is fully public.

## CLI

The fastest way to explore World Bank data without writing code.

```bash
# run without installing
npx worldbank-data360 search "co2 emissions" --top 5

# install globally for shorter commands
npm install -g worldbank-data360
worldbank search "co2 emissions" --top 5
```

### Typical workflow

**1. Find an indicator**

```bash
worldbank search "life expectancy" --top 5 --database WB_WDI
```
```json
{
  "total": 549,
  "shown": 5,
  "items": [
    { "id": "WB_WDI_SP_DYN_LE00_IN", "name": "Life expectancy at birth, total (years)", "databaseId": "WB_WDI", "score": 76.2 },
    ...
  ]
}
```

**2. Check coverage before fetching**

```bash
worldbank info WB_WDI_SP_DYN_LE00_IN
```
```json
{
  "name": "Life expectancy at birth, total (years)",
  "database": "World Development Indicators (WDI)",
  "areas": 265,
  "years": "1960–2024"
}
```

If `years` is a list instead of a range, the indicator is published only in specific years — request only those years in `--from`/`--to`.

**3. Fetch data**

```bash
worldbank data WB_WDI --indicator WB_WDI_SP_DYN_LE00_IN --area POL,DEU,USA --from 2010 --to 2023
```
```json
{
  "count": 42,
  "indicator": "WB_WDI_SP_DYN_LE00_IN",
  "indicatorName": "Life expectancy at birth, total (years)",
  "database": "WB_WDI",
  "databaseName": "World Development Indicators (WDI)",
  "meta": { "UNIT_MEASURE": "YR" },
  "records": {
    "DEU": [
      { "period": "2010", "value": 80.5 },
      { "period": "2011", "value": 80.6 }
    ],
    "POL": [...],
    "USA": [...]
  }
}
```

Multiple countries → records grouped by country code. Single country → flat array. Pipe to jq: `worldbank data ... | jq '.records.POL'`

### All CLI commands

| Command | Description |
|---|---|
| `worldbank discover` | List all 100+ databases with indicator counts |
| `worldbank search <query> [--top N] [--database ID]` | Search indicators by keyword |
| `worldbank info <INDICATOR_ID>` | Show name, countries, year range, and dimensions |
| `worldbank data <DB> --indicator <ID> [--area] [--from] [--to] [--top N] [--all]` | Fetch data |
| `worldbank explain <DB> --indicator <ID> [...]` | Preview query without fetching |
| `worldbank countries` | List all countries with ISO codes |

Default result limit is 100 rows. Add `--all` to fetch everything.

## SDK

```bash
npm install worldbank-data360
```

```ts
import { WorldBankClient } from 'worldbank-data360'

const client = new WorldBankClient()

const result = await client
  .data('WB_WDI')
  .indicator('WB_WDI_NY_GDP_PCAP_CD')
  .area(['POL', 'DEU', 'USA'])
  .from('2010').to('2023')
  .fetch()

// result.count    → number of records
// result.records  → DataRecord[]
```

`OBS_VALUE` from the raw API is always a string — the SDK casts it to `number`. Null and empty fields are stripped. Records are sorted by year, then country code.

### Data queries

```ts
const builder = client.data('WB_WDI')

builder
  .indicator('WB_WDI_SP_POP_TOTL')
  .area(['POL', 'DEU', 'USA'])   // single string or array
  .from('2000')
  .to('2023')
  .sex('F')                       // demographic filters
  .age('Y15T24')
  .urbanisation('U')

const result = await builder.fetch()
```

### Search

```ts
const results = await client
  .search()
  .search('poverty')
  .database('WB_WDI')   // optional: filter by database
  .top(10)
  .fetchItems()
// → { total, shown, items: [{ id, name, databaseId, score, topics? }] }
```

### Discover databases

```ts
const overview = await client.discover()
// → { totalIndicators: 12938, databases: [{ id: 'WB_WDI', name: 'World Development Indicators', indicatorCount: 1534 }, ...] }
```

### Indicator dimensions

```ts
const dims = await client
  .disaggregation('WB_WDI')
  .indicator('WB_WDI_SP_POP_TOTL')
  .fetch()
// → [{ field_name: 'SEX', label_name: 'Sex', field_value: ['M', 'F', '_T'] }, ...]
```

### AI-first methods

```ts
// Preview query without fetching
const info = client
  .data('WB_WDI')
  .indicator('WB_WDI_SP_POP_TOTL')
  .area(['POL', 'DEU'])
  .from('2010').to('2023')
  .explain()

// Fetch and format as markdown table for an LLM prompt
const ctx = await client
  .data('WB_WDI')
  .indicator('WB_WDI_SP_POP_TOTL')
  .area('POL')
  .from('2020').to('2023')
  .toContext()
```

### Countries

```ts
const countries = await client.countries().fetch()
// → { meta: { total }, items: [{ id, name, region, incomeLevel }] }
```

### Error handling

```ts
import { SDKRequestError } from 'worldbank-data360'

try {
  await client.data('INVALID_DB').fetch()
} catch (err) {
  if (err instanceof SDKRequestError) {
    console.log(err.sdkError.message)     // "HTTP 400 from GET /data360/data"
    console.log(err.sdkError.suggestion)  // "Check your DATABASE_ID..."
    console.log(err.sdkError.docsUrl)
  }
}
```

## API endpoints

| Method | Endpoint |
|---|---|
| `.discover()` | `POST /data360/searchv2` (facets) |
| `.data()` | `GET /data360/data` |
| `.search()` | `POST /data360/searchv2` |
| `.indicators()` | `GET /data360/indicators` |
| `.disaggregation()` | `GET /data360/disaggregation` |
| `.metadata()` | `POST /data360/metadata` |
| `.countries()` | `GET /V2/country` (World Bank V2) |

Both APIs are public — no authentication required.

## Data attribution

Data sourced from the [World Bank Data360 API](https://data360api.worldbank.org) and [World Bank V2 API](https://api.worldbank.org/V2). Subject to [World Bank Terms of Use](https://www.worldbank.org/en/about/legal/terms-and-conditions).

This is an unofficial open-source wrapper, not affiliated with or endorsed by the World Bank Group.

## License

MIT
