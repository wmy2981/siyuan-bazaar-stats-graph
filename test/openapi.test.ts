/**
 * The OpenAPI description has to parse and has to describe exactly what the
 * endpoints accept; these tests fail when either side drifts.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { queryParameters, parseOptions } from '../src/options'

const text = readFileSync(new URL('../src/openapi.yaml', import.meta.url), 'utf8')
const spec = parse(text)

/** Every $ref in the document, resolved against the document itself. */
function resolve(ref: string): unknown {
  expect(ref.startsWith('#/')).toBe(true)
  return ref
    .slice(2)
    .split('/')
    .reduce<Record<string, unknown> | undefined>((node, key) => node?.[key] as Record<string, unknown>, spec)
}

/** A parameter as the document defines it, after following its $ref. */
interface Parameter {
  name: string
  in: string
  required?: boolean
  example?: string
  schema: Record<string, unknown>
}

/** Follow a parameter's $ref; the shared components are the only source of definitions. */
function parameter(entry: { $ref?: string; name?: string }): Parameter {
  return entry.$ref ? (resolve(entry.$ref) as Parameter) : (entry as Parameter)
}

const operations = {
  svg: spec.paths['/api/chart/{owner}/{repo}'].get,
  png: spec.paths['/api/png/chart/{owner}/{repo}'].get,
}

describe('OpenAPI document', () => {
  it('parses as OpenAPI 3.1 with a title, version and production server', () => {
    expect(spec.openapi).toMatch(/^3\.1\.\d+$/)
    expect(spec.info.title).toBeTruthy()
    expect(spec.info.version).toBe('1.0.0')
    expect(spec.servers.map((server: { url: string }) => server.url)).toContain('https://siyuan-bazaar-stats-graph.sr1.cc.cd')
  })

  it('describes both chart endpoints with their media types', () => {
    expect(Object.keys(spec.paths)).toEqual(['/api/chart/{owner}/{repo}', '/api/png/chart/{owner}/{repo}'])
    expect(operations.svg.operationId).toBe('renderSvgChart')
    expect(operations.png.operationId).toBe('renderPngChart')
    expect(Object.keys(operations.svg.responses['200'].content)).toEqual(['image/svg+xml'])
    expect(Object.keys(operations.png.responses['200'].content)).toEqual(['image/png'])
    // The image endpoints answer 200 for errors too, so no error status is documented.
    expect(Object.keys(operations.svg.responses)).toEqual(['200'])
    expect(Object.keys(operations.png.responses)).toEqual(['200'])
  })

  it('documents the status and cache headers the worker sends', () => {
    const headers = spec.components.headers
    expect(Object.keys(headers).sort()).toEqual([
      'Access-Control-Allow-Origin',
      'CDN-Cache-Control',
      'Cache-Control',
      'X-Cache',
      'X-Chart-Status',
      'X-Data-Stale',
      'X-Fetched-At',
    ])
    expect(headers['X-Chart-Status'].schema.enum).toEqual(['ok', 'error', 'stale'])
    expect(headers['X-Cache'].schema.enum).toEqual(['MISS', 'HIT', 'STALE'])
    for (const operation of Object.values(operations) as { responses: Record<string, { headers: Record<string, unknown> }> }[]) {
      expect(Object.keys(operation.responses['200'].headers).sort()).toEqual(Object.keys(headers).sort())
    }
  })

  it('resolves every $ref inside the document', () => {
    const refs = [...text.matchAll(/\$ref: '([^']+)'/g)].map((match) => match[1]!)
    expect(refs.length).toBeGreaterThan(0)
    for (const ref of refs) expect(resolve(ref)).toBeDefined()
  })

  it('documents exactly the query parameters the endpoints accept', () => {
    for (const operation of Object.values(operations) as { parameters: { $ref?: string; name?: string }[] }[]) {
      const documented = operation.parameters
        .map(parameter)
        .filter((entry) => entry.in === 'query')
        .map((entry) => (entry.name === 'theme' ? 'theme' : entry.name))
      expect(documented.sort()).toEqual([...queryParameters].sort())
    }
    expect(
      operations.svg.parameters
        .map(parameter)
        .filter((entry) => entry.in === 'path')
        .map((entry) => entry.name),
    ).toEqual(['owner', 'repo'])
    expect(
      operations.png.parameters
        .map(parameter)
        .filter((entry) => entry.in === 'path')
        .map((entry) => entry.name),
    ).toEqual(['owner', 'repo'])
  })

  it('accepts every documented parameter with a value taken from the description', () => {
    const samples: Record<(typeof queryParameters)[number], string> = {
      metrics: 'downloads,rating',
      theme: 'light',
      lang: 'zh',
      width: '640',
      height: '320',
      title: 'false',
      legend: 'false',
      grid: 'false',
      area: 'true',
      updated: 'false',
      range: '30d',
      start: '2026-08-01',
      end: '2026-09-01',
    }
    for (const name of queryParameters) {
      const url = new URL(`https://charts.test/api/chart/owner/repo?${name}=${samples[name]}`)
      expect(() => parseOptions(url)).not.toThrow()
      expect(() => parseOptions(url, true)).not.toThrow()
    }
  })

  it('matches the enum, range and default values the parser enforces', () => {
    const byName = (operation: { parameters: { $ref?: string; name?: string }[] }, name: string) =>
      operation.parameters.map(parameter).find((entry) => entry.name === name)!.schema
    expect(byName(operations.svg, 'theme').enum).toEqual(['light', 'dark', 'auto', 'transparent'])
    expect(byName(operations.png, 'theme').enum).toEqual(['light', 'dark', 'transparent'])
    expect(byName(operations.svg, 'theme').default).toBe('auto')
    expect(byName(operations.png, 'theme').default).toBe('light')
    expect(byName(operations.svg, 'lang').enum).toEqual(['en', 'zh', 'auto'])
    expect(byName(operations.svg, 'metrics').default).toBe('downloads')
    expect(byName(operations.svg, 'range').enum).toEqual(['30d', '90d', '1y', 'all'])
    for (const [name, min, max, fallback] of [
      ['width', 320, 1600, 800],
      ['height', 200, 1000, 400],
    ] as const) {
      expect(byName(operations.svg, name)).toMatchObject({ type: 'integer', minimum: min, maximum: max, default: fallback })
    }
    for (const [name, fallback] of [
      ['title', true],
      ['legend', true],
      ['grid', true],
      ['area', false],
      ['updated', true],
    ] as const) {
      expect(byName(operations.svg, name)).toMatchObject({ type: 'boolean', default: fallback })
    }
  })

  it('marks only the path parameters as required', () => {
    for (const operation of Object.values(operations) as { parameters: { $ref?: string; name?: string }[] }[]) {
      for (const entry of operation.parameters.map(parameter)) {
        expect({ name: entry.name, required: entry.required ?? false }).toEqual({ name: entry.name, required: entry.in === 'path' })
      }
    }
  })

  it('applies the documented defaults to a bare request', () => {
    const documented = (name: string) => operations.svg.parameters.map(parameter).find((entry: Parameter) => entry.name === name)!.schema.default
    const bare = parseOptions(new URL('https://charts.test/api/chart/owner/repo'))
    expect(bare.metrics).toEqual([documented('metrics')])
    expect(bare.theme).toBe(documented('theme'))
    expect(bare.lang).toBe(documented('lang'))
    expect([bare.width, bare.height]).toEqual([documented('width'), documented('height')])
    expect([bare.title, bare.legend, bare.grid, bare.area, bare.updated]).toEqual([
      documented('title'),
      documented('legend'),
      documented('grid'),
      documented('area'),
      documented('updated'),
    ])
    // `range=all` covers the whole history, so a bare request carries no date bounds.
    expect(documented('range')).toBe('all')
    expect([bare.start, bare.end]).toEqual([undefined, undefined])
    expect(parseOptions(new URL('https://charts.test/api/png/chart/owner/repo'), true).theme).toBe(
      operations.png.parameters.map(parameter).find((entry: Parameter) => entry.name === 'theme')!.schema.default,
    )
  })

  it('answers a request built only from the documented defaults', () => {
    for (const [path, png] of [
      ['/api/chart/{owner}/{repo}', false],
      ['/api/png/chart/{owner}/{repo}', true],
    ] as const) {
      const params: Parameter[] = spec.paths[path].get.parameters.map(parameter)
      const example = (name: string) => params.find((entry) => entry.name === name)!.example!
      // Swagger UI prefills a query parameter with its example, else with its default, and
      // sends what is shown, so those values have to be accepted together.
      const query = params
        .filter((entry) => entry.in === 'query')
        .map((entry) => [entry.name, entry.schema.default ?? entry.example] as const)
        .filter(([, value]) => value !== undefined)
        .map(([name, value]) => `${name}=${value}`)
        .join('&')
      const route = path.replace('{owner}', example('owner')).replace('{repo}', example('repo'))
      // parseOptions is the gate both routes run, so a throw here is the error card a reader would see.
      expect(() => parseOptions(new URL(`https://charts.test${route}?${query}`), png)).not.toThrow()
      // A window that ends before it starts would be rejected as well.
      expect(example('start') <= example('end')).toBe(true)
    }
  })
})
