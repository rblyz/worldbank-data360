import type { DataRecord } from '../types/params.js'

export function stripEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {}
  for (const key of Object.keys(obj) as Array<keyof T>) {
    const val = obj[key]
    if (val !== null && val !== undefined && val !== '') {
      result[key] = val
    }
  }
  return result
}

export function normalizeDataRecord(raw: Record<string, unknown>): DataRecord {
  const { OBS_VALUE, INDICATOR, REF_AREA, TIME_PERIOD, ...rest } = raw

  const record: DataRecord = {
    value: OBS_VALUE !== undefined && OBS_VALUE !== '' ? Number(OBS_VALUE) : NaN
  }

  if (INDICATOR && typeof INDICATOR === 'string') record.indicator = INDICATOR
  if (REF_AREA && typeof REF_AREA === 'string') record.area = REF_AREA
  if (TIME_PERIOD && typeof TIME_PERIOD === 'string') record.period = TIME_PERIOD

  for (const [k, v] of Object.entries(rest)) {
    if (v !== null && v !== undefined && v !== '') {
      (record as unknown as Record<string, unknown>)[k] = v
    }
  }

  return record
}
