> ⛔ **已归档(2026-09-02)**:本文件是 2026-06-21 的旧契约,已被 `docs/design-constitution.md` 取代,勿照此执行。说明见同目录 `README.md`。

# START HERE —— 给 Claude Code 的第一条指令

你正在把一套**已完成的设计稿**落地进本仓库(React 18 + Vite 5)。设计稿不是参考,是**逐像素的硬契约**。

## 第 0 步:读规则,别跳过

1. 读 `design/HANDOFF.md` —— 开头的 **⛔ 铁律** 和 **✍️ 文案规范** 是红线,违反 = 返工。
2. 读 `design/spec/README.md` —— 了解全站定位与美学原则。

## 工作方式(必须遵守)

- **一次只做一页。** 顺序:Vocabulary → Home → Resources → Atelier → SolanaWitness → Login → NotFound → PageLoading → ResetPassword → ResourceCurate。
- **每页开工前**:先读 `design/spec/<页面>.md`,再在浏览器打开 `design/<页面>.dc.html` 对照着做。
- **每页做完**:用 `HANDOFF.md §10` 的验收清单逐条自检,再交人验收。**人验收通过前,不准开下一页。**
- **先视觉/交互 1:1,后接后端。** 所有页面视觉验收通过后,才做 SRS / 音频 / Supabase Auth / AI 助手(HANDOFF §3–§7)。

## 绝对禁止(踩过的坑)

- ❌ 自己另画一套、改布局、"优化"设计稿。
- ❌ 加设计稿里没有的页面/区块/按钮/内容。
- ❌ emoji / 渐变 / 圆角奶油盒子 / 新造颜色 / 设计系统外的样式。
- ❌ 英文 UI 文案、技术黑话(Cloudflare/PDA/devnet…)泄露给用户。
- ❌ 背词换成简单词 —— 必须 TCF/TEF/DELF B2–C1。
- ❌ 拿不准就猜 —— 拿不准就开 `.dc.html` 对照,或问人。

## 上线

走 `mathclass-dev-workflow`:开分支 → commit → PR → **等用户点名授权合并**(不自合)。部署走 `mathclass-deploy`,需用户新的点名授权。细节见 `HANDOFF.md §9`。

---

**现在开始:读 HANDOFF.md 和 spec/Vocabulary.md,打开 Vocabulary.dc.html,只做 Vocabulary 这一页的视觉与交互还原。做完用 §10 自检后停下,等我验收。**
