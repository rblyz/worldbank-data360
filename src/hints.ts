interface Hint {
  tag: string
  text: string
}

const hints: Hint[] = [
  // after-search — юзер нашёл индикатор, следующий шаг
  { tag: 'after-search', text: 'Next: `worldbank info <ID>` — shows which countries and years actually have data before you fetch.' },
  { tag: 'after-search', text: 'Top result not what you expected? Add --database to narrow: `worldbank search "..." --database WB_WDI`. Run `worldbank discover` to see all database IDs.' },
  { tag: 'after-search', text: 'Indicator IDs encode the database: WB_WDI_SP_POP_TOTL → database WB_WDI. Use that as the first arg to `worldbank data`.' },

  // after-info — юзер видит параметры, готов к data
  { tag: 'after-info', text: 'Now fetch: `worldbank data <DATABASE> --indicator <ID> --area POL --from 2000 --to 2023`. Database ID is the first two segments of the indicator ID.' },
  { tag: 'after-info', text: 'If you see "sex" or "age" in the output above, the indicator has breakdowns — they appear automatically per record when data varies.' },

  // after-info-sparse — данные не ежегодные
  { tag: 'after-info-sparse', text: 'Use the exact years listed above — requesting a range like 2015–2023 will silently return only the published years within it.' },
  { tag: 'after-info-sparse', text: 'To get everything, omit --from and --to entirely: `worldbank data <DB> --indicator <ID> --area POL`.' },

  // after-data-single-area — один регион, подсказка сравнить
  { tag: 'after-data-single-area', text: 'Compare countries: `--area POL,DEU,USA,CHN` — records will be grouped by country code automatically.' },
  { tag: 'after-data-single-area', text: 'Getting only 100 rows? The default limit is --top 100. Add --all to fetch everything.' },

  // after-data-multi-area — мультистрана
  { tag: 'after-data-multi-area', text: 'Filter one country with jq: `worldbank data ... | jq \'.records.POL\'`' },

  // after-empty — ничего не вернулось
  { tag: 'after-empty', text: 'Run `worldbank info <ID>` first — it shows the real year range and country coverage. The indicator may not have data for the region or period you requested.' },
  { tag: 'after-empty', text: 'Some indicators appear in search but return no data (deprecated or not yet published). Check `worldbank info <ID>` or try a related indicator.' },
  { tag: 'after-empty', text: 'Country codes are ISO 3166-1 alpha-3 (POL, DEU, USA, CHN). Run `worldbank countries` to look up the right code.' },

  // after-truncated — обрезано
  { tag: 'after-truncated', text: 'Add --all to fetch all records, or narrow the range: --from 2010 --to 2023.' },

  // general — для help и пустого ввода
  { tag: 'general', text: 'Typical workflow: `worldbank search "topic"` → `worldbank info <ID>` → `worldbank data <DB> --indicator <ID> --area POL --from 2000 --to 2023`.' },
  { tag: 'general', text: 'Not sure which database to use? `worldbank discover` lists all 100 databases with indicator counts.' },
  { tag: 'general', text: 'All output is JSON — pipe to jq: `worldbank data ... | jq \'.records\'`' },
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
