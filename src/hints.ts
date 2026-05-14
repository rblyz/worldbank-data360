interface Hint {
  tags: string[]
  text: string
}

const hints: Hint[] = [
  // after-search
  {
    tags: ['after-search'],
    text: 'Found an indicator? Run `worldbank info <ID>` to see available countries and actual year coverage before fetching data.'
  },
  {
    tags: ['after-search'],
    text: 'Narrow results by database: `worldbank search "your topic" --database WB_WDI`. Use `worldbank discover` to see all database IDs.'
  },
  {
    tags: ['after-search'],
    text: 'Search uses full-text ranking — if the top result looks off, try a more specific phrase or add the database filter.'
  },

  // after-info
  {
    tags: ['after-info'],
    text: 'Ready to fetch? `worldbank data <DB> --indicator <ID> --area POL --from 2000 --to 2023`'
  },
  {
    tags: ['after-info'],
    text: 'If "sex" or "age" appears in the dimensions, the indicator has disaggregated breakdowns — you\'ll see them per record automatically.'
  },
  {
    tags: ['after-info-sparse'],
    text: 'This indicator is not published annually — gaps in the data are expected, not a bug.'
  },
  {
    tags: ['after-info-sparse'],
    text: 'Benchmark indicators like HCI are published only in specific years. Request the exact years shown, not a range.'
  },

  // after-data-single-area
  {
    tags: ['after-data-single-area'],
    text: 'Want to compare countries? Pass multiple area codes: `--area POL,DEU,USA,CHN`. Records will be grouped by country.'
  },
  {
    tags: ['after-data-single-area'],
    text: 'Need all records without the 100-row limit? Add `--all` to your command.'
  },

  // after-data-multi-area
  {
    tags: ['after-data-multi-area'],
    text: 'Records are grouped by country code. Pipe to jq: `worldbank data ... | jq \'.records.POL\'`'
  },
  {
    tags: ['after-data-multi-area'],
    text: 'Country codes follow ISO 3166-1 alpha-3. Run `worldbank countries` to find the right code.'
  },

  // after-empty
  {
    tags: ['after-empty'],
    text: 'Got no data? Run `worldbank info <ID>` to verify the actual year range and available area codes for this indicator.'
  },
  {
    tags: ['after-empty'],
    text: 'Some indicators exist in search results but have no data (deprecated or not yet published). Try a related indicator in a different database.'
  },
  {
    tags: ['after-empty'],
    text: 'Area codes are ISO 3166-1 alpha-3 (POL, DEU, USA). Run `worldbank countries` to look up the right code.'
  },

  // after-truncated
  {
    tags: ['after-truncated'],
    text: 'Results were truncated. Add `--all` to fetch everything, or use `--from` / `--to` to narrow the date range.'
  },
  {
    tags: ['after-truncated'],
    text: 'Fetching all records for many countries across many years can be slow — consider narrowing with `--from` and `--to`.'
  },

  // general
  {
    tags: ['general'],
    text: 'Typical workflow: `search` → `info` → `data`. Search finds the ID, info confirms coverage, data fetches the numbers.'
  },
  {
    tags: ['general'],
    text: 'All output is JSON — pipe to jq for filtering: `worldbank data ... | jq \'.records\'`'
  },
]

export function getHint(tag: string): string | undefined {
  const matches = hints.filter(h => h.tags.includes(tag))
  if (matches.length === 0) return undefined
  return matches[Math.floor(Math.random() * matches.length)]!.text
}
