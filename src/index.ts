import { waitUntil } from 'cloudflare:workers'
import { renderAutoErrorChart, renderChart, renderErrorChart } from './chart'
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

function errorChart(url: URL, message: string, hint: string): string {
  const lang = url.searchParams.get('lang')
  const zh = translateError(message)
  if (lang === 'en') return renderErrorChart(message, hint, 'error', 'en')
  if (lang === 'zh') return renderErrorChart(zh.message, zh.hint, 'error', 'zh')
  return renderAutoErrorChart(message, hint, zh.message, zh.hint)
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    if (request.method !== 'GET' && request.method !== 'HEAD') return svg(errorChart(url, 'Method not allowed', 'Use a GET request for this SVG endpoint.'), 200, true)
    if (url.pathname === '/' || url.pathname === '/index.html') return demo(request)
    if (url.pathname === '/favicon.ico') return new Response(null, { status: 204 })
    const match = route.exec(url.pathname)
    if (!match) return svg(errorChart(url, 'Invalid chart URL', 'Use /api/chart/{owner}/{repo}?metrics=downloads,rating,ratings'), 200, true)
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
      return svg(errorChart(url, error.message, error.hint), 200, true)
    }
  },
} satisfies ExportedHandler

function translateError(message: string): { message: string; hint: string } {
  const messages: Record<string, { message: string; hint: string }> = {
    'Package not found': { message: '未找到集市包', hint: '请检查 owner/repo，并确认该包已在思源集市上架。' },
    'No history in this date range': { message: '该时间范围内没有历史数据', hint: '请尝试 range=all 或更早的开始日期。' },
    'Data source is temporarily unavailable': { message: '数据源暂时不可用', hint: '请稍后重试。' },
    'Data source returned an error': { message: '数据源返回错误', hint: '请稍后重试。' },
    'Data source returned invalid data': { message: '数据源数据异常', hint: '请稍后重试。' },
    'History data is temporarily unavailable': { message: '历史数据暂时不可用', hint: '请稍后重试。' },
    'History data is too large': { message: '历史数据过大', hint: '请缩小时间范围。' },
    'History data is malformed': { message: '历史数据格式错误', hint: '请稍后重试。' },
    'Unknown metric': { message: '未知指标', hint: '请使用 metrics=downloads,rating,ratings（可多选）。' },
    'Unknown theme': { message: '未知主题', hint: '请使用 theme=light、theme=dark 或 theme=auto。' },
    'Unknown language': { message: '未知语言', hint: '请使用 lang=en、lang=zh 或 lang=auto。' },
    'Unknown date range': { message: '未知时间范围', hint: '请使用 range=30d、90d、1y、all，或 start/end。' },
    'Invalid chart URL': { message: '图表链接无效', hint: '请使用 /api/chart/{owner}/{repo}?metrics=downloads,rating,ratings。' },
    'Conflicting date filters': { message: '日期参数冲突', hint: 'range 与 start/end 只能二选一。' },
    'Invalid date range': { message: '日期范围无效', hint: 'start 必须早于或等于 end。' },
    'Method not allowed': { message: '请求方法不允许', hint: '请使用 GET 请求此 SVG 接口。' },
    'Unable to draw this chart': { message: '无法生成图表', hint: '请稍后重试。' },
  }
  if (messages[message]) return messages[message]
  if (message.startsWith('Invalid ')) return { message: `参数 ${message.slice(8)} 无效`, hint: '请检查参数格式与取值范围。' }
  if (message.startsWith('Unknown parameter:')) return { message: `未知参数：${message.slice(18).trim()}`, hint: '请检查图表链接中的参数名。' }
  return { message: '无法生成图表', hint: '请检查参数后重试。' }
}
