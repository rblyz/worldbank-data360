import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { stripEmpty, normalizeDataRecord } from '../src/utils/compact.js'

describe('stripEmpty', () => {
  test('removes null values', () => {
    const result = stripEmpty({ a: 'hello', b: null, c: 42 })
    assert.deepEqual(result, { a: 'hello', c: 42 })
  })

  test('removes undefined values', () => {
    const result = stripEmpty({ a: 'hello', b: undefined })
    assert.deepEqual(result, { a: 'hello' })
  })

  test('removes empty string', () => {
    const result = stripEmpty({ a: 'hello', b: '' })
    assert.deepEqual(result, { a: 'hello' })
  })

  test('keeps 0 and false', () => {
    const result = stripEmpty({ a: 0, b: false, c: '' })
    assert.deepEqual(result, { a: 0, b: false })
  })

  test('keeps boolean true', () => {
    const result = stripEmpty({ a: true, b: null })
    assert.deepEqual(result, { a: true })
  })

  test('returns empty object when all values are empty', () => {
    const result = stripEmpty({ a: null, b: undefined, c: '' })
    assert.deepEqual(result, {})
  })
})

describe('normalizeDataRecord', () => {
  test('casts OBS_VALUE string to number', () => {
    const result = normalizeDataRecord({ OBS_VALUE: '37515748' })
    assert.equal(result.value, 37515748)
    assert.equal(typeof result.value, 'number')
  })

  test('casts float OBS_VALUE correctly', () => {
    const result = normalizeDataRecord({ OBS_VALUE: '13621.902' })
    assert.equal(result.value, 13621.902)
  })

  test('renames INDICATOR → indicator', () => {
    const result = normalizeDataRecord({ OBS_VALUE: '1', INDICATOR: 'WB_WDI_SP_POP_TOTL' })
    assert.equal(result.indicator, 'WB_WDI_SP_POP_TOTL')
    assert.equal('INDICATOR' in result, false)
  })

  test('renames REF_AREA → area', () => {
    const result = normalizeDataRecord({ OBS_VALUE: '1', REF_AREA: 'POL' })
    assert.equal(result.area, 'POL')
    assert.equal('REF_AREA' in result, false)
  })

  test('renames TIME_PERIOD → period', () => {
    const result = normalizeDataRecord({ OBS_VALUE: '1', TIME_PERIOD: '2023' })
    assert.equal(result.period, '2023')
    assert.equal('TIME_PERIOD' in result, false)
  })

  test('strips null fields from remaining keys', () => {
    const result = normalizeDataRecord({
      OBS_VALUE: '1',
      COMMENT_OBS: null,
      OBS_STATUS: 'A',
      UNIT_TYPE: null
    })
    assert.equal('COMMENT_OBS' in result, false)
    assert.equal('UNIT_TYPE' in result, false)
    assert.equal((result as Record<string, unknown>)['OBS_STATUS'], 'A')
  })

  test('strips empty string fields from remaining keys', () => {
    const result = normalizeDataRecord({ OBS_VALUE: '1', DATA_SOURCE: '' })
    assert.equal('DATA_SOURCE' in result, false)
  })

  test('keeps boolean false and number 0 in remaining keys', () => {
    const result = normalizeDataRecord({ OBS_VALUE: '1', LATEST_DATA: false, UNIT_MULT: 0 })
    assert.equal(result.LATEST_DATA, false)
    assert.equal(result.UNIT_MULT, 0)
  })

  test('returns NaN for missing OBS_VALUE', () => {
    const result = normalizeDataRecord({})
    assert.equal(isNaN(result.value), true)
  })

  test('returns NaN for empty string OBS_VALUE', () => {
    const result = normalizeDataRecord({ OBS_VALUE: '' })
    assert.equal(isNaN(result.value), true)
  })

  test('full record - real API shape', () => {
    const raw = {
      OBS_VALUE: '36687353',
      TIME_FORMAT: 'P1Y',
      UNIT_MULT: 0,
      COMMENT_OBS: null,
      OBS_STATUS: 'A',
      OBS_CONF: 'PU',
      AGG_METHOD: '_Z',
      DECIMALS: '2',
      COMMENT_TS: null,
      DATA_SOURCE: null,
      LATEST_DATA: false,
      DATABASE_ID: 'WB_WDI',
      INDICATOR: 'WB_WDI_SP_POP_TOTL',
      REF_AREA: 'POL',
      SEX: '_T',
      TIME_PERIOD: '2023',
      FREQ: 'A',
      UNIT_MEASURE: 'PS',
      UNIT_TYPE: null
    }

    const result = normalizeDataRecord(raw)

    assert.equal(result.value, 36687353)
    assert.equal(result.indicator, 'WB_WDI_SP_POP_TOTL')
    assert.equal(result.area, 'POL')
    assert.equal(result.period, '2023')
    assert.equal('COMMENT_OBS' in result, false)
    assert.equal('COMMENT_TS' in result, false)
    assert.equal('DATA_SOURCE' in result, false)
    assert.equal('UNIT_TYPE' in result, false)
    assert.equal(result.LATEST_DATA, false)
    assert.equal(result.UNIT_MULT, 0)
  })
})
