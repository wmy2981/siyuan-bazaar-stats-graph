import { describe, expect, it } from 'vitest'
import { parseOptions, sliceHistory } from '../src/options'

const url = (query = '') => new URL(`https://charts.example/api/chart/owner/repo?${query}`)

describe('chart parameters', () => {
  it('has safe defaults and supports all metrics', () => {
    expect(parseOptions(url())).toMatchObject({ width: 800, height: 400, metrics: ['downloads'], theme: 'auto', repo: 'owner/repo' })
    expect(parseOptions(url('metrics=downloads,rating,ratings&theme=dark&area=true')).metrics).toHaveLength(3)
  })
  it.each(['metrics=nope', 'theme=blue', 'width=319', 'height=1001', 'range=7d', 'start=2026-02-30', 'start=2026-10-02&end=2026-10-01', 'foo=bar', 'area=yes'])('rejects invalid input: %s', query => {
    expect(() => parseOptions(url(query))).toThrow()
  })
  it('accepts explicit dates and deduplicates metrics', () => {
    const parsed = parseOptions(url('metrics=rating,rating&start=2026-08-01&end=2026-08-02'))
    expect(parsed.metrics).toEqual(['rating'])
    expect(parsed.start).toBe(Date.UTC(2026, 7, 1) / 1000)
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
})
