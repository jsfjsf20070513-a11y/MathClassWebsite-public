#!/usr/bin/env node
// 资源目录外链存活检查:HEAD(失败退 GET)逐条探测,输出分类报告。
import { resourceCategories } from '../src/data/resourceCatalog.js'

const entries = resourceCategories.flatMap((shelf) =>
  (shelf.items || []).map((it) => ({ shelf: shelf.label, title: it.title, url: it.url })),
)
console.log(`共 ${entries.length} 条外链`)
const results = { ok: 0, redirect: [], broken: [], error: [] }
for (const e of entries) {
  if (!e.url) continue
  try {
    let res = await fetch(e.url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000) })
    if (res.status === 405 || res.status === 403) {
      res = await fetch(e.url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(20000) })
    }
    if (res.ok) results.ok += 1
    else if (res.status >= 400) results.broken.push(`${res.status} ${e.shelf} · ${e.title} · ${e.url}`)
  } catch (err) {
    results.error.push(`${err.name} ${e.shelf} · ${e.title} · ${e.url}`)
  }
  await new Promise((r) => setTimeout(r, 300))
}
console.log(`存活 ${results.ok}`)
console.log(`HTTP 4xx/5xx(${results.broken.length}):`)
results.broken.forEach((l) => console.log('  ' + l))
console.log(`网络异常(${results.error.length}):`)
results.error.forEach((l) => console.log('  ' + l))
