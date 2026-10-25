import { beforeEach, describe, expect, it, vi } from 'vitest'

const summary = { packages: [{ name: 'sample', repo: 'owner/repo' }] }
const detail = { name: 'sample', repo: 'owner/repo', current: { d: 42 }, history: [{ t: 1787702400, d: 20 }, { t: 1790294400, d: 42, a: 4.5, c: 2 }] }

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
    expect(body).toContain('id="chart-form"')
    expect(body).toContain('value="wmy2981/ai-title-siyuan"')
    expect(body).toContain('data-copy-key="markdown"')
    expect(body).not.toContain('/*__STYLE__*/')
    expect(body).not.toContain('/*__SCRIPT__*/')
  })
  it('supports HEAD for the demo page', async () => {
    const response = await worker.fetch(new Request('https://charts.test/', { method: 'HEAD' }))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(await response.text()).toBe('')
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
    expect(body).toContain('owner/repo · 2026-09-25')
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
  it('serves the last successful chart for one day during upstream failure', async () => {
    const cached = new Response('<svg>previous</svg>', { headers: { 'X-Fetched-At': new Date().toISOString(), 'X-Chart-Status': 'ok' } })
    vi.mocked(caches.default.match).mockResolvedValueOnce(undefined).mockResolvedValueOnce(cached)
    vi.mocked(fetch).mockImplementation(async () => { throw new Error('offline') })
    const response = await worker.fetch(new Request('https://charts.test/api/chart/owner/repo'))
    expect(response.headers.get('x-chart-status')).toBe('stale')
    expect(response.headers.get('x-cache')).toBe('STALE')
    expect(await response.text()).toBe('<svg>previous</svg>')
  })
  it('returns an SVG for unsupported methods', async () => {
    const response = await worker.fetch(new Request('https://charts.test/api/chart/owner/repo', { method: 'POST' }))
    expect(response.headers.get('x-chart-status')).toBe('error')
    expect(await response.text()).toContain('Method not allowed')
  })
})
