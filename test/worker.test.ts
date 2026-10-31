/** Worker contract: routing, caching, error surfaces and response headers. */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const summary = { packages: [{ name: 'sample', repo: 'owner/repo' }] }
const detail = { name: 'sample', repo: 'owner/repo', current: { d: 42 }, history: [{ t: 1787702400, d: 20 }, { t: 1790294400, d: 42, a: 4.5, c: 2 }] }

// Stub the Worker-only modules so the entry point can run under Node.
vi.mock('cloudflare:workers', () => ({ waitUntil: (promise: Promise<unknown>) => promise.catch(() => {}) }))
vi.stubGlobal('caches', { default: { match: vi.fn(async () => undefined), put: vi.fn(async () => undefined) } })
vi.spyOn(globalThis, 'fetch').mockImplementation(async input => {
  const url = String(input)
  if (url.endsWith('/summary.json')) return Response.json(summary)
  if (url.endsWith('/packages/sample.json')) return Response.json(detail)
  return new Response('not found', { status: 404 })
})
const { default: worker } = await import('../src/index')

describe('chart builder page', () => {
  it.each(['/', '/index.html'])('serves the interactive demo at %s', async path => {
    const response = await worker.fetch(new Request(`https://charts.test${path}`))
    const body = await response.text()
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(response.headers.get('content-security-policy')).toContain("script-src 'unsafe-inline'")
    expect(response.headers.get('content-security-policy')).toContain('https://static.cloudflareinsights.com')
    expect(response.headers.get('content-security-policy')).toContain("img-src 'self' data: blob:")
    expect(body).toContain('id="chart-form"')
    expect(body).toContain('value="wmy2981/ai-title-siyuan"')
    expect(body).toContain('data-copy-key="markdown"')
    expect(body).toContain('<meta name="color-scheme" content="light dark">')
    expect(body).toContain('data-page-theme-mode="auto"')
    expect(body).toContain('data-page-theme-mode="dark"')
    expect(body).toContain('siyuan-bazaar-page-theme')
    expect(body).not.toContain('/*__STYLE__*/')
    expect(body).not.toContain('/*__SCRIPT__*/')
  })
  it('supports HEAD for the demo page', async () => {
    const response = await worker.fetch(new Request('https://charts.test/', { method: 'HEAD' }))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(await response.text()).toBe('')
  })
  it('serves a crawlable robots.txt', async () => {
    const response = await worker.fetch(new Request('https://charts.test/robots.txt'))
    expect(response.headers.get('content-type')).toContain('text/plain')
    expect(await response.text()).toContain('User-agent: *')
  })
})

describe('SVG Worker', () => {
  beforeEach(() => vi.mocked(caches.default.match).mockClear())
  it('returns a real, self-contained SVG with Unix timestamps converted', async () => {
    const response = await worker.fetch(new Request('https://charts.test/api/chart/owner/repo?metrics=downloads,rating,ratings'))
    const body = await response.text()
    expect(response.headers.get('content-type')).toContain('image/svg+xml')
    expect(response.headers.get('x-chart-status')).toBe('ok')
    expect(response.headers.get('cache-control')).toContain('s-maxage=1800')
    expect(body).toContain('>owner/repo</text>')
    expect(body).not.toContain('owner/repo ·')
    expect(body).toContain('Last updated: 2026-09-25 00:00:00 UTC')
    expect(body).toContain('最后更新：2026-09-25 00:00:00 UTC')
    expect(body).toContain('data-metric="downloads"')
    expect(body).toContain('data-lang="auto"')
    expect(body).toContain('systemLanguage=')
    expect(body).toContain('Downloads (L) 42')
    expect(body).toContain('下载量 (左轴) 42')
    expect(body).not.toContain('1970-')
    expect(body).not.toMatch(/<script|\shref\s*=/)
  })
  it('keeps an explicit language single-language', async () => {
    const response = await worker.fetch(new Request('https://charts.test/api/chart/owner/repo?lang=zh'))
    const body = await response.text()
    expect(body).toContain('data-lang="zh"')
    expect(body).toContain('下载量 (左轴) 42')
    expect(body).not.toContain('<switch>')
    expect(body).not.toContain('Downloads (L)')
  })
  it.each(['/api/chart/nope', '/api/chart/owner/repo?metrics=nope', '/api/chart/owner/repo?start=2020-01-01&end=2020-01-02'])('returns visible SVG errors for %s', async path => {
    const response = await worker.fetch(new Request(`https://charts.test${path}`))
    expect(response.status).toBe(200)
    expect(response.headers.get('x-chart-status')).toBe('error')
    expect(response.headers.get('cache-control')).toContain('s-maxage=60')
    expect(await response.text()).toContain('<svg')
  })
  it('localizes an omitted-language error inside the same SVG', async () => {
    const response = await worker.fetch(new Request('https://charts.test/api/chart/owner/repo?start=2020-01-01&end=2020-01-02'))
    const body = await response.text()
    expect(body).toContain('data-lang="auto"')
    expect(body).toContain('No history in this date range')
    expect(body).toContain('该时间范围内没有历史数据')
  })
  it('filters custom date ranges using UTC timestamps', async () => {
    // The range ends before the newest observation, so the update line must come
    // from the full history instead of the rendered slice.
    const response = await worker.fetch(new Request('https://charts.test/api/chart/owner/repo?metrics=downloads&start=2026-08-01&end=2026-09-10&lang=en'))
    const body = await response.text()
    expect(response.headers.get('x-chart-status')).toBe('ok')
    expect(body).toContain('data-endpoint="downloads"')
    expect(body).toContain('Last updated: 2026-09-25 00:00:00 UTC')
    expect(body).toContain('2026-08')
    // The excluded newest observation appears only in the update line.
    expect(body.match(/2026-09-25/g)).toHaveLength(1)
  })
  it('reports a cache hit in X-Cache', async () => {
    const stored = new Response('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>', {
      headers: { 'content-type': 'image/svg+xml; charset=utf-8', 'x-chart-status': 'ok', 'x-cache': 'MISS' },
    })
    vi.mocked(caches.default.match).mockResolvedValueOnce(stored)
    const calls = vi.mocked(fetch).mock.calls.length
    const response = await worker.fetch(new Request('https://charts.test/api/chart/owner/repo?metrics=downloads&area=true'))
    expect(vi.mocked(fetch).mock.calls.length).toBe(calls)
    expect(response.headers.get('x-cache')).toBe('HIT')
    expect(response.headers.get('x-chart-status')).toBe('ok')
    expect(await response.text()).toContain('<svg')
  })
  it('stores a fallback copy for one day independently of the normal cache', async () => {
    await worker.fetch(new Request('https://charts.test/api/chart/owner/repo'))
    const puts = vi.mocked(caches.default.put).mock.calls.slice(-2)
    expect(puts.map(([request]) => (request as Request).url)).toEqual([
      'https://charts.test/api/chart/owner/repo',
      'https://charts.test/api/chart/owner/repo?_stale=1',
    ])
    expect(puts[0][1].headers.get('cache-control')).toContain('s-maxage=1800')
    expect(puts[1][1].headers.get('cache-control')).toContain('s-maxage=86400')
    expect(puts[1][1].headers.get('cdn-cache-control')).toBe('max-age=86400')
  })
  it('serves the fallback after the normal cache expires during upstream failure', async () => {
    const entries = new Map<string, { response: Response; expiresAt: number }>()
    const implementation = vi.mocked(fetch).getMockImplementation()!
    vi.useFakeTimers().setSystemTime(new Date('2026-10-25T00:00:00Z'))
    try {
      vi.mocked(caches.default.put).mockImplementation(async (request, response) => {
        const maxAge = Number(/s-maxage=(\d+)/.exec(response.headers.get('cache-control'))?.[1])
        entries.set((request as Request).url, { response: response.clone(), expiresAt: Date.now() + maxAge * 1000 })
      })
      vi.mocked(caches.default.match).mockImplementation(async request => {
        const entry = request instanceof Request ? entries.get(request.url) : undefined
        return entry && entry.expiresAt > Date.now() ? entry.response.clone() : undefined
      })
      await worker.fetch(new Request('https://charts.test/api/chart/owner/repo'))
      vi.setSystemTime(Date.now() + 1801_000)
      vi.mocked(fetch).mockImplementation(async () => { throw new Error('offline') })
      const response = await worker.fetch(new Request('https://charts.test/api/chart/owner/repo'))
      expect(response.headers.get('x-chart-status')).toBe('stale')
      expect(response.headers.get('x-cache')).toBe('STALE')
      expect(await response.text()).toContain('<svg')
    } finally {
      vi.useRealTimers()
      vi.mocked(caches.default.match).mockResolvedValue(undefined)
      vi.mocked(fetch).mockImplementation(implementation)
    }
  })
  it('returns an SVG for unsupported methods', async () => {
    const response = await worker.fetch(new Request('https://charts.test/api/chart/owner/repo', { method: 'POST' }))
    expect(response.headers.get('x-chart-status')).toBe('error')
    expect(await response.text()).toContain('Method not allowed')
  })
})

describe('localized SVG errors', () => {
  const chart = (path: string, lang: string) => {
    const separator = path.includes('?') ? '&' : '?'
    return worker.fetch(new Request(`https://charts.test${path}${separator}lang=${lang}`))
  }
  it.each([
    ['/api/chart/owner', 'Invalid chart URL', '图表链接无效'],
    ['/api/chart/owner/repo?foo=1', 'Unknown parameter: foo', '未知参数：foo'],
    ['/api/chart/owner/repo?metrics=nope', 'Unknown metric', '未知指标'],
    ['/api/chart/owner/repo?theme=blue', 'Unknown theme', '未知主题'],
    ['/api/chart/owner/repo?range=7d', 'Unknown date range', '未知时间范围'],
    ['/api/chart/owner/repo?width=abc', 'Invalid width', '参数 width 无效'],
    ['/api/chart/owner/repo?height=1001', 'Invalid height', '参数 height 无效'],
    ['/api/chart/owner/repo?width=1&width=2', 'Invalid width', '参数 width 无效'],
    ['/api/chart/owner/repo?grid=maybe', 'Invalid grid', '参数 grid 无效'],
    ['/api/chart/owner/repo?start=2020-13-01', 'Invalid start', '参数 start 无效'],
    ['/api/chart/owner/repo?range=30d&start=2020-01-01', 'Conflicting date filters', '日期参数冲突'],
    ['/api/chart/owner/repo?start=2020-01-02&end=2020-01-01', 'Invalid date range', '日期范围无效'],
    ['/api/chart/owner/repo?start=2020-01-01&end=2020-01-02', 'No history in this date range', '该时间范围内没有历史数据'],
  ])('renders %s as %s or %s only', async (path, en, zh) => {
    const english = await (await chart(path, 'en')).text()
    expect(english).toContain('data-lang="en"')
    expect(english).toContain(en)
    expect(english).not.toMatch(/[\u4e00-\u9fff]/)
    expect(english).not.toContain('<switch>')
    expect(english).not.toContain('{{')

    const chinese = await (await chart(path, 'zh')).text()
    expect(chinese).toContain('data-lang="zh"')
    expect(chinese).toContain(zh)
    expect(chinese).not.toContain(en)
    expect(chinese).not.toContain('<switch>')
    expect(chinese).not.toContain('{{')
    expect(chinese).toMatch(/<desc id="error-hint">[^<]*[\u4e00-\u9fff]/)

    const auto = await (await chart(path, 'auto')).text()
    expect(auto).toContain('data-lang="auto"')
    expect(auto).toContain('<switch>')
    expect(auto).toContain(en)
    expect(auto).toContain(zh)
    expect(auto).toContain(`<title id="error-title">${en} / ${zh}</title>`)
    expect(auto).not.toContain('{{')
  })
  it('keeps both languages when the requested language is unknown', async () => {
    const response = await worker.fetch(new Request('https://charts.test/api/chart/owner/repo?lang=fr'))
    const body = await response.text()
    expect(response.headers.get('x-chart-status')).toBe('error')
    expect(body).toContain('Unknown language')
    expect(body).toContain('未知语言')
    expect(body).toContain('<switch>')
  })
  it('localizes a Chinese error hint with the dynamic detail', async () => {
    const chinese = await (await chart('/api/chart/nobody/nothing', 'zh')).text()
    expect(chinese).toContain('未找到集市包')
    expect(chinese).toContain('github.com/nobody/nothing')
    const english = await (await chart('/api/chart/nobody/nothing', 'en')).text()
    expect(english).toContain('No bazaar package matches github.com/nobody/nothing')
  })
  it('localizes an upstream failure and keeps the status code', async () => {
    const implementation = vi.mocked(fetch).getMockImplementation()!
    vi.mocked(fetch).mockImplementation(async () => new Response('upstream down', { status: 503 }))
    try {
      const chinese = await (await chart('/api/chart/owner/repo', 'zh')).text()
      expect(chinese).toContain('数据源返回错误')
      expect(chinese).toContain('上游状态码 503')
      const english = await (await chart('/api/chart/owner/repo', 'en')).text()
      expect(english).toContain('Data source returned an error')
      expect(english).toContain('Upstream status: 503')
    } finally {
      vi.mocked(fetch).mockImplementation(implementation)
    }
  })
  it('shows an unsupported schema as a visible error instead of a chart', async () => {
    const implementation = vi.mocked(fetch).getMockImplementation()!
    vi.mocked(fetch).mockImplementation(async input => {
      const url = String(input)
      if (url.endsWith('/summary.json')) return Response.json(summary)
      if (url.endsWith('/packages/sample.json')) return Response.json({ ...detail, schema: 2 })
      return new Response('not found', { status: 404 })
    })
    try {
      const response = await worker.fetch(new Request('https://charts.test/api/chart/owner/repo?lang=en'))
      expect(response.headers.get('x-chart-status')).toBe('error')
      const body = await response.text()
      expect(body).toContain('Unsupported upstream data format')
      expect(body).toContain('2')
      expect(body).not.toContain('data-metric=')
    } finally {
      vi.mocked(fetch).mockImplementation(implementation)
    }
  })
  it('localizes the hint for an unsupported method', async () => {
    for (const [lang, message, hint] of [
      ['en', 'Method not allowed', 'Use a GET request for this SVG endpoint.'],
      ['zh', '请求方法不允许', '请使用 GET 请求此 SVG 接口。'],
    ] as const) {
      const body = await (await worker.fetch(new Request(`https://charts.test/api/chart/owner/repo?lang=${lang}`, { method: 'POST' }))).text()
      expect(body).toContain(message)
      expect(body).toContain(hint)
    }
  })
})
