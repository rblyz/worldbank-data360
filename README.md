# worldbank

TypeScript SDK for the [World Bank Data360 API](https://data360api.worldbank.org). Fluent interface, automatic pagination, AI-first design.

```ts
const data = await client
  .data('WB_WDI')
  .indicator('WB_WDI_SP_POP_TOTL')
  .area(['POL', 'DEU', 'USA'])
  .from('2000').to('2023')
  .fetch()
```

## Install

```bash
npm install worldbank
```

No API key required — both APIs are fully public.

## Quick start

```ts
import { WorldBankClient } from 'worldbank'

const client = new WorldBankClient()

const result = await client
  .data('WB_WDI')
  .indicator('WB_WDI_NY_GDP_PCAP_CD')
  .area(['POL', 'DEU', 'USA'])
  .from('2010').to('2023')
  .fetch()

console.log(result.count)       // 42
console.log(result.records[0])  // { value: 50024.869, area: 'USA', period: '2011', ... }
```

`OBS_VALUE` from the raw API is always a string — the SDK casts it to `number` for you. Null and empty fields are stripped from every record.

## CLI

```bash
npx worldbank discover
npx worldbank search "birth rate" --top 5
npx worldbank data WB_WDI --indicator WB_WDI_SP_DYN_CBRT_IN --area POL --from 2000 --to 2023
npx worldbank explain WB_WDI --indicator WB_WDI_SP_DYN_CBRT_IN --area POL
npx worldbank countries
```

The `data` command fetches human-readable names for the indicator and database alongside the data:

```json
{
  "count": 24,
  "indicator": "WB_WDI_SP_DYN_CBRT_IN",
  "indicatorName": "Birth rate, crude (per 1,000 people)",
  "area": "POL",
  "database": "WB_WDI",
  "databaseName": "World Development Indicators (WDI)",
  "meta": { "FREQ": "A", "DECIMALS": "2", "OBS_STATUS": "A" },
  "records": [
    { "period": "2000", "value": 9.9 },
    { "period": "2001", "value": 9.6 }
  ]
}
```

Records are sorted by year. Repeated fields (`FREQ`, `DECIMALS`, etc.) appear once in `meta`, not in every record. SDMX placeholder values (`_Z`, `_T`) are stripped automatically.

By default `data` shows up to 100 records — use `--all` to fetch everything or `--top N` to set a limit. Output is JSON, pipeable to `jq`.

## Getting started without reading docs

Don't know where to begin? Three steps:

```ts
// 1. What's available?
const overview = await client.discover()
// → { totalIndicators: 12938, databases: [{ id: 'WB_WDI', indicatorCount: 1534 }, ...], hint: '...' }

// 2. Find an indicator by keyword
const results = await client.search().search('co2 emissions').top(5).fetchItems()
// → { count: 300, items: [{ id: 'WB_SSGD_CO2_EMISSIONS', name: 'CO2 emissions', databaseId: 'WB_SSGD' }, ...] }

// 3. Fetch the data
const data = await client.data('WB_SSGD').indicator('WB_SSGD_CO2_EMISSIONS').area('POL').from('2000').to('2023').fetch()
```

## Fluent API

### Data queries — `client.data(databaseId)`

```ts
const builder = client.data('WB_WDI')

// Filters — all optional, all chainable
builder
  .indicator('WB_WDI_SP_POP_TOTL')   // indicator ID
  .area('POL')                         // single country
  .area(['POL', 'DEU', 'USA'])         // or multiple
  .from('2000')                        // start year
  .to('2023')                          // end year
  .sex('F')                            // demographic filters
  .age('Y15T24')
  .urbanisation('U')
  .breakdown1('...')                   // indicator-specific dimensions
  .freq('A')                           // frequency
  .unitMeasure('USD')

// Fetch — handles pagination automatically (API max 1000 records/call)
const result = await builder.fetch()
// → { count: number, records: DataRecord[] }
```

### AI-first methods

```ts
// explain() — inspect the query before fetching, no HTTP call
const info = client
  .data('WB_WDI')
  .indicator('WB_WDI_SP_POP_TOTL')
  .area(['POL', 'DEU'])
  .from('2010').to('2023')
  .explain()
// → {
//     databaseId: 'WB_WDI',
//     indicator: 'WB_WDI_SP_POP_TOTL',
//     area: ['POL', 'DEU'],
//     timePeriodFrom: '2010',
//     timePeriodTo: '2023',
//     filters: {},
//     description: 'Database: WB_WDI | Indicator: WB_WDI_SP_POP_TOTL | Area: POL, DEU | Period: 2010–2023'
//   }

// toContext() — fetch and format as a markdown table ready for an LLM prompt
const ctx = await client
  .data('WB_WDI')
  .indicator('WB_WDI_SP_POP_TOTL')
  .area('POL')
  .from('2020').to('2023')
  .toContext()
// → ## World Bank Data: Database: WB_WDI | ...
//   Total records: 4
//
//   | period | area | indicator | value |
//   |--------|------|-----------|-------|
//   | 2020   | POL  | WB_WDI_SP_POP_TOTL | 37515748 |
//   ...
```

### Search — `client.search()`

Full-text and semantic search across all Data360 datasets.

```ts
// fetchItems() — normalized results: id, name, databaseId, score, topics
const results = await client
  .search()
  .search('poverty')
  .top(10)
  .fetchItems()
// → { count: 1501, items: [{ id: 'WB_WDI_SI_POV_GAPS', name: 'Poverty gap...', databaseId: 'WB_WDI', score: 43.8, topics: [] }] }

// fetch() — raw JSON for advanced use (OData filters, vector queries, facets)
const raw = await client
  .search()
  .search('poverty')
  .filter("series_description/topics/any(t: t/name eq 'Health')")
  .top(10)
  .fetch()
```

### Indicators — `client.indicators(datasetId)`

List all indicator IDs available in a dataset.

```ts
const indicators = await client.indicators('WB_WDI').fetch()
```

### Disaggregation — `client.disaggregation(datasetId)`

Get available disaggregation dimensions (sex, age, urbanisation, etc.) for a dataset or specific indicator.

```ts
const dims = await client
  .disaggregation('WB_WDI')
  .indicator('WB_WDI_SP_POP_TOTL')
  .fetch()
```

### Metadata — `client.metadata()`

Query dataset metadata using [OData filter syntax](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html).

```ts
const meta = await client
  .metadata()
  .query("*&$filter=series_description/database_id eq 'WB_WDI'&$select=series_description/idno,series_description/name")
```

### Reference data (World Bank V2 API)

```ts
// Countries — id, name, region, income level, coordinates
const countries = await client.countries().fetch()
// → { meta: { total: 296, ... }, items: V2Country[] }

// Topics
const topics = await client.topics().fetch()

// Indicator catalogue (29k+ indicators)
const indicators = await client.v2Indicators().fetch()
```

## Error handling

All HTTP errors throw `SDKRequestError` with a human-readable message and a suggestion:

```ts
import { SDKRequestError } from 'worldbank'

try {
  await client.data('INVALID_DB').fetch()
} catch (err) {
  if (err instanceof SDKRequestError) {
    console.log(err.sdkError.message)     // "HTTP 400 from GET /data360/data"
    console.log(err.sdkError.suggestion)  // "Check your DATABASE_ID and filter parameters..."
    console.log(err.sdkError.docsUrl)     // "https://data360api.worldbank.org/swagger/index.html"
  }
}
```

## APIs

| Client method | API | Endpoint |
|---|---|---|
| `.discover()` | Data360 | `POST /data360/searchv2` (facets) |
| `.data()` | Data360 | `GET /data360/data` |
| `.search()` | Data360 | `POST /data360/searchv2` |
| `.indicators()` | Data360 | `GET /data360/indicators` |
| `.disaggregation()` | Data360 | `GET /data360/disaggregation` |
| `.metadata()` | Data360 | `POST /data360/metadata` |
| `.countries()` | World Bank V2 | `GET /V2/country` |
| `.v2Indicators()` | World Bank V2 | `GET /V2/indicator` |
| `.topics()` | World Bank V2 | `GET /V2/topic` |

Both APIs are public — no authentication required.

## Data attribution

Data is sourced from the [World Bank Data360 API](https://data360api.worldbank.org) and the [World Bank V2 API](https://api.worldbank.org/V2). Use of this data is subject to the [World Bank Terms and Conditions](https://www.worldbank.org/en/about/legal/terms-and-conditions). The World Bank Group authorizes the use of this material subject to the terms and conditions on its website.

This SDK is an unofficial open-source wrapper and is not affiliated with or endorsed by the World Bank Group.

## License

MIT
