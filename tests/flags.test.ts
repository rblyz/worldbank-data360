import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { parseFlags } from '../src/utils/flags.js'

describe('parseFlags', () => {
  test('parses a single flag with value', () => {
    assert.deepEqual(parseFlags(['--top', '5']), { top: '5' })
  })

  test('parses multiple flags', () => {
    assert.deepEqual(
      parseFlags(['--from', '2000', '--to', '2023']),
      { from: '2000', to: '2023' }
    )
  })

  test('parses boolean flag (no value)', () => {
    assert.deepEqual(parseFlags(['--all']), { all: '' })
  })

  test('parses mixed flags and boolean', () => {
    assert.deepEqual(
      parseFlags(['--top', '10', '--all']),
      { top: '10', all: '' }
    )
  })

  test('ignores non-flag args', () => {
    assert.deepEqual(parseFlags(['search', '--top', '5']), { top: '5' })
  })

  test('handles flag followed by another flag (boolean)', () => {
    assert.deepEqual(
      parseFlags(['--all', '--top', '5']),
      { all: '', top: '5' }
    )
  })

  test('returns empty object for no args', () => {
    assert.deepEqual(parseFlags([]), {})
  })

  test('parses area with comma-separated values as single string', () => {
    const flags = parseFlags(['--area', 'POL,DEU,USA'])
    assert.equal(flags['area'], 'POL,DEU,USA')
    assert.deepEqual(flags['area']?.split(','), ['POL', 'DEU', 'USA'])
  })
})
