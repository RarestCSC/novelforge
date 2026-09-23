# NovelForge 功能说明

## AI 接口

AI 请求统一位于 `src/lib/ai.ts`，兼容 OpenAI 风格的 `/chat/completions` 接口，因此可以配置：

- OpenAI
- DeepSeek
- 其他 OpenAI 兼容服务
- 本地模型服务，例如 Ollama 的兼容网关

Provider 配置保存在本机浏览器存储 `novelforge-providers` 中。真实桌面版发布前，应将 API Key 迁移到 Tauri 的系统密钥链，而不是长期保存在 localStorage。

## 本地开发

```bash
npm install
npm run dev
```

桌面开发：

```bash
npm run tauri dev
```
