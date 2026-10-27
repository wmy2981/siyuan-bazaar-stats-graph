/**
 * SVG → PNG rasterisation with @resvg/resvg-wasm.
 *
 * resvg is one of the few rasterisers that runs inside a Cloudflare Worker:
 * the Rust renderer is compiled to a single wasm module that ships inside
 * the npm package and is bundled by the Cloudflare Vite plugin (declared in
 * src/wasm.d.ts), so nothing binary is added to this repository.
 *
 * Only fixed-language, fixed-theme documents may reach this module. The
 * `lang=auto` / `theme=auto` documents switch through <switch> and CSS
 * custom properties, neither of which a static rasteriser can resolve the
 * way a browser does; src/index.ts resolves auto to en/light first, which
 * is also what the issue asks for: a PNG cannot follow the reader's
 * preferences after it has been rendered.
 *
 * Text needs real fonts — see src/fonts.ts. When every font fetch failed
 * the render still succeeds but contains no text; that degradation is
 * logged there and documented in README.md rather than hidden.
 */
import { Resvg, initWasm } from '@resvg/resvg-wasm'
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm'
import { loadFontBuffers, type ResolvedLanguage } from './fonts'

/** initWasm may only run once per isolate, so the promise is memoised. */
let initialised: Promise<void> | undefined

function ensureResvg(): Promise<void> {
  initialised ??= initWasm(resvgWasm)
  return initialised
}

/**
 * Rasterise one complete SVG document (bodyOnly=false, explicit width and
 * height) at its natural size. No background is painted here or in the SVG,
 * so the PNG keeps a transparent alpha channel.
 */
export async function svgToPng(svg: string, lang: ResolvedLanguage): Promise<Uint8Array> {
  await ensureResvg()
  const fontBuffers = await loadFontBuffers(lang)
  if (!fontBuffers.length) console.error('Rendering PNG without fonts; text will be missing')
  // The SVG asks for a system sans stack; inside the Worker that generic
  // family is whichever Noto face covers the chart's language.
  const family = lang === 'zh' ? 'Noto Sans SC' : 'Noto Sans'
  const resvg = new Resvg(svg, {
    font: { fontBuffers, defaultFontFamily: family, sansSerifFamily: family },
    fitTo: { mode: 'original' },
  })
  const rendered = resvg.render()
  try {
    return rendered.asPng()
  } finally {
    rendered.free()
    resvg.free()
  }
}
