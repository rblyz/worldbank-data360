#!/usr/bin/env node
import { WorldBankClient } from './client.js'

const client = new WorldBankClient()
const [cmd, ...rest] = process.argv.slice(2)

function parseFlags(args: string[]): Record<string, string> {
  const flags: Record<string, string> = {}
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (!arg?.startsWith('--')) continue
    const key = arg.slice(2)
    const next = args[i + 1]
    if (next && !next.startsWith('--')) {
      flags[key] = next
      i++
    } else {
      flags[key] = ''
    }
  }
  return flags
}

function out(data: unknown) {
  console.log(JSON.stringify(data, null, 2))
}

function help() {
  console.log(`
worldbank CLI

Commands:
  discover                              List all available databases
  search <query> [--top N]             Search indicators by keyword
  data <DB> --indicator <ID>           Fetch data (default: --top 100)
               [--area POL,DEU,USA]
               [--from YEAR] [--to YEAR]
               [--top N] [--all]
  explain <DB> --indicator <ID>        Preview query without fetching
               [--area POL,DEU] [--from YEAR] [--to YEAR]
  countries                            List all countries

Examples:
  npx worldbank discover
  npx worldbank search "co2 emissions" --top 5
  npx worldbank data WB_WDI --indicator WB_WDI_SP_POP_TOTL --area POL --from 2020 --to 2023
  npx worldbank data WB_WDI --indicator WB_WDI_NY_GDP_PCAP_CD --area POL,DEU,USA --from 2018 --to 2023
  npx worldbank explain WB_WDI --indicator WB_WDI_SP_POP_TOTL --area POL,DEU --from 2010 --to 2023
  npx worldbank countries
`)
}

async function main() {
  if (!cmd || cmd === 'help' || cmd === '--help') {
    help()
    return
  }

  if (cmd === 'discover') {
    out(await client.discover())
    return
  }

  if (cmd === 'countries') {
    out(await client.countries().fetch())
    return
  }

  if (cmd === 'search') {
    const query = rest[0]
    if (!query || query.startsWith('--')) { console.error('Usage: worldbank search <query> [--top N]'); process.exit(1) }
    const flags = parseFlags(rest.slice(1))
    const builder = client.search().search(query)
    builder.top(flags['top'] ? Number(flags['top']) : 10)
    out(await builder.fetchItems())
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

    const builder = client.data(databaseId).indicator(flags['indicator'])
    if (flags['area']) builder.area(flags['area'].split(','))
    if (flags['from']) builder.from(flags['from'])
    if (flags['to']) builder.to(flags['to'])

    if (cmd === 'explain') {
      out(builder.explain())
    } else {
      const result = await builder.fetch()
      const all = 'all' in flags
      const top = flags['top'] ? Number(flags['top']) : 100
      if (!all && result.records.length > top) {
        result.records = result.records.slice(0, top)
        process.stderr.write(`Note: showing ${top} of ${result.count} records. Use --all to fetch everything or --top N to set limit.\n`)
      }
      out(result)
    }
    return
  }

  console.error(`Unknown command: ${cmd}. Run "worldbank help" for usage.`)
  process.exit(1)
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
