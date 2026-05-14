interface Hint {
  tag: string
  text: string
}

const hints: Hint[] = [
  { tag: 'after-search', text: 'Found an indicator? Run `worldbank info <ID>` to see available countries and actual year coverage before fetching data.' },
  { tag: 'after-search', text: 'Narrow results by database: `worldbank search "your topic" --database WB_WDI`. Use `worldbank discover` to see all database IDs.' },
  { tag: 'after-search', text: 'Search uses full-text ranking — if the top result looks off, try a more specific phrase or add the database filter.' },

  { tag: 'after-info', text: 'Ready to fetch? `worldbank data <DB> --indicator <ID> --area POL --from 2000 --to 2023`' },
  { tag: 'after-info', text: 'If "sex" or "age" appears in the dimensions, the indicator has disaggregated breakdowns — you\'ll see them per record automatically.' },

  { tag: 'after-info-sparse', text: 'This indicator is not published annually — gaps in the data are expected, not a bug.' },
  { tag: 'after-info-sparse', text: 'Benchmark indicators like HCI are published only in specific years. Request the exact years shown, not a range.' },

  { tag: 'after-data-single-area', text: 'Want to compare countries? Pass multiple area codes: `--area POL,DEU,USA,CHN`. Records will be grouped by country.' },
  { tag: 'after-data-single-area', text: 'Need all records without the 100-row limit? Add `--all` to your command.' },

  { tag: 'after-data-multi-area', text: 'Records are grouped by country code. Pipe to jq: `worldbank data ... | jq \'.records.POL\'`' },
  { tag: 'after-data-multi-area', text: 'Country codes follow ISO 3166-1 alpha-3. Run `worldbank countries` to find the right code.' },

  { tag: 'after-empty', text: 'Got no data? Run `worldbank info <ID>` to verify the actual year range and available area codes for this indicator.' },
  { tag: 'after-empty', text: 'Some indicators exist in search results but have no data (deprecated or not yet published). Try a related indicator in a different database.' },
  { tag: 'after-empty', text: 'Area codes are ISO 3166-1 alpha-3 (POL, DEU, USA). Run `worldbank countries` to look up the right code.' },

  { tag: 'after-truncated', text: 'Results were truncated. Add `--all` to fetch everything, or use `--from` / `--to` to narrow the date range.' },
  { tag: 'after-truncated', text: 'Fetching all records for many countries across many years can be slow — consider narrowing with `--from` and `--to`.' },

  { tag: 'general', text: 'Typical workflow: `search` → `info` → `data`. Search finds the ID, info confirms coverage, data fetches the numbers.' },
  { tag: 'general', text: 'All output is JSON — pipe to jq for filtering: `worldbank data ... | jq \'.records\'`' },
]

const hintsByTag = new Map<string, Hint[]>()
for (const h of hints) {
  const bucket = hintsByTag.get(h.tag) ?? []
  bucket.push(h)
  hintsByTag.set(h.tag, bucket)
}

export function getHint(tag: string): string | undefined {
  const bucket = hintsByTag.get(tag)
  if (!bucket?.length) return undefined
  return bucket[Math.floor(Math.random() * bucket.length)]!.text
}
