import { useEffect, useMemo, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DailyMeditation from '../components/DailyMeditation'
import { externalLinkProps } from '../lib/safeUrl'
import { resourceCategories } from '../data/resourceCatalog'
import { useResourceCatalog } from '../hooks/useResourceCatalog'
import { getResourceLead } from '../lib/resourceText'
import { usePageFlip } from '../hooks/usePageFlip'
import { markFlipNav, wasFlipNav } from '../lib/flipNav'

// 书目 Resources — 2026-08 编排版「一册图录」(宪法 §5.3):
// 第一停 = 斜体大刊头 + 罗马数字索引;之后一架一页(Ⅰ–Ⅷ),轻翻,
// 翻入时条目逐条错开淡入;架内容超一屏走页内滚动优先。
// 条目 = 标题外链 + 酒红小标签 + 中文简介一行;数据源 resourceCatalog 不动。
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
const toRoman = (n) => ROMAN[n] || `${n + 1}`

function buildShelfOrder(catalogItems) {
  const preferred = resourceCategories.map((category) => category.label)
  const extras = Array.from(
    new Set(
      catalogItems
        .map((item) => item.category)
        .filter((category) => category && !preferred.includes(category)),
    ),
  ).sort((a, b) => a.localeCompare(b, 'zh-CN'))

  return [...preferred, ...extras]
}

export default function Resources() {
  const navigate = useNavigate()
  const { catalogItems } = useResourceCatalog()
  const [arrive] = useState(() => wasFlipNav())

  const shelves = useMemo(() => {
    const introByCategory = new Map(
      resourceCategories.map((category) => [category.label, category.intro]),
    )

    return buildShelfOrder(catalogItems)
      .map((category) => ({
        title: category,
        intro: introByCategory.get(category) || '',
        items: catalogItems.filter((item) => item.category === category),
      }))
      .filter((shelf) => shelf.items.length)
  }, [catalogItems])

  // 页面栈:0 = 索引,1..n = 书架;书架轻翻(0.5s),索引 → 首架同参。
  const pageCount = shelves.length + 1
  const sides = useMemo(() => ['none', ...shelves.map(() => 'right')], [shelves])
  const { page, next, prev, goTo, setPageEl } = usePageFlip({
    count: pageCount,
    sides,
    durationMs: 500,
  })

  // 支持 /resources#shelf-N 直达(Home 第 4 页索引行点击进来)。
  useEffect(() => {
    const m = window.location.hash.match(/^#shelf-(\d+)$/)
    if (!m) return
    const idx = Number(m[1])
    if (idx >= 1 && idx <= shelves.length) {
      const t = window.setTimeout(() => goTo(idx), 60)
      return () => window.clearTimeout(t)
    }
    return undefined
  }, [shelves.length, goTo])

  const goHome = useCallback(() => {
    markFlipNav()
    navigate('/')
  }, [navigate])

  const folio = page === 0
    ? 'Index'
    : `${toRoman(page - 1)} — ${toRoman(shelves.length - 1)}`

  return (
    <main className={`bib${arrive ? ' mag-arrive' : ''}`}>
      <nav className="vpl-nav" aria-label="页内导航">
        <button type="button" className="vpl-nav-back" onClick={goHome} lang="fr">← Accueil</button>
        <span className="vpl-nav-title" lang="fr">Bibliothèque</span>
        <span className="vpl-nav-side" lang="fr">{catalogItems.length}&nbsp;entrées</span>
      </nav>

      <div className="bib-stack">
        {/* ── 第一停:刊头 + 索引 ── */}
        <section ref={setPageEl(0)} className="bib-page bib-index" style={{ zIndex: 10 }} aria-label="索引">
          <div className="bib-index-inner">
            <p className="vpl-kicker" data-animate="">Ressources &amp; bibliographie · 资源与书目</p>
            <h1 className="bib-masthead" lang="fr" data-animate="">Bibliothèque</h1>
            <p className="bib-quote" lang="fr" data-animate="">Classer n&apos;est pas clore ; c&apos;est laisser les chemins demeurer lisibles.</p>
            <div className="mag-biblio-grid bib-index-grid" data-animate="">
              {shelves.map((shelf, index) => (
                <button
                  key={shelf.title}
                  type="button"
                  className="mag-biblio-row"
                  onClick={() => goTo(index + 1)}
                >
                  <span className="mag-biblio-roman">{toRoman(index)}</span>
                  <span className="mag-biblio-label">{shelf.title}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── 一架一页 ── */}
        {shelves.map((shelf, index) => (
          <section
            key={shelf.title}
            ref={setPageEl(index + 1)}
            className="bib-page bib-shelf"
            style={{ zIndex: 11 + index, transform: 'translateX(105%) rotate(2.2deg)' }}
            aria-label={shelf.title}
          >
            <div className="bib-scroll" data-flip-scroll="">
              <div className="bib-shelf-inner">
                <div className="bib-shelf-head" data-animate="">
                  <span className="bib-shelf-roman">{toRoman(index)}</span>
                  <h2 className="bib-shelf-title">{shelf.title}</h2>
                  <span className="bib-shelf-count">{shelf.items.length}</span>
                </div>
                {shelf.intro ? <p className="bib-shelf-intro" data-animate="">{shelf.intro}</p> : null}
                <ol className="bib-entries">
                  {shelf.items.map((item) => {
                    const lead = getResourceLead(item)
                    return (
                      <li key={item.id} className="bib-entry" data-animate="">
                        <div className="bib-entry-row">
                          <a {...externalLinkProps(item.url)} className="bib-entry-title">{item.title}&nbsp;↗</a>
                          {item.tag ? <span className="bib-entry-tag">{item.tag}</span> : null}
                        </div>
                        {lead ? <p className="bib-entry-desc">{lead}</p> : null}
                      </li>
                    )
                  })}
                </ol>
                {index === shelves.length - 1 ? (
                  <div className="bib-coda" data-animate="">
                    <DailyMeditation offset={8} />
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="mag-folio bib-folio" aria-hidden="true">{folio}</div>
      <div className="mag-controls">
        <button type="button" onClick={prev} aria-label="上一页" className="mag-arrow" disabled={page === 0}>‹</button>
        <button type="button" onClick={next} aria-label="下一页" className="mag-arrow is-next" disabled={page === pageCount - 1}>›</button>
      </div>
    </main>
  )
}
