# NovelForge

本地优先的 AI 小说创作桌面工作台，基于 Tauri 2 + React + TypeScript。

## 已实现

- 小说、卷、章节管理与本地自动保存
- 人物、世界观、故事大纲资料库
- 前情提要：可将前文总结为长篇续写上下文
- 划词修改：选中正文后交给 AI 润色，并替换选中文本
- OpenAI 兼容接口、DeepSeek、自定义接口
- Tauri 桌面工作区持久化到系统应用数据目录
- Markdown 导出与桌面端工作区备份

## 启动桌面端

需要 Node.js 20+、Rust stable 和 Tauri 2 系统依赖：

```bash
npm install
npm run tauri dev
```

构建安装包：

```bash
npm run tauri build
```

## 浏览器预览

```bash
npm run dev
```

浏览器预览会使用 `localStorage`；桌面端会额外将工作区保存到 Tauri 的应用数据目录。

## AI 安全提示

API Key 目前用于本地开发配置。正式发布前建议继续迁移到操作系统密钥链，不要把真实 Key 提交到 Git 仓库。
