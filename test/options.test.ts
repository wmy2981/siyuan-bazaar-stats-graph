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
  it.each(['metrics=nope', 'theme=blue', 'lang=fr', 'width=319', 'height=1001', 'range=7d', 'start=2026-02-30', 'start=2026-10-02&end=2026-10-01', 'foo=bar', 'area=yes'])('rejects invalid input: %s', query => {
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
})

describe('history slicing', () => {
  const history = [{ t: 10, d: 1 }, { t: 20, d: 3 }, { t: 30, d: 8 }]
  it('carries the last known value to the start boundary', () => {
    expect(sliceHistory(history, 25, 35)).toEqual([{ t: 25, d: 3 }, { t: 30, d: 8 }])
  })
  it('does not fabricate a baseline before the first point', () => {
    expect(sliceHistory(history, 1, 15)).toEqual([{ t: 10, d: 1 }])
  })
  it('slices open-ended ranges on either side', () => {
    // start only: keep everything from the boundary, carrying the last value.
    expect(sliceHistory(history, 15, undefined)).toEqual([{ t: 15, d: 1 }, { t: 20, d: 3 }, { t: 30, d: 8 }])
    // end only: keep everything up to the boundary, with no synthetic baseline.
    expect(sliceHistory(history, undefined, 25)).toEqual([{ t: 10, d: 1 }, { t: 20, d: 3 }])
  })
})
