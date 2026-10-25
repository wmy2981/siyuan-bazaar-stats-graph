import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadPackage } from '../src/data'

const summary = { packages: [{ name: 'sample', repo: 'owner/repo' }] }
const detail = { name: 'sample', repo: 'owner/repo', current: { d: 42 }, history: [{ t: 100, d: 20, x: [1, 0, 0, 0, 1] }] }
const mockFetch = (routes: Record<string, () => Response>) => vi.spyOn(globalThis, 'fetch').mockImplementation(async input => {
  const handler = routes[String(input)]
  return handler?.() ?? new Response('not found', { status: 404 })
})
afterEach(() => vi.restoreAllMocks())

describe('package data', () => {
  it('resolves repositories and derives rating distribution', async () => {
    mockFetch({
      'https://github.mytemos.com/siyuan-bazaar-stats/data/summary.json': () => Response.json(summary),
      'https://github.mytemos.com/siyuan-bazaar-stats/data/packages/sample.json': () => Response.json(detail),
    })
    const result = await loadPackage('owner/repo')
    expect(result.history).toEqual([{ t: 100_000, d: 20, a: 3, c: 2 }])
  })
  it('converts upstream Unix seconds to SVG milliseconds', async () => {
    mockFetch({
      'https://github.mytemos.com/siyuan-bazaar-stats/data/summary.json': () => Response.json(summary),
      'https://github.mytemos.com/siyuan-bazaar-stats/data/packages/sample.json': () => Response.json({ ...detail, history: [{ t: 1787702400, d: 42 }] }),
    })
    const result = await loadPackage('owner/repo')
    expect(new Date(result.history[0]!.t).toISOString()).toBe('2026-08-26T00:00:00.000Z')
  })
  it('matches full GitHub URLs and ignores non-GitHub repos', async () => {
    mockFetch({
      'https://github.mytemos.com/siyuan-bazaar-stats/data/summary.json': () => Response.json({ packages: [{ name: 'a', repo: 'https://github.com/Owner/Repo.git' }, { name: 'b', repo: 'https://evil.test/owner/repo' }] }),
      'https://github.mytemos.com/siyuan-bazaar-stats/data/packages/a.json': () => Response.json({ ...detail, name: 'a' }),
    })
    expect((await loadPackage('OWNER/REPO')).history[0]?.d).toBe(20)
  })
  it('falls back to raw snapshots and restores full-snapshot rating state', async () => {
    const lines = [
      JSON.stringify({ t: 1, full: true, p: { sample: { d: 10, x: [0, 0, 0, 1, 0] } } }),
      JSON.stringify({ t: 2, p: { sample: { d: 12 } } }),
      JSON.stringify({ t: 3, p: { other: { d: 50 } } }),
    ].join('\n')
    mockFetch({
      'https://github.mytemos.com/siyuan-bazaar-stats/data/summary.json': () => Response.json(summary),
      'https://github.mytemos.com/siyuan-bazaar-stats/data/packages/sample.json': () => new Response('unavailable', { status: 503 }),
      'https://raw.githubusercontent.com/TCOTC/siyuan-bazaar-stats/main/data/snapshots/2026-10.jsonl': () => new Response(lines),
    })
    const result = await loadPackage('owner/repo')
    expect(result.history).toEqual([{ t: 1000, d: 10, a: 4, c: 1 }, { t: 2000, d: 12, a: 4, c: 1 }])
    expect(result.stale).toBe(true)
  })
  it('returns a useful error for an unknown repository', async () => {
    mockFetch({
      'https://github.mytemos.com/siyuan-bazaar-stats/data/summary.json': () => Response.json({ packages: [] }),
      'https://bazaar.b3logfile.com/bazaar/index.json': () => Response.json({ packages: {} }),
    })
    await expect(loadPackage('owner/unknown')).rejects.toThrow('Package not found')
  })
})
