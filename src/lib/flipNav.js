// 站内翻页衔接标记(宪法 §4)。离开页在 navigate 前 markFlipNav(),
// 到达页与 App 的加载幕在挂载时用 wasFlipNav() 判断:
// - App 跳过 PageLoading 白幕(首次进站不受影响);
// - 到达页播放翻入动画,让"出场翻页 → 入场翻页"读作同一个动作。
// 标记 1.5s 自动过期,非破坏性读取——两个消费者都能看到同一次导航。

let flipAt = 0

export function markFlipNav() {
  flipAt = Date.now()
}

export function wasFlipNav() {
  return Date.now() - flipAt < 1500
}
