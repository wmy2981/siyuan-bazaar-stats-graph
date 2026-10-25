import type { ChartPoint } from './chart'

const INDEX_URL = 'https://bazaar.b3logfile.com/bazaar/index.json'
const SUMMARY_URL = 'https://siyuan-bazaar-stats.mytemos.com/data/summary.json'
const SUMMARY_MIRROR_URL = 'https://github.mytemos.com/siyuan-bazaar-stats/data/summary.json'
const PACKAGE_URL = 'https://siyuan-bazaar-stats.mytemos.com/data/packages/'
const PACKAGE_MIRROR_URL = 'https://github.mytemos.com/siyuan-bazaar-stats/data/packages/'
const RAW_URL = 'https://raw.githubusercontent.com/TCOTC/siyuan-bazaar-stats/main/data/snapshots'
const MAX_SNAPSHOT_BYTES = 24 * 1024 * 1024

interface Stats { d?: number; a?: number; c?: number; x?: number[] }
interface Snapshot { t: number; full?: boolean; p: Record<string, Stats> }
interface PackageDetail { name: string; repo: string; displayName?: string; current: Stats; history: ChartPoint[] }

export class ChartError extends Error {
  constructor(message: string, public hint: string, public status = 400) { super(message) }
}

export interface PackageHistory { name: string; displayName: string; history: ChartPoint[]; stale?: boolean }

async function get(url: string, timeout = 15_000): Promise<Response> {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(timeout), cf: { cacheEverything: false, cacheTtl: 0 }, headers: { 'User-Agent': 'siyuan-bazaar-stats-graph/1.0', Accept: 'application/json, application/x-ndjson, text/plain' } })
  } catch {
    throw new ChartError('Data source is temporarily unavailable', 'Please try again in a minute.', 502)
  }
}

async function json<T>(url: string): Promise<T> {
  const response = await get(url)
  if (!response.ok) throw new ChartError('Data source returned an error', `Upstream status: ${response.status}. Please try again later.`, 502)
  try { return await response.json() as T }
  catch { throw new ChartError('Data source returned invalid data', 'Please try again after the upstream data is repaired.', 502) }
}

const repoNames = (repo: unknown): string[] => {
  if (typeof repo !== 'string') return []
  try {
    const url = new URL(repo.startsWith('http') ? repo : `https://github.com/${repo}`)
    if (url.hostname !== 'github.com' && url.hostname !== 'www.github.com') return []
    const parts = url.pathname.replace(/\.git$/, '').split('/').filter(Boolean)
    return parts.length >= 2 ? [`${parts[0]}/${parts[1]}`.toLowerCase()] : []
  } catch { return [] }
}

async function resolvePackage(repo: string): Promise<string> {
  const wanted = repo.toLowerCase()
  let summary: { packages?: { name: string; repo?: string }[] }
  try { summary = await json(SUMMARY_MIRROR_URL) } catch { summary = await json(SUMMARY_URL) }
  const found = summary.packages?.find(item => repoNames(item.repo).includes(wanted))
  if (found) return found.name
  try {
    const index = await json<Record<string, unknown>>(INDEX_URL)
    const fallback = findInIndex(index, wanted)
    if (fallback) return fallback
  } catch {
    // Preserve the actionable not-found response if the secondary index is unavailable.
  }
  throw new ChartError('Package not found', `No bazaar package matches github.com/${repo}. Check owner/repo and package availability.`, 404)
}

function findInIndex(value: unknown, repo: string, key = ''): string | undefined {
  if (!value || typeof value !== 'object') return undefined
  if (Array.isArray(value)) {
    for (const item of value) { const found = findInIndex(item, repo, key); if (found) return found }
    return undefined
  }
  const record = value as Record<string, unknown>
  if (repoNames(record.repo).includes(repo) || repoNames(record.url).includes(repo)) return key || (typeof record.name === 'string' ? record.name : undefined)
  for (const [childKey, child] of Object.entries(record)) { const found = findInIndex(child, repo, childKey); if (found) return found }
  return undefined
}

function rating(stats: Stats): Pick<ChartPoint, 'a' | 'c'> {
  if (stats.x?.length === 5 && stats.x.every(n => Number.isFinite(n) && n >= 0)) {
    const c = stats.x.reduce((a, b) => a + b, 0)
    return c ? { a: stats.x.reduce((sum, n, i) => sum + n * (i + 1), 0) / c, c } : {}
  }
  return { ...(Number.isFinite(stats.a) ? { a: stats.a } : {}), ...(Number.isFinite(stats.c) ? { c: stats.c } : {}) }
}

function point(t: number, stats: Stats): ChartPoint | undefined {
  if (!Number.isFinite(t) || !Number.isFinite(stats.d) || (stats.d ?? -1) < 0) return undefined
  return { t: t * 1000, d: stats.d, ...rating(stats) }
}

export async function loadPackage(repo: string): Promise<PackageHistory> {
  const name = await resolvePackage(repo)
  try {
    let detail: PackageDetail
    try { detail = await json(`${PACKAGE_MIRROR_URL}${encodeURIComponent(name)}.json`) }
    catch { detail = await json(`${PACKAGE_URL}${encodeURIComponent(name)}.json`) }
    if (detail.name === name && Array.isArray(detail.history)) {
      const history = detail.history.map(p => point(p.t, p)).filter((p): p is ChartPoint => !!p)
      if (history.length) return { name, displayName: detail.displayName || name, history }
    }
  } catch {
    // The public raw snapshots are the fallback when the generated site is unavailable.
  }
  return { name, displayName: name, history: await loadSnapshots(name), stale: true }
}

async function loadSnapshots(name: string): Promise<ChartPoint[]> {
  const now = new Date()
  const months: string[] = []
  // History began in August 2026. Include the prior month for range baselines.
  for (let year = 2026, month = 7; year < now.getUTCFullYear() || (year === now.getUTCFullYear() && month <= now.getUTCMonth());) {
    months.push(`${year}-${String(month + 1).padStart(2, '0')}`)
    if (++month === 12) { month = 0; year++ }
  }
  const result = await Promise.all(months.map(async month => {
    const response = await get(`${RAW_URL}/${month}.jsonl`)
    if (response.status === 404) return ''
    if (!response.ok) throw new ChartError('History data is temporarily unavailable', `Upstream status: ${response.status}. Please try again later.`, 502)
    if (Number(response.headers.get('content-length')) > MAX_SNAPSHOT_BYTES) throw new ChartError('History data is too large', 'Use a narrower date range.', 502)
    const text = await response.text()
    if (text.length > MAX_SNAPSHOT_BYTES) throw new ChartError('History data is too large', 'Use a narrower date range.', 502)
    return text
  }))
  const history: ChartPoint[] = []
  let current: ChartPoint | undefined
  for (const text of result) for (const line of text.split('\n')) {
    if (!line.trim()) continue
    let snapshot: Snapshot
    try { snapshot = JSON.parse(line) } catch { throw new ChartError('History data is malformed', 'Please try again after the upstream data is repaired.', 502) }
    if (!Number.isFinite(snapshot.t) || !snapshot.p || typeof snapshot.p !== 'object') continue
    if (snapshot.full) current = undefined
    const stats = snapshot.p[name]
    if (stats) {
      const next = point(snapshot.t, { ...current, ...stats, ...(stats.x ? {} : { a: current?.a, c: current?.c }) })
      if (next) { current = next; history.push(next) }
    }
  }
  return history
}
