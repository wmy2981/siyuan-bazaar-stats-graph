/**
 * Loads the observed history for one bazaar package.
 *
 * Resolution order: a GitHub repository is mapped to a bazaar package name via the
 * stats summary (GitHub Pages mirror first, primary host second), then the generated
 * per-package history is fetched. When that fails, the raw monthly snapshots are
 * replayed instead and the result is marked stale so the chart can advertise it.
 */
import type { ChartPoint } from './chart'
import { localizeError, type ErrorCode, type ErrorValues } from './i18n'

/** Official SiYuan bazaar catalog (Qiniu CDN); used only to resolve a name. */
const INDEX_URL = 'https://bazaar.b3logfile.com/bazaar/index.json'
/** Generated stats site: package name lookup and per-package history. */
const SUMMARY_URL = 'https://siyuan-bazaar-stats.mytemos.com/data/summary.json'
/** GitHub Pages mirror of the stats site, tried first for edge latency. */
const SUMMARY_MIRROR_URL = 'https://github.mytemos.com/siyuan-bazaar-stats/data/summary.json'
/** Per-package history on the generated stats site. */
const PACKAGE_URL = 'https://siyuan-bazaar-stats.mytemos.com/data/packages/'
/** GitHub Pages mirror of the per-package history. */
const PACKAGE_MIRROR_URL = 'https://github.mytemos.com/siyuan-bazaar-stats/data/packages/'
/** Raw monthly snapshots in TCOTC/siyuan-bazaar-stats; the last-resort source. */
const RAW_URL = 'https://raw.githubusercontent.com/TCOTC/siyuan-bazaar-stats/main/data/snapshots'
/** Refuse oversized monthly snapshots instead of buffering them inside a Worker. */
const MAX_SNAPSHOT_BYTES = 24 * 1024 * 1024
/**
 * Format version of the upstream `/data/` artifacts, which carry it as `schema`.
 * Upstream freezes the field names and entry URLs but bumps this number when the
 * shape changes (docs/data-contract.md), so a different value must be refused
 * rather than read as if the fields still meant the same thing.
 */
const DATA_SCHEMA = 1

/**
 * Upstream record shapes. The collector abbreviates every metric key to keep the
 * snapshots small: d = downloads, a = average rating, c = rating count and
 * x = the five-star histogram (index 0 is one star).
 */
interface Stats { d?: number; a?: number; c?: number; x?: number[] }
interface Snapshot { t: number; full?: boolean; p: Record<string, Stats> }
interface Summary { schema?: number; packages?: { name: string; repo?: string }[] }
interface PackageDetail { schema?: number; name: string; repo: string; displayName?: string; current: Stats; history: ChartPoint[] }

/** Error carrying a localisable code, its substitutions and the status to log. */
export class ChartError extends Error {
  readonly hint: string
  constructor(readonly code: ErrorCode, readonly values: ErrorValues = {}, readonly status = 400) {
    const text = localizeError(code, values, 'en')
    super(text.message)
    this.hint = text.hint
  }
}

/** Normalised history handed to the renderer. */
export interface PackageHistory { name: string; displayName: string; history: ChartPoint[]; stale?: boolean }

/**
 * Fetch with a 15s timeout. A slow answer is treated as an outage instead of being
 * retried inside the same request: the caller already has a stale-cache fallback.
 */
async function get(url: string, timeout = 15_000): Promise<Response> {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(timeout), cf: { cacheEverything: false, cacheTtl: 0 }, headers: { 'User-Agent': 'siyuan-bazaar-stats-graph/1.0', Accept: 'application/json, application/x-ndjson, text/plain' } })
  } catch {
    throw new ChartError('dataSourceUnavailable', {}, 502)
  }
}

/** Fetch and parse JSON, mapping transport, status and parse failures to their own codes. */
async function json<T>(url: string): Promise<T> {
  const response = await get(url)
  if (!response.ok) throw new ChartError('dataSourceError', { status: response.status }, 502)
  try { return await response.json() as T }
  catch { throw new ChartError('dataSourceInvalid', {}, 502) }
}

/**
 * Refuse artifacts written for another schema.
 *
 * A missing value is accepted: the GitHub Pages mirror can lag behind the primary
 * host, and artifacts published before the field existed are still schema 1.
 */
function assertSchema(value: { schema?: unknown }): void {
  const schema = value.schema === undefined ? DATA_SCHEMA : value.schema
  if (schema !== DATA_SCHEMA) throw new ChartError('unsupportedSchema', { schema: String(schema), supported: String(DATA_SCHEMA) }, 502)
}

/** Normalise a GitHub URL or slug into a lowercase owner/repo pair. */
const repoNames = (repo: unknown): string[] => {
  if (typeof repo !== 'string') return []
  try {
    const url = new URL(repo.startsWith('http') ? repo : `https://github.com/${repo}`)
    if (url.hostname !== 'github.com' && url.hostname !== 'www.github.com') return []
    const parts = url.pathname.replace(/\.git$/, '').split('/').filter(Boolean)
    return parts.length >= 2 ? [`${parts[0]}/${parts[1]}`.toLowerCase()] : []
  } catch { return [] }
}

/**
 * Map owner/repo to a bazaar package name.
 *
 * The summary mirror lists repository URLs, so it is the cheapest lookup; the
 * official catalog is only consulted when the mirror has no entry (typically for
 * packages published after the last stats collection). A miss in both is a
 * user-facing "package not found".
 */
async function resolvePackage(repo: string): Promise<string> {
  const wanted = repo.toLowerCase()
  let summary: Summary
  try { summary = await json(SUMMARY_MIRROR_URL) } catch { summary = await json(SUMMARY_URL) }
  assertSchema(summary)
  const found = summary.packages?.find(item => repoNames(item.repo).includes(wanted))
  if (found) return found.name
  try {
    const index = await json<Record<string, unknown>>(INDEX_URL)
    const fallback = findInIndex(index, wanted)
    if (fallback) return fallback
  } catch {
    // Preserve the actionable not-found response if the secondary index is unavailable.
  }
  throw new ChartError('packageNotFound', { repo }, 404)
}

/** Depth-first search of the catalog for a record pointing at this repository. */
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

/**
 * Ratings arrive either as a five-star histogram (x) or as a precomputed average
 * (a) plus count (c). Prefer the histogram because it is exact and lets the chart
 * derive both the average and the total.
 */
function rating(stats: Stats): Pick<ChartPoint, 'a' | 'c'> {
  if (stats.x?.length === 5 && stats.x.every(n => Number.isFinite(n) && n >= 0)) {
    const c = stats.x.reduce((a, b) => a + b, 0)
    return c ? { a: stats.x.reduce((sum, n, i) => sum + n * (i + 1), 0) / c, c } : {}
  }
  return { ...(Number.isFinite(stats.a) ? { a: stats.a } : {}), ...(Number.isFinite(stats.c) ? { c: stats.c } : {}) }
}

/** Build one chart point, dropping records without a valid download count. */
function point(t: number, stats: Stats): ChartPoint | undefined {
  if (!Number.isFinite(t) || !Number.isFinite(stats.d) || (stats.d ?? -1) < 0) return undefined
  return { t: t * 1000, d: stats.d, ...rating(stats) }
}

/**
 * Per-package detail from the mirror, then the primary host; undefined when both
 * fail so the caller can replay snapshots instead.
 */
async function loadDetail(name: string): Promise<PackageDetail | undefined> {
  const file = `${encodeURIComponent(name)}.json`
  try { return await json<PackageDetail>(`${PACKAGE_MIRROR_URL}${file}`) } catch {
    try { return await json<PackageDetail>(`${PACKAGE_URL}${file}`) } catch { return undefined }
  }
}

/**
 * Preferred path: the generated per-package history for the resolved name.
 *
 * Falls back to raw snapshots when that document is missing or malformed, and
 * flags the result as stale so the SVG can advertise the degraded source. A
 * schema bump is checked outside that fallback: it is a contract change, not an
 * outage, so fields of unverified meaning must not be rendered from snapshots
 * instead.
 */
export async function loadPackage(repo: string): Promise<PackageHistory> {
  const name = await resolvePackage(repo)
  const detail = await loadDetail(name)
  if (detail) {
    assertSchema(detail)
    if (detail.name === name && Array.isArray(detail.history)) {
      const history = detail.history.map(p => point(p.t, p)).filter((p): p is ChartPoint => !!p)
      if (history.length) return { name, displayName: detail.displayName || name, history }
    }
  }
  return { name, displayName: name, history: await loadSnapshots(name), stale: true }
}

/**
 * Replay monthly snapshots as a sparse change log.
 *
 * Each line is one collection run and only changed fields are present, so a
 * `full` record resets the carried ratings. Missing ratings keep the last known
 * value, and the months are fetched in parallel.
 */
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
    if (!response.ok) throw new ChartError('historyUnavailable', { status: response.status }, 502)
    if (Number(response.headers.get('content-length')) > MAX_SNAPSHOT_BYTES) throw new ChartError('historyTooLarge', {}, 502)
    const text = await response.text()
    if (text.length > MAX_SNAPSHOT_BYTES) throw new ChartError('historyTooLarge', {}, 502)
    return text
  }))
  const history: ChartPoint[] = []
  let current: ChartPoint | undefined
  for (const text of result) for (const line of text.split('\n')) {
    if (!line.trim()) continue
    let snapshot: Snapshot
    try { snapshot = JSON.parse(line) } catch { throw new ChartError('historyMalformed', {}, 502) }
    if (!Number.isFinite(snapshot.t) || !snapshot.p || typeof snapshot.p !== 'object') continue
    if (snapshot.full) current = undefined
    const stats = snapshot.p[name]
    if (stats) {
      // Snapshots never carry `a` / `c`: upstream derives both from `x`, so only a
      // histogram is authoritative in a snapshot row and any `a` / `c` is invalid.
      const next = point(snapshot.t, { d: stats.d ?? current?.d, ...(stats.x ? { x: stats.x } : { a: current?.a, c: current?.c }) })
      if (next) { current = next; history.push(next) }
    }
  }
  return history
}
