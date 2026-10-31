/**
 * Worker entry point: serves the chart builder at /, SVG charts at
 * /api/chart/{owner}/{repo} and transparent PNG charts at
 * /api/png/chart/{owner}/{repo}. SVG routes always answer expected errors with
 * SVG; the PNG route answers with a rasterised error chart instead.
 */
import { waitUntil } from 'cloudflare:workers'
import { renderAutoErrorChart, renderChart, renderErrorChart, type ChartOptions } from './chart'
import demoHtml from './demo/demo.html?raw'
import demoScript from './demo/demo.js?raw'
import demoStyles from './demo/demo.css?raw'
import { ChartError, loadPackage } from './data'
import type { ResolvedLanguage } from './fonts'
import { localizeError } from './i18n'
import { parseOptions, sliceHistory } from './options'
import { svgToPng } from './png'

/** Owner/repo path shape shared by both chart routes; mirrors GitHub's slug rules. */
const slug = '([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))/([A-Za-z0-9_.-]{1,100})'
const svgRoute = new RegExp(`^/api/chart/${slug}/?$`)
const pngRoute = new RegExp(`^/api/png/chart/${slug}/?$`)
/** Charts are inert images, so their policy can stay maximally strict. */
const SECURITY = { 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox", 'Access-Control-Allow-Origin': '*' }
/** The builder needs inline style and script plus Cloudflare's analytics beacon. */
const DEMO_SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'none'; img-src 'self' data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
}
/** Inline the stylesheet and script so the page is a single cacheable response. */
const demoPage = demoHtml
  .replace('/*__STYLE__*/', () => demoStyles)
  .replace('/*__SCRIPT__*/', () => demoScript)

/**
 * Shared cache and status headers for SVG and PNG responses.
 *
 * Success and failure both carry Cache-Control for the edge (30 minutes for a
 * chart, one minute for an error) plus Cloudflare's CDN-Cache-Control, and the
 * cache state is reported in X-Cache.
 */
function imageHeaders(type: string, error: boolean, cache: string): Record<string, string> {
  const maxAge = error ? 60 : 1800
  return { ...SECURITY, 'Content-Type': type, 'Cache-Control': `public, max-age=60, s-maxage=${maxAge}`, 'CDN-Cache-Control': `max-age=${maxAge}`, 'X-Chart-Status': error ? 'error' : 'ok', 'X-Cache': cache, Vary: 'Accept-Encoding' }
}

function svg(body: string, status = 200, error = false, cache = 'MISS'): Response {
  return new Response(body, { status, headers: imageHeaders('image/svg+xml; charset=utf-8', error, cache) })
}

/** PNG twin of svg(): identical cache and status header semantics. */
function png(body: Uint8Array, status = 200, error = false, cache = 'MISS'): Response {
  return new Response(body as BodyInit, { status, headers: imageHeaders('image/png', error, cache) })
}

/** A stored copy carries the X-Cache it was written with, so restamp it on the way out. */
function cacheHit(response: Response): Response {
  const hit = new Response(response.body, response)
  hit.headers.set('X-Cache', 'HIT')
  return hit
}

/** Builder page; HEAD still answers with the same headers and no body. */
function demo(request: Request): Response {
  return new Response(request.method === 'HEAD' ? null : demoPage, {
    headers: { ...DEMO_SECURITY, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300', Vary: 'Accept-Encoding' },
  })
}

/** Errors render in the reader's language, or in both when lang=auto. */
function errorChart(url: URL, error: ChartError): string {
  const lang = url.searchParams.get('lang')
  const en = localizeError(error.code, error.values, 'en')
  const zh = localizeError(error.code, error.values, 'zh')
  if (lang === 'en') return renderErrorChart(en.message, en.hint, 'error', 'en')
  if (lang === 'zh') return renderErrorChart(zh.message, zh.hint, 'error', 'zh')
  return renderAutoErrorChart(en.message, en.hint, zh.message, zh.hint)
}

/**
 * PNG error surface: the single-language error chart, rasterised.
 *
 * Unlike a successful chart the error card keeps its opaque light background so
 * the message stays readable on any page colour. If the rasteriser itself is
 * what failed, fall back to the SVG error chart: a visible SVG beats a broken
 * image, and the status headers stay honest.
 */
async function pngError(url: URL, error: ChartError): Promise<Response> {
  const lang: ResolvedLanguage = url.searchParams.get('lang') === 'zh' ? 'zh' : 'en'
  const text = localizeError(error.code, error.values, lang)
  const chart = renderErrorChart(text.message, text.hint, 'error', lang)
  try {
    return png(await svgToPng(chart, lang), 200, true)
  } catch (cause) {
    console.error('PNG error chart failed; serving the SVG error chart', cause)
    return svg(chart, 200, true)
  }
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    /** PNG paths answer rasterised errors; every other path keeps the SVG contract. */
    const isPng = url.pathname.startsWith('/api/png/')
    // Only GET and HEAD are meaningful; anything else renders a visible error.
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return isPng ? pngError(url, new ChartError('methodNotAllowed')) : svg(errorChart(url, new ChartError('methodNotAllowed')), 200, true)
    }
    if (url.pathname === '/' || url.pathname === '/index.html') return demo(request)
    if (url.pathname === '/favicon.ico') return new Response(null, { status: 204 })
    if (url.pathname === '/robots.txt') return new Response(request.method === 'HEAD' ? null : 'User-agent: *\nAllow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } })
    // Unknown paths still return an image so an embed fails visibly instead of
    // blank: SVG for chart-shaped paths, a rasterised error for PNG ones.
    const match = (isPng ? pngRoute : svgRoute).exec(url.pathname)
    if (!match) {
      return isPng ? pngError(url, new ChartError('invalidChartUrl')) : svg(errorChart(url, new ChartError('invalidChartUrl')), 200, true)
    }
    const cacheKey = new Request(url.toString(), { method: 'GET' })
    const staleUrl = new URL(url)
    staleUrl.searchParams.set('_stale', '1')
    const staleKey = new Request(staleUrl.toString(), { method: 'GET' })
    try {
      const options = parseOptions(url)
      const cached = await caches.default.match(cacheKey)
      if (cached) return cacheHit(cached)
      const pkg = await loadPackage(`${match[1]}/${match[2]}`)
      const history = sliceHistory(
        pkg.history,
        options.start === undefined ? undefined : options.start * 1000,
        options.end === undefined ? undefined : options.end * 1000,
      )
      if (!history.length) throw new ChartError('noHistoryInRange', {}, 404)
      // The last-updated line uses the full upstream history, not the sliced
      // range being rendered and not the time this chart was generated.
      const lastUpdated = pkg.history.reduce((latest, point) =>
        Number.isFinite(point.t) && point.t > latest ? point.t : latest, Number.NEGATIVE_INFINITY)
      // A PNG is frozen at render time, so it cannot follow the reader the way
      // the auto SVG does: `lang=auto` and `theme=auto` — explicit or defaulted
      // — resolve to English and light, and the background is omitted.
      const lang: ResolvedLanguage = options.lang === 'zh' ? 'zh' : 'en'
      const renderOptions: ChartOptions = isPng
        ? { ...options, lang, theme: options.theme === 'dark' ? 'dark' : 'light', transparent: true }
        : options
      const chart = renderChart(history, { ...renderOptions, lastUpdated: Number.isFinite(lastUpdated) ? lastUpdated : undefined })
      const response = isPng ? png(await svgToPng(chart, lang)) : svg(chart)
      response.headers.set('X-Fetched-At', new Date().toISOString())
      if (pkg.stale) response.headers.set('X-Data-Stale', 'true')
      const staleCopy = response.clone()
      staleCopy.headers.set('Cache-Control', 'public, max-age=60, s-maxage=86400')
      staleCopy.headers.set('CDN-Cache-Control', 'max-age=86400')
      waitUntil(caches.default.put(cacheKey, response.clone()))
      waitUntil(caches.default.put(staleKey, staleCopy))
      return response
    } catch (cause) {
      // Serve the 24h stale copy instead of an error while the upstream is down.
      const previous = await caches.default.match(staleKey)
      const fetchedAt = previous ? Date.parse(previous.headers.get('X-Fetched-At') || '') : NaN
      if (previous && Date.now() - fetchedAt < 86_400_000) {
        const stale = new Response(previous.body, previous)
        stale.headers.set('X-Chart-Status', 'stale')
        stale.headers.set('X-Cache', 'STALE')
        stale.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60')
        return stale
      }
      const error = cause instanceof ChartError ? cause : new ChartError('renderFailed', {}, 502)
      if (!(cause instanceof ChartError)) console.error('Chart generation failed', cause)
      return isPng ? pngError(url, error) : svg(errorChart(url, error), 200, true)
    }
  },
} satisfies ExportedHandler
