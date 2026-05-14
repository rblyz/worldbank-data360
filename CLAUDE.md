# worldbank-data360 SDK

TypeScript SDK for World Bank Data360 API. Published to npm as `worldbank-data360`.

## APIs

- **data360api.worldbank.org** — main data (`/data360/data`, `/data360/indicators`, `/data360/metadata`, `/data360/searchv2`, `/data360/disaggregation`)
- **api.worldbank.org/V2** — reference lookups (countries, topics) — not yet implemented

No auth required. Both APIs are public.

## Key rules

- `OBS_VALUE` in API responses is `string` — always cast to `number` before returning
- Autopagination: API returns max 1000 records per call; SDK handles `skip` internally
- Fluent builder interface — methods return `this`, `.fetch()` fires the request
- Compact response format: strip null/undefined fields before returning to caller
- Human-readable errors: include `suggestion` and `docsUrl` fields

## Structure

```
src/
  index.ts              # public exports
  client.ts             # WorldBankClient class
  endpoints/
    data.ts             # DataQueryBuilder (fluent interface)
    indicators.ts       # indicator list
    metadata.ts         # metadata POST
    search.ts           # searchv2 POST
    disaggregation.ts   # disaggregation GET
  types/
    generated.ts        # AUTO-GENERATED — do not edit, run `npm run generate:types`
    params.ts           # hand-written param/result types
  mcp/
    index.ts            # MCP server export (worldbank-data360/mcp)
tests/
examples/
  gdp-by-country.ts
```

## Commands

```bash
npm run build           # tsc → dist/
npm run generate:types  # regenerate src/types/generated.ts from OpenAPI spec
npm run example         # run examples/gdp-by-country.ts via tsx
```

## Publishing

Do NOT publish after every change. Batch changes and publish once when ready.

```bash
npm version patch       # bump version (patch/minor/major)
npm run build
npm publish --access=public
```

## Fluent API shape (target)

```ts
const client = new WorldBankClient()

const data = await client
  .data('WB_WDI')
  .indicator('WB_WDI_SP_POP_TOTL')
  .area('POL')
  .from('2000').to('2023')
  .fetch()

// AI-first extras
const info = await client.data('WB_WDI').indicator('WB_WDI_SP_POP_TOTL').explain()
const prompt = await client.data('WB_WDI').indicator('WB_WDI_SP_POP_TOTL').toContext()
```

## Generated types

`src/types/generated.ts` is produced by `openapi-typescript` from:
`https://raw.githubusercontent.com/worldbank/open-api-specs/refs/heads/main/Data360%20Open_API.json`

Key schema: `components["schemas"]["DataResponse"]` — `count: number`, `value: DataRecord[]`

## What's NOT done yet

- `src/endpoints/` — all builders (next step)
- `api.worldbank.org/V2` integration
- MCP server
- Tests
- npm publish config
