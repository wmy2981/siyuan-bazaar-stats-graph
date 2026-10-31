/**
 * Bundled WebAssembly modules.
 *
 * The Cloudflare Vite plugin compiles a `.wasm` import into a
 * WebAssembly.Module, so the rasteriser can hand it straight to resvg's
 * initWasm without a network fetch.
 */
declare module '*.wasm' {
  const wasmModule: WebAssembly.Module
  export default wasmModule
}
