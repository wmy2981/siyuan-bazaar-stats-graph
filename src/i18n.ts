/** Messages for every expected failure, mirrored in English and Chinese. */
export type Language = 'en' | 'zh'

export interface LocalizedText {
  message: string
  hint: string
}

/** Every error code carries a headline plus an actionable hint. */
interface ErrorText {
  en: LocalizedText
  zh: LocalizedText
}

/**
 * Every error message and hint the SVG endpoint can show. Both languages are
 * required, so the type checker rejects a new error that ships only English.
 * `{{placeholder}}` values are filled by `localizeError`.
 */
/** Single source of truth for error text; tests assert both languages. */
export const ERRORS = {
  methodNotAllowed: {
    en: { message: 'Method not allowed', hint: 'Use a GET request for this SVG endpoint.' },
    zh: { message: '请求方法不允许', hint: '请使用 GET 请求此 SVG 接口。' },
  },
  invalidChartUrl: {
    en: { message: 'Invalid chart URL', hint: 'Use /api/chart/{owner}/{repo}?metrics=downloads,rating,ratings' },
    zh: { message: '图表链接无效', hint: '请使用 /api/chart/{owner}/{repo}?metrics=downloads,rating,ratings。' },
  },
  unknownParameter: {
    en: { message: 'Unknown parameter: {{name}}', hint: 'Use metrics, theme, width, height, range, start, end, lang, title, legend, grid or area.' },
    zh: { message: '未知参数：{{name}}', hint: '请使用 metrics、theme、width、height、range、start、end、lang、title、legend、grid 或 area。' },
  },
  repeatedParameter: {
    en: { message: 'Invalid {{name}}', hint: 'Provide one {{name}} parameter.' },
    zh: { message: '参数 {{name}} 无效', hint: '请只提供一个 {{name}} 参数。' },
  },
  wholeNumberParameter: {
    en: { message: 'Invalid {{name}}', hint: '{{name}} must be a whole number from {{min}} to {{max}}.' },
    zh: { message: '参数 {{name}} 无效', hint: '{{name}} 必须是 {{min}} 到 {{max}} 之间的整数。' },
  },
  outOfRangeParameter: {
    en: { message: 'Invalid {{name}}', hint: '{{name}} must be from {{min}} to {{max}}.' },
    zh: { message: '参数 {{name}} 无效', hint: '{{name}} 必须在 {{min}} 到 {{max}} 之间。' },
  },
  booleanParameter: {
    en: { message: 'Invalid {{name}}', hint: '{{name}} must be true or false.' },
    zh: { message: '参数 {{name}} 无效', hint: '{{name}} 只能是 true 或 false。' },
  },
  invalidDateParameter: {
    en: { message: 'Invalid {{name}}', hint: '{{name}} must be a valid date in YYYY-MM-DD format.' },
    zh: { message: '参数 {{name}} 无效', hint: '{{name}} 必须是 YYYY-MM-DD 格式的有效日期。' },
  },
  unknownMetric: {
    en: { message: 'Unknown metric', hint: 'Use metrics=downloads,rating,ratings (one or more).' },
    zh: { message: '未知指标', hint: '请使用 metrics=downloads,rating,ratings（可多选）。' },
  },
  unknownTheme: {
    en: { message: 'Unknown theme', hint: 'Use theme=light, theme=dark or theme=auto.' },
    zh: { message: '未知主题', hint: '请使用 theme=light、theme=dark 或 theme=auto。' },
  },
  unknownLanguage: {
    en: { message: 'Unknown language', hint: 'Use lang=en, lang=zh or lang=auto.' },
    zh: { message: '未知语言', hint: '请使用 lang=en、lang=zh 或 lang=auto。' },
  },
  unknownRange: {
    en: { message: 'Unknown date range', hint: 'Use range=30d,90d,1y,all, or start=YYYY-MM-DD&end=YYYY-MM-DD.' },
    zh: { message: '未知时间范围', hint: '请使用 range=30d、90d、1y、all，或 start=YYYY-MM-DD&end=YYYY-MM-DD。' },
  },
  conflictingDateFilters: {
    en: { message: 'Conflicting date filters', hint: 'Use either range or start/end, not both.' },
    zh: { message: '日期参数冲突', hint: 'range 与 start/end 只能二选一。' },
  },
  reversedDateRange: {
    en: { message: 'Invalid date range', hint: 'start must be earlier than or equal to end.' },
    zh: { message: '日期范围无效', hint: 'start 必须早于或等于 end。' },
  },
  noHistoryInRange: {
    en: { message: 'No history in this date range', hint: 'Try range=all or an earlier start date.' },
    zh: { message: '该时间范围内没有历史数据', hint: '请尝试 range=all 或更早的开始日期。' },
  },
  packageNotFound: {
    en: { message: 'Package not found', hint: 'No bazaar package matches github.com/{{repo}}. Check owner/repo and package availability.' },
    zh: { message: '未找到集市包', hint: '思源集市里没有与 github.com/{{repo}} 匹配的包，请检查 owner/repo 以及该包是否已上架。' },
  },
  dataSourceUnavailable: {
    en: { message: 'Data source is temporarily unavailable', hint: 'Please try again in a minute.' },
    zh: { message: '数据源暂时不可用', hint: '请稍后重试。' },
  },
  dataSourceError: {
    en: { message: 'Data source returned an error', hint: 'Upstream status: {{status}}. Please try again later.' },
    zh: { message: '数据源返回错误', hint: '上游状态码 {{status}}，请稍后重试。' },
  },
  dataSourceInvalid: {
    en: { message: 'Data source returned invalid data', hint: 'Please try again after the upstream data is repaired.' },
    zh: { message: '数据源数据异常', hint: '请等待上游数据修复后重试。' },
  },
  historyUnavailable: {
    en: { message: 'History data is temporarily unavailable', hint: 'Upstream status: {{status}}. Please try again later.' },
    zh: { message: '历史数据暂时不可用', hint: '上游状态码 {{status}}，请稍后重试。' },
  },
  historyTooLarge: {
    en: { message: 'History data is too large', hint: 'Use a narrower date range.' },
    zh: { message: '历史数据过大', hint: '请缩小时间范围。' },
  },
  historyMalformed: {
    en: { message: 'History data is malformed', hint: 'Please try again after the upstream data is repaired.' },
    zh: { message: '历史数据格式错误', hint: '请等待上游数据修复后重试。' },
  },
  renderFailed: {
    en: { message: 'Unable to draw this chart', hint: 'Please try again in a minute.' },
    zh: { message: '无法生成图表', hint: '请稍后重试。' },
  },
} as const satisfies Record<string, ErrorText>

export type ErrorCode = keyof typeof ERRORS
export type ErrorValues = Record<string, string | number>

/** Look up a code and substitute its placeholder values. */
export function localizeError(code: ErrorCode, values: ErrorValues = {}, lang: Language): LocalizedText {
  const text = ERRORS[code][lang]
  return { message: fill(text.message, values), hint: fill(text.hint, values) }
}

/** `{{name}}` is interpolated; single braces stay literal, e.g. `/api/chart/{owner}/{repo}`. */
/** Replace {placeholder} tokens; unknown tokens are left untouched. */
function fill(template: string, values: ErrorValues): string {
  return template.replace(/\{\{(\w+)\}\}/g, (placeholder, name: string) => name in values ? String(values[name]) : placeholder)
}
