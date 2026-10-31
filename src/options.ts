/**
 * Query-string parsing for the chart endpoint.
 *
 * Every rejection is a ChartError with a localisable code rather than a TypeError,
 * because the Worker renders those as SVG and a broken embed stays readable.
 */
import { ChartError } from './data'
import type { ChartLanguage, ChartOptions, Metric, Theme } from './chart'

/** Metrics the metrics parameter accepts, in the order they are drawn and listed. */
const metrics: Metric[] = ['downloads', 'rating', 'ratings']
/** Range names to day counts; `all` means the whole history and maps to undefined. */
const ranges: Record<string, number | undefined> = { '30d': 30, '90d': 90, '1y': 365, all: undefined }

export function parseOptions(url: URL): ChartOptions & { start?: number; end?: number } {
  const allowed = new Set(['metrics', 'theme', 'lang', 'width', 'height', 'title', 'legend', 'grid', 'area', 'updated', 'range', 'start', 'end'])
  for (const name of url.searchParams.keys()) if (!allowed.has(name)) throw new ChartError('unknownParameter', { name })
  /** Read a parameter once; repetition is rejected instead of silently ignored. */
  const one = (name: string) => {
    const values = url.searchParams.getAll(name)
    if (values.length > 1) throw new ChartError('repeatedParameter', { name })
    return values[0]
  }
  const metricParam = one('metrics') || 'downloads'
  const selected = [...new Set(metricParam.split(',').map(v => v.trim()))]
  if (!selected.length || selected.some(v => !metrics.includes(v as Metric))) throw new ChartError('unknownMetric')
  const theme = one('theme') || 'auto'
  if (theme !== 'light' && theme !== 'dark' && theme !== 'auto') throw new ChartError('unknownTheme')
  const lang = one('lang') || 'auto'
  if (lang !== 'en' && lang !== 'zh' && lang !== 'auto') throw new ChartError('unknownLanguage')
  /** Numeric parameters are whole numbers inside an explicit range. */
  const number = (name: string, fallback: number, min: number, max: number) => {
    const raw = one(name)
    if (!raw) return fallback
    if (!/^\d+$/.test(raw)) throw new ChartError('wholeNumberParameter', { name, min, max })
    const value = Number(raw)
    if (value < min || value > max) throw new ChartError('outOfRangeParameter', { name, min, max })
    return value
  }
  /** Boolean parameters accept only the literal true or false. */
  const bool = (name: string, fallback: boolean) => {
    const raw = one(name)
    if (!raw) return fallback
    if (raw !== 'true' && raw !== 'false') throw new ChartError('booleanParameter', { name })
    return raw === 'true'
  }
  const range = one('range') || 'all'
  if (!(range in ranges)) throw new ChartError('unknownRange')
  /**
   * Dates are UTC days and independent: an omitted bound stays open, so start
   * alone runs to the newest observation and end alone covers everything up to
   * that day. An end date includes the whole day.
   */
  const parseDate = (name: string, end = false) => {
    const raw = one(name)
    if (!raw) return undefined
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
    const time = match ? Date.UTC(+match[1]!, +match[2]! - 1, +match[3]!) : NaN
    if (!match || !Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== raw) throw new ChartError('invalidDateParameter', { name })
    return Math.floor(time / 1000) + (end ? 86399 : 0)
  }
  const start = parseDate('start')
  const end = parseDate('end', true)
  if ((start || end) && range !== 'all') throw new ChartError('conflictingDateFilters')
  if (start && end && start > end) throw new ChartError('reversedDateRange')
  const days = ranges[range]
  const rangeEnd = end ?? Math.floor(Date.now() / 1000)
  return {
    width: number('width', 800, 320, 1600), height: number('height', 400, 200, 1000),
    theme: theme as Theme, metrics: selected as Metric[], lang: lang as ChartLanguage,
    title: bool('title', true), legend: bool('legend', true), grid: bool('grid', true), area: bool('area', false),
    updated: bool('updated', true),
    start: start ?? (days ? rangeEnd - days * 86400 : undefined), end,
    // Both /api/chart and /api/png/chart end with the owner/repo pair.
    repo: url.pathname.split('/').filter(Boolean).slice(-2).join('/'),
  }
}

/**
 * Restrict a history to a time window.
 *
 * Both bounds are optional: an open side keeps that end of the history, so
 * start-only runs to the newest observation and end-only from the first one.
 * When the window starts after the first observation, the last value before the
 * window is repeated at the boundary so cumulative metrics still read correctly
 * from the left edge of the chart.
 */
export function sliceHistory<T extends { t: number }>(history: T[], start?: number, end?: number): T[] {
  const filtered = history.filter(p => (!start || p.t >= start) && (!end || p.t <= end))
  if (start && filtered.length) {
    const baseline = history.findLast(p => p.t < start)
    if (baseline) filtered.unshift({ ...baseline, t: start })
  }
  return filtered
}
