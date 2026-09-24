import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Bot, ChevronDown, FileText, Library, Menu, PenLine, Plus, Search, Settings2, Sparkles, Sun, Trash2, WandSparkles, X } from 'lucide-react';
import './styles.css';
import { defaultProviders, requestAI, type AIProvider, type AITask } from './lib/ai';

type Chapter = {
  id: string;
  title: string;
  words: number;
  status: 'draft' | 'done';
  content: string;
  summary?: string;
};

type Volume = {
  id: string;
  title: string;
  chapters: Chapter[];
};

type Novel = {
  id: string;
  title: string;
  subtitle: string;
  volumes: Volume[];
};

type Note = {
  id: string;
  name: string;
  detail: string;
};

const sample = `雨落下来的时候，灰塔刚好敲响第十二声钟。

林默站在旧车站的屋檐下，手里捏着那封没有署名的信。信封被雨水浸得发皱，唯一清晰的，是火漆上那枚陌生的银色月纹。

远处的轨道隐入黑暗，像一条沉默的蛇。最后一班列车早已离站，可站台尽头却亮起了一盏灯。`;

const initialNovel: Novel = {
  id: 'novel-1',
  title: '雾中月',
  subtitle: '奇幻 · 连载中',
  volumes: [
    {
      id: 'v1',
      title: '第一卷 · 月影',
      chapters: [
        { id: 'c1', title: '第一章  雨夜来客', words: 2486, status: 'done', content: sample },
        { id: 'c2', title: '第二章  灰塔之下', words: 1830, status: 'draft', content: '灰塔里没有人声，只有冷风穿过每道长廊。' },
        { id: 'c3', title: '第三章  未寄出的信', words: 0, status: 'draft', content: '信封在桌上泛着潮湿的光。' },
      ],
    },
    {
      id: 'v2',
      title: '第二卷 · 深海回声',
      chapters: [{ id: 'c4', title: '第四章  潮汐之后', words: 0, status: 'draft', content: '海浪在无尽的夜里将记忆冲刷干净。' }],
    },
  ],
};

const taskMap: Record<string, AITask> = {
  续写: 'continue',
  总结: 'summarize',
  润色: 'polish',
  扩写: 'expand',
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [novel, setNovel] = useState<Novel>(() => read('novelforge-novel', initialNovel));
  const [providers, setProviders] = useState<AIProvider[]>(() => read('novelforge-providers', defaultProviders));
  const [people, setPeople] = useState<Note[]>(() => read('novelforge-people', []));
  const [world, setWorld] = useState<Note[]>(() => read('novelforge-world', []));
  const [mode, setMode] = useState('续写');
  const [result, setResult] = useState('选择一个 AI 操作，结果会显示在这里。');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prompt, setPrompt] = useState('');
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [modal, setModal] = useState<'library' | 'settings' | null>(null);
  const [libraryTab, setLibraryTab] = useState<'人物' | '世界观' | '大纲'>('人物');
  const [volumeId, setVolumeId] = useState(initialNovel.volumes[0].id);
  const [chapterId, setChapterId] = useState(initialNovel.volumes[0].chapters[0].id);

  useEffect(() => {
    localStorage.setItem('novelforge-novel', JSON.stringify(novel));
  }, [novel]);

  useEffect(() => {
    localStorage.setItem('novelforge-people', JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    localStorage.setItem('novelforge-world', JSON.stringify(world));
  }, [world]);

  useEffect(() => {
    localStorage.setItem('novelforge-providers', JSON.stringify(providers));
  }, [providers]);

  useEffect(() => {
    if (!novel.volumes.length) return;
    const currentVolume = novel.volumes.find((v) => v.id === volumeId) ?? novel.volumes[0];
    setVolumeId(currentVolume.id);
    const currentChapter = currentVolume.chapters.find((c) => c.id === chapterId) ?? currentVolume.chapters[0];
    if (currentChapter) setChapterId(currentChapter.id);
  }, [novel, volumeId, chapterId]);

  const currentVolume = useMemo(
    () => novel.volumes.find((v) => v.id === volumeId) ?? novel.volumes[0],
    [novel, volumeId],
  );

  const currentChapter = useMemo(
    () => currentVolume.chapters.find((c) => c.id === chapterId) ?? currentVolume.chapters[0],
    [currentVolume, chapterId],
  );

  const totalWords = useMemo(
    () => novel.volumes.reduce((sum, volume) => sum + volume.chapters.reduce((inner, chapter) => inner + chapter.words, 0), 0),
    [novel],
  );

  const chapterWordCount = useMemo(() => currentChapter.content.replace(/\s/g, '').length, [currentChapter.content]);

  const activeProvider = providers.find((p) => p.enabled) || providers[0] || defaultProviders[0];
  const notes = libraryTab === '人物' ? people : world;

  const updateChapter = (patch: Partial<Chapter>) => {
    setNovel((prev) => ({
      ...prev,
      volumes: prev.volumes.map((volume) =>
        volume.id === currentVolume.id
          ? {
              ...volume,
              chapters: volume.chapters.map((chapter) =>
                chapter.id === currentChapter.id ? { ...chapter, ...patch } : chapter,
              ),
            }
          : volume,
      ),
    }));
  };

  const addChapter = () => {
    const newId = `c-${Date.now()}`;
    const chapterDraft: Chapter = {
      id: newId,
      title: `第${currentVolume.chapters.length + 1}章  未命名章节`,
      words: 0,
      status: 'draft',
      content: '新的章节从这里开始。',
    };

    setNovel((prev) => ({
      ...prev,
      volumes: prev.volumes.map((volume) =>
        volume.id === currentVolume.id
          ? { ...volume, chapters: [...volume.chapters, chapterDraft] }
          : volume,
      ),
    }));
    setChapterId(newId);
  };

  const addVolume = () => {
    const newVolumeId = `v-${Date.now()}`;
    const newChapterIdValue = `c-${Date.now() + 1}`;
    const newVolume: Volume = {
      id: newVolumeId,
      title: `第${novel.volumes.length + 1}卷  新卷名`,
      chapters: [
        {
          id: newChapterIdValue,
          title: '第一章  新章节',
          words: 0,
          status: 'draft',
          content: '新卷的第一章节从这里开始。',
        },
      ],
    };

    setNovel((prev) => ({ ...prev, volumes: [...prev.volumes, newVolume] }));
    setVolumeId(newVolumeId);
    setChapterId(newChapterIdValue);
  };

  const deleteCurrentChapter = () => {
    if (currentVolume.chapters.length <= 1) return;

    setNovel((prev) => ({
      ...prev,
      volumes: prev.volumes.map((volume) => {
        if (volume.id !== currentVolume.id) return volume;
        const nextChapters = volume.chapters.filter((chapter) => chapter.id !== currentChapter.id);
        return { ...volume, chapters: nextChapters };
      }),
    }));

    const index = currentVolume.chapters.findIndex((chapter) => chapter.id === currentChapter.id);
    const fallback = currentVolume.chapters[index - 1] || currentVolume.chapters[index + 1];
    if (fallback) setChapterId(fallback.id);
  };

  const updateNoteList = (setter: React.Dispatch<React.SetStateAction<Note[]>>, noteId: string, patch: Partial<Note>) => {
    setter((prev) => prev.map((note) => (note.id === noteId ? { ...note, ...patch } : note)));
  };

  const addLibraryEntry = () => {
    const entry: Note = {
      id: String(Date.now()),
      name: libraryTab === '人物' ? '未命名人物' : '未命名设定',
      detail: '点击这里补充设定内容。',
    };

    if (libraryTab === '人物') {
      setPeople((prev) => [...prev, entry]);
      return;
    }

    setWorld((prev) => [...prev, entry]);
  };

  const runAI = async () => {
    const provider = activeProvider;
    if (!provider || !provider.apiKey.trim()) {
      setError('请先在“工作台设置”中配置 AI 接口的 API Key。');
      setResult('');
      return;
    }

    if (!provider.baseUrl.trim()) {
      setError('请先配置接口地址。');
      setResult('');
      return;
    }

    setLoading(true);
    setError('');
    setResult('AI 正在思考……');

    try {
      const context = [...people, ...world]
        .map((item) => `${item.name}：${item.detail}`)
        .join('\n');

      const answer = await requestAI({
        provider,
        task: taskMap[mode] || 'continue',
        chapter: currentChapter.content,
        instruction: prompt,
        context,
      });

      setResult(answer);
      setPrompt('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI 请求失败');
      setResult('');
    } finally {
      setLoading(false);
    }
  };

  const insertResultIntoChapter = () => {
    if (!result || result === '选择一个 AI 操作，结果会显示在这里。') return;
    const next = `${currentChapter.content}\n\n${result}`;
    updateChapter({
      content: next,
      words: next.replace(/\s/g, '').length,
      summary: mode === '总结' ? result : currentChapter.summary,
    });
  };

  const setProviderValue = (id: string, patch: Partial<AIProvider>) => {
    setProviders((prev) => prev.map((provider) => (provider.id === id ? { ...provider, ...patch } : provider)));
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><BookOpen size={18} /></div>
          <div>
            <b>NovelForge</b>
            <small>AI 小说工作台</small>
          </div>
        </div>

        <div className="crumbs">
          <span>我的作品</span>
          <span>/</span>
          <strong>{novel.title}</strong>
          <ChevronDown size={12} />
        </div>

        <div className="top-actions">
          <span className="saved"><span className="dot" /> 已自动保存</span>
          <button className="icon-btn"><Search size={16} /></button>
          <button className="icon-btn"><Sun size={16} /></button>
          <button className="avatar">R</button>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="side-header">
            <span>作品导航</span>
            <button onClick={addVolume}><Plus size={14} /></button>
          </div>

          <div className="book-card">
            <div className="book-cover">雾<br/>海</div>
            <div className="book-info">
              <strong>{novel.title}</strong>
              <small>{novel.subtitle}</small>
            </div>
            <ChevronDown size={14} />
          </div>

          <div className="side-nav">
            <div className="nav-head">
              <span>章节</span>
              <span>{totalWords.toLocaleString()} 字</span>
            </div>

            <div className="tree">
              {novel.volumes.map((volume) => (
                <div className="volume" key={volume.id}>
                  <div className="volume-row">
                    <ChevronDown size={12} />
                    <span>{volume.title}</span>
                    <button onClick={() => {
                      setVolumeId(volume.id);
                      if (volume.chapters[0]) setChapterId(volume.chapters[0].id);
                    }}><Plus size={13} /></button>
                  </div>

                  {volume.chapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      className={`chapter ${chapter.id === currentChapter.id ? 'selected' : ''}`}
                      onClick={() => {
                        setVolumeId(volume.id);
                        setChapterId(chapter.id);
                      }}
                    >
                      <FileText size={14} />
                      <span>{chapter.title}</span>
                      <em>{chapter.words ? `${Math.floor(chapter.words / 1000)}k` : '—'}</em>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="side-footer">
            <button onClick={() => { setLibraryTab('人物'); setModal('library'); }}><Library size={15} /> 资料库</button>
            <button onClick={() => { setLibraryTab('大纲'); setModal('library'); }}><PenLine size={15} /> 故事大纲</button>
            <button onClick={() => setModal('settings')}><Settings2 size={15} /> 工作台设置</button>
          </div>
        </aside>

        <main className="editor-panel">
          <div className="editor-toolbar">
            <div className="mode-tabs">
              <button className="active">写作</button>
              <button onClick={() => { setLibraryTab('大纲'); setModal('library'); }}>大纲</button>
              <button onClick={() => { setLibraryTab('人物'); setModal('library'); }}>资料</button>
            </div>

            <div className="toolbar-right">
              <span className="status-pill"><span className="dot" /> 写作中</span>
              <button className="icon-btn" onClick={deleteCurrentChapter} title="删除当前章节"><Trash2 size={15} /></button>
              <button className="icon-btn" onClick={addChapter} title="新增章节"><Plus size={16} /></button>
            </div>
          </div>

          <div className="editor-shell">
            <div className="editor-wrap">
              <div className="eyebrow">{currentVolume.title}</div>
              <div className="title-box">
                <input value={currentChapter.title} onChange={(e) => updateChapter({ title: e.target.value })} />
              </div>
              <div className="chapter-meta">第 {currentVolume.chapters.findIndex((chapter) => chapter.id === currentChapter.id) + 1} 章</div>
              <div className="rule" />
              <textarea
                value={currentChapter.content}
                onChange={(e) => {
                  const newContent = e.target.value;
                  updateChapter({
                    content: newContent,
                    words: newContent.replace(/\s/g, '').length,
                  });
                }}
                spellCheck={false}
              />
              <div className="editor-footer">
                <span>Markdown 支持</span>
                <span>{chapterWordCount.toLocaleString()} 字</span>
              </div>
            </div>
          </div>
        </main>

        {assistantOpen && (
          <aside className="ai-panel">
            <div className="ai-head">
              <div className="ai-title">
                <div className="ai-mark"><Bot size={16} /></div>
                <div>
                  <b>AI 助手</b>
                  <small>让灵感继续发生</small>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setAssistantOpen(false)}><X size={16} /></button>
            </div>

            <div className="tab-group">
              {['续写', '总结', '润色'].map((item) => (
                <button key={item} className={mode === item ? 'active' : ''} onClick={() => setMode(item)}>{item}</button>
              ))}
            </div>

            <div className="context-box">
              <div className="head">
                <span>当前上下文</span>
                <span>{people.length + world.length + 1} 项</span>
              </div>
              <div className="context-item"><FileText size={12} /> 当前章节 <span>已启用</span></div>
              <div className="context-item"><Library size={12} /> 人物设定 <span>{people.length ? '已启用' : '空白'}</span></div>
              <div className="context-item"><BookOpen size={12} /> 世界观 <span>{world.length ? '已启用' : '空白'}</span></div>
            </div>

            <div className="ai-actions">
              <p>你想做什么？</p>
              <div className="action-grid">
                {['续写', '总结', '润色', '扩写'].map((item) => (
                  <button key={item} onClick={() => {
                    setMode(item);
                    void runAI();
                  }}>
                    <WandSparkles size={15} />
                    <span>{item}</span>
                    <small>{item === '续写' ? '延续剧情' : item === '总结' ? '提炼要点' : item === '润色' ? '优化表达' : '丰富细节'}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="result-box">
              <div className="title"><Sparkles size={12} /> AI 结果 {loading && '· 处理中'}</div>
              {error ? <span className="error-text">{error}</span> : result}
              {result && result !== '选择一个 AI 操作，结果会显示在这里。' && !loading && (
                <button className="small-action" onClick={insertResultIntoChapter}>插入正文</button>
              )}
            </div>

            <div className="prompt-box">
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="告诉 AI 你的创作要求……" />
              <button className="send" disabled={loading} onClick={() => void runAI()}>
                <WandSparkles size={14} /> {loading ? '生成中…' : `开始${mode}`}
              </button>
            </div>

            <div className="model-row">
              <div className="left"><span className="dot" /> {activeProvider?.name || '未配置'}</div>
              <span onClick={() => setModal('settings')}>设置</span>
            </div>
          </aside>
        )}
      </div>

      {!assistantOpen && <button className="open-ai" onClick={() => setAssistantOpen(true)}><Bot size={15} /> 打开 AI 助手</button>}

      {modal === 'library' && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>创作资料库</h3>
                <small>人物、世界观与故事大纲</small>
              </div>
              <button className="icon-btn" onClick={() => setModal(null)}><X size={16} /></button>
            </div>

            <div className="tab-group library-tabs">
              {['人物', '世界观', '大纲'].map((item) => (
                <button key={item} className={libraryTab === item ? 'active' : ''} onClick={() => setLibraryTab(item as '人物' | '世界观' | '大纲')}>{item}</button>
              ))}
            </div>

            {libraryTab !== '大纲' && (
              <button className="save-button" onClick={addLibraryEntry}><Plus size={14} /> 新建设定</button>
            )}

            {libraryTab === '大纲' ? (
              <textarea
                className="outline"
                defaultValue={localStorage.getItem('novelforge-outline') || '故事总纲\n\n在这里记录故事主线、分卷目标与关键转折。'}
                onChange={(e) => localStorage.setItem('novelforge-outline', e.target.value)}
              />
            ) : (
              <div className="notes">
                {notes.length ? notes.map((note) => (
                  <div className="note" key={note.id}>
                    <input
                      value={note.name}
                      onChange={(e) => {
                        const setter = libraryTab === '人物' ? setPeople : setWorld;
                        updateNoteList(setter, note.id, { name: e.target.value });
                      }}
                    />
                    <textarea
                      value={note.detail}
                      onChange={(e) => {
                        const setter = libraryTab === '人物' ? setPeople : setWorld;
                        updateNoteList(setter, note.id, { detail: e.target.value });
                      }}
                    />
                  </div>
                )) : <p className="empty">还没有资料，点击“新建设定”开始。</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {modal === 'settings' && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>工作台设置</h3>
                <small>API Key 仅保存于当前设备</small>
              </div>
              <button className="icon-btn" onClick={() => setModal(null)}><X size={16} /></button>
            </div>

            {providers.map((provider) => (
              <div className="provider-card" key={provider.id}>
                <div className="provider-top">
                  <strong>{provider.name}</strong>
                  <button className={`toggle ${provider.enabled ? 'on' : ''}`} onClick={() => setProviderValue(provider.id, { enabled: !provider.enabled })}>
                    <span />
                  </button>
                </div>

                <div className="provider-grid">
                  <label>
                    模型
                    <input value={provider.model} onChange={(e) => setProviderValue(provider.id, { model: e.target.value })} />
                  </label>
                  <label>
                    接口地址
                    <input value={provider.baseUrl} onChange={(e) => setProviderValue(provider.id, { baseUrl: e.target.value })} />
                  </label>
                  <label className="full-width">
                    API Key
                    <input type="password" value={provider.apiKey} placeholder="输入后仅保存在本机" onChange={(e) => setProviderValue(provider.id, { apiKey: e.target.value })} />
                  </label>
                </div>
              </div>
            ))}

            <button className="save-button" onClick={() => setModal(null)}>保存设置</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
