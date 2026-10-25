/**
 * Renders repository history as a self-contained, static SVG.
 *
 * Nothing here may reference scripts, external assets or hover state: the output is
 * served as an image and cached by GitHub's image proxy.
 */
export type Metric = 'downloads' | 'rating' | 'ratings';
export type Theme = 'light' | 'dark' | 'auto';
export type ChartLanguage = 'en' | 'zh' | 'auto';
type ResolvedLanguage = Exclude<ChartLanguage, 'auto'>;

/** One observation: Unix milliseconds plus whichever metrics were recorded. */
export interface ChartPoint {
  t: number;
  d?: number;
  a?: number;
  c?: number;
}

/** Normalised chart parameters, already validated by parseOptions(). */
export interface ChartOptions {
  width: number;
  height: number;
  theme: Theme;
  metrics: Metric[];
  title: boolean;
  legend: boolean;
  grid: boolean;
  area: boolean;
  lang: ChartLanguage;
  repo: string;
}

/** A metric value resolved from a ChartPoint, tagged with its index in the history. */
type Datum = { t: number; value: number; index: number };
/** A run of consecutive observations; a gap in the data starts a new segment. */
type Segment = { start: number; points: Datum[] };
/** Value range and tick positions for a single axis. */
type Scale = { min: number; max: number; ticks: number[] };

/** System font stack: no webfont request, so the SVG stays self-contained. */
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
/** Legend geometry, shared by the row layout and the renderer. */
const LEGEND_LINE_WIDTH = 12;
const LEGEND_TEXT_OFFSET = 18;
const LEGEND_ITEM_GAP = 22;
const LEGEND_ROW_HEIGHT = 15;
/** One colour per metric; the legend reuses these exact values. */
const COLORS: Record<Metric, string> = {
  downloads: '#0f9f8f',
  rating: '#8264c6',
  ratings: '#d48a17',
};
/** Axis labels; both languages are inlined because auto ships one document. */
const LABELS: Record<Metric, { en: string; zh: string }> = {
  downloads: { en: 'Downloads', zh: '下载量' },
  rating: { en: 'Rating', zh: '评分' },
  ratings: { en: 'Ratings', zh: '评分数' },
};

/** Theme palettes. The automatic theme emits both and switches with prefers-color-scheme. */
type PaletteKey = 'background' | 'foreground' | 'title' | 'grid';
const PALETTE: Record<'light' | 'dark', Record<PaletteKey, string>> = {
  light: { background: '#f5f8fb', foreground: '#506579', title: '#17324d', grid: '#dce5ed' },
  dark: { background: '#18232f', foreground: '#d5e2ed', title: '#dcebf7', grid: '#344453' },
};
/** Both themes ship in one document, so the cached SVG follows the reader's colour preference. */
/**
 * Both palettes are declared as CSS custom properties on the root element and
 * switched with a prefers-color-scheme media query, so one cached document can
 * serve readers in either appearance without a second request.
 */
const AUTO_STYLE = `<style>svg{--chart-background:${PALETTE.light.background};--chart-foreground:${PALETTE.light.foreground};--chart-title:${PALETTE.light.title};--chart-grid:${PALETTE.light.grid}}.chart-background{fill:var(--chart-background)}.chart-foreground{fill:var(--chart-foreground)}.chart-title{fill:var(--chart-title)}.chart-grid{stroke:var(--chart-grid)}.chart-ring{stroke:var(--chart-background)}@media (prefers-color-scheme:dark){svg{--chart-background:${PALETTE.dark.background};--chart-foreground:${PALETTE.dark.foreground};--chart-title:${PALETTE.dark.title};--chart-grid:${PALETTE.dark.grid}}}</style>`;

/** Escape text before it is interpolated into SVG markup. */
const escapeXml = (value: unknown): string => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');
/** Round coordinates to two decimals: precise enough, and it keeps the markup small. */
const num = (value: number): string => String(Math.round(value * 100) / 100);
/** Render timestamps as UTC dates, matching how the upstream data is bucketed. */
const date = (timestamp: number): string => new Date(timestamp).toISOString().slice(0, 10);
/** Axis and legend values: integers stay bare, fractions keep two decimals. */
const formatValue = (value: number): string => Number.isInteger(value)
  ? String(value)
  : String(Math.round(value * 100) / 100);

/**
 * Pick a "nice" axis step (1, 2 or 5 times a power of ten) so a count axis keeps
 * roughly four ticks no matter how large the values are.
 */
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

/** Rough advance width in pixels; a Worker has no font metrics to consult. */
function measureText(text: string, fontSize: number): number {
  let width = 0;
  for (const character of text) {
    const code = character.codePointAt(0)!;
    if (code === 32) width += fontSize * 0.32;
    else if (code > 0xff) width += fontSize;
    else width += fontSize * 0.6;
  }
  return width;
}

/** Truncate with an ellipsis until the text fits the given width. */
function fitText(text: string, width: number, fontSize: number): string {
  if (measureText(text, fontSize) <= width) return text;
  let fitted = '';
  for (const character of text) {
    if (measureText(`${fitted}${character}…`, fontSize) > width) break;
    fitted += character;
  }
  return `${fitted}…`;
}

/**
 * Lay legend entries into rows that fit the plot width.
 *
 * Each label ends with its axis (L for downloads, R for the right-hand metrics)
 * and the latest value, which is why a metric without data shows an em dash.
 */
type LegendItem = { metric: Metric; label: string; width: number };

function legendRows(metrics: Metric[], width: number, lang: 'en' | 'zh',
  latest: Map<Metric, Datum | undefined>): LegendItem[][] {
  const items = metrics.map((metric) => {
    const value = latest.get(metric);
    const axis = metric === 'downloads'
      ? (lang === 'zh' ? '左轴' : 'L')
      : (lang === 'zh' ? '右轴' : 'R');
    const label = `${LABELS[metric][lang]} (${axis}) ${value ? formatValue(value.value) : '—'}`;
    return { metric, label, width: measureText(label, 10) };
  });
  const rows: LegendItem[][] = [[]];
  let used = 0;
  for (const item of items) {
    const itemWidth = LEGEND_TEXT_OFFSET + item.width + LEGEND_ITEM_GAP;
    if (rows[rows.length - 1].length && used + itemWidth > width) {
      rows.push([]);
      used = 0;
    }
    rows[rows.length - 1].push(item);
    used += itemWidth;
  }
  return rows;
}

/** Wrap on character width units, counting CJK characters as two. */
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

/** systemLanguage list for the Chinese branch of the <switch> element. */
const CHINESE_LANGUAGES = 'zh-CN,zh-SG,zh-TW,zh-HK,zh-MO,zh-Hans,zh-Hant,zh';

/** Expected failures render as SVG with HTTP 200 so a README never shows a broken image. */
function errorBody(message: string, hint: string): string {
  const lines = wrapText(hint, 96);
  const fontSize = Math.max(9, Math.min(13, 142 / Math.max(1, lines.length) - 3));
  const lineHeight = fontSize + 6;
  const hintSvg = lines.map((line, index) =>
    `<text x="32" y="${num(79 + index * lineHeight)}" fill="#506579" font-size="${num(fontSize)}">${escapeXml(line)}</text>`).join('');
  return `<rect width="100%" height="100%" rx="8" fill="#f5f8fb"/><circle cx="34" cy="35" r="10" fill="#c45656"/><text x="34" y="40" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="700">!</text><text x="54" y="41" fill="#17324d" font-size="17" font-weight="600">${escapeXml(fitText(message, 710, 17))}</text>${hintSvg}`;
}

/** Single-language error document. */
export function renderErrorChart(message: string, hint: string, kind = 'error', lang: ResolvedLanguage = 'en'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="220" viewBox="0 0 800 220" role="img" aria-labelledby="error-title error-hint" data-kind="${escapeXml(kind)}" data-lang="${lang}" font-family="${FONT}"><title id="error-title">${escapeXml(message)}</title><desc id="error-hint">${escapeXml(hint)}</desc>${errorBody(message, hint)}</svg>`;
}

/** Bilingual error document; the reader's language selects the branch. */
export function renderAutoErrorChart(enMessage: string, enHint: string, zhMessage: string, zhHint: string, kind = 'error'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="220" viewBox="0 0 800 220" role="img" aria-labelledby="error-title error-hint" data-kind="${escapeXml(kind)}" data-lang="auto" font-family="${FONT}"><title id="error-title">${escapeXml(enMessage)} / ${escapeXml(zhMessage)}</title><desc id="error-hint">${escapeXml(enHint)} / ${escapeXml(zhHint)}</desc><switch><g systemLanguage="${CHINESE_LANGUAGES}" lang="zh-CN">${errorBody(zhMessage, zhHint)}</g><g lang="en">${errorBody(enMessage, enHint)}</g></switch></svg>`;
}

/**
 * Entry point for chart rendering.
 *
 * A fixed language renders one body and returns it directly. `lang=auto` renders
 * both bodies and wraps them in a <switch>: the reader's browser picks a branch,
 * so a single cached document serves both Chinese and English.
 */
export function renderChart(points: ChartPoint[], options: ChartOptions): string {
  if (options.lang !== 'auto') return renderChartDocument(points, options, options.lang);
  const width = Math.max(1, Number.isFinite(options.width) ? options.width : 800);
  const height = Math.max(1, Number.isFinite(options.height) ? options.height : 400);
  const zh = renderChartDocument(points, options, 'zh', true);
  const en = renderChartDocument(points, options, 'en', true);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${num(width)}" height="${num(height)}" viewBox="0 0 ${num(width)} ${num(height)}" role="img" aria-labelledby="chart-title chart-desc" data-lang="auto" font-family="${FONT}"><title id="chart-title">${escapeXml(options.repo)}</title><desc id="chart-desc">Repository metrics over time / 仓库指标时间折线图</desc>${options.theme === 'auto' ? AUTO_STYLE : ''}<switch><g systemLanguage="${CHINESE_LANGUAGES}" lang="zh-CN">${zh}</g><g lang="en">${en}</g></switch></svg>`;
}

/**
 * Build one language variant of the chart body.
 *
 * bodyOnly is set when the caller wraps the result in a <switch>; the outer <svg>,
 * <title> and <desc> are then emitted by the caller. The layout is derived from the
 * requested size: insets for axis labels, the title and the legend rows leave the
 * remaining space to the plot area.
 */
function renderChartDocument(points: ChartPoint[], options: ChartOptions, lang: ResolvedLanguage, bodyOnly = false): string {
  const width = Math.max(1, Number.isFinite(options.width) ? options.width : 800);
  const height = Math.max(1, Number.isFinite(options.height) ? options.height : 400);
  const metrics = [...new Set(options.metrics)].filter((metric): metric is Metric => metric in COLORS);
  /** Upstream short keys used in the history payload. */
  const field: Record<Metric, keyof ChartPoint> = { downloads: 'd', rating: 'a', ratings: 'c' };
  /** Split each metric at gaps so missing samples are never interpolated. */
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
  /** The x domain spans the whole history so every series shares one time axis. */
  const all = [...series.values()].flat().flatMap((segment) => segment.points);
  const times = points.filter((point) => Number.isFinite(point.t)).map((point) => point.t).sort((a, b) => a - b);
  const minTime = times[0];
  const maxTime = times[times.length - 1];
  const hasTime = times.length > 0;

  /** Plot insets: room for axis labels, the title and the legend. */
  const left = metrics.includes('downloads') ? Math.min(60, width * 0.18) : 18;
  const right = metrics.some((metric) => metric !== 'downloads') ? Math.min(65, width * 0.2) : 18;
  const titleSpace = options.title ? 50 : 14;
  const legend = options.legend
    ? legendRows(metrics, width - left - right, lang,
      new Map(metrics.map((metric) => [metric, series.get(metric)?.at(-1)?.points.at(-1)])))
    : [];
  const bottom = 27 + Math.max(0, legend.length - 1) * LEGEND_ROW_HEIGHT + (legend.length ? 14 : 0);
  const plotWidth = Math.max(1, width - left - right);
  const plotHeight = Math.max(1, height - titleSpace - bottom);
  const x = (t: number): number => hasTime && maxTime !== minTime
    ? left + (t - minTime) / (maxTime - minTime) * plotWidth
    : left + plotWidth / 2;

  /** Rating is fixed at 1-5; downloads and counts scale to their own maximum. */
  const countScale = (metric: Metric): Scale => scaleCounts(
    (series.get(metric) ?? []).flatMap((segment) => segment.points).map((point) => point.value));
  const scales: Partial<Record<Metric, Scale>> = {
    downloads: countScale('downloads'),
    rating: { min: 1, max: 5, ticks: [1, 2, 3, 4, 5] },
    ratings: countScale('ratings'),
  };
  /** Map a value into the plot area using that metric's own scale. */
  const y = (metric: Metric, value: number): number => {
    const scale = scales[metric]!;
    return titleSpace + (scale.max - value) / (scale.max - scale.min) * plotHeight;
  };
  const auto = options.theme === 'auto';
  const palette = options.theme === 'dark' ? PALETTE.dark : PALETTE.light;
  /**
 * Emit a palette value. A fixed theme needs a plain attribute; the automatic theme
 * adds the class for the CSS custom property but keeps the inline light value as a
 * fallback for renderers that do not support variables.
 */
  const paint = (name: PaletteKey, kind: 'fill' | 'stroke', cls = `chart-${name}`): string =>
    auto ? `class="${cls}" ${kind}="${PALETTE.light[name]}"` : `${kind}="${palette[name]}"`;
  const svg: string[] = bodyOnly ? [] : [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${num(width)}" height="${num(height)}" viewBox="0 0 ${num(width)} ${num(height)}" role="img" aria-labelledby="chart-title chart-desc" data-lang="${lang}" font-family="${FONT}">`,
    `<title id="chart-title">${escapeXml(options.repo)}</title>`,
    `<desc id="chart-desc">${escapeXml(lang === 'zh' ? '仓库指标时间折线图' : 'Repository metrics over time')}</desc>`,
    ...(auto ? [AUTO_STYLE] : []),
  ];
  svg.push(`<rect width="100%" height="100%" rx="8" ${paint('background', 'fill')}/>`);

  if (options.title) {
    const suffix = hasTime ? ` · ${date(maxTime)}` : '';
    const room = width - left - 14;
    const full = `${options.repo}${suffix}`;
    const title = fitText(full, room, 15) === full ? full : fitText(options.repo, room, 15);
    svg.push(`<text x="${num(left)}" y="23" ${paint('title', 'fill')} font-size="15" font-weight="600">${escapeXml(title)}</text>`);
  }

  const gridMetric = metrics.includes('downloads') ? 'downloads' : metrics[0];
  if (gridMetric) {
    for (const tick of scales[gridMetric]!.ticks) {
      const yy = y(gridMetric, tick);
      if (options.grid) {
        svg.push(`<line x1="${num(left)}" y1="${num(yy)}" x2="${num(width - right)}" y2="${num(yy)}" ${paint('grid', 'stroke')} stroke-width="1"/>`);
      }
    }
  }

  if (metrics.includes('downloads')) {
    for (const tick of scales.downloads!.ticks) {
      svg.push(`<text x="${num(left - 7)}" y="${num(y('downloads', tick) + 3)}" text-anchor="end" ${paint('foreground', 'fill')} font-size="10">${formatValue(tick)}</text>`);
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
      svg.push(`<text x="${num(width - right + 7)}" y="${num(y(railMetric, tick) + 3)}" ${paint('foreground', 'fill')} font-size="10">${label}</text>`);
    }
  }

  svg.push(`<line x1="${num(left)}" y1="${num(titleSpace + plotHeight)}" x2="${num(width - right)}" y2="${num(titleSpace + plotHeight)}" ${paint('grid', 'stroke')}/>`);
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
      svg.push(`<text x="${num(xx)}" y="${num(titleSpace + plotHeight + 17)}" text-anchor="${anchor}" ${paint('foreground', 'fill')} font-size="10">${label}</text>`);
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
    if (last) svg.push(`<circle data-endpoint="${metric}" cx="${num(x(last.t))}" cy="${num(y(metric, last.value))}" r="3.5" fill="${color}" ${paint('background', 'stroke', 'chart-ring')} stroke-width="1.5"/>`);
  }

  if (!all.length) {
    const message = lang === 'zh' ? '暂无所选指标数据' : 'No data for the selected metrics';
    svg.push(`<text x="${num(left + plotWidth / 2)}" y="${num(titleSpace + plotHeight / 2)}" text-anchor="middle" ${paint('foreground', 'fill')} font-size="12">${message}</text>`);
  }
  for (let row = 0; row < legend.length; row++) {
    let xx = left;
    const yy = height - (legend.length - row - 1) * LEGEND_ROW_HEIGHT - 6;
    for (const { metric, label, width: labelWidth } of legend[row]) {
      const textX = xx + LEGEND_TEXT_OFFSET;
      const available = Math.max(1, width - right - textX - 2);
      svg.push(`<line data-legend="${metric}" x1="${num(xx)}" y1="${num(yy - 3)}" x2="${num(xx + LEGEND_LINE_WIDTH)}" y2="${num(yy - 3)}" stroke="${COLORS[metric]}" stroke-width="2"/>`);
      svg.push(`<text x="${num(textX)}" y="${num(yy)}" ${paint('foreground', 'fill')} font-size="10">${escapeXml(fitText(label, available, 10))}</text>`);
      xx += LEGEND_TEXT_OFFSET + labelWidth + LEGEND_ITEM_GAP;
    }
  }
  if (!bodyOnly) svg.push('</svg>');
  return svg.join('');
}
