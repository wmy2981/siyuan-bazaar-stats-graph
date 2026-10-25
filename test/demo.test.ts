import { readFileSync } from 'node:fs'
import vm from 'node:vm'
/** Runs the inlined builder script against a minimal DOM harness. */
import { describe, expect, it, vi } from 'vitest'

const script = readFileSync(new URL('../src/demo/demo.js', import.meta.url), 'utf8')

function element(overrides = {}) {
  const listeners = {}
  return {
    classList: { add: vi.fn(), remove: vi.fn(), toggle: vi.fn() },
    addEventListener(type, handler) { listeners[type] = handler },
    listeners,
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    hidden: false,
    value: '',
    checked: false,
    dataset: {},
    ...overrides,
  }
}

function loadDemo(fetch) {
  const metric = element({ checked: true, value: 'downloads' })
  const range = element({ checked: true, value: '30d' })
  const theme = element({ checked: true, value: 'auto' })
  const form = element({ elements: { area: { checked: false }, title: { checked: true }, legend: { checked: true }, grid: { checked: true } } })
  form.querySelectorAll.mockImplementation(selector => selector.includes('metrics') ? [metric] : selector.includes('range') ? [range] : [theme])
  const nodes = Object.fromEntries([
    'repo', 'repo-error', 'date-error', 'start', 'end', 'custom-dates', 'lang', 'width', 'height',
    'chart-preview', 'preview-empty', 'plot-stage', 'plot-endpoint', 'open-chart', 'render-state',
    'render-label', 'live-status', 'code-url', 'code-html', 'code-markdown',
  ].map(id => [`#${id}`, element()]))
  nodes['#repo'].value = 'owner/repo'
  nodes['#lang'].value = 'auto'
  nodes['#width'].value = '800'
  nodes['#height'].value = '400'
  nodes['#chart-form'] = form
  const meta = element()
  const document = {
    documentElement: element(),
    querySelector(selector) {
      if (selector.startsWith('meta')) return meta
      return nodes[selector] || null
    },
    querySelectorAll: vi.fn(() => []),
    createElement: vi.fn(() => element()),
    execCommand: vi.fn(() => true),
  }
  const context = {
    AbortController, Blob, document, fetch, location: { origin: 'https://charts.test' },
    navigator: { languages: ['en'] }, Response, URL, URLSearchParams,
    window: { matchMedia: () => ({ matches: false, addEventListener: vi.fn() }) },
    localStorage: { setItem: vi.fn() }, setTimeout, clearTimeout,
  }
  vm.runInNewContext(script, context)
  return { nodes, fetch }
}

describe('chart preview status', () => {
  it.each([
    ['ok', 'Ready'],
    ['error', 'Failed'],
    ['stale', 'Stale data'],
  ])('shows %s after loading the SVG', async (status, label) => {
    const response = new Response('<svg xmlns="http://www.w3.org/2000/svg"></svg>', {
      headers: { 'Content-Type': 'image/svg+xml', 'X-Chart-Status': status },
    })
    const { nodes } = loadDemo(vi.fn(async () => response))
    await vi.waitFor(() => expect(nodes['#chart-preview'].src).toMatch(/^blob:/))
    nodes['#chart-preview'].listeners.load()
    expect(nodes['#render-label'].textContent).toBe(label)
    expect(nodes['#preview-empty'].hidden).toBe(true)
    expect(nodes['#chart-preview'].hidden).toBe(false)
    expect(nodes['#plot-stage'].setAttribute).toHaveBeenLastCalledWith('aria-busy', 'false')
  })

  it('shows failed when the request cannot load', async () => {
    const { nodes } = loadDemo(vi.fn(async () => { throw new Error('offline') }))
    await vi.waitFor(() => expect(nodes['#render-label'].textContent).toBe('Failed'))
    expect(nodes['#preview-empty'].textContent).toBe('The chart could not be loaded.')
    expect(nodes['#chart-preview'].hidden).toBe(true)
    expect(nodes['#chart-preview'].removeAttribute).toHaveBeenCalledWith('src')
  })

  it('hides a broken image instead of showing its alt text', async () => {
    const response = new Response('<svg xmlns="http://www.w3.org/2000/svg"></svg>', {
      headers: { 'Content-Type': 'image/svg+xml', 'X-Chart-Status': 'ok' },
    })
    const { nodes } = loadDemo(vi.fn(async () => response))
    await vi.waitFor(() => expect(nodes['#chart-preview'].src).toMatch(/^blob:/))
    nodes['#chart-preview'].listeners.error()
    expect(nodes['#chart-preview'].hidden).toBe(true)
    expect(nodes['#chart-preview'].removeAttribute).toHaveBeenCalledWith('src')
    expect(nodes['#preview-empty'].hidden).toBe(false)
    expect(nodes['#preview-empty'].textContent).toBe('The chart could not be loaded.')
  })

  it('keeps the preview image hidden regardless of its display style', () => {
    const styles = readFileSync(new URL('../src/demo/demo.css', import.meta.url), 'utf8')
    expect(styles).toMatch(/#chart-preview\[hidden\]\s*\{\s*display:\s*none;/)
  })
})

function plainText(markup: string) {
  return markup
    .replaceAll('</span>', '')
    .replace(/<span class="tok-[a-z]+">/g, '')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
}

describe('embed snippets', () => {
  const svg = () => new Response('<svg xmlns="http://www.w3.org/2000/svg"></svg>', {
    headers: { 'Content-Type': 'image/svg+xml', 'X-Chart-Status': 'ok' },
  })

  it('highlights the HTML snippet without changing the copied text', () => {
    const { nodes } = loadDemo(vi.fn(async () => svg()))
    const markup = nodes['#code-html'].innerHTML
    expect(markup).toContain('<span class="tok-punct">&lt;</span><span class="tok-tag">img</span>')
    expect(markup).toContain('<span class="tok-attr">src</span>')
    expect(markup).toContain('<span class="tok-attr">alt</span>')
    expect(markup).toContain('<span class="tok-attr">width</span>')
    expect(markup).toContain('<span class="tok-attr">height</span>')
    expect(markup).toContain('<span class="tok-string">&quot;https://charts.test/api/chart/owner/repo?')
    expect(markup).toContain('<span class="tok-punct">&gt;</span>')
    const url = nodes['#code-url'].textContent
    expect(plainText(markup)).toBe(`<img\n  src="${url}"\n  alt="SiYuan bazaar package trends for owner/repo"\n  width="800"\n  height="400"\n>`)
    // The query string is escaped exactly once, so the copied snippet keeps a single "&".
    expect(url).toContain('&')
    expect(plainText(markup)).not.toContain('&amp;')
    expect(markup).not.toContain('&amp;amp;')
  })

  it('highlights the Markdown snippet without changing the copied text', () => {
    const { nodes } = loadDemo(vi.fn(async () => svg()))
    const markup = nodes['#code-markdown'].innerHTML
    expect(markup).toContain('<span class="tok-punct">![</span>')
    expect(markup).toContain('<span class="tok-punct">](</span>')
    expect(markup).toContain('<span class="tok-url">https://charts.test/api/chart/owner/repo?')
    expect(markup).toContain('<span class="tok-punct">)</span>')
    const url = nodes['#code-url'].textContent
    expect(plainText(markup)).toBe(`![SiYuan bazaar package trends for owner/repo](${url})`)
  })

  it('leaves the chart URL snippet unhighlighted', () => {
    const { nodes } = loadDemo(vi.fn(async () => svg()))
    expect(nodes['#code-url'].textContent).toMatch(/^https:\/\/charts\.test\/api\/chart\/owner\/repo\?/)
    expect(nodes['#code-url'].innerHTML).toBeUndefined()
  })

  it('uses the GitHub syntax palette in both themes', () => {
    const styles = readFileSync(new URL('../src/demo/demo.css', import.meta.url), 'utf8')
    for (const color of [
      '--code-tag: #116329;', '--code-attr: #0550ae;', '--code-string: #0a3069;', '--code-punct: #1f2328;',
      '--code-tag: #7ee787;', '--code-attr: #79c0ff;', '--code-string: #a5d6ff;', '--code-punct: #e6edf3;',
    ]) expect(styles).toContain(color)
    expect(styles).toMatch(/\.snippet \.tok-url \{\s*color: var\(--code-string\);/)
  })
})
