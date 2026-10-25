import { ChartError } from './data'
import type { ChartOptions, Metric, Theme } from './chart'

const metrics: Metric[] = ['downloads', 'rating', 'ratings']
const ranges: Record<string, number | undefined> = { '30d': 30, '90d': 90, '1y': 365, all: undefined }

export function parseOptions(url: URL): ChartOptions & { start?: number; end?: number } {
  const allowed = new Set(['metrics', 'theme', 'lang', 'width', 'height', 'title', 'legend', 'grid', 'area', 'range', 'start', 'end'])
  for (const name of url.searchParams.keys()) if (!allowed.has(name)) throw new ChartError(`Unknown parameter: ${name}`, 'Use metrics, theme, width, height, range, start, end, lang, title, legend, grid or area.')
  const one = (name: string) => {
    const values = url.searchParams.getAll(name)
    if (values.length > 1) throw new ChartError(`Invalid ${name}`, `Provide one ${name} parameter.`)
    return values[0]
  }
  const metricParam = one('metrics') || 'downloads'
  const selected = [...new Set(metricParam.split(',').map(v => v.trim()))]
  if (!selected.length || selected.some(v => !metrics.includes(v as Metric))) throw new ChartError('Unknown metric', 'Use metrics=downloads,rating,ratings (one or more).')
  const theme = one('theme') || 'light'
  if (theme !== 'light' && theme !== 'dark') throw new ChartError('Unknown theme', 'Use theme=light or theme=dark.')
  const lang = one('lang') || 'en'
  if (lang !== 'en' && lang !== 'zh') throw new ChartError('Unknown language', 'Use lang=en or lang=zh.')
  const number = (name: string, fallback: number, min: number, max: number) => {
    const raw = one(name)
    if (!raw) return fallback
    if (!/^\d+$/.test(raw)) throw new ChartError(`Invalid ${name}`, `${name} must be a whole number from ${min} to ${max}.`)
    const value = Number(raw)
    if (value < min || value > max) throw new ChartError(`Invalid ${name}`, `${name} must be from ${min} to ${max}.`)
    return value
  }
  const bool = (name: string, fallback: boolean) => {
    const raw = one(name)
    if (!raw) return fallback
    if (raw !== 'true' && raw !== 'false') throw new ChartError(`Invalid ${name}`, `${name} must be true or false.`)
    return raw === 'true'
  }
  const range = one('range') || 'all'
  if (!(range in ranges)) throw new ChartError('Unknown date range', 'Use range=30d,90d,1y,all, or start=YYYY-MM-DD&end=YYYY-MM-DD.')
  const parseDate = (name: string, end = false) => {
    const raw = one(name)
    if (!raw) return undefined
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
    const time = match ? Date.UTC(+match[1]!, +match[2]! - 1, +match[3]!) : NaN
    if (!match || !Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== raw) throw new ChartError(`Invalid ${name}`, `${name} must be a valid date in YYYY-MM-DD format.`)
    return Math.floor(time / 1000) + (end ? 86399 : 0)
  }
  const start = parseDate('start')
  const end = parseDate('end', true)
  if ((start || end) && range !== 'all') throw new ChartError('Conflicting date filters', 'Use either range or start/end, not both.')
  if (start && end && start > end) throw new ChartError('Invalid date range', 'start must be earlier than or equal to end.')
  const days = ranges[range]
  const rangeEnd = end ?? Math.floor(Date.now() / 1000)
  return {
    width: number('width', 800, 320, 1600), height: number('height', 400, 200, 1000),
    theme: theme as Theme, metrics: selected as Metric[], lang: lang as 'en' | 'zh',
    title: bool('title', true), legend: bool('legend', true), grid: bool('grid', true), area: bool('area', false),
    start: start ?? (days ? rangeEnd - days * 86400 : undefined), end,
    repo: `${url.pathname.split('/')[3]}/${url.pathname.split('/')[4]}`,
  }
}

export function sliceHistory<T extends { t: number }>(history: T[], start?: number, end?: number): T[] {
  const filtered = history.filter(p => (!start || p.t >= start) && (!end || p.t <= end))
  if (start && filtered.length) {
    const baseline = history.findLast(p => p.t < start)
    if (baseline) filtered.unshift({ ...baseline, t: start })
  }
  return filtered
}
