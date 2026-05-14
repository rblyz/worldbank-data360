import type { DataResult, DataRecord } from '../types/params.js'

const SDMX_DEFAULT = new Set(['_Z', '_T'])
const NOISE_KEYS = new Set([
  'TIME_FORMAT', 'OBS_CONF', 'AGG_METHOD', 'DECIMALS', 'FREQ',
  'SEX', 'AGE', 'URBANISATION', 'COMP_BREAKDOWN_1', 'COMP_BREAKDOWN_2', 'COMP_BREAKDOWN_3',
  'UNIT_MEASURE', 'UNIT_MULT', 'OBS_STATUS', 'LATEST_DATA'
])

export interface FormattedDataResult {
  count: number
  indicator?: string
  indicatorName?: string
  area?: string | string[]
  database?: string
  databaseName?: string
  meta: Record<string, unknown>
  records: Array<{ period?: string; value: number }>
}

export function formatDataResult(
  result: DataResult,
  names?: { indicatorName?: string; databaseName?: string }
): FormattedDataResult {
  const first = result.records[0] as unknown as Record<string, unknown> | undefined

  const meta: Record<string, unknown> = {}
  if (first) {
    for (const key of NOISE_KEYS) {
      const v = first[key]
      if (v !== undefined && v !== null && v !== '' && !SDMX_DEFAULT.has(v as string)) {
        meta[key] = v
      }
    }
  }

  const sorted = [...result.records].sort((a, b) => {
    const pa = a.period ?? ''
    const pb = b.period ?? ''
    return pa < pb ? -1 : pa > pb ? 1 : 0
  })

  return {
    count: result.count,
    indicator: first?.['indicator'] as string | undefined,
    indicatorName: names?.indicatorName,
    area: first?.['area'] as string | undefined,
    database: first?.['DATABASE_ID'] as string | undefined,
    databaseName: names?.databaseName,
    meta,
    records: sorted.map(r => ({ period: r.period, value: r.value }))
  }
}
