# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

- Use `cf`, never Wrangler, for Cloudflare operations. Preserve `cloudflare.config.ts`, including the production domain and log query-string redaction.
- Use `npm run check` before committing. For prebuilt deployment checks, run `npm run build:ci` before `cf deploy --prebuilt`; plain `cf build` omits the config preparation needed in CI.
- Upstream timestamps are Unix **seconds**; convert them to milliseconds for SVG rendering. Snapshots are sparse change records, not equally spaced samples, and rating gaps must remain disconnected.
- Keep SVG self-contained and static: no scripts, external assets, or hover dependencies. Expected errors are also SVG with HTTP 200 for GitHub README compatibility; retain the short error cache and successful-chart fallback.
- Production changes go only through `main`: successful `CI` triggers `Deploy`. Do not run `cf deploy` directly from an agent session.
- Chart/layout changes require browser checks in light and dark themes, all three metrics, and at 320×200. Verify legend/line colors match, labels do not overlap, and GitHub README embedding renders.
- Tests mock `cloudflare:workers` and the cache API; preserve those seams when changing the Worker entrypoint.
