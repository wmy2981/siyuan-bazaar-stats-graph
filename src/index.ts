import { waitUntil } from 'cloudflare:workers'
import { renderAutoErrorChart, renderChart, renderErrorChart } from './chart'
import demoHtml from './demo/demo.html?raw'
import demoScript from './demo/demo.js?raw'
import demoStyles from './demo/demo.css?raw'
import { ChartError, loadPackage } from './data'
import { localizeError } from './i18n'
import { parseOptions, sliceHistory } from './options'

const route = /^\/api\/chart\/([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9_.-]{1,100})\/?$/
const SECURITY = { 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox", 'Access-Control-Allow-Origin': '*' }
const DEMO_SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'none'; img-src 'self' data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
}
const demoPage = demoHtml
  .replace('/*__STYLE__*/', () => demoStyles)
  .replace('/*__SCRIPT__*/', () => demoScript)

function svg(body: string, status = 200, error = false, cache = 'MISS'): Response {
  return new Response(body, { status, headers: { ...SECURITY, 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': `public, max-age=60, s-maxage=${error ? 60 : 1800}`, 'CDN-Cache-Control': `max-age=${error ? 60 : 1800}`, 'X-Chart-Status': error ? 'error' : 'ok', 'X-Cache': cache, Vary: 'Accept-Encoding' } })
}

function demo(request: Request): Response {
  return new Response(request.method === 'HEAD' ? null : demoPage, {
    headers: { ...DEMO_SECURITY, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300', Vary: 'Accept-Encoding' },
  })
}

function errorChart(url: URL, error: ChartError): string {
  const lang = url.searchParams.get('lang')
  const en = localizeError(error.code, error.values, 'en')
  const zh = localizeError(error.code, error.values, 'zh')
  if (lang === 'en') return renderErrorChart(en.message, en.hint, 'error', 'en')
  if (lang === 'zh') return renderErrorChart(zh.message, zh.hint, 'error', 'zh')
  return renderAutoErrorChart(en.message, en.hint, zh.message, zh.hint)
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    if (request.method !== 'GET' && request.method !== 'HEAD') return svg(errorChart(url, new ChartError('methodNotAllowed')), 200, true)
    if (url.pathname === '/' || url.pathname === '/index.html') return demo(request)
    if (url.pathname === '/favicon.ico') return new Response(null, { status: 204 })
    if (url.pathname === '/robots.txt') return new Response(request.method === 'HEAD' ? null : 'User-agent: *\nAllow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } })
    const match = route.exec(url.pathname)
    if (!match) return svg(errorChart(url, new ChartError('invalidChartUrl')), 200, true)
    const cacheKey = new Request(url.toString(), { method: 'GET' })
    const staleUrl = new URL(url)
    staleUrl.searchParams.set('_stale', '1')
    const staleKey = new Request(staleUrl.toString(), { method: 'GET' })
    try {
      const options = parseOptions(url)
      const cached = await caches.default.match(cacheKey)
      if (cached) return cached
      const pkg = await loadPackage(`${match[1]}/${match[2]}`)
      const history = sliceHistory(
        pkg.history,
        options.start === undefined ? undefined : options.start * 1000,
        options.end === undefined ? undefined : options.end * 1000,
      )
      if (!history.length) throw new ChartError('noHistoryInRange', {}, 404)
      const chart = renderChart(history, options)
      const response = svg(chart)
      response.headers.set('X-Fetched-At', new Date().toISOString())
      if (pkg.stale) response.headers.set('X-Data-Stale', 'true')
      const staleCopy = response.clone()
      staleCopy.headers.set('Cache-Control', 'public, max-age=60, s-maxage=86400')
      staleCopy.headers.set('CDN-Cache-Control', 'max-age=86400')
      waitUntil(caches.default.put(cacheKey, response.clone()))
      waitUntil(caches.default.put(staleKey, staleCopy))
      return response
    } catch (cause) {
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
      return svg(errorChart(url, error), 200, true)
    }
  },
} satisfies ExportedHandler
