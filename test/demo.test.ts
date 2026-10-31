import { readFileSync } from 'node:fs'
import vm from 'node:vm'
/** Runs the inlined builder script against a minimal DOM harness. */
import { describe, expect, it, vi } from 'vitest'

const script = readFileSync(new URL('../src/demo/demo.js', import.meta.url), 'utf8')

function element(overrides = {}) {
  const listeners = {}
  const attributes = {}
  return {
    classList: { add: vi.fn(), remove: vi.fn(), toggle: vi.fn() },
    addEventListener(type, handler) { listeners[type] = handler },
    listeners,
    setAttribute: vi.fn((name, value) => { attributes[name] = String(value) }),
    removeAttribute: vi.fn((name) => { delete attributes[name] }),
    getAttribute: vi.fn((name) => attributes[name] ?? null),
    querySelectorAll: vi.fn(() => []),
    hidden: false,
    value: '',
    checked: false,
    dataset: {},
    style: {},
    dispatchEvent: vi.fn(),
    ...overrides,
  }
}

/** One top-bar switch option: stores attributes and reports a fixed box. */
function switchOption({ dataset = {}, left = 0, width = 30 }) {
  const attributes = {}
  return element({
    dataset,
    setAttribute: vi.fn((name, value) => { attributes[name] = String(value) }),
    removeAttribute: vi.fn((name) => { delete attributes[name] }),
    getAttribute: vi.fn((name) => attributes[name] ?? null),
    getBoundingClientRect: () => ({ left, top: 0, width, height: 28, right: left + width, bottom: 28 }),
  })
}

/** A switch group that records listeners so tests can fire pointer events. */
function switchGroup(left, items) {
  const listeners = {}
  const classes = new Set()
  const group = {
    clientLeft: 0,
    clientTop: 0,
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      has: (name) => classes.has(name),
    },
    addEventListener(type, handler, capture = false) {
      (listeners[`${type}:${Boolean(capture)}`] ??= []).push(handler)
    },
    prepend: vi.fn(),
    getBoundingClientRect: () => ({ left, top: 0, width: 200, height: 30, right: left + 200, bottom: 30 }),
    setPointerCapture: vi.fn(),
    querySelectorAll: (selector) => selector === '.segment' ? items : [],
    fire(type, event, capture = false) {
      for (const handler of listeners[`${type}:${Boolean(capture)}`] ?? []) handler(event)
    },
  }
  for (const item of items) item.parentElement = group
  return group
}

function loadDemo(fetch, switches = null) {
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
  const created = []
  const document = {
    documentElement: element(),
    querySelector(selector) {
      if (selector.startsWith('meta')) return meta
      return nodes[selector] || null
    },
    querySelectorAll(selector) {
      if (switches) {
        if (selector === 'button[data-page-theme-mode]') return switches.theme
        if (selector === '[data-page-lang]') return switches.language
        if (selector === '.segmented') return switches.segments
      }
      return []
    },
    createElement: vi.fn(() => {
      const node = element()
      created.push(node)
      return node
    }),
    execCommand: vi.fn(() => true),
  }
  const context = {
    AbortController, Blob, document, Event, fetch, location: { origin: 'https://charts.test' },
    navigator: { languages: ['en'] }, Response, URL, URLSearchParams,
    window: { matchMedia: () => ({ matches: false, addEventListener: vi.fn() }), addEventListener: vi.fn() },
    localStorage: { setItem: vi.fn() }, setTimeout, clearTimeout,
  }
  vm.runInNewContext(script, context)
  return { nodes, fetch, created, document }
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

describe('sliding switch thumbs', () => {
  const svg = () => new Response('<svg xmlns="http://www.w3.org/2000/svg"></svg>', {
    headers: { 'Content-Type': 'image/svg+xml', 'X-Chart-Status': 'ok' },
  })

  function themeSwitches() {
    const auto = switchOption({ dataset: { pageThemeMode: 'auto' }, left: 2 })
    const light = switchOption({ dataset: { pageThemeMode: 'light' }, left: 34 })
    const dark = switchOption({ dataset: { pageThemeMode: 'dark' }, left: 66 })
    const items = [auto, light, dark]
    return { items, group: switchGroup(0, items) }
  }

  it('creates one thumb per group and places it over the selection', () => {
    const { items, group } = themeSwitches()
    const { created } = loadDemo(vi.fn(async () => svg()), { theme: items, language: [], segments: [] })
    const thumb = created[0]
    expect(thumb.className).toBe('switch-thumb')
    expect(thumb.getAttribute('aria-hidden')).toBe('true')
    expect(group.classList.has('has-thumb')).toBe(true)
    expect(group.prepend).toHaveBeenCalledWith(thumb)
    expect(thumb.style.transform).toBe('translate(2px, 0px)')
    expect(thumb.style.width).toBe('30px')
    expect(thumb.style.opacity).toBe('1')
  })

  it('drags the thumb with the pointer and snaps to the nearest option', () => {
    const { items, group } = themeSwitches()
    const { created, document } = loadDemo(vi.fn(async () => svg()), { theme: items, language: [], segments: [] })
    const thumb = created[0]
    const base = { pointerId: 1, isPrimary: true, pointerType: 'mouse', button: 0 }
    group.fire('pointerdown', { ...base, clientX: 10 })
    // The item under the thumb is marked so its text and icon invert while dragging.
    expect(items[0].classList.add).toHaveBeenCalledWith('is-drag-target')
    group.fire('pointermove', { ...base, clientX: 40 })
    // The thumb follows the pointer exactly before release.
    expect(thumb.style.transform).toBe('translate(32px, 0px)')
    group.fire('pointermove', { ...base, clientX: 80 })
    expect(items[2].classList.add).toHaveBeenCalledWith('is-drag-target')
    expect(items[0].classList.remove).toHaveBeenCalledWith('is-drag-target')
    group.fire('pointerup', { ...base, clientX: 80 })
    // Releasing past the last centre activates that option and snaps the thumb.
    expect(items[2].getAttribute('aria-pressed')).toBe('true')
    expect(thumb.style.transform).toBe('translate(66px, 0px)')
    expect(document.documentElement.dataset.colorMode).toBe('dark')
    expect(items[2].classList.remove).toHaveBeenCalledWith('is-drag-target')
  })

  it('switches a segmented group on drag and swallows the native click', () => {
    const range = switchOption({ left: 2 })
    const all = switchOption({ left: 60 })
    const rangeInput = element({ checked: true })
    const allInput = element({ checked: false })
    // Radio semantics: checking one input clears the others, as the browser does.
    const inputs = [rangeInput, allInput]
    const checked = new Map(inputs.map(input => [input, input.checked]))
    for (const input of inputs) {
      Object.defineProperty(input, 'checked', {
        get: () => checked.get(input),
        set: (value) => {
          checked.set(input, Boolean(value))
          if (value) for (const other of inputs) if (other !== input) checked.set(other, false)
        },
      })
    }
    range.querySelector = () => rangeInput
    all.querySelector = () => allInput
    const group = switchGroup(0, [range, all])
    const { created } = loadDemo(vi.fn(async () => svg()), { theme: [], language: [], segments: [group] })
    expect(created[0].style.transform).toBe('translate(2px, 0px)')
    const base = { pointerId: 2, isPrimary: true, pointerType: 'touch', button: 0 }
    group.fire('pointerdown', { ...base, clientX: 10 })
    group.fire('pointermove', { ...base, clientX: 70 })
    expect(all.classList.add).toHaveBeenCalledWith('is-drag-target')
    group.fire('pointerup', { ...base, clientX: 70 })
    expect(allInput.checked).toBe(true)
    expect(allInput.dispatchEvent).toHaveBeenCalled()
    expect(created[0].style.transform).toBe('translate(60px, 0px)')
    expect(all.classList.remove).toHaveBeenCalledWith('is-drag-target')
    // The click that follows the release must not re-activate the old option.
    const click = { isTrusted: true, preventDefault: vi.fn(), stopPropagation: vi.fn() }
    group.fire('click', click, true)
    expect(click.preventDefault).toHaveBeenCalled()
    expect(click.stopPropagation).toHaveBeenCalled()
  })

  it('leaves a plain click and keyboard changes to the native controls', () => {
    const { items, group } = themeSwitches()
    const { created } = loadDemo(vi.fn(async () => svg()), { theme: items, language: [], segments: [] })
    const thumb = created[0]
    const base = { pointerId: 3, isPrimary: true, pointerType: 'mouse', button: 0 }
    group.fire('pointerdown', { ...base, clientX: 10 })
    group.fire('pointerup', { ...base, clientX: 10 })
    // No drag: nothing is activated, and no click is swallowed.
    expect(items[0].getAttribute('aria-pressed')).toBe('true')
    expect(thumb.style.transform).toBe('translate(2px, 0px)')
    // A keyboard-driven change re-aligns the thumb.
    items[1].setAttribute('aria-pressed', 'true')
    items[0].setAttribute('aria-pressed', 'false')
    group.fire('change', {})
    expect(thumb.style.transform).toBe('translate(34px, 0px)')
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
