import DailyMeditation from '../components/DailyMeditation'
import { dailyTheoremNotes } from '../data/dailyTheoremNotes.generated'
import { explanationsCredit, theoremExplanations } from '../data/theoremExplanations.generated'

const DAY_IN_MS = 24 * 60 * 60 * 1000
const THEOREM_ROTATION_START_DAY = Math.floor(Date.UTC(2025, 8, 1) / DAY_IN_MS)

function getShanghaiDaySerial(reference = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(reference)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, Number(value)]),
  )

  return Math.floor(Date.UTC(parts.year, parts.month - 1, parts.day) / DAY_IN_MS)
}

function getRotatingTheoremIndex(length) {
  if (!length) {
    return 0
  }

  const dayOffset = getShanghaiDaySerial() - THEOREM_ROTATION_START_DAY
  return ((dayOffset % length) + length) % length
}

function getEditionDateLabel() {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
}

// 汉字纪年日期(二〇二六年八月十三日)——刊头的中文声部。
const CN_NUM = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九']
function getChineseDateLabel(reference = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: 'numeric', day: 'numeric' })
      .formatToParts(reference)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, Number(value)]),
  )
  const year = String(parts.year).split('').map((c) => CN_NUM[Number(c)]).join('')
  const month = parts.month <= 10 ? (parts.month === 10 ? '十' : CN_NUM[parts.month]) : `十${CN_NUM[parts.month % 10]}`
  const d = parts.day
  const day = d <= 10
    ? (d === 10 ? '十' : CN_NUM[d])
    : d < 20
      ? `十${CN_NUM[d % 10]}`
      : `${CN_NUM[Math.floor(d / 10)]}十${d % 10 ? CN_NUM[d % 10] : ''}`
  return `${year}年${month}月${day}日`
}

// 扉页 Home — 2026-08 减法后的契约:封面三行(题名/法语副题/日期)→
// 每日定理(KaTeX + 折叠证明)→ 每日哲思 → 细页脚。每屏一件事,不再有
// 学院名 kicker 与朗读器。
export default function Home() {
  const dailyTheorem = dailyTheoremNotes[getRotatingTheoremIndex(dailyTheoremNotes.length)]
  const editionDateLabel = getEditionDateLabel()
  const chineseDateLabel = getChineseDateLabel()
  const proof = theoremExplanations[dailyTheorem.title]

  return (
    <article className="page-column home-page">
      <header className="home-cover">
        <h1 className="home-cover-title">2025 级数学班</h1>
        <p className="home-cover-subtitle" lang="fr">Trente mathématiciens, une classe.</p>
        <p className="home-cover-edition">
          <span>{chineseDateLabel}</span>
          <span aria-hidden="true"> · </span>
          <span lang="fr">{`Édition du ${editionDateLabel}`}</span>
        </p>
      </header>

      <section className="home-theorem" aria-label="每日定理">
        <p className="home-theorem-kicker"><span lang="fr">Rappel mathématique</span> · 每日定理</p>
        <h2 className="home-theorem-title">{dailyTheorem.title}</h2>
        <p className="home-theorem-prelude">{dailyTheorem.prelude}</p>
        <div
          className="home-theorem-formula"
          dangerouslySetInnerHTML={{ __html: dailyTheorem.displayHtml || dailyTheorem.fallback }}
        />
        <p className="home-theorem-note">{dailyTheorem.note}</p>
        {proof ? (
          <details className="home-proof">
            <summary>
              <span className="home-proof-mark" aria-hidden="true" />
              <span className="site-nav-fr" lang="fr">Démonstration</span>
              <span aria-hidden="true"> · </span>
              <span>证明思路</span>
            </summary>
            <div className="home-proof-body">
              <div className="theorem-explanation-block">
                <p className="theorem-explanation-lang" aria-hidden="true">中文</p>
                <ol className="home-proof-steps">
                  {(Array.isArray(proof.zh) ? proof.zh : [proof.zh]).map((step, idx) => (
                    <li key={idx} dangerouslySetInnerHTML={{ __html: step }} />
                  ))}
                </ol>
              </div>
              <div className="theorem-explanation-block">
                <p className="theorem-explanation-lang" aria-hidden="true">Français</p>
                <ol className="home-proof-steps" lang="fr">
                  {(Array.isArray(proof.fr) ? proof.fr : [proof.fr]).map((step, idx) => (
                    <li key={idx} dangerouslySetInnerHTML={{ __html: step }} />
                  ))}
                </ol>
              </div>
              <p className="home-proof-credit">Bilingual reasoning by {explanationsCredit.generator}</p>
            </div>
          </details>
        ) : null}
      </section>

      <section className="home-meditation">
        <DailyMeditation offset={0} />
      </section>
    </article>
  )
}
