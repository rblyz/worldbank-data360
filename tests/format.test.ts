import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { formatDataResult } from '../src/utils/format.js'
import type { DataResult } from '../src/types/params.js'

function makeResult(records: Array<{ period: string; value: number; extra?: Record<string, unknown> }>): DataResult {
  return {
    count: records.length,
    records: records.map(r => ({
      value: r.value,
      period: r.period,
      indicator: 'WB_WDI_SP_DYN_CBRT_IN',
      area: 'POL',
      DATABASE_ID: 'WB_WDI',
      ...r.extra
    }))
  }
}

describe('formatDataResult()', () => {
  test('preserves record order (sorting is done by paginate)', () => {
    const result = formatDataResult(makeResult([
      { period: '2000', value: 9 },
      { period: '2005', value: 8 },
      { period: '2010', value: 10 }
    ]))
    assert.deepEqual(result.records.map(r => r.period), ['2000', '2005', '2010'])
  })

  test('hoists indicator, area, database to top level', () => {
    const result = formatDataResult(makeResult([{ period: '2023', value: 7.4 }]))
    assert.equal(result.indicator, 'WB_WDI_SP_DYN_CBRT_IN')
    assert.equal(result.area, 'POL')
    assert.equal(result.database, 'WB_WDI')
  })

  test('records contain only period and value', () => {
    const result = formatDataResult(makeResult([{ period: '2023', value: 7.4 }]))
    const keys = Object.keys(result.records[0]!)
    assert.deepEqual(keys.sort(), ['period', 'value'])
  })

  test('meta contains noise fields from first record', () => {
    const result = formatDataResult(makeResult([{
      period: '2023',
      value: 7.4,
      extra: { FREQ: 'A', DECIMALS: '2', OBS_STATUS: 'A' }
    }]))
    assert.equal(result.meta['FREQ'], 'A')
    assert.equal(result.meta['DECIMALS'], '2')
    assert.equal(result.meta['OBS_STATUS'], 'A')
  })

  test('meta strips SDMX default values (_Z, _T)', () => {
    const result = formatDataResult(makeResult([{
      period: '2023',
      value: 7.4,
      extra: { SEX: '_T', AGE: '_T', COMP_BREAKDOWN_1: '_Z', FREQ: 'A' }
    }]))
    assert.equal('SEX' in result.meta, false)
    assert.equal('AGE' in result.meta, false)
    assert.equal('COMP_BREAKDOWN_1' in result.meta, false)
    assert.equal(result.meta['FREQ'], 'A')
  })

  test('meta strips null and empty string noise fields', () => {
    const result = formatDataResult(makeResult([{
      period: '2023',
      value: 7.4,
      extra: { OBS_CONF: null as unknown as string, TIME_FORMAT: '' }
    }]))
    assert.equal('OBS_CONF' in result.meta, false)
    assert.equal('TIME_FORMAT' in result.meta, false)
  })

  test('meta keeps numeric 0 and boolean false', () => {
    const result = formatDataResult(makeResult([{
      period: '2023',
      value: 7.4,
      extra: { UNIT_MULT: 0, LATEST_DATA: false }
    }]))
    assert.equal(result.meta['UNIT_MULT'], 0)
    assert.equal(result.meta['LATEST_DATA'], false)
  })

  test('empty records — returns empty array and no meta', () => {
    const result = formatDataResult({ count: 0, records: [] })
    assert.equal(result.records.length, 0)
    assert.deepEqual(result.meta, {})
  })
})
