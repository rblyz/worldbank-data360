#!/usr/bin/env node
import { WorldBankClient } from './client.js'
import { parseFlags } from './utils/flags.js'
import { formatDataResult, formatAsCsv, isSdmxDefault } from './utils/format.js'
import { fetchIndicatorMeta } from './endpoints/metadata.js'
import { getHint } from './hints.js'

const INFO_SKIP_FIELDS = new Set(['INDICATOR', 'FREQ', 'COMP_BREAKDOWN_1', 'COMP_BREAKDOWN_2', 'COMP_BREAKDOWN_3', 'UNIT_MEASURE', 'TIME_FORMAT', 'OBS_CONF', 'OBS_STATUS', 'DECIMALS', 'AGG_METHOD'])
const INFO_FIELD_LABELS: Record<string, string> = {
  SEX: 'sex', AGE: 'age', URBANISATION: 'urbanisation', REF_AREA: 'areas', TIME_PERIOD: 'years'
}

function hint(tag: string) {
  const h = getHint(tag)
  if (h) process.stderr.write(`\n💡 ${h}\n`)
}

const client = new WorldBankClient()
const [cmd, ...rest] = process.argv.slice(2)

function out(data: unknown) {
  console.log(JSON.stringify(data, null, 2))
}

function help() {
  console.log(`
worldbank CLI

Commands:
  discover                              Quick start guide with examples
  discover --databases                  List all databases as JSON
  search <query> [--top N]             Search indicators by keyword
               [--database WB_WDI]
  info <INDICATOR_ID>                  Show available dimensions and year range
  data <DB> --indicator <ID>           Fetch data (default: --top 100)
               [--area POL,DEU,USA]
               [--from YEAR] [--to YEAR]
               [--top N] [--all]
               [--format json|csv]
  explain <DB> --indicator <ID>        Preview query without fetching
               [--area POL,DEU] [--from YEAR] [--to YEAR]
  countries                            List all countries

Examples:
  npx worldbank discover
  npx worldbank search "co2 emissions" --top 5
  npx worldbank info WB_WDI_SP_POP_TOTL
  npx worldbank data WB_WDI --indicator WB_WDI_SP_POP_TOTL --area POL --from 2020 --to 2023
  npx worldbank data WB_WDI --indicator WB_WDI_NY_GDP_PCAP_CD --area POL,DEU,USA --from 2018 --to 2023
  npx worldbank explain WB_WDI --indicator WB_WDI_SP_POP_TOTL --area POL,DEU --from 2010 --to 2023
  npx worldbank countries
`)
}

async function main() {
  if (!cmd || cmd === 'help' || cmd === '--help') {
    help()
    hint('general')
    if (!cmd) process.exit(1)
    return
  }

  if (cmd === 'discover') {
    const flags = parseFlags(rest)
    if ('databases' in flags) {
      out(await client.discover())
    } else {
      const result = await client.discover()
      process.stdout.write(printDiscoverIntro(result.totalIndicators))
    }
    return
  }

  if (cmd === 'countries') {
    const result = await client.countries().fetch()
    const items = result.items.filter(c => c.region?.id !== 'NA')
    out({ ...result, items })
    return
  }

  if (cmd === 'info') {
    const indicatorId = rest[0]
    if (!indicatorId || indicatorId.startsWith('--')) { console.error('Usage: worldbank info <INDICATOR_ID>'); process.exit(1) }
    const parts = indicatorId.split('_')
    if (parts.length < 3) { console.error(`Invalid indicator ID: "${indicatorId}". Expected format: DB_NAME_INDICATOR (e.g. WB_WDI_SP_POP_TOTL)`); process.exit(1) }
    const databaseId = parts.slice(0, 2).join('_')
    const [raw, meta] = await Promise.all([
      client.disaggregation(databaseId).indicator(indicatorId).fetch() as Promise<Array<{ field_name: string; label_name: string; field_value: string[] }>>,
      fetchIndicatorMeta(indicatorId)
    ])
    const result: Record<string, unknown> = {}
    if (meta?.name) result['name'] = meta.name
    if (meta?.databaseName) result['database'] = meta.databaseName
    for (const dim of raw) {
      if (INFO_SKIP_FIELDS.has(dim.field_name)) continue
      const values = dim.field_value.filter(v => !isSdmxDefault(v))
      if (values.length === 0) continue
      const key = INFO_FIELD_LABELS[dim.field_name] ?? dim.field_name.toLowerCase()
      if (dim.field_name === 'TIME_PERIOD') {
        const sorted = [...values].sort((a, b) => Number(a) - Number(b))
        const isContiguous = sorted.every((y, i) => i === 0 || Number(y) === Number(sorted[i - 1]) + 1)
        result['years'] = isContiguous
          ? `${sorted[0]}–${sorted[sorted.length - 1]}`
          : sorted
      } else if (dim.field_name === 'REF_AREA') {
        result['areas'] = values.length
      } else {
        result[key] = values
      }
    }
    out(result)
    hint(Array.isArray(result['years']) ? 'after-info-sparse' : 'after-info')
    return
  }

  if (cmd === 'search') {
    const query = rest[0]
    if (!query || query.startsWith('--')) { console.error('Usage: worldbank search <query> [--top N]'); process.exit(1) }
    const flags = parseFlags(rest.slice(1))
    const builder = client.search().search(query)
    if (flags['database']) builder.database(flags['database'])
    builder.top(flags['top'] ? Number(flags['top']) : 10)
    out(await builder.fetchItems())
    hint('after-search')
    return
  }

  if (cmd === 'data' || cmd === 'explain') {
    const databaseId = rest[0]
    if (!databaseId || databaseId.startsWith('--')) {
      console.error(`Usage: worldbank ${cmd} <DATABASE_ID> --indicator <ID> [--area POL,DEU] [--from YEAR] [--to YEAR] [--top N] [--all]`)
      process.exit(1)
    }
    const flags = parseFlags(rest.slice(1))
    if (!flags['indicator']) { console.error('--indicator is required'); process.exit(1) }

    if (flags['from'] && flags['to'] && flags['from'] > flags['to']) {
      console.error(`Error: --from (${flags['from']}) must be ≤ --to (${flags['to']})`)
      process.exit(1)
    }

    const builder = client.data(databaseId).indicator(flags['indicator'])
    if (flags['area']) builder.area(flags['area'].split(','))
    if (flags['from']) builder.from(flags['from'])
    if (flags['to']) builder.to(flags['to'])

    if (cmd === 'explain') {
      out(builder.explain())
    } else {
      const [result, meta] = await Promise.all([
        builder.fetch(),
        fetchIndicatorMeta(flags['indicator'])
      ])
      const all = 'all' in flags
      const top = flags['top'] ? Number(flags['top']) : 100
      const wasTruncated = !all && result.records.length > top
      if (wasTruncated) {
        result.records = result.records.slice(0, top)
      }
      const formatted = formatDataResult(
        result,
        meta ? { indicatorName: meta.name, databaseName: meta.databaseName } : undefined,
        { indicator: flags['indicator'], area: flags['area'] },
        wasTruncated ? { top, total: result.count } : undefined
      )
      const isCsv = flags['format'] === 'csv'
      if (isCsv) {
        process.stdout.write(formatAsCsv(formatted) + '\n')
      } else {
        out(formatted)
      }
      if (result.records.length === 0) {
        hint('after-empty')
        process.exit(1)
      } else if (!isCsv) {
        if (wasTruncated) {
          hint('after-truncated')
        } else {
          const areas = flags['area']?.split(',') ?? []
          hint(areas.length > 1 ? 'after-data-multi-area' : 'after-data-single-area')
        }
      }
    }
    return
  }

  console.error(`Unknown command: ${cmd}. Run "worldbank help" for usage.`)
  process.exit(1)
}

function printDiscoverIntro(totalIndicators: number): string {
  return `
worldbank-data360  —  ${totalIndicators.toLocaleString()} indicators from the World Bank and partners

QUICK START

  1. Search for an indicator
       worldbank search "gdp per capita" --top 5

  2. Check what years and countries actually have data
       worldbank info WB_WDI_NY_GDP_PCAP_CD

  3. Fetch
       worldbank data WB_WDI --indicator WB_WDI_NY_GDP_PCAP_CD --area POL,DEU,USA --from 2010 --to 2023

  Narrow to a specific database:
       worldbank search "co2 emissions" --database WB_WDI --top 5

  Filter one country from multi-country results with jq:
       worldbank data WB_WDI --indicator WB_WDI_NY_GDP_PCAP_CD --area POL,DEU,USA | jq '.records.POL'

  Export to CSV (opens in Excel / Google Sheets):
       worldbank data WB_WDI --indicator WB_WDI_NY_GDP_PCAP_CD --area POL,DEU,USA --format csv > gdp.csv

DATABASE LIST

  100+ databases: WB_WDI (World Development Indicators), WB_GEM (Global Economic Monitor),
  IMF_DOT (Direction of Trade Statistics), WB_HCI (Human Capital Index), and more.

  Full list as JSON:  worldbank discover --databases
  Filter by database: worldbank search "..." --database WB_WDI

OTHER COMMANDS

  worldbank info <INDICATOR_ID>                      year range, countries, breakdowns
  worldbank explain <DB> --indicator <ID> [...]      preview query without fetching
  worldbank countries                                all countries with ISO alpha-3 codes
  worldbank help                                     command reference

`
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
