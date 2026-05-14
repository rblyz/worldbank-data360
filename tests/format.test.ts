import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { formatDataResult, formatAsCsv } from '../src/utils/format.js'
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

  test('all-caps fields go to meta, SDMX defaults and noise fields stripped', () => {
    const result = formatDataResult(makeResult([{
      period: '2023',
      value: 7.4,
      extra: { UNIT_MEASURE: 'USD', SEX: '_T', AGE: '_T', OBS_STATUS: 'A', FREQ: 'A', LATEST_DATA: false }
    }]))
    assert.equal(result.meta['UNIT_MEASURE'], 'USD')
    assert.equal('SEX' in result.meta, false)
    assert.equal('AGE' in result.meta, false)
    assert.equal('OBS_STATUS' in result.meta, false)
    assert.equal('FREQ' in result.meta, false)
    assert.equal('LATEST_DATA' in result.meta, false)
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

describe('formatAsCsv()', () => {
  test('single area — rows include area column', () => {
    const formatted = formatDataResult(makeResult([
      { period: '2020', value: 100, area: 'POL' },
      { period: '2021', value: 110, area: 'POL' }
    ]))
    const csv = formatAsCsv(formatted)
    const lines = csv.trim().split('\n')
    assert.equal(lines[0], 'area,period,value')
    assert.equal(lines[1], 'POL,2020,100')
    assert.equal(lines[2], 'POL,2021,110')
  })

  test('multi area — all areas flattened into rows', () => {
    const formatted = formatDataResult(makeResult([
      { period: '2020', value: 100, area: 'POL' },
      { period: '2020', value: 200, area: 'DEU' }
    ]))
    const csv = formatAsCsv(formatted)
    const lines = csv.trim().split('\n')
    assert.equal(lines[0], 'area,period,value')
    assert.equal(lines.length, 3)
    assert.ok(lines.some(l => l.startsWith('POL,')))
    assert.ok(lines.some(l => l.startsWith('DEU,')))
  })

  test('extra dimensions appear as columns', () => {
    const formatted = formatDataResult(makeResult([
      { period: '2018', value: 0.81, area: 'FIN', extra: { SEX: 'M' } },
      { period: '2018', value: 0.84, area: 'FIN', extra: { SEX: 'F' } }
    ]))
    const csv = formatAsCsv(formatted)
    const lines = csv.trim().split('\n')
    assert.ok(lines[0]!.includes('SEX'))
    assert.ok(lines.some(l => l.includes(',M')))
    assert.ok(lines.some(l => l.includes(',F')))
  })

  test('values with commas are quoted', () => {
    const formatted = formatDataResult(makeResult([
      { period: '2020', value: 100, area: 'POL', extra: { SEX: 'note, with comma' } },
      { period: '2021', value: 110, area: 'POL', extra: { SEX: 'other' } }
    ]))
    const csv = formatAsCsv(formatted)
    assert.ok(csv.includes('"note, with comma"'))
  })

  test('empty records — returns empty string', () => {
    const formatted = formatDataResult({ count: 0, records: [] }, undefined, { area: 'POL' })
    assert.equal(formatAsCsv(formatted), '')
  })
})
