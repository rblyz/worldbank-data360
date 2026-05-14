import type { DataResult } from '../types/params.js'

function isUpperCase(key: string) {
  return key === key.toUpperCase()
}

function isSdmxDefault(v: unknown) {
  return typeof v === 'string' && v.startsWith('_')
}

export interface FormattedDataResult {
  count: number
  showing?: number
  truncated?: true
  indicator?: string
  indicatorName?: string
  area?: string
  database?: string
  databaseName?: string
  warning?: string
  meta: Record<string, unknown>
  records: Array<Record<string, unknown>> | Record<string, Array<Record<string, unknown>>>
}

export function formatDataResult(
  result: DataResult,
  names?: { indicatorName?: string; databaseName?: string },
  query?: { indicator?: string; area?: string | string[] },
  truncation?: { top: number; total: number }
): FormattedDataResult {
  const first = result.records[0] as unknown as Record<string, unknown> | undefined

  const queryAreas = Array.isArray(query?.area)
    ? query.area
    : query?.area?.split(',') ?? []
  const multiArea = queryAreas.length > 1

  // Collect all all-caps keys that appear with a non-default value in any record
  const allCapsKeys = new Set<string>()
  for (const r of result.records) {
    const rec = r as unknown as Record<string, unknown>
    for (const [key, v] of Object.entries(rec)) {
      if (!isUpperCase(key) || v === undefined || v === null || v === '') continue
      if (!isSdmxDefault(v)) allCapsKeys.add(key)
    }
  }

  // Find which of those keys vary across records
  const varyingKeys = new Set<string>()
  for (const key of allCapsKeys) {
    const values = new Set(result.records.map(r => (r as unknown as Record<string, unknown>)[key]))
    if (values.size > 1) varyingKeys.add(key)
  }

  // Meta: constant all-caps fields (from first record)
  const meta: Record<string, unknown> = {}
  for (const key of allCapsKeys) {
    if (varyingKeys.has(key)) continue
    const v = (first as unknown as Record<string, unknown>)?.[key]
    if (v !== undefined && v !== null && v !== '' && !isSdmxDefault(v)) meta[key] = v
  }

  // Per-record builder
  const toRecord = (r: DataResult['records'][number], includeArea: boolean) => {
    const rec = r as unknown as Record<string, unknown>
    const out: Record<string, unknown> = {}
    if (r.period !== undefined) out['period'] = r.period
    if (includeArea && r.area !== undefined) out['area'] = r.area
    for (const key of varyingKeys) {
      const v = rec[key]
      if (v === undefined || v === null || v === '' || isSdmxDefault(v)) continue
      out[key] = v
    }
    out['value'] = r.value
    return out
  }

  const indicator = (first?.['indicator'] as string | undefined) ?? query?.indicator
  const area = multiArea
    ? undefined
    : (first?.['area'] as string | undefined) ?? queryAreas[0]

  let records: FormattedDataResult['records']
  if (multiArea) {
    const grouped: Record<string, Array<Record<string, unknown>>> = {}
    for (const r of result.records) {
      const key = r.area ?? 'unknown'
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(toRecord(r, false))
    }
    records = grouped
  } else {
    records = result.records.map(r => toRecord(r, false))
  }

  return {
    count: result.count,
    ...(truncation ? { showing: truncation.top, truncated: true } : {}),
    indicator,
    indicatorName: names?.indicatorName,
    area,
    database: first?.['DATABASE_ID'] as string | undefined,
    databaseName: names?.databaseName,
    warning: result.records.length === 0
      ? 'No data returned. Possible causes: invalid area code, indicator not available for this region, or date range out of bounds. Run "worldbank countries" to verify area codes.'
      : undefined,
    meta,
    records
  }
}
