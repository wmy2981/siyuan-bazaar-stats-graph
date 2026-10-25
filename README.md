# SiYuan Bazaar Stats Graph

Static SVG trend charts for [SiYuan Note](https://github.com/siyuan-note/siyuan) bazaar packages, powered by Cloudflare Workers and the public history from [TCOTC/siyuan-bazaar-stats](https://github.com/TCOTC/siyuan-bazaar-stats).

![Live chart for the SiYuan sample plugin](https://siyuan-bazaar-stats-graph.sr1.cc.cd/api/chart/siyuan-note/plugin-sample?metrics=downloads&range=90d&area=true)

## Embed in a README

```md
![Package trends](https://siyuan-bazaar-stats-graph.sr1.cc.cd/api/chart/OWNER/REPO?metrics=downloads,rating,ratings&range=90d)
```

Replace `OWNER/REPO` with the package's GitHub repository. The service resolves it to the bazaar package through the official package catalog. No API key is required.

Production base URL: `https://siyuan-bazaar-stats-graph.sr1.cc.cd`

## Endpoint

```text
GET /api/chart/{owner}/{repo}
```

The response is always a self-contained `image/svg+xml` document, including input and upstream errors. This keeps errors visible instead of producing a broken image in GitHub READMEs. Successful charts have a 30-minute shared cache; error charts expire after one minute. During an upstream outage, the most recent successful chart may be served for up to 24 hours with `X-Chart-Status: stale` and `X-Cache: STALE`. Otherwise `X-Chart-Status` distinguishes `ok` from `error`.

### Parameters

| Parameter | Values | Default |
| --- | --- | --- |
| `metrics` | Comma-separated `downloads`, `rating`, `ratings` | `downloads` |
| `range` | `30d`, `90d`, `1y`, `all` | `all` |
| `start`, `end` | UTC dates, `YYYY-MM-DD`; use instead of `range` | — |
| `theme` | `light`, `dark` | `light` |
| `width` | Integer from 320 to 1600 | `800` |
| `height` | Integer from 200 to 1000 | `400` |
| `title` | `true`, `false` | `true` |
| `legend` | `true`, `false` | `true` |
| `grid` | `true`, `false` | `true` |
| `area` | `true`, `false`; fill below downloads | `false` |
| `lang` | `en`, `zh` | `en` |

`rating` is the weighted average from 1 to 5. `ratings` is the number of ratings. Downloads use the left axis; rating metrics use the right. When both rating metrics are selected, paired right-axis labels show average / count. Lines use actual observation timestamps rather than assuming evenly spaced samples. Gaps in rating history are not connected. A range beginning after the first observation carries the last known value to the start boundary, which correctly represents cumulative metrics.

### Examples

```text
/api/chart/OWNER/REPO?metrics=downloads&range=30d&area=true
/api/chart/OWNER/REPO?metrics=downloads,rating&theme=dark&width=960&height=480
/api/chart/OWNER/REPO?metrics=rating,ratings&start=2026-08-01&end=2026-10-01&lang=zh
```

The SVG is intentionally static: no scripts, external resources, cookies or runtime browser dependencies. GitHub's image proxy can safely cache and render it.

## Data

- Package repository mapping and current catalog: official SiYuan bazaar indexes.
- Historical values: TCOTC/siyuan-bazaar-stats, scheduled to collect every 30 minutes when values change. GitHub's scheduled workflows may be delayed by hours; this service cannot publish observations that the upstream has not collected yet.
- Preferred history: the upstream generated package detail JSON; raw monthly snapshots are used as fallback.
- Charts display the latest observation date. The source began collecting history in August 2026; earlier dates have no data.
- Every chart request after the 30-minute edge-cache lifetime fetches the current upstream package data without an additional CDN cache layer. New upstream observations therefore appear after the upstream site finishes publishing and the chart cache expires. Raw GitHub snapshots remain available as fallback.

This project does not copy or redistribute a separate history database. Upstream availability and corrections flow into subsequently refreshed charts.

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

### GitHub Actions deployment

`CI` runs on every branch push, every pull request and manual dispatch. It runs tests, type checks and `cf deploy --prebuilt --dry-run`.

`Deploy` runs after a successful `CI` run on `main`, or by manual dispatch. It rebuilds the same commit and deploys with `cf deploy --prebuilt`. Manual deployment does not require a preceding CI run; the automatic `workflow_run` path does.

Add these repository secrets under **Settings → Secrets and variables → Actions**:

- `CLOUDFLARE_API_TOKEN`: a token with permission to edit Workers in the account.
- `CLOUDFLARE_ACCOUNT_ID`: the account ID shown in the Cloudflare dashboard.

Then add the repository variable `CLOUDFLARE_DEPLOY_ENABLED` with value `true` under **Settings → Secrets and variables → Actions → Variables**. The opt-in variable prevents a failing deployment before credentials are configured.

No credentials are committed to this repository. Forks can run the validation workflow without secrets; deployment only runs on `main` in the upstream repository.

## License

[MIT](./LICENSE)
