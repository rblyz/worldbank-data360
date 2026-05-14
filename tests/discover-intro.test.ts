import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { printDiscoverIntro } from '../src/utils/discover-intro.js'

const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '')

describe('printDiscoverIntro()', () => {
  test('includes total indicator count formatted with locale separator', () => {
    assert.ok(stripAnsi(printDiscoverIntro(12938)).includes('12,938'))
  })

  test('contains QUICK START section', () => {
    assert.ok(stripAnsi(printDiscoverIntro(12938)).includes('QUICK START'))
  })

  test('contains DATABASES section', () => {
    assert.ok(stripAnsi(printDiscoverIntro(12938)).includes('DATABASES'))
  })

  test('mentions --databases flag', () => {
    assert.ok(stripAnsi(printDiscoverIntro(12938)).includes('--databases'))
  })

  test('mentions CSV export', () => {
    assert.ok(stripAnsi(printDiscoverIntro(12938)).includes('--format csv'))
  })

  test('mentions jq pattern', () => {
    assert.ok(stripAnsi(printDiscoverIntro(12938)).includes('jq'))
  })

  test('total indicator count is interpolated correctly', () => {
    const plain = stripAnsi(printDiscoverIntro(5000))
    assert.ok(plain.includes('5,000'))
    assert.ok(!plain.includes('12,938'))
  })
})
