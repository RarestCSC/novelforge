import React, { useMemo, useState } from 'react';
import { BookOpen, Bot, ChevronDown, FileText, Library, Menu, MoreHorizontal, PenLine, Plus, Search, Settings2, Sparkles, Sun, WandSparkles, X } from 'lucide-react';
import './styles.css';

type Chapter = { id: string; title: string; words: number; status?: 'draft' | 'done' };
const seed: Chapter[] = [
  { id: '1', title: '第一章  雨夜来客', words: 2486, status: 'done' },
  { id: '2', title: '第二章  灰塔之下', words: 1830, status: 'draft' },
  { id: '3', title: '第三章  未寄出的信', words: 0, status: 'draft' },
];

const sample = `雨落下来的时候，灰塔刚好敲响第十二声钟。

林默站在旧车站的屋檐下，手里捏着那封没有署名的信。信封被雨水浸得发皱，唯一清晰的，是火漆上那枚陌生的银色月纹。

远处的轨道隐入黑暗，像一条沉默的蛇。最后一班列车早已离站，可站台尽头却亮起了一盏灯。`;

function App() {
  const [chapters, setChapters] = useState(seed);
  const [selected, setSelected] = useState('1');
  const [text, setText] = useState(() => localStorage.getItem('novelforge-draft') || sample);
  const [mode, setMode] = useState('续写');
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [result, setResult] = useState('选择一个 AI 操作，结果会显示在这里。');

  const current = useMemo(() => chapters.find((c) => c.id === selected) ?? chapters[0], [chapters, selected]);
  const wordCount = useMemo(() => text.replace(/\s/g, '').length, [text]);

  const runAi = () => {
    setResult(mode === '续写'
      ? '林默抬起头。那个人的脸藏在帽檐的阴影里，只有一双眼睛，像两粒被雨水打磨过的黑曜石。\n\n“把信交给我。”\n\n车站的灯忽然全部熄灭。'
      : mode === '总结'
        ? '本章讲述林默在雨夜抵达旧车站，并遇见一位等待他的神秘人物。银色月纹和未署名的信件暗示着更大的秘密。'
        : '这段落的语气沉静而压抑，雨夜与车站等场景起到了很强的心理铺垫作用。');
  };

  React.useEffect(() => {
    localStorage.setItem('novelforge-draft', text);
  }, [text]);

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
          <strong>雾中月</strong>
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
            <button><MoreHorizontal size={14} /></button>
          </div>

          <div className="book-card">
            <div className="book-cover">雾<br/>海</div>
            <div className="book-info">
              <strong>雾中月</strong>
              <small>奇幻 · 连载中</small>
            </div>
            <ChevronDown size={14} />
          </div>

          <div className="side-nav">
            <div className="nav-head">
              <span>章节</span>
              <span>12,486 字</span>
            </div>

            <div className="tree">
              <div className="volume">
                <div className="volume-row">
                  <ChevronDown size={12} />
                  <span>第一卷 · 月影</span>
                  <button onClick={() => {
                    const id = String(Date.now());
                    setChapters((prev) => [...prev, { id, title: `第${prev.length + 1}章  未命名章节`, words: 0, status: 'draft' }]);
                    setSelected(id);
                  }}><Plus size={13} /></button>
                </div>

                {chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    className={`chapter ${chapter.id === selected ? 'selected' : ''}`}
                    onClick={() => setSelected(chapter.id)}
                  >
                    <FileText size={14} />
                    <span>{chapter.title}</span>
                    <em>{chapter.words ? `${Math.floor(chapter.words / 1000)}k` : '—'}</em>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="side-footer">
            <button><Library size={15} /> 资料库</button>
            <button><PenLine size={15} /> 故事大纲</button>
            <button><Settings2 size={15} /> 工作台设置</button>
          </div>
        </aside>

        <main className="editor-panel">
          <div className="editor-toolbar">
            <div className="mode-tabs">
              <button className="active">写作</button>
              <button>大纲</button>
              <button>资料</button>
            </div>

            <div className="toolbar-right">
              <span className="status-pill"><span className="dot" /> 写作中</span>
              <button className="icon-btn"><Menu size={16} /></button>
            </div>
          </div>

          <div className="editor-shell">
            <div className="editor-wrap">
              <div className="eyebrow">第一卷 · 月影</div>
              <div className="title-box">
                <input
                  value={current.title}
                  onChange={(e) => setChapters((prev) => prev.map((chapter) => chapter.id === selected ? { ...chapter, title: e.target.value } : chapter))}
                />
              </div>
              <div className="chapter-meta">第 1 章</div>
              <div className="rule" />
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setChapters((prev) => prev.map((chapter) => chapter.id === selected ? { ...chapter, words: e.target.value.replace(/\s/g, '').length } : chapter));
                }}
                spellCheck={false}
              />
              <div className="editor-footer">
                <span>Markdown 支持</span>
                <span>{wordCount.toLocaleString()} 字</span>
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
                <span>3 项</span>
              </div>
              <div className="context-item"><FileText size={12} /> 当前章节 <span>已启用</span></div>
              <div className="context-item"><Library size={12} /> 人物设定 <span>已启用</span></div>
              <div className="context-item"><BookOpen size={12} /> 第一卷摘要 <span>已启用</span></div>
            </div>

            <div className="ai-actions">
              <p>你想做什么？</p>
              <div className="action-grid">
                <button onClick={runAi}><WandSparkles size={15} /><span>续写</span><small>延续剧情</small></button>
                <button onClick={runAi}><Sparkles size={15} /><span>总结</span><small>提炼要点</small></button>
                <button onClick={runAi}><Sparkles size={15} /><span>润色</span><small>优化表达</small></button>
                <button onClick={runAi}><PenLine size={15} /><span>扩写</span><small>丰富细节</small></button>
              </div>
            </div>

            <div className="result-box">
              <div className="title"><Sparkles size={12} /> AI 结果</div>
              {result}
            </div>

            <div className="prompt-box">
              <textarea placeholder="告诉 AI 你的创作要求……" />
              <button className="send" onClick={runAi}><WandSparkles size={14} /> 开始{mode}</button>
            </div>

            <div className="model-row">
              <div className="left"><span className="dot" /> OpenAI 兼容接口</div>
              <span>切换</span>
            </div>
          </aside>
        )}
      </div>

      {!assistantOpen && <button className="open-ai" onClick={() => setAssistantOpen(true)}><Bot size={15} /> 打开 AI 助手</button>}
    </div>
  );
}

export default App;
