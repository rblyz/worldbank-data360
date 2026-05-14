import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { paginate } from '../src/endpoints/data.js'

function makeRecord(obsValue: string, i = 0) {
  return {
    OBS_VALUE: obsValue,
    INDICATOR: 'WB_WDI_SP_POP_TOTL',
    REF_AREA: 'POL',
    TIME_PERIOD: String(2000 + i),
    OBS_STATUS: 'A',
    COMMENT_OBS: null,
    UNIT_TYPE: null
  }
}

function makePage(count: number, startValue = 0) {
  return Array.from({ length: count }, (_, i) => makeRecord(String(startValue + i), i))
}

describe('paginate()', () => {
  test('empty response — returns count 0 and no records', async () => {
    const result = await paginate(async () => ({ count: 0, value: [] }))
    assert.equal(result.count, 0)
    assert.equal(result.records.length, 0)
  })

  test('single page under 1000 — one fetcher call', async () => {
    let calls = 0
    const result = await paginate(async () => {
      calls++
      return { count: 5, value: makePage(5) }
    })
    assert.equal(calls, 1)
    assert.equal(result.records.length, 5)
    assert.equal(result.count, 5)
  })

  test('exactly 1000 records — stops after one call (allRecords.length >= totalCount)', async () => {
    let calls = 0
    const result = await paginate(async () => {
      calls++
      return { count: 1000, value: makePage(1000) }
    })
    assert.equal(calls, 1)
    assert.equal(result.records.length, 1000)
  })

  test('1001 records — makes two fetcher calls', async () => {
    let calls = 0
    const result = await paginate(async (skip) => {
      calls++
      if (skip === 0) return { count: 1001, value: makePage(1000, 0) }
      return { count: 1001, value: makePage(1, 1000) }
    })
    assert.equal(calls, 2)
    assert.equal(result.records.length, 1001)
    assert.equal(result.count, 1001)
  })

  test('second call receives correct skip value', async () => {
    const skips: number[] = []
    await paginate(async (skip) => {
      skips.push(skip)
      if (skip === 0) return { count: 1001, value: makePage(1000) }
      return { count: 1001, value: makePage(1) }
    })
    assert.deepEqual(skips, [0, 1000])
  })

  test('OBS_VALUE string is cast to number', async () => {
    const result = await paginate(async () => ({
      count: 1,
      value: [{ OBS_VALUE: '37515748.5', REF_AREA: 'POL', INDICATOR: 'X', TIME_PERIOD: '2023' }]
    }))
    assert.equal(typeof result.records[0]?.value, 'number')
    assert.equal(result.records[0]?.value, 37515748.5)
  })

  test('null and empty string fields are stripped from records', async () => {
    const result = await paginate(async () => ({
      count: 1,
      value: [{
        OBS_VALUE: '1',
        COMMENT_OBS: null,
        DATA_SOURCE: null,
        UNIT_TYPE: null,
        OBS_STATUS: 'A',
        DECIMALS: ''
      }]
    }))
    const record = result.records[0]
    assert.ok(record)
    assert.equal('COMMENT_OBS' in record, false)
    assert.equal('DATA_SOURCE' in record, false)
    assert.equal('UNIT_TYPE' in record, false)
    assert.equal('DECIMALS' in record, false)
    assert.equal((record as Record<string, unknown>)['OBS_STATUS'], 'A')
  })

  test('3000 records — three fetcher calls', async () => {
    let calls = 0
    const result = await paginate(async (skip) => {
      calls++
      const remaining = 3000 - skip
      const pageSize = Math.min(1000, remaining)
      return { count: 3000, value: makePage(pageSize, skip) }
    })
    assert.equal(calls, 3)
    assert.equal(result.records.length, 3000)
  })
})
