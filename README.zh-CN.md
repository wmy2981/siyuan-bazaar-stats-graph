# SiYuan Bazaar Stats Graph

[English](./README.md) | 简体中文

为 [SiYuan Note](https://github.com/siyuan-note/siyuan) 集市包生成静态 SVG 趋势图，由 Cloudflare Workers 驱动，数据来自 [TCOTC/siyuan-bazaar-stats](https://github.com/TCOTC/siyuan-bazaar-stats) 公开的历史记录。

![wmy2981/ai-title-siyuan 的实时图表](https://siyuan-bazaar-stats-graph.sr1.cc.cd/api/chart/wmy2981/ai-title-siyuan?metrics=downloads&range=90d&area=true&lang=zh)

## 嵌入到 README

```md
![包趋势](https://siyuan-bazaar-stats-graph.sr1.cc.cd/api/chart/OWNER/REPO?metrics=downloads,rating,ratings&range=90d&lang=zh)
```

把 `OWNER/REPO` 换成该包的 GitHub 仓库即可。服务会通过官方包目录把它解析到对应的集市包，无需 API Key。

生产环境地址：`https://siyuan-bazaar-stats-graph.sr1.cc.cd`

## 接口

```text
GET /api/chart/{owner}/{repo}
```

响应始终是一份自包含的 `image/svg+xml` 文档，输入错误与上游错误也是如此，这样错误会直接显示出来，而不是在 GitHub README 里变成一张破图。成功图表共享缓存 30 分钟，错误图表 1 分钟后过期。上游故障期间，最近一次成功的图表最多可继续提供 24 小时，此时带 `X-Chart-Status: stale` 与 `X-Cache: STALE`。其他情况下 `X-Chart-Status` 用于区分 `ok` 与 `error`。

### 参数

| 参数 | 取值 | 默认值 |
| --- | --- | --- |
| `metrics` | 逗号分隔的 `downloads`、`rating`、`ratings` | `downloads` |
| `range` | `30d`、`90d`、`1y`、`all` | `all` |
| `start`、`end` | UTC 日期，格式 `YYYY-MM-DD`；与 `range` 二选一 | — |
| `theme` | `light`、`dark` | `light` |
| `width` | 320 到 1600 之间的整数 | `800` |
| `height` | 200 到 1000 之间的整数 | `400` |
| `title` | `true`、`false` | `true` |
| `legend` | `true`、`false` | `true` |
| `grid` | `true`、`false` | `true` |
| `area` | `true`、`false`；填充下载量曲线下方区域 | `false` |
| `lang` | `en`、`zh` | `en` |

`rating` 是 1 到 5 的加权平均分，`ratings` 是评分人数。下载量使用左侧坐标轴，评分指标使用右侧坐标轴。同时选择两个评分指标时，右侧坐标轴标签成对显示平均分 / 人数。折线使用真实的观测时间戳，不假设采样间隔均匀。评分历史中的空缺不会被连线。若所选范围起点晚于首次观测时间，则把最后一次已知值延伸到起点边界，这对累计指标是正确表示。

### 示例

```text
/api/chart/OWNER/REPO?metrics=downloads&range=30d&area=true&lang=zh
/api/chart/OWNER/REPO?metrics=downloads,rating&theme=dark&width=960&height=480&lang=zh
/api/chart/OWNER/REPO?metrics=rating,ratings&start=2026-08-01&end=2026-10-01&lang=zh
```

SVG 刻意保持静态：没有脚本、外部资源、Cookie 或运行时的浏览器依赖。GitHub 的图片代理可以安全地缓存并渲染它。

## 数据

- 包仓库映射与当前目录：思源集市官方索引。
- 历史数值：TCOTC/siyuan-bazaar-stats，数值变化时每 30 分钟采集一次。GitHub 的定时工作流可能延迟数小时，本服务无法发布上游尚未采集到的观测值。
- 优先历史来源：上游生成的包详情 JSON；每月原始快照作为兜底。
- 图表显示最新观测日期。上游从 2026 年 8 月开始采集历史，更早的日期没有数据。
- 每次超出 30 分钟边缘缓存生命周期后，图表请求会直接获取当前上游包数据，不再叠加一层 CDN 缓存。因此新的上游观测值会在上游站点发布完成且图表缓存过期后出现。GitHub 原始快照始终作为兜底可用。

本项目不复制、也不再分发独立的历史数据库。上游的可用性与数据修正会体现在后续刷新的图表中。

## 开发

需要 Node.js 22.23+ 或 24.22+，以及 [Cloudflare `cf` CLI](https://developers.cloudflare.com/cf/)。

```sh
npm install
npm run dev          # cf dev
npm test             # 单元测试与数据契约测试
npm run typecheck
npm run build        # cf build
npm run check        # 全部本地检查
npm run deploy       # cf deploy，需先 cf auth login
```

## 许可证

[MIT](./LICENSE)
