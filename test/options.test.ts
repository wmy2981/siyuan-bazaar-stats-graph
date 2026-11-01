/** Query-string validation and history slicing. */
import { describe, expect, it } from 'vitest'
import { parseOptions, sliceHistory } from '../src/options'

const url = (query = '') => new URL(`https://charts.example/api/chart/owner/repo?${query}`)

describe('chart parameters', () => {
  it('has safe defaults and supports all metrics', () => {
    expect(parseOptions(url())).toMatchObject({ width: 800, height: 400, metrics: ['downloads'], theme: 'auto', lang: 'auto', repo: 'owner/repo' })
    expect(parseOptions(url('metrics=downloads,rating,ratings&theme=dark&area=true')).metrics).toHaveLength(3)
    expect(parseOptions(url('lang=auto')).lang).toBe('auto')
    expect(parseOptions(url('lang=zh')).lang).toBe('zh')
    expect(parseOptions(url('lang=en')).lang).toBe('en')
    expect(parseOptions(url()).updated).toBe(true)
    expect(parseOptions(url('updated=false')).updated).toBe(false)
    expect(parseOptions(url('updated=true')).updated).toBe(true)
  })
  it.each([
    'metrics=nope',
    'theme=blue',
    'lang=fr',
    'width=319',
    'height=1001',
    'range=7d',
    'start=2026-02-30',
    'start=2026-10-02&end=2026-10-01',
    'foo=bar',
    'area=yes',
  ])('rejects invalid input: %s', (query) => {
    expect(() => parseOptions(url(query))).toThrow()
  })
  it('accepts explicit dates and deduplicates metrics', () => {
    const parsed = parseOptions(url('metrics=rating,rating&start=2026-08-01&end=2026-08-02'))
    expect(parsed.metrics).toEqual(['rating'])
    expect(parsed.start).toBe(Date.UTC(2026, 7, 1) / 1000)
  })
  it('accepts a one-sided date range', () => {
    // start only: the upper bound stays open (newest observation).
    const fromStart = parseOptions(url('start=2026-08-01'))
    expect(fromStart.start).toBe(Date.UTC(2026, 7, 1) / 1000)
    expect(fromStart.end).toBeUndefined()
    // end only: the lower bound stays open (first observation), end covers the day.
    const toEnd = parseOptions(url('end=2026-08-02'))
    expect(toEnd.start).toBeUndefined()
    expect(toEnd.end).toBe(Date.UTC(2026, 7, 2) / 1000 + 86399)
    // Both bounds remain independent when both are supplied.
    expect(parseOptions(url('start=2026-08-01&end=2026-08-02')).start).toBe(Date.UTC(2026, 7, 1) / 1000)
  })
  it('treats the epoch date as a real boundary', () => {
    // 1970-01-01 parses to second 0, which must not read as "no start given".
    const parsed = parseOptions(url('start=1970-01-01'))
    expect(parsed.start).toBe(0)
    // A date bound still conflicts with a fixed window, and reversals are still caught.
    expect(() => parseOptions(url('start=1970-01-01&range=30d'))).toThrow()
    expect(() => parseOptions(url('start=1970-01-02&end=1970-01-01'))).toThrow()
  })
  it('fixes the PNG theme instead of resolving auto', () => {
    const png = (query = '') => new URL(`https://charts.example/api/png/chart/owner/repo?${query}`)
    // A raster is frozen at render time, so it defaults to light and must name a theme.
    expect(parseOptions(png(), true).theme).toBe('light')
    expect(parseOptions(png('theme=dark'), true).theme).toBe('dark')
    expect(parseOptions(png('theme=transparent'), true).theme).toBe('transparent')
    expect(() => parseOptions(png('theme=auto'), true)).toThrow()
    expect(() => parseOptions(png('theme=blue'), true)).toThrow()
    // The SVG route still defaults to auto and accepts transparent.
    expect(parseOptions(url('theme=transparent')).theme).toBe('transparent')
  })
})

describe('history slicing', () => {
  const history = [
    { t: 10, d: 1 },
    { t: 20, d: 3 },
    { t: 30, d: 8 },
  ]
  it('carries the last known value to the start boundary', () => {
    expect(sliceHistory(history, 25, 35)).toEqual([
      { t: 25, d: 3 },
      { t: 30, d: 8 },
    ])
  })
  it('does not fabricate a baseline before the first point', () => {
    expect(sliceHistory(history, 1, 15)).toEqual([{ t: 10, d: 1 }])
  })
  it('slices open-ended ranges on either side', () => {
    // start only: keep everything from the boundary, carrying the last value.
    expect(sliceHistory(history, 15, undefined)).toEqual([
      { t: 15, d: 1 },
      { t: 20, d: 3 },
      { t: 30, d: 8 },
    ])
    // end only: keep everything up to the boundary, with no synthetic baseline.
    expect(sliceHistory(history, undefined, 25)).toEqual([
      { t: 10, d: 1 },
      { t: 20, d: 3 },
    ])
  })
})
