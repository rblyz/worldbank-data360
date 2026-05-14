import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { formatDataResult } from '../src/utils/format.js'
import type { DataResult } from '../src/types/params.js'

function makeResult(records: Array<{ period: string; value: number; area?: string; extra?: Record<string, unknown> }>): DataResult {
  return {
    count: records.length,
    records: records.map(r => ({
      value: r.value,
      period: r.period,
      indicator: 'WB_WDI_SP_DYN_CBRT_IN',
      area: r.area ?? 'POL',
      DATABASE_ID: 'WB_WDI',
      ...r.extra
    }))
  }
}

describe('formatDataResult()', () => {
  test('single area — records is array, area hoisted to top level', () => {
    const result = formatDataResult(
      makeResult([{ period: '2023', value: 7.4 }]),
      undefined,
      { area: 'POL' }
    )
    assert.equal(result.area, 'POL')
    assert.ok(Array.isArray(result.records))
    assert.equal('area' in (result.records as Array<Record<string, unknown>>)[0]!, false)
  })

  test('multiple areas — records is object grouped by area', () => {
    const result = formatDataResult(
      makeResult([
        { period: '2023', value: 7.4, area: 'POL' },
        { period: '2023', value: 5.1, area: 'DEU' }
      ]),
      undefined,
      { area: 'POL,DEU' }
    )
    assert.equal(result.area, undefined)
    assert.ok(!Array.isArray(result.records))
    const grouped = result.records as Record<string, Array<Record<string, unknown>>>
    assert.ok('POL' in grouped)
    assert.ok('DEU' in grouped)
    assert.equal(grouped['POL']![0]!['value'], 7.4)
    assert.equal(grouped['DEU']![0]!['value'], 5.1)
  })

  test('grouped records do not include area field inside each record', () => {
    const result = formatDataResult(
      makeResult([
        { period: '2023', value: 7.4, area: 'POL' },
        { period: '2023', value: 5.1, area: 'DEU' }
      ]),
      undefined,
      { area: 'POL,DEU' }
    )
    const grouped = result.records as Record<string, Array<Record<string, unknown>>>
    assert.equal('area' in grouped['POL']![0]!, false)
  })

  test('hoists indicator and database to top level', () => {
    const result = formatDataResult(makeResult([{ period: '2023', value: 7.4 }]))
    assert.equal(result.indicator, 'WB_WDI_SP_DYN_CBRT_IN')
    assert.equal(result.database, 'WB_WDI')
  })

  test('single area records contain only period and value when no varying fields', () => {
    const result = formatDataResult(makeResult([{ period: '2023', value: 7.4 }]))
    const records = result.records as Array<Record<string, unknown>>
    const keys = Object.keys(records[0]!)
    assert.deepEqual(keys.sort(), ['period', 'value'])
  })

  test('all-caps fields go to meta, SDMX defaults (_Z _T) stripped', () => {
    const result = formatDataResult(makeResult([{
      period: '2023',
      value: 7.4,
      extra: { FREQ: 'A', SEX: '_T', AGE: '_T', OBS_STATUS: 'A' }
    }]))
    assert.equal(result.meta['FREQ'], 'A')
    assert.equal(result.meta['OBS_STATUS'], 'A')
    assert.equal('SEX' in result.meta, false)
    assert.equal('AGE' in result.meta, false)
  })

  test('varying all-caps fields appear per record, not in meta', () => {
    const result = formatDataResult(
      makeResult([
        { period: '2018', value: 0.81, area: 'FIN', extra: { SEX: 'M' } },
        { period: '2018', value: 0.84, area: 'FIN', extra: { SEX: 'F' } },
        { period: '2018', value: 0.79, area: 'SWE', extra: { SEX: 'M' } },
        { period: '2018', value: 0.83, area: 'SWE', extra: { SEX: 'F' } }
      ])
    )
    const grouped = result.records as Record<string, Array<Record<string, unknown>>>
    assert.equal(grouped['FIN']![0]!['SEX'], 'M')
    assert.equal(grouped['FIN']![1]!['SEX'], 'F')
    assert.equal('SEX' in result.meta, false)
  })

  test('truncation fields appear when provided', () => {
    const result = formatDataResult(
      makeResult([{ period: '2023', value: 7.4 }]),
      undefined,
      undefined,
      { top: 100, total: 500 }
    )
    assert.equal(result.truncated, true)
    assert.equal(result.showing, 100)
  })

  test('no truncation fields when not truncated', () => {
    const result = formatDataResult(makeResult([{ period: '2023', value: 7.4 }]))
    assert.equal(result.truncated, undefined)
    assert.equal(result.showing, undefined)
  })

  test('empty records — warning with query context echoed', () => {
    const result = formatDataResult(
      { count: 0, records: [] },
      undefined,
      { indicator: 'WB_WDI_NONEXISTENT', area: 'POL' }
    )
    assert.ok(Array.isArray(result.records))
    assert.equal((result.records as unknown[]).length, 0)
    assert.ok(typeof result.warning === 'string' && result.warning.length > 0)
    assert.equal(result.indicator, 'WB_WDI_NONEXISTENT')
    assert.equal(result.area, 'POL')
  })

  test('non-empty records — no warning', () => {
    const result = formatDataResult(makeResult([{ period: '2023', value: 7.4 }]))
    assert.equal(result.warning, undefined)
  })
})
