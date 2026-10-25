import { waitUntil } from 'cloudflare:workers'
import { renderChart, renderErrorChart } from './chart'
import demoHtml from './demo.html?raw'
import demoScript from './demo.js?raw'
import demoStyles from './demo.css?raw'
import { ChartError, loadPackage } from './data'
import { parseOptions, sliceHistory } from './options'

const route = /^\/api\/chart\/([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9_.-]{1,100})\/?$/
const SECURITY = { 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox", 'Access-Control-Allow-Origin': '*' }
const DEMO_SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
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

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    if (request.method !== 'GET' && request.method !== 'HEAD') return svg(renderErrorChart('Method not allowed', 'Use a GET request for this SVG endpoint.'), 200, true)
    if (url.pathname === '/' || url.pathname === '/index.html') return demo(request)
    if (url.pathname === '/favicon.ico') return new Response(null, { status: 204 })
    const match = route.exec(url.pathname)
    if (!match) return svg(renderErrorChart('Invalid chart URL', 'Use /api/chart/{owner}/{repo}?metrics=downloads,rating,ratings'), 200, true)
    try {
      const options = parseOptions(url)
      const cacheKey = new Request(url.toString(), { method: 'GET' })
      const cached = await caches.default.match(cacheKey)
      if (cached) return cached
      const pkg = await loadPackage(`${match[1]}/${match[2]}`)
      const history = sliceHistory(pkg.history, options.start, options.end)
      if (!history.length) throw new ChartError('No history in this date range', 'Try range=all or an earlier start date.', 404)
      const chart = renderChart(history, options)
      const response = svg(chart)
      response.headers.set('X-Fetched-At', new Date().toISOString())
      if (pkg.stale) response.headers.set('X-Data-Stale', 'true')
      waitUntil(caches.default.put(cacheKey, response.clone()))
      return response
    } catch (cause) {
      const previous = await caches.default.match(new Request(url.toString(), { method: 'GET' }))
      const fetchedAt = previous ? Date.parse(previous.headers.get('X-Fetched-At') || '') : NaN
      if (previous && Date.now() - fetchedAt < 86_400_000) {
        const stale = new Response(previous.body, previous)
        stale.headers.set('X-Chart-Status', 'stale')
        stale.headers.set('X-Cache', 'STALE')
        stale.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60')
        return stale
      }
      const error = cause instanceof ChartError ? cause : new ChartError('Unable to draw this chart', 'Please try again in a minute.', 502)
      if (!(cause instanceof ChartError)) console.error('Chart generation failed', cause)
      const zh = url.searchParams.get('lang') === 'zh'
      const message = zh ? translateError(error.message) : error.message
      return svg(renderErrorChart(message, error.hint), 200, true)
    }
  },
} satisfies ExportedHandler

function translateError(message: string): string {
  const messages: Record<string, string> = {
    'Package not found': '未找到集市包',
    'No history in this date range': '该时间范围内没有历史数据',
    'Data source is temporarily unavailable': '数据源暂时不可用',
    'History data is temporarily unavailable': '历史数据暂时不可用',
    'Unknown metric': '未知指标',
    'Unknown theme': '未知主题',
    'Invalid chart URL': '图表链接无效',
  }
  return messages[message] ?? '无法生成图表'
}
