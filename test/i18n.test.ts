/** Every error code must exist in both languages, placeholders included. */
import { describe, expect, it } from 'vitest'
import { ERRORS, localizeError, type ErrorCode, type ErrorValues } from '../src/i18n'

const codes = Object.keys(ERRORS) as ErrorCode[]
const CJK = /[\u4e00-\u9fff]/
const values: ErrorValues = { name: 'width', min: 320, max: 1600, repo: 'owner/repo', status: 502, schema: 2, supported: 1 }

describe('error text catalog', () => {
  it('provides an English and a Chinese message and hint for every code', () => {
    expect(codes.length).toBeGreaterThan(0)
    for (const code of codes) {
      for (const lang of ['en', 'zh'] as const) {
        expect(ERRORS[code][lang].message.trim(), `${code}.${lang}.message`).not.toBe('')
        expect(ERRORS[code][lang].hint.trim(), `${code}.${lang}.hint`).not.toBe('')
      }
      expect(ERRORS[code].zh.message, `${code} needs a translated message`).not.toBe(ERRORS[code].en.message)
      expect(ERRORS[code].zh.message, `${code} message must be Chinese`).toMatch(CJK)
      expect(ERRORS[code].zh.hint, `${code} hint must be Chinese`).toMatch(CJK)
      expect(ERRORS[code].en.message, `${code} message must stay English`).not.toMatch(CJK)
      expect(ERRORS[code].en.hint, `${code} hint must stay English`).not.toMatch(CJK)
    }
  })

  it('uses the same placeholders in both languages and only known values', () => {
    const placeholders = (text: string) => [...text.matchAll(/\{\{(\w+)\}\}/g)].map(match => match[1]).sort()
    for (const code of codes) {
      for (const field of ['message', 'hint'] as const) {
        const en = placeholders(ERRORS[code].en[field])
        expect(placeholders(ERRORS[code].zh[field]), `${code}.${field}`).toEqual(en)
        for (const name of en) expect(Object.keys(values), `${code}.${field} uses unknown {{${name}}}`).toContain(name)
      }
    }
  })

  it('interpolates values and keeps documentation braces literal', () => {
    expect(localizeError('packageNotFound', { repo: 'nobody/nothing' }, 'en').hint)
      .toBe('No bazaar package matches github.com/nobody/nothing. Check owner/repo and package availability.')
    expect(localizeError('packageNotFound', { repo: 'nobody/nothing' }, 'zh').hint).toContain('github.com/nobody/nothing')
    expect(localizeError('outOfRangeParameter', { name: 'height', min: 200, max: 1000 }, 'zh').hint)
      .toBe('height 必须在 200 到 1000 之间。')
    expect(localizeError('dataSourceError', { status: 503 }, 'zh').hint).toBe('上游状态码 503，请稍后重试。')
    expect(localizeError('invalidChartUrl', {}, 'en').hint).toContain('/api/chart/{owner}/{repo}')
    for (const code of codes) {
      for (const lang of ['en', 'zh'] as const) {
        const text = localizeError(code, values, lang)
        expect(`${text.message} ${text.hint}`, code).not.toMatch(/\{\{\w+\}\}/)
      }
    }
  })
})
