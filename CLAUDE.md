# CLAUDE.md

- Use `cf`, never Wrangler, for Cloudflare operations. Preserve `cloudflare.config.ts`, including the production domain and log query-string redaction.
- Use `npm run check` before committing. For prebuilt deployment checks, run `npm run build:ci` before `cf deploy --prebuilt`; plain `cf build` omits the config preparation needed in CI.
- Commit messages follow the history in this repository: `type: short imperative description`, no scope, for example `fix: hide broken chart previews`.
- Upstream timestamps are Unix **seconds**; convert them for SVG rendering. Snapshots are sparse change records, so rating gaps stay disconnected.
- `TCOTC/siyuan-bazaar-stats` `docs/data-contract.md` freezes the upstream entry URLs, snapshot semantics and `/data/` `schema`; re-read it before changing `src/data.ts`.
- Keep SVG self-contained and static: no scripts, external assets or hover dependencies. Expected errors are also SVG with HTTP 200 for GitHub README compatibility; retain the short error cache and successful-chart fallback.
- The chart API contract lives in `src/openapi.yaml`, served at `/openapi.yaml` and rendered by the Swagger UI at `/docs`; `queryParameters` in `src/options.ts` is its source of truth, and `test/openapi.test.ts` fails when the two drift. Keep the Swagger UI files bundled from `swagger-ui-dist` and the `/docs` CSP self-hosted, with no inline script.
- Production changes go only through `main`: successful `CI` triggers `Deploy`. Do not run `cf deploy` directly from an agent session.
- Chart/layout changes require browser checks in light and dark themes, all three metrics, and at 320×200. Verify legend/line colors match, labels do not overlap, and GitHub README embedding renders.
- Tests mock `cloudflare:workers` and the cache API; preserve those seams when changing the Worker entrypoint.
