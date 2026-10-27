/**
 * Bundled WebAssembly modules.
 *
 * The Cloudflare Vite plugin compiles a `.wasm` import into a
 * WebAssembly.Module, wrangler-style, so the rasteriser can hand it straight
 * to resvg's initWasm without a network fetch or a checked-in copy of the
 * compiled module beyond the one inside the npm package.
 */
declare module '*.wasm' {
  const wasmModule: WebAssembly.Module
  export default wasmModule
}
