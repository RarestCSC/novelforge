export type ProviderId = 'openai' | 'deepseek' | 'custom';

export type AIProvider = {
  id: ProviderId;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
};

export type AITask = 'continue' | 'summarize' | 'polish' | 'expand';

export type AIRequest = {
  provider: AIProvider;
  task: AITask;
  chapter: string;
  instruction?: string;
  context?: string;
  temperature?: number;
  signal?: AbortSignal;
};

export const defaultProviders: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI 兼容接口',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
    enabled: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    apiKey: '',
    model: 'deepseek-chat',
    enabled: false,
  },
  {
    id: 'custom',
    name: '自定义接口',
    baseUrl: '',
    apiKey: '',
    model: '',
    enabled: false,
  },
];

const taskInstructions: Record<AITask, string> = {
  continue: '续写当前章节。保持已有叙事视角、人物性格、时代背景和语言风格，不要重复原文，直接输出可接在正文后面的内容。',
  summarize: '总结当前章节，提炼主要事件、人物变化、冲突、线索和未解决的问题。使用简洁的中文分点输出。',
  polish: '润色当前文本。保持原意、人物设定和情节不变，改善用词、节奏、画面感和句子衔接，只输出润色后的正文。',
  expand: '扩写当前文本。保持原有情节不变，补充环境、动作、心理和感官细节，只输出扩写后的正文。',
};

function endpoint(provider: AIProvider) {
  const base = provider.baseUrl.trim().replace(/\/$/, '');
  if (!base) throw new Error(`请先配置「${provider.name}」的接口地址`);
  return base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;
}

export async function requestAI(request: AIRequest): Promise<string> {
  const { provider } = request;
  if (!provider.apiKey.trim()) throw new Error(`请先配置「${provider.name}」的 API Key`);
  if (!provider.model.trim()) throw new Error(`请先配置「${provider.name}」的模型名称`);

  const context = request.context?.trim() || '暂无额外资料';
  const userContent = [
    `任务：${taskInstructions[request.task]}`,
    request.instruction?.trim() ? `创作要求：${request.instruction.trim()}` : '',
    `相关资料：\n${context}`,
    `当前章节：\n${request.chapter}`,
  ].filter(Boolean).join('\n\n');

  const response = await fetch(endpoint(provider), {
    method: 'POST',
    signal: request.signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: provider.model.trim(),
      temperature: request.temperature ?? (request.task === 'summarize' ? 0.3 : 0.8),
      messages: [
        { role: 'system', content: '你是 NovelForge 的中文小说创作助手。遵守用户的创作要求，不编造与上下文冲突的设定。' },
        { role: 'user', content: userContent },
      ],
    }),
  });

  let payload: { error?: { message?: string }; choices?: Array<{ message?: { content?: string } }> };
  try { payload = await response.json(); } catch { throw new Error(`AI 服务返回了无法解析的响应（${response.status}）`); }
  if (!response.ok) throw new Error(payload.error?.message || `AI 请求失败（${response.status}）`);

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('AI 没有返回有效内容');
  return content;
}

export function getSavedProviders(fallback: AIProvider[]): AIProvider[] {
  try {
    const saved = JSON.parse(localStorage.getItem('novelforge-providers') || 'null');
    return Array.isArray(saved) && saved.length ? saved : fallback;
  } catch { return fallback; }
}

export function saveProviders(providers: AIProvider[]) {
  localStorage.setItem('novelforge-providers', JSON.stringify(providers));
}
