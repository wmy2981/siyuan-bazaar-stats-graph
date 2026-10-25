# SiYuan Bazaar Stats Graph

[English](./README.md) | 简体中文

为 [SiYuan Note](https://github.com/siyuan-note/siyuan) 集市包生成静态 SVG 趋势图，由 Cloudflare Workers 驱动，数据来自 [TCOTC/siyuan-bazaar-stats](https://github.com/TCOTC/siyuan-bazaar-stats) 公开的历史记录。

*示例图（使用实时数据）：*

![wmy2981/ai-title-siyuan 的实时图表](https://siyuan-bazaar-stats-graph.sr1.cc.cd/api/chart/wmy2981/ai-title-siyuan?metrics=downloads&range=90d&area=true&lang=zh)

## 图表生成器

打开[交互式图表生成器](https://siyuan-bazaar-stats-graph.sr1.cc.cd/)：输入仓库、调整全部图表参数、实时预览 SVG，并复制图表链接、HTML 图片标签或 README Markdown。图表默认使用 `lang=auto`，嵌入后会跟随每位读者的浏览器语言。

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
| `theme` | `light`、`dark`、`auto` | `auto` |
| `width` | 320 到 1600 之间的整数 | `800` |
| `height` | 200 到 1000 之间的整数 | `400` |
| `title` | `true`、`false` | `true` |
| `legend` | `true`、`false` | `true` |
| `grid` | `true`、`false` | `true` |
| `area` | `true`、`false`；填充下载量曲线下方区域 | `false` |
| `lang` | `en`、`zh`、`auto` | `auto` |

`theme=auto`（默认）时同一份 SVG 自带两套配色，按访问者系统的深浅色偏好呈现。GitHub 页面主题无法传递给图片，因此系统深色配浅色 GitHub 时仍会显示深色卡片；需要固定外观时显式指定 `theme`。

`lang=auto`（默认）时同一份 SVG 自带中英文标签，按访问者的界面语言偏好自动选择。需要固定语言时显式指定 `lang=en` 或 `lang=zh`。

配色通过内联 `<style>` 中的 CSS 自定义属性下发，因此 SVG 依赖 CSS 变量支持。浏览器渲染正常，但忽略 `var()` 的渲染器（例如 cairosvg）会丢掉所有文字——标题、坐标轴标签与图例——只留下曲线和网格；`lang` 与 `theme` 都无法规避。若用于 PDF 或 PNG 导出，请改用支持 CSS 变量的渲染器。

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
- 历史数值来自 TCOTC/siyuan-bazaar-stats 的上游包详情 JSON，每月原始快照作为兜底。观测只在数值变化时记录，最快每 30 分钟一次，起始于 2026 年 8 月；GitHub 定时调度可能延迟数小时。图表显示最新观测日期。
- 时间戳取自集市的 `publishedAt`，不是采集时刻，因此各点间隔不均匀，数值没有变化的时段也没有对应的点。
- 已下架的包会从上游产物中消失，这类图表返回 `packageNotFound`。
- 上游产物带 `schema`；取值不同会直接报错，而不是按字段含义未变来读取。字段、地址与快照语义的冻结契约见上游[数据契约](https://github.com/TCOTC/siyuan-bazaar-stats/blob/main/docs/data-contract.md)。
- 图表缓存 30 分钟，因此新观测会在上游发布后最多 30 分钟出现在图中。

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
