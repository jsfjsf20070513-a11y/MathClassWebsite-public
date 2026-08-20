import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import katex from 'katex'
import { useAuth } from '../context/useAuth'
import { clearMessages, fetchMessages, saveMessage } from '../lib/aiAssistantBackend'
import { markFlipNav, wasFlipNav } from '../lib/flipNav'

// 把助手回复里的 $...$ / $$...$$ 渲染成 KaTeX 公式,**粗体** 转 <strong>,其余
// 文本 HTML 转义后原样保留(容器 white-space:pre-wrap 负责换行)。KaTeX 输出是
// 安全 HTML;katex 随本 lazy 路由加载,不进主包。
const HTML_ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
function escapeHtml(s) {
  return `${s}`.replace(/[&<>"']/g, (c) => HTML_ESCAPE[c])
}
function renderProse(s) {
  // 除 **粗体** 外,把模型常吐的轻量 markdown 清理成书信体排版:
  // ### 标题 → 小节强调行;* / - 列表 → · 引导;--- → 短发丝线;> 引文去尖括号。
  return escapeHtml(s)
    .replace(/^#{1,4}\s+(.+)$/gm, '<strong class="cor-h">$1</strong>')
    .replace(/^\s*---+\s*$/gm, '<span class="cor-hr" aria-hidden="true"></span>')
    .replace(/^\s*[*-]\s+/gm, '· ')
    .replace(/^\s*&gt;\s?/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}
function renderRich(text) {
  const out = []
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g
  let last = 0
  let m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(renderProse(text.slice(last, m.index)))
    const display = m[1] !== undefined
    const expr = display ? m[1] : m[2]
    try {
      out.push(katex.renderToString(expr, { throwOnError: false, displayMode: display, output: 'html' }))
    } catch {
      out.push(escapeHtml(m[0]))
    }
    last = re.lastIndex
  }
  if (last < text.length) out.push(renderProse(text.slice(last)))
  return out.join('')
}

// 答疑 Assistant — 2026-08 编排版「Correspondance 书信体」(宪法 §5.4):
// 空状态(刊头 + 起手问题细字链)与对话态是两个停顿;Q./R. 小型悬挂眉头,
// 答句挂发丝左线(自上而下画出),等待指示是一根呼吸发丝线;拍题照片
// 渲染为「Figure n」编号图框。Worker、限流、云端历史、图片压缩逻辑零改动。
const AI_ENDPOINT = 'https://rucmathclass.com/api/chat'
const MAX_HISTORY = 20

const STARTERS = [
  '用中文解释一下中值定理的直觉',
  'Conjugue le verbe « résoudre » au présent',
  '« dérivée » 是阴性还是阳性?给个例句',
  'Explique la différence entre limite et continuité',
]

// 选图后在浏览器里压缩:缩到最长边 1536、转 JPEG q0.85——既省 token 又统一格式。
// 返回 { mimeType, data(纯 base64), preview(data URL 用于缩略图) }。
async function compressImage(file) {
  const dataUrl = await new Promise((res, rej) => {
    const fr = new FileReader()
    fr.onload = () => res(fr.result)
    fr.onerror = rej
    fr.readAsDataURL(file)
  })
  const img = await new Promise((res, rej) => {
    const im = new Image()
    im.onload = () => res(im)
    im.onerror = rej
    im.src = dataUrl
  })
  const maxDim = 1536
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(img, 0, 0, w, h)
  const out = canvas.toDataURL('image/jpeg', 0.85)
  return { mimeType: 'image/jpeg', data: out.split(',')[1], preview: out }
}

function getFrDateLabel() {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Asia/Shanghai',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
}

export default function Assistant() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([]) // {role:'user'|'model', content}
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [image, setImage] = useState(null) // { mimeType, data, preview }
  const [arrive] = useState(() => wasFlipNav())
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  // 背词答错跳转带来的上下文(?term=&answer=):预填一条解释请求,不自动发送。
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const term = params.get('term')
    if (!term) return
    const answer = params.get('answer')
    setInput(`请解释法语词 « ${term} »${answer ? `,并分析我刚才的答案「${answer}」为什么不对` : ''}。`)
  }, [])

  // 登录后从云端加载已保存的对话(跨设备)。表未建(compat)时返回空,静默降级为
  // 仅本次会话内存。
  useEffect(() => {
    if (!user) return undefined
    let alive = true
    fetchMessages(user.id)
      .then(({ messages: loaded }) => {
        if (alive && loaded.length) setMessages(loaded)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [user])

  const send = useCallback(
    async (text) => {
      const typed = `${text}`.trim()
      if ((!typed && !image) || loading) return
      setError('')
      const content = typed || '请看图,用中文一步步解释这道题并给出答案。'
      const sentImage = image
      const userMsg = { role: 'user', content, image: sentImage?.preview }
      const next = [...messages, userMsg].slice(-MAX_HISTORY)
      setMessages(next)
      setInput('')
      setImage(null)
      setLoading(true)
      if (user) saveMessage(user.id, 'user', content).catch(() => {})
      try {
        // 只把 {role, content} 发给模型(不回传缩略图);当前这轮的图走 body.image。
        const body = { messages: next.map((m) => ({ role: m.role, content: m.content })) }
        if (sentImage) body.image = { mimeType: sentImage.mimeType, data: sentImage.data }
        const res = await fetch(AI_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error(`服务返回 ${res.status}`)
        const data = await res.json()
        const reply = `${data?.text || ''}`.trim()
        if (!reply) throw new Error('空回复')
        setMessages((m) => [...m, { role: 'model', content: reply }])
        if (user) saveMessage(user.id, 'model', reply).catch(() => {})
      } catch (err) {
        setError(err?.message || '请求失败,请稍后再试。')
      } finally {
        setLoading(false)
        inputRef.current?.focus()
      }
    },
    [messages, loading, user, image],
  )

  const onPickImage = useCallback(async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('只支持图片文件。')
      return
    }
    if (file.size > 12 * 1024 * 1024) {
      setError('图片太大,请小于 12MB。')
      return
    }
    try {
      setError('')
      setImage(await compressImage(file))
    } catch {
      setError('图片处理失败,换一张试试。')
    }
  }, [])

  const handleClear = useCallback(() => {
    setMessages([])
    setError('')
    if (user) clearMessages(user.id).catch(() => {})
  }, [user])

  const goHome = useCallback(() => {
    markFlipNav('/assistant')
    navigate('/')
  }, [navigate])

  // 「Figure n」编号:按 user 消息里带图的先后顺序计数。
  let figureCounter = 0

  const nav = (
    <nav className="vpl-nav" aria-label="页内导航">
      <button type="button" className="vpl-nav-back" onClick={goHome} lang="fr">← Accueil</button>
      <span className="vpl-nav-title" lang="fr">Correspondance</span>
      {messages.length ? (
        <button type="button" className="vpl-nav-back cor-effacer" onClick={handleClear} lang="fr">Effacer · 清空</button>
      ) : (
        <span className="vpl-nav-side">{user ? 'Historique · 云端' : '未登录'}</span>
      )}
    </nav>
  )

  if (!user) {
    return (
      <main className={`cor${arrive ? ' mag-arrive' : ''}`}>
        {nav}
        <div className="cor-gate">
          <p className="vpl-kicker" lang="fr">Connexion requise</p>
          <p className="vpl-notice-text">登录后即可使用班级 AI 助手 —— 双语数学答疑,可拍题问图。</p>
          <Link className="mag-enter" to="/login">Connexion&nbsp;&nbsp;→</Link>
        </div>
      </main>
    )
  }

  return (
    <main className={`cor${arrive ? ' mag-arrive' : ''}`}>
      {nav}

      {messages.length === 0 && !loading ? (
        /* ── 停顿一:刊头空状态 ── */
        <div className="cor-cover" key="cover">
          <p className="vpl-kicker" data-animate="" style={{ animationDelay: '0.1s' }} lang="fr">Assistant · 班级答疑</p>
          <h1 className="cor-masthead" lang="fr">Correspondance</h1>
          <p className="cor-sub" lang="fr">Pose une question de maths ou de français — en chinois ou en français.</p>
          <div className="cor-starters">
            {STARTERS.map((s, k) => (
              <button
                key={s}
                type="button"
                className="cor-starter"
                style={{ animationDelay: `${0.35 + k * 0.12}s` }}
                onClick={() => send(s)}
                lang={/[a-zA-Zéèàçù]/.test(s[0]) ? 'fr' : undefined}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ── 停顿二:信笺流 ── */
        <div className="cor-thread" ref={scrollRef} key="thread">
          <div className="cor-thread-inner">
            <div className="cor-dateline" aria-hidden="true">
              <span className="cor-dateline-rule" />
              <p lang="fr">{`Le ${getFrDateLabel()}`}</p>
              <span className="cor-dateline-rule" />
            </div>
            {messages.map((m, idx) => {
              if (m.role === 'user') {
                const fig = m.image ? ++figureCounter : 0
                return (
                  <div key={idx} className="cor-turn">
                    <span className="cor-mark is-q" aria-hidden="true">Q.</span>
                    <div className="cor-q-body">
                      {m.image ? (
                        <figure className="cor-figure">
                          <figcaption lang="fr">{`Figure ${fig} · 拍题照片`}</figcaption>
                          <img src={m.image} alt={`Figure ${fig}`} />
                        </figure>
                      ) : null}
                      <p className="cor-q-text">{m.content}</p>
                    </div>
                  </div>
                )
              }
              return (
                <div key={idx} className="cor-turn">
                  <span className="cor-mark is-r" aria-hidden="true">R.</span>
                  <div className="cor-r-body">
                    <p className="cor-r-text" dangerouslySetInnerHTML={{ __html: renderRich(m.content) }} />
                  </div>
                </div>
              )
            })}
            {loading ? (
              <div className="cor-turn">
                <span className="cor-mark is-r" aria-hidden="true">R.</span>
                <div className="cor-r-body cor-waiting">
                  <span className="cor-breathe" aria-label="回信撰写中" />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {error ? <p className="cor-error">{error}</p> : null}

      {image ? (
        <div className="cor-attach">
          <figure className="cor-figure cor-figure-pending">
            <figcaption lang="fr">Figure à joindre · 待发送</figcaption>
            <img src={image.preview} alt="待发送的图片" />
          </figure>
          <button type="button" className="cor-attach-remove" onClick={() => setImage(null)} aria-label="移除图片">×</button>
        </div>
      ) : null}

      <form
        className="cor-composer"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <button
          type="button"
          className="cor-joindre"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          lang="fr"
        >
          Joindre une figure
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} style={{ display: 'none' }} />
        <textarea
          ref={inputRef}
          className="cor-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
          placeholder="Poser une question… · 中法双语均可"
          rows={1}
          disabled={loading}
          aria-label="向 AI 助手提问"
        />
        <button type="submit" className="cor-envoyer" disabled={loading || (!input.trim() && !image)} lang="fr">
          Envoyer
        </button>
      </form>
      <p className="cor-foot">由 Gemini 驱动 · 仅供学习参考,请自行核对。</p>
    </main>
  )
}
