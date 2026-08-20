import { useCallback, useEffect, useRef, useState } from 'react'

// 共用翻页物理(宪法 §4)——Home 与内页同一套参数,不许各页自造。
// 页面栈:绝对定位互叠,zIndex = 10 + i;已到页 translate(0),未到页停在各自入场侧。
// 交互:← → 键、滚轮(|deltaY|>24 防抖 950ms)、触摸横滑 >56px。
// 页内滚动优先:当前页内 [data-flip-scroll] 未滚到边缘时,滚轮不翻页。
// prefers-reduced-motion:翻页降级为淡入淡出(transform 直落,过渡只走 opacity)。

const PARKED = {
  right: 'translateX(105%) rotate(2.2deg)',
  left: 'translateX(-105%) rotate(-2.2deg)',
  top: 'translateY(-105%) rotate(1.2deg)',
  bottom: 'translateY(105%) rotate(-1.2deg)',
}
const SHADOW = {
  right: '-40px 0 80px rgba(23,16,12,0.10)',
  left: '40px 0 80px rgba(23,16,12,0.10)',
  top: '0 40px 80px rgba(23,16,12,0.10)',
  bottom: '0 -40px 80px rgba(23,16,12,0.10)',
  none: '-40px 0 80px rgba(23,16,12,0.10)',
}

export const FLIP_EASE = 'cubic-bezier(0.72, 0, 0.22, 1)'

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function usePageFlip({ count, sides = [], durationMs = 900, enabled = true }) {
  const [page, setPage] = useState(0)
  const pagesRef = useRef([])
  const pageStateRef = useRef(0)
  const appliedPageRef = useRef(-1)
  const instantRef = useRef(true)
  const wheelLockRef = useRef(0)
  const touchRef = useRef(null)
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const setPageEl = useCallback((index) => (el) => {
    pagesRef.current[index] = el
  }, [])

  const apply = useCallback((cur, instant) => {
    const reduced = prefersReducedMotion()
    // 数据加载等原因导致的重跑不算翻页:只有页码真变才重播进场编排。
    const changed = appliedPageRef.current !== cur
    appliedPageRef.current = cur
    pagesRef.current.forEach((el, i) => {
      if (!el) return
      const side = sides[i] || 'right'
      el.style.zIndex = String(10 + i)
      el.style.pointerEvents = i === cur ? 'auto' : 'none'
      el.style.transformOrigin = '50% 100%'
      // 停靠在场外的页不带投影——多页叠停时投影会在页缘穿帮。
      el.style.boxShadow = i <= cur ? (SHADOW[side] || SHADOW.none) : 'none'
      if (reduced) {
        el.style.transition = instant ? 'none' : 'opacity 0.3s ease'
        el.style.transform = 'none'
        el.style.opacity = i === cur ? '1' : i < cur ? '1' : '0'
      } else {
        el.style.transition = instant ? 'none' : `transform ${durationMs}ms ${FLIP_EASE}`
        el.style.opacity = ''
        el.style.transform = i <= cur || side === 'none'
          ? 'translate(0, 0) rotate(0deg)'
          : PARKED[side] || PARKED.right
      }
      // 进场编排:刚成为当前页的内容逐件错开淡入(0.7s,起点 0.35s,步进 0.12s)。
      const items = el.querySelectorAll('[data-animate]')
      if (i === cur) {
        if (!changed) return // 页码没变的重跑:别打断正在播/已播完的进场
        if (instant || reduced) {
          items.forEach((it) => {
            it.style.animation = 'none'
            it.style.opacity = '1'
          })
        } else {
          items.forEach((it, k) => {
            it.style.animation = 'none'
            it.style.opacity = '0'
            requestAnimationFrame(() => {
              it.style.animation = `magFadeIn 0.7s ${0.35 + k * 0.12}s cubic-bezier(0.22, 1, 0.36, 1) both`
            })
          })
        }
      } else {
        items.forEach((it) => {
          it.style.animation = 'none'
          it.style.opacity = i < cur ? '1' : '0'
        })
      }
    })
  }, [sides, durationMs])

  const goTo = useCallback((idx) => {
    const max = count - 1
    const next = Math.max(0, Math.min(max, idx))
    if (next === pageStateRef.current) return
    pageStateRef.current = next
    setPage(next)
  }, [count])

  useEffect(() => {
    apply(page, instantRef.current)
    instantRef.current = false
  }, [page, apply])

  useEffect(() => {
    const inField = (target) => {
      const tag = target?.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable
    }
    const onKey = (e) => {
      if (!enabledRef.current || inField(e.target)) return
      if (e.key === 'ArrowRight') goTo(pageStateRef.current + 1)
      else if (e.key === 'ArrowLeft') goTo(pageStateRef.current - 1)
    }
    const onWheel = (e) => {
      if (!enabledRef.current) return
      const now = Date.now()
      if (now < wheelLockRef.current) return
      if (Math.abs(e.deltaY) < 24) return
      // 页内滚动优先:滚到边缘才翻页。
      const el = pagesRef.current[pageStateRef.current]
      const scroller = el?.querySelector('[data-flip-scroll]')
      if (scroller && scroller.scrollHeight > scroller.clientHeight + 1) {
        const atTop = scroller.scrollTop <= 0
        const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1
        if ((e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop)) return
      }
      wheelLockRef.current = now + 950
      goTo(pageStateRef.current + (e.deltaY > 0 ? 1 : -1))
    }
    const onTouchStart = (e) => {
      touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    const onTouchEnd = (e) => {
      if (!enabledRef.current || !touchRef.current) return
      const dx = e.changedTouches[0].clientX - touchRef.current.x
      const dy = e.changedTouches[0].clientY - touchRef.current.y
      touchRef.current = null
      if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy)) {
        goTo(pageStateRef.current + (dx < 0 ? 1 : -1))
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [goTo])

  const next = useCallback(() => goTo(pageStateRef.current + 1), [goTo])
  const prev = useCallback(() => goTo(pageStateRef.current - 1), [goTo])

  // 出场翻页(跨路由衔接的前半个动作):当前页向 exit 侧翻出,~0.45s 后回调。
  const flipOut = useCallback((onDone, exitSide = 'left') => {
    const el = pagesRef.current[pageStateRef.current]
    if (!el || prefersReducedMotion()) {
      onDone()
      return
    }
    el.style.transition = `transform 450ms ${FLIP_EASE}, opacity 450ms ease`
    el.style.transform = PARKED[exitSide] || PARKED.left
    window.setTimeout(onDone, 430)
  }, [])

  return { page, goTo, next, prev, setPageEl, flipOut }
}
