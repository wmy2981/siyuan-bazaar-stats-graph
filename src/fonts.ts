/**
 * Runtime webfonts for the PNG rasteriser (src/png.ts).
 *
 * resvg runs with no system fonts inside a Worker, and a fontless render
 * silently drops every <text> element — the exact failure README.md warns
 * about for CSS-variable renderers. The fonts are therefore fetched from
 * Google Fonts on first use and kept in the Cache API, so no font binary is
 * committed to this repository and only the first request per edge location
 * pays the download.
 *
 * The css2 endpoint is asked with a bare `Mozilla/5.0` user agent on purpose:
 * that is the request shape for which it answers with one complete TTF per
 * weight (format('truetype')) instead of unicode-range-split woff2 subsets,
 * which resvg cannot consume as a single font buffer.
 *
 * Coverage is deliberately small. Latin text gets Noto Sans 400/600/700 (the
 * weights the chart uses). Chinese additionally gets Noto Sans SC 400 only:
 * a full SC face is ~10 MB per weight, so 600/700 titles fall back to the
 * 400 face rather than tripling the first-request cost. If a fetch fails the
 * loader returns whatever it did get — possibly nothing — and the caller
 * still renders; the chart degrades to a textless image instead of an error.
 */
import type { ChartLanguage } from './chart'

/** A language with auto already resolved; PNG output is always single-language. */
export type ResolvedLanguage = Exclude<ChartLanguage, 'auto'>

const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&display=swap'
const FONT_CSS_SC = 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400&display=swap'
/** See the module comment: this UA selects the TTF variant of the css2 answer. */
const TTF_USER_AGENT = 'Mozilla/5.0'
/** Font files are immutable once published, so the cached copy can live a year. */
const FONT_CACHE_CONTROL = 'public, max-age=31536000, immutable'

/**
 * Fetch bytes through the Cache API.
 *
 * Every failure mode — no cache binding, a cache error, a network error, a
 * non-200 — resolves to null rather than throwing, because a font is an
 * enhancement to the raster, not a precondition for answering the request.
 */
async function fetchCachedBytes(url: string, headers?: Record<string, string>): Promise<Uint8Array | null> {
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

/** Extract the TTF URLs from a css2 answer, in declaration order, de-duplicated. */
function fontUrls(css: string): string[] {
  return [...new Set([...css.matchAll(/url\((https:[^)]+)\)\s*format\('truetype'\)/g)].map((match) => match[1]))]
}

/**
 * Load the font buffers for one resolved language.
 *
 * Noto Sans always comes first so fontdb registers the Latin families before
 * the CJK fallback. The result may be empty when Google Fonts is unreachable;
 * callers must treat text as best-effort (see the module comment).
 */
export async function loadFontBuffers(lang: ResolvedLanguage): Promise<Uint8Array[]> {
  const stylesheets = lang === 'zh' ? [FONT_CSS, FONT_CSS_SC] : [FONT_CSS]
  const buffers: Uint8Array[] = []
  for (const stylesheet of stylesheets) {
    const cssBytes = await fetchCachedBytes(stylesheet, { 'User-Agent': TTF_USER_AGENT })
    if (!cssBytes) {
      console.error('Font stylesheet unavailable', stylesheet)
      continue
    }
    const css = new TextDecoder().decode(cssBytes)
    for (const url of fontUrls(css)) {
      const font = await fetchCachedBytes(url)
      if (font) buffers.push(font)
      else console.error('Font file unavailable', url)
    }
  }
  return buffers
}
