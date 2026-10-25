export type Metric = 'downloads' | 'rating' | 'ratings';
export type Theme = 'light' | 'dark';

export interface ChartPoint {
  t: number;
  d?: number;
  a?: number;
  c?: number;
}

export interface ChartOptions {
  width: number;
  height: number;
  theme: Theme;
  metrics: Metric[];
  title: boolean;
  legend: boolean;
  grid: boolean;
  area: boolean;
  lang: 'en' | 'zh';
  repo: string;
}

type Datum = { t: number; value: number; index: number };
type Segment = { start: number; points: Datum[] };
type Scale = { min: number; max: number; ticks: number[] };

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const COLORS: Record<Metric, string> = {
  downloads: '#0f9f8f',
  rating: '#8264c6',
  ratings: '#d48a17',
};
const LABELS: Record<Metric, { en: string; zh: string }> = {
  downloads: { en: 'Downloads', zh: '下载量' },
  rating: { en: 'Rating', zh: '评分' },
  ratings: { en: 'Ratings', zh: '评分数' },
};

const escapeXml = (value: unknown): string => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');
const num = (value: number): string => String(Math.round(value * 100) / 100);
const date = (timestamp: number): string => new Date(timestamp).toISOString().slice(0, 10);
const formatValue = (value: number): string => Number.isInteger(value)
  ? String(value)
  : String(Math.round(value * 100) / 100);

function scaleCounts(values: number[]): Scale {
  const largest = Math.max(0, ...values);
  if (largest === 0) return { min: 0, max: 1, ticks: [0, 1] };
  const rough = largest / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const fraction = rough / power;
  const step = (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) * power;
  const max = Math.ceil(largest / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= max + step / 2; value += step) ticks.push(value);
  return { min: 0, max, ticks };
}

/** Keep first/last, global extrema, and local extrema in the remaining time buckets. */
function sample(data: Datum[], limit = 500): Datum[] {
  if (data.length <= limit) return data;
  const low = data.reduce((best, point, index) => point.value < data[best].value ? index : best, 0);
  const high = data.reduce((best, point, index) => point.value > data[best].value ? index : best, 0);
  const forced = new Set([0, data.length - 1, low, high]);
  const remaining = data.map((_, index) => index).filter((index) => !forced.has(index));
  const slots = Math.max(0, limit - forced.size);
  const buckets = Math.max(1, Math.floor(slots / 2));
  for (let bucket = 0; bucket < buckets && slots > 0; bucket++) {
    const start = Math.floor(bucket * remaining.length / buckets);
    const end = Math.floor((bucket + 1) * remaining.length / buckets);
    if (start === end) continue;
    let bucketLow = start;
    let bucketHigh = start;
    for (let i = start + 1; i < end; i++) {
      if (data[remaining[i]].value < data[remaining[bucketLow]].value) bucketLow = i;
      if (data[remaining[i]].value > data[remaining[bucketHigh]].value) bucketHigh = i;
    }
    forced.add(remaining[bucketLow]);
    forced.add(remaining[bucketHigh]);
  }
  return [...forced].sort((a, b) => a - b).map((index) => data[index]);
}

function fitText(text: string, width: number, fontSize: number): string {
  const max = Math.max(1, Math.floor(width / (fontSize * 0.58)));
  return text.length <= max ? text : `${text.slice(0, Math.max(1, max - 1))}…`;
}

function legendRows(metrics: Metric[], width: number, lang: 'en' | 'zh',
  latest: Map<Metric, Datum | undefined>): { metric: Metric; label: string }[][] {
  const items = metrics.map((metric) => {
    const value = latest.get(metric);
    const axis = metric === 'downloads'
      ? (lang === 'zh' ? '左轴' : 'L')
      : (lang === 'zh' ? '右轴' : 'R');
    return { metric, label: `${LABELS[metric][lang]} (${axis}) ${value ? formatValue(value.value) : '—'}` };
  });
  const rows: { metric: Metric; label: string }[][] = [[]];
  let used = 0;
  for (const item of items) {
    const itemWidth = item.label.length * 6 + 23;
    if (rows[rows.length - 1].length && used + itemWidth > width) {
      rows.push([]);
      used = 0;
    }
    rows[rows.length - 1].push(item);
    used += itemWidth;
  }
  return rows;
}

function wrapText(text: string, maxUnits: number): string[] {
  const lines: string[] = [];
  for (const sourceLine of text.split(/\r?\n/)) {
    let line = '';
    let units = 0;
    for (const character of sourceLine) {
      const width = character.codePointAt(0)! > 0xff ? 2 : 1;
      if (line && units + width > maxUnits) {
        lines.push(line);
        line = '';
        units = 0;
      }
      line += character;
      units += width;
    }
    lines.push(line);
  }
  return lines;
}

export function renderErrorChart(message: string, hint: string, kind = 'error'): string {
  const lines = wrapText(hint, 96);
  const fontSize = Math.max(9, Math.min(13, 142 / Math.max(1, lines.length) - 3));
  const lineHeight = fontSize + 6;
  const hintSvg = lines.map((line, index) =>
    `<text x="32" y="${num(79 + index * lineHeight)}" fill="#506579" font-size="${num(fontSize)}">${escapeXml(line)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="220" viewBox="0 0 800 220" role="img" aria-labelledby="error-title error-hint" data-kind="${escapeXml(kind)}" font-family="${FONT}"><title id="error-title">${escapeXml(message)}</title><desc id="error-hint">${escapeXml(hint)}</desc><rect width="100%" height="100%" rx="8" fill="#f5f8fb"/><circle cx="34" cy="35" r="10" fill="#c45656"/><text x="32" y="39" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="700">!</text><text x="54" y="41" fill="#17324d" font-size="17" font-weight="600">${escapeXml(fitText(message, 710, 17))}</text>${hintSvg}</svg>`;
}

export function renderChart(points: ChartPoint[], options: ChartOptions): string {
  const width = Math.max(1, Number.isFinite(options.width) ? options.width : 800);
  const height = Math.max(1, Number.isFinite(options.height) ? options.height : 400);
  const dark = options.theme === 'dark';
  const lang = options.lang;
  const metrics = [...new Set(options.metrics)].filter((metric): metric is Metric => metric in COLORS);
  const field: Record<Metric, keyof ChartPoint> = { downloads: 'd', rating: 'a', ratings: 'c' };
  const series = new Map<Metric, Segment[]>();
  for (const metric of metrics) {
    const data = points
      .flatMap((point, index) => {
        const value = point[field[metric]];
        return Number.isFinite(point.t) && Number.isFinite(value)
          ? [{ t: point.t, value: value as number, index }]
          : [];
      })
      .filter((point) => point.value >= 0 && (metric !== 'rating' || point.value <= 5))
      .sort((a, b) => a.t - b.t);
    const segments: Segment[] = [];
    for (const point of data) {
      const previous = segments.at(-1)?.points.at(-1);
      if (!previous || point.index !== previous.index + 1) segments.push({ start: point.index, points: [] });
      segments.at(-1)!.points.push(point);
    }
    for (const segment of segments) segment.points = sample(segment.points);
    series.set(metric, segments);
  }
  const all = [...series.values()].flat().flatMap((segment) => segment.points);
  const times = points.filter((point) => Number.isFinite(point.t)).map((point) => point.t).sort((a, b) => a - b);
  const minTime = times[0];
  const maxTime = times[times.length - 1];
  const hasTime = times.length > 0;

  const left = metrics.includes('downloads') ? Math.min(60, width * 0.18) : 18;
  const right = metrics.some((metric) => metric !== 'downloads') ? Math.min(65, width * 0.2) : 18;
  const titleSpace = options.title ? 36 : 14;
  const legend = options.legend
    ? legendRows(metrics, width - left - right, lang,
      new Map(metrics.map((metric) => [metric, series.get(metric)?.at(-1)?.points.at(-1)])))
    : [];
  const bottom = 27 + Math.max(0, legend.length - 1) * 13 + (legend.length ? 14 : 0);
  const plotWidth = Math.max(1, width - left - right);
  const plotHeight = Math.max(1, height - titleSpace - bottom);
  const x = (t: number): number => hasTime && maxTime !== minTime
    ? left + (t - minTime) / (maxTime - minTime) * plotWidth
    : left + plotWidth / 2;

  const countScale = (metric: Metric): Scale => scaleCounts(
    (series.get(metric) ?? []).flatMap((segment) => segment.points).map((point) => point.value));
  const scales: Partial<Record<Metric, Scale>> = {
    downloads: countScale('downloads'),
    rating: { min: 1, max: 5, ticks: [1, 2, 3, 4, 5] },
    ratings: countScale('ratings'),
  };
  const y = (metric: Metric, value: number): number => {
    const scale = scales[metric]!;
    return titleSpace + (scale.max - value) / (scale.max - scale.min) * plotHeight;
  };
  const background = dark ? '#18232f' : '#f5f8fb';
  const foreground = dark ? '#d5e2ed' : '#506579';
  const titleColor = dark ? '#dcebf7' : '#17324d';
  const gridColor = dark ? '#344453' : '#dce5ed';
  const svg: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${num(width)}" height="${num(height)}" viewBox="0 0 ${num(width)} ${num(height)}" role="img" aria-labelledby="chart-title chart-desc" font-family="${FONT}">`,
    `<title id="chart-title">${escapeXml(options.repo)}</title>`,
    `<desc id="chart-desc">${escapeXml(lang === 'zh' ? '仓库指标时间折线图' : 'Repository metrics over time')}</desc>`,
    `<rect width="100%" height="100%" rx="8" fill="${background}"/>`,
  ];

  if (options.title) {
    const suffix = hasTime ? ` · ${date(maxTime)}` : '';
    const title = fitText(`${options.repo}${suffix}`, width - 28, 15);
    svg.push(`<text x="14" y="23" fill="${titleColor}" font-size="15" font-weight="600">${escapeXml(title)}</text>`);
  }

  const gridMetric = metrics.includes('downloads') ? 'downloads' : metrics[0];
  if (gridMetric) {
    for (const tick of scales[gridMetric]!.ticks) {
      const yy = y(gridMetric, tick);
      if (options.grid) {
        svg.push(`<line x1="${num(left)}" y1="${num(yy)}" x2="${num(width - right)}" y2="${num(yy)}" stroke="${gridColor}" stroke-width="1"/>`);
      }
    }
  }

  if (metrics.includes('downloads')) {
    for (const tick of scales.downloads!.ticks) {
      svg.push(`<text x="${num(left - 7)}" y="${num(y('downloads', tick) + 3)}" text-anchor="end" fill="${foreground}" font-size="10">${formatValue(tick)}</text>`);
    }
  }
  const rightMetrics = metrics.filter((metric) => metric !== 'downloads');
  if (rightMetrics.length) {
    const railMetric = rightMetrics.includes('rating') ? 'rating' : 'ratings';
    for (const tick of scales[railMetric]!.ticks) {
      const paired = rightMetrics.length === 2
        ? scales.ratings!.ticks.reduce((closest, value) =>
          Math.abs(y('ratings', value) - y('rating', tick)) < Math.abs(y('ratings', closest) - y('rating', tick)) ? value : closest)
        : undefined;
      const label = railMetric === 'rating'
        ? `${formatValue(tick)}${paired === undefined ? '' : ` / ${formatValue(paired)}`}`
        : formatValue(tick);
      svg.push(`<text x="${num(width - right + 7)}" y="${num(y(railMetric, tick) + 3)}" fill="${foreground}" font-size="10">${label}</text>`);
    }
  }

  svg.push(`<line x1="${num(left)}" y1="${num(titleSpace + plotHeight)}" x2="${num(width - right)}" y2="${num(titleSpace + plotHeight)}" stroke="${gridColor}"/>`);
  if (hasTime) {
    const tickCount = maxTime === minTime ? 1 : Math.max(2, Math.min(width >= 640 ? 6 : width >= 440 ? 5 : 4, Math.floor(plotWidth / 88) + 1));
    const labels = new Set<string>();
    for (let i = 0; i < tickCount; i++) {
      const timestamp = minTime + (maxTime - minTime) * i / Math.max(1, tickCount - 1);
      const label = date(timestamp);
      if (labels.has(label)) continue;
      labels.add(label);
      const anchor = i === 0 ? 'start' : i === tickCount - 1 ? 'end' : 'middle';
      const xx = i === 0 ? left : i === tickCount - 1 ? width - right : x(timestamp);
      svg.push(`<text x="${num(xx)}" y="${num(titleSpace + plotHeight + 17)}" text-anchor="${anchor}" fill="${foreground}" font-size="10">${label}</text>`);
    }
  }

  for (const metric of metrics) {
    const segments = series.get(metric)!;
    const color = COLORS[metric];
    for (const { points: segment, start } of segments) {
      const coordinates = segment.map((point) => `${num(x(point.t))},${num(y(metric, point.value))}`).join(' ');
      if (metric === 'downloads' && options.area && segment.length > 1) {
        const baseline = num(y(metric, 0));
        svg.push(`<path d="M ${coordinates.replaceAll(' ', ' L ')} L ${num(x(segment[segment.length - 1].t))},${baseline} L ${num(x(segment[0].t))},${baseline} Z" fill="${color}" opacity="0.13"/>`);
      }
      if (segment.length === 1) {
        const point = segment[0];
        svg.push(`<circle cx="${num(x(point.t))}" cy="${num(y(metric, point.value))}" r="2.5" fill="${color}"/>`);
      } else if (segment.length > 1) {
        svg.push(`<polyline data-metric="${metric}" data-start="${start}" points="${coordinates}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`);
      }
    }
    const last = segments.at(-1)?.points.at(-1);
    if (last) svg.push(`<circle data-endpoint="${metric}" cx="${num(x(last.t))}" cy="${num(y(metric, last.value))}" r="3.5" fill="${color}" stroke="${background}" stroke-width="1.5"/>`);
  }

  if (!all.length) {
    const message = lang === 'zh' ? '暂无所选指标数据' : 'No data for the selected metrics';
    svg.push(`<text x="${num(left + plotWidth / 2)}" y="${num(titleSpace + plotHeight / 2)}" text-anchor="middle" fill="${foreground}" font-size="12">${message}</text>`);
  }
  for (let row = 0; row < legend.length; row++) {
    let xx = left;
    const yy = height - (legend.length - row - 1) * 13 - 6;
    for (const { metric, label } of legend[row]) {
      svg.push(`<line data-legend="${metric}" x1="${num(xx)}" y1="${num(yy - 3)}" x2="${num(xx + 12)}" y2="${num(yy - 3)}" stroke="${COLORS[metric]}" stroke-width="2"/>`);
      svg.push(`<text x="${num(xx + 17)}" y="${num(yy)}" fill="${foreground}" font-size="10">${escapeXml(fitText(label, width - xx - 22, 10))}</text>`);
      xx += label.length * 6 + 23;
    }
  }
  svg.push('</svg>');
  return svg.join('');
}
