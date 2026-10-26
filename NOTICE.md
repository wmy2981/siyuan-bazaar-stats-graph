# Notice and attribution

## Data

Charts rendered here display statistics collected by
[siyuan-bazaar-stats](https://github.com/TCOTC/siyuan-bazaar-stats), published
under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) per its
[data license](https://github.com/TCOTC/siyuan-bazaar-stats/blob/main/data/LICENSE)
(upstream [`8c071f8`](https://github.com/TCOTC/siyuan-bazaar-stats/commit/8c071f8e1f72b5bc0a00b509cb1fdd892c78ad79)).

### Fields used

Read at request time from the upstream package JSON, raw snapshots as fallback. Only
`downloads`, `rating.average` and `rating.count` reach the chart, plus `owner/repo`
and the latest date in the title; no other field is displayed.

### Modifications

- No dataset is mirrored; the only copy is the 30-minute edge cache.
- A five-star histogram, when present, is aggregated into an average and count.
- Points use their real timestamps (`t`, Unix seconds); missing samples break the
  line rather than being interpolated, except in the snapshot fallback, where a
  missing rating carries the previous value forward.
- A window starting after the first observation repeats the last earlier value.

### Re-publishing charts

A README embed needs nothing further. If you redistribute a chart image
elsewhere, keep its source note or add:

> Data source: [siyuan-bazaar-stats](https://github.com/TCOTC/siyuan-bazaar-stats)
> (CC BY 4.0). Chart rendered by
> [siyuan-bazaar-stats-graph](https://github.com/wmy2981/siyuan-bazaar-stats-graph).

## Scope

- Source code: [MIT](./LICENSE).
- Files and icons served from `bazaar.b3logfile.com`, `oss.b3logfile.com` and
  `siyuan-sync.b3logfile.com` belong to their providers, under neither license.
- Not affiliated with or endorsed by SiYuan Note or the SiYuan bazaar; data is as-is.
