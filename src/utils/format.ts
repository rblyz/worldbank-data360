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
  area?: string
  database?: string
  databaseName?: string
  meta: Record<string, unknown>
  records: Array<{ period?: string; area?: string; value: number }>
}

export function formatDataResult(
  result: DataResult,
  names?: { indicatorName?: string; databaseName?: string }
): FormattedDataResult {
  const first = result.records[0] as unknown as Record<string, unknown> | undefined

  const areas = new Set(result.records.map(r => r.area).filter(Boolean))
  const multiArea = areas.size > 1

  const meta: Record<string, unknown> = {}
  if (first) {
    for (const key of NOISE_KEYS) {
      const v = first[key]
      if (v !== undefined && v !== null && v !== '' && !SDMX_DEFAULT.has(v as string)) {
        meta[key] = v
      }
    }
  }

  const records = result.records.map(r =>
    multiArea
      ? { period: r.period, area: r.area, value: r.value }
      : { period: r.period, value: r.value }
  )

  return {
    count: result.count,
    indicator: first?.['indicator'] as string | undefined,
    indicatorName: names?.indicatorName,
    area: multiArea ? undefined : (first?.['area'] as string | undefined),
    database: first?.['DATABASE_ID'] as string | undefined,
    databaseName: names?.databaseName,
    meta,
    records
  }
}
