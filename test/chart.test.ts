import { describe, expect, it } from 'vitest';
import { renderChart, renderErrorChart, type ChartOptions, type ChartPoint } from '../src/chart';

const DAY = 86_400_000;
const time = (day: number) => Date.UTC(2024, 0, day);
const options = (overrides: Partial<ChartOptions> = {}): ChartOptions => ({
  width: 800,
  height: 400,
  theme: 'light',
  metrics: ['downloads'],
  title: true,
  legend: true,
  grid: true,
  area: false,
  lang: 'en',
  repo: 'owner/project',
  ...overrides,
});

describe('renderChart', () => {
  it('escapes all XML special characters in repository text', () => {
    const svg = renderChart([], options({ repo: `<a&"'${'>'}` }));
    expect(svg).toContain('&lt;a&amp;&quot;&apos;&gt;');
    expect(svg).not.toContain('<a&');
  });

  it.each(['light', 'dark'] as const)('renders a self-contained %s theme', (theme) => {
    const svg = renderChart([{ t: time(1), d: 1 }, { t: time(2), d: 2 }], options({ theme }));
    expect(svg).toContain(`data-endpoint="downloads"`);
    expect(svg).toContain(theme === 'dark' ? '#18232f' : '#f5f8fb');
    expect(svg).not.toMatch(/<script\b|<link\b|<image\b|\shref\s*=|@import|url\s*\(/i);
    expect(svg).toContain("-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif");
  });

  it('uses the correct metric fields and colors', () => {
    const svg = renderChart([
      { t: time(1), d: 10, a: 3.5, c: 4 },
      { t: time(2), d: 20, a: 4.5, c: 8 },
    ], options({ metrics: ['downloads', 'rating', 'ratings'] }));
    expect(svg).toContain('data-metric="downloads"');
    expect(svg).toContain('data-metric="rating"');
    expect(svg).toContain('data-metric="ratings"');
    expect(svg).toContain('#0f9f8f');
    expect(svg).toContain('#8264c6');
    expect(svg).toContain('#d48a17');
    expect(svg).toContain('Downloads (L) 20');
    expect(svg).toContain('Rating (R) 4.5');
    expect(svg).toContain('Ratings (R) 8');
    expect(svg).toMatch(/>1 \/ \d+<\/text>/);
  });

  it('breaks a line at missing ratings instead of interpolating', () => {
    const svg = renderChart([
      { t: time(1), a: 2 },
      { t: time(2) },
      { t: time(3), a: 5 },
    ], options({ metrics: ['rating'] }));
    expect(svg).not.toContain('data-metric="rating"');
    expect(svg.match(/<circle/g)).toHaveLength(3);
    expect(svg).toContain('>1</text>');
    expect(svg).toContain('>5</text>');
  });

  it('renders a friendly empty state and omits unselected metrics', () => {
    const empty = renderChart([], options({ lang: 'zh', metrics: ['rating'] }));
    expect(empty).toContain('暂无所选指标数据');
    expect(empty).not.toContain('data-metric="downloads"');
    const missing = renderChart([{ t: time(1), a: 4 }], options({ metrics: ['downloads'] }));
    expect(missing).toContain('No data for the selected metrics');
  });

  it('shows the latest UTC date and four to six real time-scale dates', () => {
    const svg = renderChart([
      { t: time(1), d: 1 },
      { t: time(10), d: 2 },
    ], options({ repo: 'x/y' }));
    expect(svg).toContain('x/y · 2024-01-10');
    const dates = [...svg.matchAll(/font-size="10">(2024-01-\d{2})<\/text>/g)].map((match) => match[1]);
    expect(dates.length).toBe(6);
    expect(dates[0]).toBe('2024-01-01');
    expect(dates.at(-1)).toBe('2024-01-10');
  });

  it('limits every sampled series to 500 points and keeps endpoints and extrema', () => {
    const points: ChartPoint[] = Array.from({ length: 1001 }, (_, i) => ({
      t: time(1) + i * DAY,
      d: i === 700 ? 9999 : i === 300 ? -0 : i,
      a: i === 600 ? 5 : i === 200 ? 1 : 3,
      c: i,
    }));
    const svg = renderChart(points, options({ metrics: ['downloads', 'rating', 'ratings'] }));
    const coordinates = [...svg.matchAll(/data-metric="downloads"[^>]* points="([^"]+)"/g)][0][1]
      .split(' ').map((pair) => pair.split(',').map(Number));
    expect(coordinates.length).toBeLessThanOrEqual(500);
    expect(coordinates[0][0]).toBe(coordinates.reduce((min, pair) => Math.min(min, pair[0]), Infinity));
    expect(coordinates.at(-1)![0]).toBe(coordinates.reduce((max, pair) => Math.max(max, pair[0]), -Infinity));
    expect(Math.min(...coordinates.map((pair) => pair[1]))).toBeLessThan(37);
    expect(svg).toContain('Downloads (L) 1000');
    expect(svg).toContain('Rating (R) 3');
  });

  it('samples long segments independently without joining gaps or losing global extrema', () => {
    const points: ChartPoint[] = Array.from({ length: 6000 }, (_, i) => ({
      t: time(1) + i * DAY,
      d: i === 0 || i === 3000 ? undefined : i === 2900 ? 9000 : i === 100 ? 1 : 50 + i % 20,
    }));
    const svg = renderChart(points, options({ area: true }));
    const lines = [...svg.matchAll(/<polyline data-metric="downloads"[^>]*points="([^"]+)"/g)];
    expect(lines).toHaveLength(2);
    for (const line of lines) expect(line[1].split(' ').length).toBeLessThanOrEqual(500);
    expect(svg).toContain('data-start="1"');
    expect(svg).toContain('data-start="3001"');
    const allY = lines.flatMap((line) => line[1].split(' ').map((pair) => Number(pair.split(',')[1])));
    expect(Math.min(...allY)).toBeLessThan(69);
    expect(Math.max(...allY)).toBeGreaterThan(358);
  });

  it('honors switches and draws area only for downloads', () => {
    const points = [{ t: time(1), d: 1, a: 3 }, { t: time(2), d: 2, a: 4 }];
    const svg = renderChart(points, options({
      metrics: ['downloads', 'rating'], title: false, legend: false, grid: false, area: true,
    }));
    expect(svg).not.toContain('owner/project ·');
    expect(svg).not.toContain('Downloads (L)');
    expect(svg).not.toContain(`stroke="#dce5ed" stroke-width="1"`);
    expect(svg).toContain('<path');
    expect(svg).not.toContain('<path data-metric="rating"');
  });

  it('keeps a plot and compact legends at narrow dimensions', () => {
    const svg = renderChart([
      { t: time(1), d: 1, a: 2, c: 1 },
      { t: time(2), d: 2, a: 3, c: 2 },
    ], options({ width: 320, height: 200, metrics: ['downloads', 'rating', 'ratings'] }));
    const baseline = Number(/<line x1="[\d.]+" y1="([\d.]+)"/.exec(svg)?.[1]);
    const firstLegend = Number(/<text x="[\d.]+" y="([\d.]+)"[^>]*>Downloads/.exec(svg)?.[1]);
    expect(baseline).toBeLessThan(firstLegend);
    expect(200 - baseline).toBeLessThanOrEqual(67);
  });
});

describe('renderErrorChart', () => {
  it('renders escaped, complete multi-line hints without scripts or external assets', () => {
    const hint = `Check https://example.com/${'averylongpath&'.repeat(12)} then retry.\n第二行 <完整> 可读`;
    const svg = renderErrorChart('Unable to load <stats>', hint, 'network');
    expect(svg).toContain('width="800" height="220"');
    expect(svg).toContain('data-kind="network"');
    expect(svg).toContain('Unable to load &lt;stats&gt;');
    expect(svg).toContain('https://example.com/');
    expect(svg).toContain('第二行 &lt;完整&gt; 可读');
    expect(svg.match(/<text/g)!.length).toBeGreaterThan(4);
    expect(svg).not.toMatch(/<script\b|<link\b|\shref\s*=|@import|url\s*\(/i);
  });
});
