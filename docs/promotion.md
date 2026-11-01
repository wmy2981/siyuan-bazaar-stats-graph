# 给自己的集市包挂一张趋势图

集市页面上只有当前的下载量和评分。这个服务把 [TCOTC/siyuan-bazaar-stats](https://github.com/TCOTC/siyuan-bazaar-stats) 的公开历史记录画成静态 SVG，一条链接贴到自己包的 README 里，就能看到这个包一路的变化，图会跟着上游数据更新。

指标、时间范围、深色浅色、尺寸都能调。打开在线生成器，填上包的仓库，边调边看预览，再复制 Markdown 或 HTML 代码。

在线交互式图表生成器：<https://siyuan-bazaar-stats-graph.sr1.cc.cd/>

Github 仓库：<https://github.com/wmy2981/siyuan-bazaar-stats-graph>

_示例图（使用实时数据）：_

![wmy2981/ai-title-siyuan 的实时图表](https://siyuan-bazaar-stats-graph.sr1.cc.cd/api/chart/wmy2981/ai-title-siyuan?metrics=downloads,rating&range=90d&area=true&lang=zh)

```text
https://siyuan-bazaar-stats-graph.sr1.cc.cd/api/chart/wmy2981/ai-title-siyuan?metrics=downloads,rating&range=90d&area=true&lang=zh
```

## 复制粘贴就能用

```md
![包趋势](https://siyuan-bazaar-stats-graph.sr1.cc.cd/api/chart/OWNER/REPO?metrics=downloads,rating,ratings&range=90d&lang=zh)
```

`OWNER/REPO` 换成包的 GitHub 仓库，服务自己到集市目录里找对应条目，不用申请 API Key。
