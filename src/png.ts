/**
 * SVG → PNG rasterisation with @resvg/resvg-wasm.
 *
 * resvg is one of the few rasterisers that runs inside a Cloudflare Worker: the
 * Rust renderer is compiled to a single wasm module that ships inside the npm
 * package and is bundled by the Cloudflare Vite plugin (declared in
 * src/wasm.d.ts), so nothing binary is added to this repository.
 *
 * Only fixed-language, fixed-theme documents may reach this module. The
 * `lang=auto` / `theme=auto` documents switch through <switch> and CSS custom
 * properties, neither of which a static rasteriser resolves the way a browser
 * does; src/index.ts resolves the language to en/zh and the theme to a fixed
 * light or dark palette first, which is also what the issue asks for: a PNG
 * cannot follow the reader after it has been rendered. `theme=transparent` is
 * resolved to the light palette with src/index.ts dropping the background card,
 * so the PNG's alpha channel stays empty without relying on CSS.
 *
 * Text needs real fonts — see src/fonts.ts. When every font fetch failed the
 * render still succeeds but contains no text; that degradation is logged there
 * and documented in README.md rather than hidden.
 */
import { Resvg, initWasm } from '@resvg/resvg-wasm'
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm'
import { loadFonts, type ResolvedLanguage } from './fonts'

/** initWasm may only run once per isolate, so the promise is memoised. */
let initialised: Promise<void> | undefined

const ensureResvg = (): Promise<void> => (initialised ??= initWasm(resvgWasm))

/**
 * Rasterise one complete SVG document at its natural size.
 *
 * No background is added here: a light or dark chart carries its own card in the
 * SVG, and a transparent one paints nothing behind the plot, so the PNG keeps an
 * empty alpha channel exactly as the document asked.
 */
export async function svgToPng(svg: string, lang: ResolvedLanguage): Promise<Uint8Array> {
  await ensureResvg()
  const { buffers, family } = await loadFonts(svg, lang)
  if (!buffers.length) console.error('Rendering PNG without fonts; text will be missing')
  const resvg = new Resvg(svg, {
    font: { fontBuffers: buffers, defaultFontFamily: family, sansSerifFamily: family },
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
