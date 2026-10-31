# SiYuan Bazaar Stats Graph

English | [简体中文](./README.zh-CN.md)

Static SVG trend charts for [SiYuan Note](https://github.com/siyuan-note/siyuan) bazaar packages, powered by Cloudflare Workers and the public history from [TCOTC/siyuan-bazaar-stats](https://github.com/TCOTC/siyuan-bazaar-stats).

*Example chart using live data:*

![Live chart for wmy2981/ai-title-siyuan](https://siyuan-bazaar-stats-graph.sr1.cc.cd/api/chart/wmy2981/ai-title-siyuan?metrics=downloads&range=90d&area=true)

## Chart builder

Open the [interactive chart builder](https://siyuan-bazaar-stats-graph.sr1.cc.cd/) to pick a repository and every chart parameter, preview the SVG live, and copy the chart URL, HTML image tag or README Markdown. Charts default to `lang=auto`, so embeds follow each reader's browser language.

## Embed in a README

```md
![Package trends](https://siyuan-bazaar-stats-graph.sr1.cc.cd/api/chart/OWNER/REPO?metrics=downloads,rating,ratings&range=90d)
```

Replace `OWNER/REPO` with the package's GitHub repository; the service resolves it through the official package catalog. No API key is required. Production base URL: `https://siyuan-bazaar-stats-graph.sr1.cc.cd`.

## Endpoint

```text
GET /api/chart/{owner}/{repo}
GET /api/png/chart/{owner}/{repo}
```

`/api/chart/{owner}/{repo}` always answers with a self-contained `image/svg+xml` document, including input and upstream errors, so failures stay visible instead of becoming a broken image in a GitHub README. Successful charts are cached for 30 minutes, error charts for one minute. During an upstream outage the latest successful chart may be served for up to 24 hours with `X-Chart-Status: stale` and `X-Cache: STALE`; otherwise `X-Chart-Status` is `ok` or `error`.

`/api/png/chart/{owner}/{repo}` returns the same chart as a PNG with a transparent background, for pipelines that cannot render SVG or CSS variables. A raster is frozen at render time, so `lang=auto` and `theme=auto` are not available there: an omitted or auto language and theme resolve to English and light, and explicit `lang=zh` or `theme=dark` still apply. Glyph subsets of Noto Sans / Noto Sans SC (SIL OFL 1.1) are fetched from Google Fonts on the first request per edge location; if that fetch fails the PNG still renders, without text. Error cards keep a light background so the message stays readable. Parameters, caching and status headers match the SVG route.

### Parameters

| Parameter | Values | Default |
| --- | --- | --- |
| `metrics` | Comma-separated `downloads`, `rating`, `ratings` | `downloads` |
| `range` | `30d`, `90d`, `1y`, `all` | `all` |
| `start`, `end` | UTC dates, `YYYY-MM-DD`; pass either or both, instead of `range` | — |
| `theme` | `light`, `dark`, `auto` | `auto` |
| `width` | Integer from 320 to 1600 | `800` |
| `height` | Integer from 200 to 1000 | `400` |
| `title` | `true`, `false` | `true` |
| `legend` | `true`, `false` | `true` |
| `grid` | `true`, `false` | `true` |
| `area` | `true`, `false`; fill below downloads | `false` |
| `updated` | `true`, `false`; show the upstream update time | `true` |
| `lang` | `en`, `zh`, `auto` | `auto` |

Passing only `start` loads from that date to the newest observation; only `end` loads everything up to that date, covering the whole UTC day; both load that range.

`theme=auto` and `lang=auto` ship both palettes and both languages in one SVG, chosen from the reader's system colour preference and interface language. An image cannot see GitHub's page theme, so a dark system with a light GitHub still gets a dark card; set `theme` or `lang` explicitly for a fixed look.

Colours are CSS custom properties in an inline `<style>` element, so the SVG needs CSS variable support. Renderers that ignore `var()` (cairosvg, for example) drop every text element — title, axis labels and legend — leaving only curves and grid, and neither `lang` nor `theme` avoids this. Use a CSS-capable renderer, or the PNG route above, for PDF or image pipelines.

`rating` is the weighted average from 1 to 5, `ratings` the number of ratings. Downloads use the left axis, rating metrics the right; with both rating metrics selected, paired right-axis labels show average / count. Lines follow real observation timestamps, rating gaps stay disconnected, and a range starting after the first observation carries the last known value to the boundary — correct for cumulative metrics.

### Examples

```text
/api/chart/OWNER/REPO?metrics=downloads&range=30d&area=true
/api/chart/OWNER/REPO?metrics=downloads,rating&theme=dark&width=960&height=480
/api/chart/OWNER/REPO?metrics=rating,ratings&start=2026-08-01&end=2026-10-01&lang=zh
/api/png/chart/OWNER/REPO?metrics=downloads&range=90d&theme=dark
```

The SVG is intentionally static: no scripts, external resources, cookies or runtime browser dependencies, so GitHub's image proxy can cache and render it safely.

## Data

- Package mappings and the catalog come from the official SiYuan bazaar indexes.
- History comes from upstream package detail JSON, with raw monthly snapshots as fallback. Observations are change-only, collected every 30 minutes at best since August 2026, and GitHub scheduling may delay them by hours. Charts show the upstream data's last update time — the newest observation, in UTC to the second — as small muted text at the bottom right, or below the legend when the chart is too narrow; hide it with `updated=false`. The title carries no date.
- Timestamps are the bazaar's `publishedAt`, not the collection time, so spacing is uneven and a quiet period has no point.
- Delisted packages leave the upstream artifacts, so their charts report `packageNotFound`.
- Artifacts carry `schema`; any other value is shown as an error rather than read with possibly changed field meanings. The upstream [data contract](https://github.com/TCOTC/siyuan-bazaar-stats/blob/main/docs/data-contract.md) freezes fields, URLs and snapshot semantics.
- Charts are cached for 30 minutes, so a new observation appears up to 30 minutes after upstream publishes it.

No history database is copied or redistributed, and no field beyond those listed in [NOTICE.md](./NOTICE.md) reaches a chart, so upstream corrections flow into the next refresh.

## Development

Requires Node.js 22.23+ or 24.22+ and the [Cloudflare `cf` CLI](https://developers.cloudflare.com/cf/).

```sh
npm install
npm run dev          # cf dev
npm test             # unit and data-contract tests
npm run typecheck
npm run build        # cf build
npm run check        # all local checks
npm run deploy       # cf deploy, after cf auth login
```

## License and attribution

Source code is [MIT](./LICENSE).

Charts display statistics from [TCOTC/siyuan-bazaar-stats](https://github.com/TCOTC/siyuan-bazaar-stats), published under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). [NOTICE.md](./NOTICE.md) covers attribution, the fields used, the transformations applied and re-use of chart images; files and icons from the `b3logfile.com` hosts belong to their providers and are covered by neither license. Not affiliated with or endorsed by SiYuan Note or the SiYuan bazaar.
