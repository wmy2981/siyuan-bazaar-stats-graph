# SiYuan Bazaar Stats Graph

Static SVG trend charts for [SiYuan Note](https://github.com/siyuan-note/siyuan) bazaar packages, powered by Cloudflare Workers and the public history from [TCOTC/siyuan-bazaar-stats](https://github.com/TCOTC/siyuan-bazaar-stats).

## Embed in a README

```md
![Package trends](https://siyuan-bazaar-stats-graph.2396772981.workers.dev/api/chart/OWNER/REPO?metrics=downloads,rating,ratings&range=90d)
```

Replace `OWNER/REPO` with the package's GitHub repository. The service resolves it to the bazaar package through the official package catalog. No API key is required.

## Endpoint

```text
GET /api/chart/{owner}/{repo}
```

The response is always a self-contained `image/svg+xml` document, including input and upstream errors. This keeps errors visible instead of producing a broken image in GitHub READMEs. Successful charts have a 30-minute shared cache; error charts expire after one minute. `X-Chart-Status` distinguishes `ok` from `error`.

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
- Historical values: TCOTC/siyuan-bazaar-stats, collected roughly every 30 minutes when values change.
- Preferred history: the upstream generated package detail JSON; raw monthly snapshots are used as fallback.
- Charts display the latest observation date. The source began collecting history in August 2026; earlier dates have no data.

This project does not copy or redistribute a separate history database. Upstream availability and corrections flow into subsequently refreshed charts.

## Development

Requires Node.js 22.18 or newer and the [Cloudflare `cf` CLI](https://developers.cloudflare.com/cf/).

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

Pull requests and pushes run tests, type checks and `cf deploy --dry-run`. A push to `main` deploys with `cf deploy` after all checks pass.

Add these repository secrets under **Settings → Secrets and variables → Actions**:

- `CLOUDFLARE_API_TOKEN`: a token with permission to edit Workers in the account.
- `CLOUDFLARE_ACCOUNT_ID`: the account ID shown in the Cloudflare dashboard.

No credentials are committed to this repository. Forks can run the validation workflow without secrets; deployment only runs on `main` in the upstream repository.

## License

[MIT](./LICENSE)
