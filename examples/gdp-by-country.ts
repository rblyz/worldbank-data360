import { WorldBankClient } from '../src/index.js'

const client = new WorldBankClient()

// 1. Population total: Poland 2000–2023
console.log('=== Population: Poland 2000–2023 ===')
const pop = await client
  .data('WB_WDI')
  .indicator('WB_WDI_SP_POP_TOTL')
  .area('POL')
  .from('2000').to('2023')
  .fetch()

console.log(`Total records: ${pop.count}`)
for (const r of pop.records.slice(-5)) {
  console.log(`  ${r.period}: ${r.value.toLocaleString()}`)
}

// 2. GDP per capita: multiple countries
console.log('\n=== GDP per capita: POL + DEU + USA (2010–2023) ===')
const gdp = await client
  .data('WB_WDI')
  .indicator('WB_WDI_NY_GDP_PCAP_CD')
  .area(['POL', 'DEU', 'USA'])
  .from('2010').to('2023')
  .fetch()

console.log(`Total records: ${gdp.count}`)
for (const r of gdp.records.slice(0, 6)) {
  console.log(`  ${r.area} ${r.period}: $${r.value.toLocaleString()}`)
}

// 3. explain() — синхронно, без HTTP
console.log('\n=== explain() (no fetch) ===')
const info = client
  .data('WB_WDI')
  .indicator('WB_WDI_NY_GDP_PCAP_CD')
  .area(['POL', 'DEU'])
  .from('2010').to('2023')
  .explain()
console.log(info.description)

// 4. toContext() → markdown table
console.log('\n=== toContext() ===')
const ctx = await client
  .data('WB_WDI')
  .indicator('WB_WDI_SP_POP_TOTL')
  .area('POL')
  .from('2020').to('2023')
  .toContext()
console.log(ctx)

// 5. Country reference list
console.log('\n=== countries() — first 5 ===')
const countries = await client.countries().fetch()
console.log(`Total countries: ${countries.meta.total}`)
for (const c of countries.items.slice(0, 5)) {
  console.log(`  ${c.iso2Code}: ${c.name} (${c.region.value})`)
}

// 6. Dataset indicators
console.log('\n=== indicators("WB_WDI") ===')
const indicators = await client.indicators('WB_WDI').fetch()
console.log(`Indicators returned: ${Array.isArray(indicators) ? indicators.length : 'unknown shape'}`)

// 7. Search
console.log('\n=== search: poverty (top 3) ===')
const results = await client.search().search('poverty').top(3).count(true).fetch()
console.log(JSON.stringify(results, null, 2))
