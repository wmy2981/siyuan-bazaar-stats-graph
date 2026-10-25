import { readFileSync } from 'node:fs'
import vm from 'node:vm'
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
  })
})
