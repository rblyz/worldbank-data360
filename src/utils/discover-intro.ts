const R = '\x1b[0m'
const bold  = (s: string) => `\x1b[1m${s}${R}`
const dim   = (s: string) => `\x1b[2m${s}${R}`
const mute  = (s: string) => `\x1b[2m${s}${R}`
const ac    = (s: string) => `\x1b[33m${s}${R}`      // accent — amber
const rule  = (s: string) => `\x1b[90m${s}${R}`      // dim rule line
const sub   = (s: string) => `\x1b[34m${s}${R}`      // subcommand — blue
const flag  = (s: string) => `\x1b[35m${s}${R}`      // flag — magenta
const str   = (s: string) => `\x1b[33m${s}${R}`      // string literal — yellow
const id    = (s: string) => `\x1b[32m${s}${R}`      // identifier — green
const op    = (s: string) => `\x1b[31m${s}${R}`      // pipe/redirect — red
const num   = (s: string) => `\x1b[33m${s}${R}`      // number — amber
const ph    = (s: string) => `\x1b[2m\x1b[3m${s}${R}` // placeholder — dim italic
const pmt   = () => dim('$ ')

const wb = bold('worldbank')

function dashRule(label: string, width = 80): string {
  const dashes = Math.max(0, width - label.length - 1)
  return `${ac(bold(label))} ${rule('─'.repeat(dashes))}`
}

function step(n: string, title: string, cmd: string): string {
  return `  ${ac(bold(n))} ${ac('▸')}  ${title}\n      ${pmt()}${cmd}`
}

function tip(title: string, cmd: string): string {
  return `  ${ac('·')}  ${title}\n      ${pmt()}${cmd}`
}

const C_SEARCH   = `${wb} ${sub('search')} ${str('"gdp per capita"')} ${flag('--top')} ${num('5')}`
const C_INFO     = `${wb} ${sub('info')} ${id('WB_WDI_NY_GDP_PCAP_CD')}`
const C_DATA     = `${wb} ${sub('data')} ${id('WB_WDI')} ${flag('--indicator')} ${id('WB_WDI_NY_GDP_PCAP_CD')} ${flag('--area')} ${id('POL,DEU,USA')} ${flag('--from')} ${num('2010')} ${flag('--to')} ${num('2023')}`
const C_NARROW   = `${wb} ${sub('search')} ${str('"co2 emissions"')} ${flag('--database')} ${id('WB_WDI')} ${flag('--top')} ${num('5')}`
const C_JQ       = `${wb} ${sub('data')} ${id('WB_WDI')} ${flag('--indicator')} ${id('WB_WDI_NY_GDP_PCAP_CD')} ${flag('--area')} ${id('POL,DEU,USA')} ${op('|')} ${bold('jq')} ${str("'.records.POL'")}`
const C_CSV      = `${wb} ${sub('data')} ${id('WB_WDI')} ${flag('--indicator')} ${id('WB_WDI_NY_GDP_PCAP_CD')} ${flag('--area')} ${id('POL,DEU,USA')} ${flag('--format')} csv ${op('>')} gdp.csv`
const C_LIST_DBS = `${wb} ${sub('discover')} ${flag('--databases')}`
const C_FILTER   = `${wb} ${sub('search')} ${str('"..."')} ${flag('--database')} ${id('WB_WDI')}`

export function printDiscoverIntro(totalIndicators: number): string {
  const total = totalIndicators.toLocaleString()
  const lines = [
    '',
    `${bold('worldbank-data360')}${dim('  ·  ')}${total} indicators from the World Bank and partners`,
    '',
    dashRule('QUICK START'),
    '',
    step('1', 'Search for an indicator', C_SEARCH),
    '',
    step('2', 'Check what years and countries actually have data', C_INFO),
    '',
    step('3', 'Fetch the values', C_DATA),
    '',
    '',
    dashRule('MORE EXAMPLES'),
    '',
    tip('Narrow to a specific database', C_NARROW),
    '',
    tip(`Pull one country from multi-country results with ${bold('jq')}`, C_JQ),
    '',
    tip('Export to CSV (opens in Excel / Google Sheets)', C_CSV),
    '',
    '',
    dashRule('DATABASES'),
    '',
    `  ${mute('100+ databases including:')}`,
    '',
    `    ${id('WB_WDI')}     World Development Indicators`,
    `    ${id('WB_GEM')}     Global Economic Monitor`,
    `    ${id('IMF_DOT')}    Direction of Trade Statistics`,
    `    ${id('WB_HCI')}     Human Capital Index`,
    `    ${dim('…and 100+ more')}`,
    '',
    `  ${mute('Full list as JSON    ')}${pmt()}${C_LIST_DBS}`,
    `  ${mute('Filter by database   ')}${pmt()}${C_FILTER}`,
    '',
    '',
    dashRule('OTHER COMMANDS'),
    '',
    `  ${wb} ${sub('info')} ${ph('<INDICATOR_ID>')}                       ${mute('year range, countries, breakdowns')}`,
    `  ${wb} ${sub('explain')} ${ph('<DB>')} ${flag('--indicator')} ${ph('<ID>')} ${dim('[...]')}      ${mute('preview a query without fetching')}`,
    `  ${wb} ${sub('countries')}                                  ${mute('all countries with ISO alpha-3 codes')}`,
    `  ${wb} ${sub('help')}                                       ${mute('command reference')}`,
    '',
    '',
  ]
  return lines.join('\n')
}
