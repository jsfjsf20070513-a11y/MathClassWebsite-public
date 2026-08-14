import { useState } from 'react'
import { paroles } from '../data/siteContent'

// Parole du jour — 每次到访随机取一句,让整个池子的广度随时间显现。
// 池内全部为有真实出处的引语(西文真句配中译;中文原典配法译),不收编造箴言。
// `offset` is accepted for backward compatibility but no longer used.
// eslint-disable-next-line no-unused-vars
export default function DailyMeditation({ offset = 0, className = '' }) {
  const [index] = useState(() => Math.floor(Math.random() * paroles.length))
  const entry = paroles[index]

  return (
    <aside className={['section-coda', className].filter(Boolean).join(' ')} aria-label="Parole du jour · 每日一句">
      <p className="section-coda-kicker"><span lang="fr">Parole du jour</span> · 每日一句</p>
      <p className="section-coda-quote" lang="fr">
        {entry.text}
      </p>
      <p className="section-coda-translation">{entry.note}</p>
      <p className="section-coda-author">
        — {entry.author}
        {entry.src ? <span className="section-coda-src"> · {entry.src}</span> : null}
      </p>
    </aside>
  )
}
