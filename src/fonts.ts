/**
 * Runtime fonts for the PNG rasteriser (src/png.ts).
 *
 * resvg runs with no system fonts inside a Worker, and a fontless render
 * silently drops every <text> element. Fonts are therefore fetched from Google
 * Fonts on first use and kept in the Cache API, so no font binary is committed
 * to this repository and only the first request per edge location pays for it.
 *
 * The subset is derived from the SVG itself: the css2 `text=` parameter returns
 * a TrueType file containing exactly the glyphs the document draws, which keeps
 * a Chinese chart at a few kilobytes instead of the ~10 MB full face. The bare
 * `Mozilla/5.0` user agent is what makes css2 answer with TrueType instead of
 * the unicode-range-split woff2 subsets that resvg cannot read as one buffer.
 *
 * If a fetch fails the loader returns the buffers it did get, possibly none, and
 * the caller still renders: the chart degrades to a textless image rather than
 * an error.
 */
import type { ChartLanguage } from './chart'

/** A language with auto already resolved; PNG output is always single-language. */
export type ResolvedLanguage = Exclude<ChartLanguage, 'auto'>

/** One family per language; both cover the Latin text the chart also draws. */
const FAMILIES: Record<ResolvedLanguage, string> = { en: 'Noto Sans', zh: 'Noto Sans SC' }
/** Weights the SVG uses: 400 body, 600 headings, 700 the error badge. */
const WEIGHTS = '400;600;700'
/** This legacy user agent is what makes css2 answer with TrueType files. */
const TTF_USER_AGENT = 'Mozilla/5.0'
/** Font files are immutable once published, so the cached copy can live a year. */
const FONT_CACHE_CONTROL = 'public, max-age=31536000, immutable'

/** Characters the document actually draws, which is exactly what the subset needs. */
function drawnText(svg: string): string {
  const characters = new Set<string>()
  for (const match of svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)) {
    for (const character of match[1]) {
      if ((character.codePointAt(0) ?? 0) > 0x1f) characters.add(character)
    }
  }
  return [...characters].sort().join('')
}

/**
 * Fetch bytes through the Cache API.
 *
 * Every failure mode — a cache error, a network error, a non-200 — resolves to
 * null rather than throwing, because a font is an enhancement to the raster,
 * not a precondition for answering the request.
 */
async function cachedBytes(url: string, headers?: Record<string, string>): Promise<Uint8Array | null> {
  try {
    const hit = await caches.default.match(url)
    if (hit) return new Uint8Array(await hit.arrayBuffer())
  } catch { /* fall through to the network */ }
  let response: Response
  try {
    response = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) })
  } catch {
    return null
  }
  if (!response.ok) return null
  const bytes = new Uint8Array(await response.arrayBuffer())
  try {
    await caches.default.put(url, new Response(bytes.slice(), {
      headers: { 'Content-Type': response.headers.get('content-type') ?? 'application/octet-stream', 'Cache-Control': FONT_CACHE_CONTROL },
    }))
  } catch { /* caching is best-effort */ }
  return bytes
}

/** Extract the TrueType URLs from a css2 answer, in declaration order, de-duplicated. */
function fontUrls(css: string): string[] {
  return [...new Set([...css.matchAll(/url\((https:[^)]+)\)\s*format\('truetype'\)/g)].map((match) => match[1]))]
}

/**
 * Load the font buffers for one document.
 *
 * The returned family name is the one resvg must resolve `sans-serif` to, so the
 * SVG's system font stack lands on the face that was actually downloaded.
 */
export async function loadFonts(svg: string, lang: ResolvedLanguage): Promise<{ buffers: Uint8Array[]; family: string }> {
  const family = FAMILIES[lang]
  const text = encodeURIComponent(drawnText(svg))
  const stylesheet = `https://fonts.googleapis.com/css2?family=${family.replaceAll(' ', '+')}:wght@${WEIGHTS}&text=${text}`
  const cssBytes = await cachedBytes(stylesheet, { 'User-Agent': TTF_USER_AGENT })
  if (!cssBytes) {
    console.error('Font stylesheet unavailable', stylesheet)
    return { buffers: [], family }
  }
  const buffers: Uint8Array[] = []
  for (const url of fontUrls(new TextDecoder().decode(cssBytes))) {
    const font = await cachedBytes(url)
    if (font) buffers.push(font)
    else console.error('Font file unavailable', url)
  }
  return { buffers, family }
}
