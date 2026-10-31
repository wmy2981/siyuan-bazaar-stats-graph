/** Font subsetting for the PNG rasteriser: the CSS request and its failure modes. */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('caches', { default: { match: vi.fn(async () => undefined), put: vi.fn(async () => undefined) } })
const { loadFonts } = await import('../src/fonts')

const css = (url: string) => `@font-face { font-family: 'Noto Sans SC'; font-weight: 400; src: url(${url}) format('truetype'); }`

describe('PNG fonts', () => {
  beforeEach(() => {
    vi.mocked(caches.default.match).mockClear()
    vi.mocked(caches.default.put).mockClear()
  })

  it('requests one TrueType subset of the drawn characters', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async input => {
      const url = String(input)
      if (url.includes('fonts.googleapis.com')) return new Response(css('https://fonts.gstatic.com/s/subset.ttf'))
      return new Response(new Uint8Array([1, 2, 3]))
    })
    try {
      const { buffers, family } = await loadFonts('<svg><text x="1">下载量 42</text><rect fill="#fff"/></svg>', 'zh')
      expect(family).toBe('Noto Sans SC')
      expect(buffers).toHaveLength(1)
      expect([...buffers[0]]).toEqual([1, 2, 3])
      const stylesheet = new URL(String(fetchMock.mock.calls[0][0]))
      expect(stylesheet.hostname).toBe('fonts.googleapis.com')
      expect(stylesheet.searchParams.get('family')).toBe('Noto Sans SC:wght@400;600;700')
      expect(stylesheet.searchParams.get('text')).toBe(' 24下载量')
      // The stylesheet is fetched with the user agent that yields TrueType.
      expect(fetchMock.mock.calls[0][1]).toMatchObject({ headers: { 'User-Agent': 'Mozilla/5.0' } })
      // The font file and the stylesheet are both cached for the edge.
      expect(vi.mocked(caches.default.put).mock.calls.map(([request]) => String(request)))
        .toEqual(['https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;600;700&text=%20' + encodeURIComponent('24下载量'), 'https://fonts.gstatic.com/s/subset.ttf'])
    } finally {
      fetchMock.mockRestore()
    }
  })

  it('uses the Latin family for English documents', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(css('https://fonts.gstatic.com/s/latin.ttf')))
    try {
      const { family } = await loadFonts('<svg><text>Downloads 42</text></svg>', 'en')
      expect(family).toBe('Noto Sans')
      expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('family')).toBe('Noto Sans:wght@400;600;700')
    } finally {
      fetchMock.mockRestore()
    }
  })

  it('still renders when the font service is unreachable', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => { throw new Error('offline') })
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      await expect(loadFonts('<svg><text>Downloads</text></svg>', 'en')).resolves.toEqual({ buffers: [], family: 'Noto Sans' })
      expect(error).toHaveBeenCalled()
    } finally {
      fetchMock.mockRestore()
      error.mockRestore()
    }
  })
})
