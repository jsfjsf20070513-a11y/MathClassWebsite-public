import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { frenchVocabulary } from '../data/frenchVocabulary'
import {
  REVIEW_RESULT,
  buildStudyQueue,
  cleanFrenchDeck,
  computeDeckStats,
  computeStudyStreak,
  gradeReviewState,
} from '../lib/srsScheduler'
import {
  EXERCISE_TYPES,
  buildExercise,
  buildMatchExercise,
  gradeExercise,
} from '../lib/exerciseGenerator'
import { fetchReviewStateMap, importReviewStates, saveReviewState } from '../lib/vocabularyBackend'
import { parseProgressImport, serializeProgress } from '../lib/vocabularyProgress'
import { markFlipNav, wasFlipNav } from '../lib/flipNav'

// 背词 Vocabulary — 2026-08 编排版「一叠卡片」(宪法 §5.2):
// 扉页(筛选/配额/COMMENCER)→ 预习卡 → 题版卡(每题一停,轻翻换卡,
// 判定原页揭示)→ 结算屏。底部发丝进度线是唯一常驻计数;筛选器只住扉页与结算屏。
// SRS 队列、六题型、云端进度、导入导出、错词重练、键盘捷径:逻辑零改动。

const MAX_NEW = 8
const MAX_REVIEW = 40
// Rotate exercise formats across the session so a word is met different ways.
const TYPE_ROTATION = [
  EXERCISE_TYPES.recognition,
  EXERCISE_TYPES.build,
  EXERCISE_TYPES.cloze,
  EXERCISE_TYPES.listen,
  EXERCISE_TYPES.spelling,
]
// 法语发音:USE_WORKER_VOICE 为 true 时优先走同域 Worker(真人音 + 边缘缓存),
// 失败回退浏览器 TTS。当前 ElevenLabs 免费层无法用法语库声音(George 是英音),
// 故暂时直接用浏览器法语 TTS;接好真人法语音后把开关置 true 即可切回 Worker 路径。
const SPEAK_ENDPOINT = 'https://rucmathclass.com/api/speak'
const USE_WORKER_VOICE = false

const VALID_DECK = cleanFrenchDeck(frenchVocabulary).valid
const DECK_TAGS = ['all', ...Array.from(new Set(VALID_DECK.map((w) => w.tag).filter(Boolean)))]
// CEFR ladder A1→C2; only the levels actually present in the deck are offered.
const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const DECK_LEVELS = ['all', ...LEVEL_ORDER.filter((l) => VALID_DECK.some((w) => w.level === l))]

const ROMAN_OPT = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ']

// 题型眉头(法语刊名 + 中文小注)。
const TYPE_KICKER = {
  [EXERCISE_TYPES.match]: ['Association', '配对'],
  [EXERCISE_TYPES.recognition]: ['Reconnaissance', '选择词义'],
  [EXERCISE_TYPES.cloze]: ['Complétez', '例句填空'],
  [EXERCISE_TYPES.listen]: ['Dictée', '听写'],
  [EXERCISE_TYPES.spelling]: ['Orthographe', '拼写'],
  [EXERCISE_TYPES.build]: ['Traduction', '拼句'],
}

// Filter the deck on both axes the learner controls: CEFR level and theme tag.
function selectDeck(level, tag) {
  return VALID_DECK.filter(
    (w) => (level === 'all' || w.level === level) && (tag === 'all' || w.tag === tag),
  )
}

function shuffled(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Short grammatical label for the prompt line, e.g. « n.f. » / « v. » / « adj. ».
function posLabel(word) {
  if (!word) return ''
  if (word.pos === 'verb') return 'v.'
  if (word.pos === 'adjective') return 'adj.'
  if (word.pos === 'noun') return word.gender === 'm' ? 'n.m.' : word.gender === 'f' ? 'n.f.' : 'n.'
  return ''
}

// Long italic part-of-speech for the study card, in French.
function posLong(word) {
  if (!word) return ''
  if (word.pos === 'verb') return 'verbe'
  if (word.pos === 'adjective') return 'adjectif'
  if (word.pos === 'adverb') return 'adverbe'
  if (word.pos === 'noun') return word.gender === 'm' ? 'nom masc.' : word.gender === 'f' ? 'nom fém.' : 'nom'
  return ''
}

// Turn the SRS study queue into a list of exercise steps. A match warm-up leads
// when there are ≥4 cards; the rest rotate through the formats. Non-match steps
// carry the word + SRS state so grading can persist.
function buildSession(queue, deck) {
  const steps = []
  if (queue.length >= 4) {
    const four = queue.slice(0, 4)
    steps.push({ kind: 'match', exercise: buildMatchExercise(four.map((q) => q.word)) })
  }
  queue.forEach((item, idx) => {
    let type = TYPE_ROTATION[idx % TYPE_ROTATION.length]
    // 「词块拼句」要求把例句译成法语,必须有例句中文(exampleZh)做题干;没有就
    // 换成拼写题,绝不出"考拼句却不给中文"的残题。
    if (type === EXERCISE_TYPES.build && !item.word.exampleZh) {
      type = EXERCISE_TYPES.spelling
    }
    steps.push({ kind: 'card', word: item.word, state: item.state, exercise: buildExercise(item.word, deck, { type }) })
  })
  return steps
}

export default function Vocabulary() {
  const { user } = useAuth()
  const navigate = useNavigate()
  // idle = 扉页(宪法 §5.2 的开始屏);其余同旧:loading|study|ready|disabled|compat|empty|error|done
  const [status, setStatus] = useState('loading')
  const [studyList, setStudyList] = useState([]) // {word, state} — preview deck shown before the test
  const [studyIdx, setStudyIdx] = useState(0)
  const [steps, setSteps] = useState([])
  const [i, setI] = useState(0)
  const [phase, setPhase] = useState('answer') // answer|feedback
  const [lastCorrect, setLastCorrect] = useState(null)
  const [picked, setPicked] = useState(null)
  const [input, setInput] = useState('')
  const [chosen, setChosen] = useState([]) // build: ordered tile ids
  const [match, setMatch] = useState({ sel: null, done: [], wrong: [] })
  const [stats, setStats] = useState({ correct: 0, attempts: 0, combo: 0, maxCombo: 0 })
  const [wrong, setWrong] = useState([]) // {word, state} missed this session — feeds the review list + 只练错词
  const [deckStats, setDeckStats] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [tag, setTag] = useState('all')
  const [level, setLevel] = useState('all')
  const [shuffle, setShuffle] = useState(false)
  const [importMsg, setImportMsg] = useState('')
  const [arrive] = useState(() => wasFlipNav())
  const fileInputRef = useRef(null)
  const inputRef = useRef(null)
  const audioRef = useRef(null)
  const voiceRef = useRef(null)
  const spokenRef = useRef(-1)

  const current = steps[i]

  // ── audio: WebAudio verdict cue + speechSynthesis for the listen format ──
  const tone = useCallback((ok) => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return
      const ac = audioRef.current || (audioRef.current = new Ctx())
      if (ac.state === 'suspended') ac.resume()
      const t = ac.currentTime
      const notes = ok ? [587.33, 880] : [392, 261.63]
      notes.forEach((f, k) => {
        const osc = ac.createOscillator()
        const gain = ac.createGain()
        osc.type = 'sine'
        osc.frequency.value = f
        const st = t + k * 0.1
        gain.gain.setValueAtTime(0.0001, st)
        gain.gain.exponentialRampToValueAtTime(0.09, st + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, st + 0.22)
        osc.connect(gain)
        gain.connect(ac.destination)
        osc.start(st)
        osc.stop(st + 0.24)
      })
    } catch {
      // audio is a nicety; never let it break the study flow
    }
  }, [])

  const browserTTS = useCallback((text) => {
    try {
      const synth = window.speechSynthesis
      if (!synth || !text) return
      synth.cancel()
      let done = false
      // Speak with a FRENCH voice. getVoices() is often empty on first call until
      // the engine loads — wait once for `voiceschanged`, with a timed safety. The
      // `done` flag guarantees exactly one utterance (never English + French double).
      const speakWith = () => {
        if (done) return
        done = true
        const u = new SpeechSynthesisUtterance(text)
        u.lang = 'fr-FR'
        u.rate = 0.9
        const fr = (synth.getVoices() || []).find((v) => /fr/i.test(v.lang))
        if (fr) u.voice = fr
        synth.speak(u)
      }
      if ((synth.getVoices() || []).length) {
        speakWith()
      } else {
        synth.addEventListener('voiceschanged', speakWith, { once: true })
        setTimeout(speakWith, 300)
      }
    } catch {
      // speech is optional
    }
  }, [])

  // Prefer the real voice via the Worker; fall back to browser TTS if the audio
  // can't load. `fallbackOnce` guards so the fallback fires AT MOST ONCE — both
  // `onerror` and the play() rejection used to fire it, causing a double voice.
  const speak = useCallback((text) => {
    if (!text) return
    try { window.speechSynthesis && window.speechSynthesis.cancel() } catch { /* ignore */ }
    // 暂走浏览器法语 TTS(见 USE_WORKER_VOICE 注释)。
    if (!USE_WORKER_VOICE) {
      browserTTS(text)
      return
    }
    let usedFallback = false
    const fallbackOnce = () => {
      if (usedFallback) return
      usedFallback = true
      browserTTS(text)
    }
    try {
      const a = voiceRef.current || (voiceRef.current = new Audio())
      a.onerror = fallbackOnce
      a.src = `${SPEAK_ENDPOINT}?text=${encodeURIComponent(text.slice(0, 160))}`
      const p = a.play()
      if (p && typeof p.catch === 'function') p.catch(fallbackOnce)
    } catch {
      fallbackOnce()
    }
  }, [browserTTS])

  const load = useCallback(async () => {
    if (!user) return
    setStatus('loading')
    setErrorMessage('')
    try {
      const { mode, states } = await fetchReviewStateMap(user.id)
      if (mode === 'disabled') return setStatus('disabled')
      if (mode === 'compat') return setStatus('compat')
      const now = new Date().toISOString()
      const deck = selectDeck(level, tag)
      setDeckStats({
        ...computeDeckStats({ deck, stateMap: states, now }),
        streak: computeStudyStreak(Object.values(states), now),
      })
      let queue = buildStudyQueue({ deck, stateMap: states, now, maxNew: MAX_NEW, maxReview: MAX_REVIEW })
      if (shuffle) queue = shuffled(queue)
      const built = buildSession(queue, deck)
      setSteps(built)
      setStudyList(queue.map((q) => ({ word: q.word, state: q.state, isNew: q.isNew })))
      setStudyIdx(0)
      setI(0)
      setPhase('answer')
      setPicked(null)
      setInput('')
      setChosen([])
      setMatch({ sel: null, done: [], wrong: [] })
      setStats({ correct: 0, attempts: 0, combo: 0, maxCombo: 0 })
      setWrong([])
      spokenRef.current = -1
      // 编排版:先停在扉页(idle),COMMENCER 后进预习/测试。
      setStatus(built.length ? 'idle' : 'empty')
    } catch (error) {
      setErrorMessage(error?.message || '加载背词数据失败。')
      setStatus('error')
    }
    return undefined
  }, [user, tag, level, shuffle])

  useEffect(() => {
    if (user) load()
  }, [user, load])

  // 扉页 → 预习(有队列)或直接测试。
  const commencer = useCallback(() => {
    if (status !== 'idle') return
    setStatus(studyList.length ? 'study' : 'ready')
  }, [status, studyList.length])

  // record verdict (combo/score) and persist the SRS state for card steps
  const record = useCallback(
    (ok, step) => {
      tone(ok)
      setLastCorrect(ok)
      setStats((s) => {
        const combo = ok ? s.combo + 1 : 0
        return {
          correct: s.correct + (ok ? 1 : 0),
          attempts: s.attempts + 1,
          combo,
          maxCombo: Math.max(s.maxCombo, combo),
        }
      })
      if (!ok && step?.kind === 'card' && step.word) {
        setWrong((w) => (w.some((x) => x.word.id === step.word.id) ? w : [...w, { word: step.word, state: step.state }]))
      }
      if (step?.kind === 'card' && user) {
        const now = new Date().toISOString()
        const next = gradeReviewState(
          { ...step.state, user_id: user.id, word_id: step.word.id },
          ok ? REVIEW_RESULT.correct : REVIEW_RESULT.wrong,
          now,
        )
        saveReviewState(next).catch(() => {})
      }
    },
    [tone, user],
  )

  const choose = useCallback(
    (opt) => {
      if (phase !== 'answer' || !current) return
      setPicked(opt)
      setPhase('feedback')
      record(gradeExercise(current.exercise, opt), current)
    },
    [phase, current, record],
  )

  const submitSpelling = useCallback(() => {
    if (phase !== 'answer' || !current) return
    setPhase('feedback')
    record(gradeExercise(current.exercise, input), current)
  }, [phase, current, input, record])

  const submitBuild = useCallback(() => {
    if (phase !== 'answer' || !current) return
    const map = Object.fromEntries(current.exercise.bank.map((t) => [t.id, t.w]))
    const words = chosen.map((id) => map[id])
    setPhase('feedback')
    record(gradeExercise(current.exercise, words), current)
  }, [phase, current, chosen, record])

  const tapTile = useCallback((id) => {
    setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
  }, [])

  const tapMatch = useCallback(
    (side, id) => {
      if (phase !== 'answer' || !current) return
      const m = match
      if (m.done.includes(id)) return
      if (!m.sel) { setMatch({ ...m, sel: { side, id }, wrong: [] }); return }
      if (m.sel.side === side) { setMatch({ ...m, sel: { side, id } }); return }
      if (m.sel.id === id) {
        // correct pair — keep side effects OUT of the state updater
        const done = [...m.done, id]
        setMatch({ sel: null, done, wrong: [] })
        if (done.length >= current.exercise.cards.length) {
          setPhase('feedback')
          record(true, current)
        }
        return
      }
      // mismatch — flash both, then clear
      setMatch({ ...m, sel: null, wrong: [`${m.sel.side}${m.sel.id}`, `${side}${id}`] })
      setTimeout(() => setMatch((mm) => ({ ...mm, wrong: [] })), 380)
    },
    [phase, current, match, record],
  )

  const next = useCallback(() => {
    const ni = i + 1
    try { window.speechSynthesis && window.speechSynthesis.cancel() } catch { /* ignore */ }
    if (ni >= steps.length) {
      setStatus('done')
      return
    }
    setI(ni)
    setPhase('answer')
    setPicked(null)
    setInput('')
    setChosen([])
    setMatch({ sel: null, done: [], wrong: [] })
  }, [i, steps.length])

  // Re-drill only the words missed this session (design: « 只练错词 »).
  const retryWrong = useCallback(() => {
    if (!wrong.length) return
    const deck = selectDeck(level, tag)
    const built = buildSession(wrong.map((x) => ({ word: x.word, state: x.state })), deck)
    setSteps(built)
    setI(0)
    setPhase('answer')
    setPicked(null)
    setInput('')
    setChosen([])
    setMatch({ sel: null, done: [], wrong: [] })
    setStats({ correct: 0, attempts: 0, combo: 0, maxCombo: 0 })
    setWrong([])
    spokenRef.current = -1
    setStatus('ready')
  }, [wrong, tag, level])

  // Study (preview) navigation: step through the deck, then begin the test.
  const studyNext = useCallback(() => {
    setStudyIdx((idx) => {
      if (idx + 1 >= studyList.length) { setStatus('ready'); return idx }
      return idx + 1
    })
  }, [studyList.length])
  const skipStudy = useCallback(() => setStatus('ready'), [])

  // speak the listen prompt when its step appears; autofocus the spelling input
  useEffect(() => {
    if (status !== 'ready' || !current) return
    if (current.exercise?.type === EXERCISE_TYPES.listen && phase === 'answer' && spokenRef.current !== i) {
      spokenRef.current = i
      speak(current.exercise.audioText)
    }
    if (current.exercise?.type === EXERCISE_TYPES.spelling && phase === 'answer') {
      inputRef.current?.focus()
    }
  }, [status, current, phase, i, speak])

  // keyboard: 1–4 pick options, Enter submits/advances
  useEffect(() => {
    if (status !== 'ready') return undefined
    const onKey = (event) => {
      const tagName = event.target?.tagName
      const inField = tagName === 'INPUT' || tagName === 'TEXTAREA'
      if (phase === 'feedback') {
        if (event.key === 'Enter' || event.code === 'Space') {
          if (inField && event.key !== 'Enter') return
          event.preventDefault()
          next()
        }
        return
      }
      const ex = current?.exercise
      if (!ex) return
      if ((ex.type === EXERCISE_TYPES.recognition || ex.type === EXERCISE_TYPES.cloze || ex.type === EXERCISE_TYPES.listen) && !inField) {
        const n = Number(event.key)
        if (n >= 1 && n <= ex.options.length) {
          event.preventDefault()
          choose(ex.options[n - 1])
        }
      } else if (ex.type === EXERCISE_TYPES.spelling && event.key === 'Enter') {
        event.preventDefault()
        submitSpelling()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [status, phase, current, choose, submitSpelling, next])

  // study preview: Enter / Space advances; idle: Enter begins
  useEffect(() => {
    if (status !== 'study' && status !== 'idle') return undefined
    const onKey = (event) => {
      if (event.key === 'Enter' || event.code === 'Space') {
        if (event.target?.tagName === 'INPUT' || event.target?.tagName === 'TEXTAREA' || event.target?.tagName === 'BUTTON') return
        event.preventDefault()
        if (status === 'idle') commencer()
        else studyNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [status, studyNext, commencer])

  // ── export / import progress ──
  const handleExport = useCallback(async () => {
    if (!user) return
    try {
      const { states } = await fetchReviewStateMap(user.id)
      const json = serializeProgress(Object.values(states), { exportedAt: new Date().toISOString() })
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `vocab-progress-${new Date().toISOString().slice(0, 10)}.json`
      anchor.click()
      URL.revokeObjectURL(url)
      setImportMsg('已导出进度 JSON。')
    } catch (error) {
      setImportMsg(`导出失败:${error?.message || error}`)
    }
  }, [user])

  const handleImportFile = useCallback(
    async (event) => {
      const file = event.target.files?.[0]
      if (!file || !user) return
      setImportMsg('正在导入…')
      try {
        const text = await file.text()
        const { rows, report } = parseProgressImport(text)
        const { mode, count } = await importReviewStates(rows, user.id)
        if (mode === 'compat') setImportMsg('数据表还没建立,无法导入。')
        else if (mode === 'disabled') setImportMsg('Supabase 未配置,无法导入。')
        else {
          setImportMsg(`导入完成:写入 ${count} 条,跳过 ${report.rejected.length} 条无效行。`)
          await load()
        }
      } catch (error) {
        setImportMsg(`导入失败:${error?.message || error}`)
      } finally {
        event.target.value = ''
      }
    },
    [user, load],
  )

  const goHome = useCallback(() => {
    markFlipNav('/vocabulary')
    navigate('/')
  }, [navigate])

  // ── render helpers ──
  const ex = current?.exercise
  const fb = phase === 'feedback'
  const acc = stats.attempts ? `${Math.round((stats.correct / stats.attempts) * 100)}%` : '—'
  const newInQueue = studyList.filter((x) => x.isNew).length
  const revInQueue = studyList.length - newInQueue

  // 底部常驻进度线(全场唯一计数)。
  const progress = status === 'ready' && steps.length
    ? { fill: (i + 1) / steps.length, label: `${i + 1} / ${steps.length}` }
    : status === 'study' && studyList.length
      ? { fill: (studyIdx + 1) / studyList.length, label: `Aperçu ${studyIdx + 1} / ${studyList.length}` }
      : null

  // 筛选行(只住扉页/空/结算屏 — 禁令 #3)。
  function renderFilters() {
    return (
      <div className="vpl-filters">
        <div className="vpl-filter-row">
          <span className="vpl-filter-key" lang="fr">Niveau</span>
          {DECK_LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              aria-pressed={level === l}
              className={`vpl-chip${level === l ? ' is-on' : ''}`}
            >
              {l === 'all' ? 'Tous' : l}
            </button>
          ))}
        </div>
        <div className="vpl-filter-row">
          <span className="vpl-filter-key" lang="fr">Thème</span>
          {/* 词库主题近 60 个,铺 chips 就是"混乱"雷区——收进一个发丝线下拉。 */}
          <select
            className="vpl-select"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            aria-label="主题筛选"
          >
            <option value="all">tous · 全部主题</option>
            {DECK_TAGS.filter((t) => t !== 'all').map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="vpl-filter-row">
          <span className="vpl-filter-key">选项</span>
          <button type="button" className={`vpl-chip${shuffle ? ' is-on' : ''}`} onClick={() => setShuffle((s) => !s)} aria-pressed={shuffle}>乱序</button>
          <button type="button" className="vpl-chip" onClick={handleExport}>导出</button>
          <button type="button" className="vpl-chip" onClick={() => fileInputRef.current?.click()}>导入</button>
          <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleImportFile} style={{ display: 'none' }} />
        </div>
        {importMsg ? <p className="vpl-msg">{importMsg}</p> : null}
      </div>
    )
  }

  function renderOptions() {
    return (
      <div className="vpl-options" role="listbox" aria-label="选项">
        {ex.options.map((opt, k) => {
          let cls = 'vpl-option'
          if (fb) {
            if (opt === ex.answer) cls += ' is-answer'
            else if (opt === picked) cls += ' is-picked-wrong'
            else cls += ' is-dim'
          }
          return (
            <button
              key={opt}
              type="button"
              className={cls}
              onClick={() => choose(opt)}
              disabled={fb}
              lang={ex.type === EXERCISE_TYPES.recognition ? undefined : 'fr'}
            >
              <span className="vpl-option-roman" aria-hidden="true">{ROMAN_OPT[k] || k + 1}</span>
              <span className="vpl-option-text">{opt}</span>
            </button>
          )
        })}
      </div>
    )
  }

  function renderFeedback() {
    if (!fb || !ex) return null
    const isMatch = ex.type === EXERCISE_TYPES.match
    const ok = isMatch || lastCorrect
    // recognition + build resolve to the exercise answer; the rest reveal the French headword.
    const correct = (ex.type === EXERCISE_TYPES.recognition || ex.type === EXERCISE_TYPES.build)
      ? ex.answer
      : (current.word?.french || ex.answer)
    const glossRaw = ex.type === EXERCISE_TYPES.build ? current.word?.exampleZh : current.word?.chinese
    const gloss = glossRaw === correct ? '' : glossRaw // 识别题答案本身就是中文,别重复一遍
    return (
      <div className={`vpl-fb ${ok ? 'is-ok' : 'is-no'}`}>
        <p className="vpl-fb-verdict">{isMatch ? 'Complet ✓ 配对完成' : ok ? 'Juste ✓ 答对' : 'Faux ✗ 答错'}</p>
        {!ok ? (
          <p className="vpl-fb-answer"><span lang="fr">{correct}</span>{gloss ? <span className="vpl-fb-gloss"> · {gloss}</span> : null}</p>
        ) : null}
        {!isMatch && current.word?.note ? <p className="vpl-fb-note">N.B. {current.word.note}</p> : null}
        <div className="vpl-fb-actions">
          <button type="button" className="mag-enter" onClick={next}>
            {i + 1 >= steps.length ? 'Terminer  →' : 'Continuer  →'}
          </button>
          {/* AI 退到具体对象之后:只在答错的这一刻,给一个带上下文的解释入口。 */}
          {!ok && current.word ? (
            <Link
              className="vpl-explain"
              to={`/assistant?term=${encodeURIComponent(current.word.french)}&answer=${encodeURIComponent(picked || input || '')}`}
            >
              Expliquer · 请助手解释
            </Link>
          ) : null}
        </div>
      </div>
    )
  }

  // 题版卡:左幅题干(眉头 + 大字),右幅交互(选项/输入/词块/配对)。
  function renderExercise() {
    const [kfr, kzh] = TYPE_KICKER[ex.type] || ['', '']
    const isChoice = ex.type === EXERCISE_TYPES.recognition || ex.type === EXERCISE_TYPES.cloze || ex.type === EXERCISE_TYPES.listen

    let stage = null
    let interaction = null

    if (ex.type === EXERCISE_TYPES.match) {
      stage = <p className="vpl-cue">点法语,再点对应的中文。</p>
      const flash = (side, id) => match.wrong.includes(`${side}${id}`)
      const tileClass = (side, c) => `vpl-tile${match.done.includes(c.id) ? ' is-done' : ''}${match.sel?.side === side && match.sel?.id === c.id ? ' is-sel' : ''}${flash(side, c.id) ? ' is-wrong' : ''}`
      interaction = (
        <div className="vpl-match">
          <div className="vpl-match-col">
            {ex.left.map((c) => (
              <button key={c.id} type="button" lang="fr" className={tileClass('L', c)} onClick={() => tapMatch('L', c.id)} disabled={match.done.includes(c.id)}>{c.text}</button>
            ))}
          </div>
          <div className="vpl-match-col">
            {ex.right.map((c) => (
              <button key={c.id} type="button" className={tileClass('R', c)} onClick={() => tapMatch('R', c.id)} disabled={match.done.includes(c.id)}>{c.text}</button>
            ))}
          </div>
        </div>
      )
    } else if (ex.type === EXERCISE_TYPES.recognition) {
      stage = (
        <>
          <p className="vpl-word" lang="fr">{ex.prompt}</p>
          <div className="vpl-word-meta">
            {posLong(current.word) ? <span lang="fr">{posLong(current.word)}</span> : null}
            <button type="button" className="vpl-listen" onClick={() => speak(current.word?.french)} lang="fr">Écouter ▷</button>
          </div>
        </>
      )
      interaction = renderOptions()
    } else if (ex.type === EXERCISE_TYPES.cloze) {
      stage = <p className="vpl-sentence" lang="fr">{ex.sentence}</p>
      interaction = renderOptions()
    } else if (ex.type === EXERCISE_TYPES.listen) {
      stage = (
        <button type="button" className="vpl-listen vpl-listen-lg" onClick={() => speak(ex.audioText)} lang="fr">
          Réécouter ▷
        </button>
      )
      interaction = renderOptions()
    } else if (ex.type === EXERCISE_TYPES.spelling) {
      stage = (
        <p className="vpl-cue vpl-cue-lg">
          {ex.prompt}
          {posLabel(current.word) ? <span className="vpl-cue-pos"> · {posLabel(current.word)}</span> : null}
        </p>
      )
      interaction = (
        <div className="vpl-write">
          <input
            ref={inputRef}
            className="vpl-input"
            lang="fr"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitSpelling() }}
            disabled={fb}
            placeholder="tapez le mot…"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="法语拼写输入"
          />
          {!fb ? (
            <button type="button" className="mag-enter vpl-verify" onClick={submitSpelling} lang="fr">Vérifier&nbsp;&nbsp;↵</button>
          ) : null}
        </div>
      )
    } else if (ex.type === EXERCISE_TYPES.build) {
      const map = Object.fromEntries(ex.bank.map((t) => [t.id, t.w]))
      stage = <p className="vpl-cue vpl-cue-lg">{current.word?.exampleZh}</p>
      interaction = (
        <div className="vpl-build">
          <div className="vpl-build-line" lang="fr">
            {chosen.length
              ? chosen.map((id) => (
                <button key={id} type="button" className="vpl-tile is-chosen" onClick={() => tapTile(id)} disabled={fb}>{map[id]}</button>
              ))
              : <span className="vpl-build-placeholder">点词块组句…</span>}
          </div>
          <div className="vpl-build-bank" lang="fr">
            {ex.bank.filter((t) => !chosen.includes(t.id)).map((t) => (
              <button key={t.id} type="button" className="vpl-tile" onClick={() => tapTile(t.id)} disabled={fb}>{t.w}</button>
            ))}
          </div>
          {!fb ? (
            <button type="button" className="mag-enter vpl-verify" onClick={submitBuild} disabled={!chosen.length} lang="fr">Vérifier&nbsp;&nbsp;↵</button>
          ) : null}
        </div>
      )
    }

    return (
      <div className={`vpl-card${isChoice || ex.type === EXERCISE_TYPES.match ? '' : ' vpl-card-narrow'}`} key={`ex-${i}`}>
        <div className="vpl-stagezone">
          <p className="vpl-kicker"><span lang="fr">{kfr}</span> · {kzh}</p>
          {stage}
        </div>
        <div className="vpl-divider" aria-hidden="true" />
        <div className="vpl-interzone">
          {interaction}
          {renderFeedback()}
        </div>
      </div>
    )
  }

  // 通知卡(未登录/加载/异常态)。
  function notice(children) {
    return <div className="vpl-card vpl-card-notice">{children}</div>
  }

  let body = null
  if (!user) {
    body = notice(
      <>
        <p className="vpl-kicker" lang="fr">Connexion requise</p>
        <p className="vpl-notice-text">背词进度按账号保存,请先登录。</p>
        <Link className="mag-enter" to="/login">Connexion&nbsp;&nbsp;→</Link>
      </>,
    )
  } else if (status === 'loading') {
    body = notice(<p className="vpl-notice-text">正在加载你的背词进度…</p>)
  } else if (status === 'disabled') {
    body = notice(<p className="vpl-notice-text">站点尚未配置 Supabase,背词功能暂不可用。</p>)
  } else if (status === 'compat') {
    body = notice(
      <p className="vpl-notice-text">背词数据表还没建立。请在 Supabase 执行 <code>setup_vocabulary.sql</code> 后再来。</p>,
    )
  } else if (status === 'error') {
    body = notice(
      <>
        <p className="vpl-notice-text">出错了:{errorMessage}</p>
        <button type="button" className="mag-enter" onClick={load}>Réessayer&nbsp;&nbsp;→</button>
      </>,
    )
  } else if (status === 'empty') {
    body = notice(
      <>
        <p className="vpl-notice-text">这个范围今天没有要背的词了。换个级别、主题,或明天再来。</p>
        {renderFilters()}
      </>,
    )
  } else if (status === 'idle') {
    body = (
      <div className="vpl-card vpl-card-idle" key="idle">
        <p className="vpl-kicker" lang="fr">Vocabulaire</p>
        <h1 className="vpl-title" lang="fr">Leçon du jour</h1>
        <p className="vpl-quota" lang="fr">{`Nouveaux ${newInQueue} · Révisions ${revInQueue}`}</p>
        {deckStats ? (
          <p className="vpl-deckstats">
            已掌握 {deckStats.mastered} · 学习中 {deckStats.learning} · 新词 {deckStats.newCount} · 连续 {deckStats.streak} 天
          </p>
        ) : null}
        {renderFilters()}
        <button type="button" className="mag-enter vpl-commencer" onClick={commencer} lang="fr">Commencer&nbsp;&nbsp;→</button>
      </div>
    )
  } else if (status === 'study' && studyList[studyIdx]) {
    const sw = studyList[studyIdx].word
    const last = studyIdx + 1 >= studyList.length
    body = (
      <div className="vpl-card vpl-card-study" key={`study-${studyIdx}`}>
        <div className="vpl-stagezone">
          <p className="vpl-kicker"><span lang="fr">Aperçu</span> · 先学一遍</p>
          <p className="vpl-word" lang="fr">{sw.french}</p>
          <div className="vpl-word-meta">
            {posLong(sw) ? <span lang="fr">{posLong(sw)}</span> : null}
            {sw.level ? <span>{sw.level}</span> : null}
            <button type="button" className="vpl-listen" onClick={() => speak(sw.french)} lang="fr">Écouter ▷</button>
          </div>
        </div>
        <div className="vpl-divider" aria-hidden="true" />
        <div className="vpl-interzone vpl-study-body">
          <p className="vpl-study-zh">{sw.chinese}</p>
          {sw.example ? <p className="vpl-study-example" lang="fr">{sw.example}</p> : null}
          {sw.exampleZh ? <p className="vpl-study-example-zh">{sw.exampleZh}</p> : null}
          {sw.note ? <p className="vpl-study-note">N.B. {sw.note}</p> : null}
          <div className="vpl-study-actions">
            <button type="button" className="mag-enter" onClick={studyNext} lang="fr">
              {last ? 'Commencer  →' : 'Suivant  →'}
            </button>
            <button type="button" className="vpl-chip" onClick={skipStudy}>跳过预习</button>
          </div>
        </div>
      </div>
    )
  } else if (status === 'ready' && current) {
    body = renderExercise()
  } else if (status === 'done') {
    body = (
      <div className="vpl-card vpl-card-done" key="done">
        <p className="vpl-kicker" lang="fr">Leçon terminée</p>
        <h1 className="vpl-title">本节完成</h1>
        <p className="vpl-done-score">答对 {stats.correct} / {stats.attempts} · 正确率 {acc} · 最高连击 ×{stats.maxCombo}</p>
        <div className="vpl-done-rule" aria-hidden="true" />
        {wrong.length ? (
          <>
            <p className="vpl-cue" lang="fr">À revoir · 需要复习</p>
            <div className="vpl-review">
              {wrong.map(({ word }) => (
                <div className="vpl-review-row" key={word.id}>
                  <span lang="fr">{word.french}</span>
                  <span className="vpl-review-zh">{word.chinese}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="vpl-cue">全部答对 —— 漂亮。</p>
        )}
        <div className="vpl-done-actions">
          {wrong.length ? <button type="button" className="mag-enter" onClick={retryWrong}>只练错词&nbsp;&nbsp;→</button> : null}
          <button type="button" className="mag-enter" onClick={load} lang="fr">Encore&nbsp;&nbsp;→</button>
        </div>
        {renderFilters()}
      </div>
    )
  }

  return (
    <main className={`vpl${arrive ? ' mag-arrive' : ''}`}>
      <nav className="vpl-nav" aria-label="页内导航">
        <button type="button" className="vpl-nav-back" onClick={goHome} lang="fr">← Accueil</button>
        <span className="vpl-nav-title" lang="fr">Vocabulaire</span>
        <span className="vpl-nav-side">{user ? 'Connecté · 已登录' : '未登录'}</span>
      </nav>
      <div className="vpl-stage">{body}</div>
      <footer className="vpl-foot" aria-hidden={!progress}>
        {progress ? (
          <>
            <div className="vpl-progress" role="progressbar" aria-label="本轮进度" aria-valuenow={Math.round(progress.fill * 100)} aria-valuemin={0} aria-valuemax={100}>
              <span className="vpl-progress-fill" style={{ width: `${Math.round(progress.fill * 100)}%` }} />
            </div>
            <span className="vpl-progress-label" lang="fr">{progress.label}</span>
          </>
        ) : null}
      </footer>
    </main>
  )
}
