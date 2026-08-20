# Carnet de classe — 首页「杂志刊」设计规范 v2（交接 Claude Code）

对应设计稿：`Home-B-Galerie.dc.html`（首页杂志）+ `Interieur v2.dc.html`（内页：背词器「Planche 图版」/ Bibliothèque 图录跨页 / Assistant「Correspondance 书信体」+ 三屏移动端 + 移动端封面）。落选稿已删除。
肖像资产：`handoff/portraits.json`（60 条清单）+ `handoff/fetch-portraits.mjs`（下载脚本，复制进 `scripts/` 跑一次）。
目标仓库：mcw-mathclass（React 18 + Vite + React Router 7）。

## 0. 一句话概念

首页是一本 **5 页横翻的美术馆图录**：60 位数学家的黑白肖像长墙做封面，
花体小刊名 `Math` 居顶，内页每页一件事（词汇入口 / 每日定理 / 资源入口 / 每日一句），
翻页有方向编排，登录从 Parole 页中间"撕开"进入。

## 1. 路由与代码去留（有最高权限的裁定）

| 现状 | 裁定 |
|---|---|
| `src/pages/Home.jsx`（纵向滚动三段） | **整页重写**为杂志刊（本规范全部内容） |
| `src/components/Layout.jsx` 页眉/页脚 | **`/` 路由不再渲染页眉页脚**（杂志自带角落导航与 folio）；内页（/vocabulary /resources /login 等）暂保留现有 Layout，后续再统一 |
| `src/components/DailyMeditation.jsx` + `paroles`（siteContent） | **保留数据与随机逻辑**，渲染搬进杂志第 5 页（组件可删，逻辑内联） |
| 每日定理（dailyTheoremNotes.generated + theoremExplanations.generated + 上海日序轮换） | **原样保留**，渲染搬进第 3 页；Démonstration 折叠证明保留 |
| `src/pages/Vocabulary.jsx`（SRS 背词器） | **不动**。杂志第 2 页只是它的引导页 |
| `src/pages/Resources.jsx` / ResourceCurate | **不动**。第 4 页是引导页 |
| `src/pages/Login.jsx` / ResetPassword / auth 全套 | **保留**；登录转场采用**原地渲染**（Home 内嵌 Connexion 屏对接 useAuth），Login.jsx 保留给直链与 reset 流程并改成同一视觉 |
| `src/pages/Assistant.jsx` | 保留路由；不进杂志导航（入口仍在背词页内） |
| PageLoading / carnet_visited 首访加载 | 保留 |
| 天气 canvas（雨/雷/晴昼/晴夜） | 保留（§6）；**cloud 与 snow 两种模式删除**，真实天气为阴/雪时回落到 clear-day / clear-night |
| Layout 页脚的 Bibliothèque / Connexion 链接 | 删除（已被第 4/5 页吸收） |

## 2. 字体

- 花体刊名：**Pinyon Script**（Google Fonts）——封面顶部 `Math`，52px，酒红
- 眉头/细节/页码：**Bodoni Moda**（opsz 6..96 可变轴；大标题开 `'opsz' 96`）
- 正文衬线：**Cormorant Garamond**；中文：宋体族（正体，不斜）
- 数字一律 `font-variant-numeric: lining-nums tabular-nums`

## 3. 纸色分层（页页不同，逐页收深）

| 页 | 底色 | 备注 |
|---|---|---|
| 01 封面 | `#f4efe6` | 肖像墙 multiply 压其上 |
| 02 Vocabulaire | `#faf6ee` | 最亮 |
| 03 Théorème | `#fdfcf8` | 近白 |
| 04 Bibliothèque | `#f0eae0` | 中性暖灰（不偏黄） |
| 05 Parole | `#b9a58a` **山毛榉木色** | 奢侈品卡片质感 |
| 06 Connexion | `#f4efe6` | 与封面同纸 |

墨色：`#1a130e` / `#221d18`；灰墨 `#6f675e`；酒红 accent `#7d2f28`（hover `#7f302b`）；
发丝线 `rgba(34,29,24,0.18~0.22)`。
Parole 页专用：文字容器 `mix-blend-mode: multiply; color: rgba(20,13,7,0.96)`（墨吸进木纹的通透感），
辅助字 `#4a3a28`，发丝线 `rgba(46,34,20,0.4)`。

## 4. 封面（01）——肖像长墙

- **网格**：`grid-template-columns: repeat(12, 13.5svh)`，5 行 `minmax(0,1fr)`，gap 0，居中；
  总宽 162svh **有意溢出视口**，左右两列被截断 → 历史长河无限延伸感
- **60 位数学家**按生年从左上到右下（Pythagoras → Erdős，名单与顺序见设计稿 slot 顺序）
- 每格：`fit: cover`，白相纸边 `0.24vw solid #fdfbf6`，微投影，
  **统一黑白** `filter: grayscale(1) contrast(1.24) brightness(1.02)`
- 整墙 `mix-blend-mode: multiply; opacity: 0.74` 融进纸底
- **资产管线（重要，已备好交接件）**：设计稿现用 Wikimedia Special:FilePath 热链，60 张并发会被限流。
  生产必须**把图片入库**：`handoff/portraits.json`（60 条，name/slug/birthYear/sourceUrl/file，
  顺序即墙面年代序）+ `handoff/fetch-portraits.mjs`（顺序下载、限流退避、幂等跳过已存文件）
  → 复制进仓库 `scripts/` 跑一次 → 产出 `public/portraits/{slug}.jpg`（宽 ≤480），前端一律引本地路径。
  运行时兜底：`onerror` 隐藏 `<img>` 露出纸底格（白相纸边保留），**不做**热链回退重试
- 上下两条纸色渐隐带（高 13% / 17%）护住角落文字
- **顶部花体 `Math`**（Pinyon Script 52px `#7d2f28`，绝对定位顶中，宽度收进字形）
- 角落：左上 `ACCUEIL`、右上 `SUZHOU {temp}`（随天气换墨色，1.2s 过渡）
- 底部居中：`ÉDITION DU {date}`（弱化：10px, `rgba(111,103,94,0.75)`，两侧 64px 发丝线）

## 5. 内页

**02 Vocabulaire（引导页，非词表）**：左对齐编辑排版。发丝线通栏（右端页码 `02 — 05`）→
超大斜体 Bodoni `Vocabulaire`（`min(12.5vw,19svh)`，line 0.95）→ 底行左：法语引言
*Dire les mathématiques en français, un mot à la fois.*（Cormorant 斜体 17px）/ 右：`ENTRER →`
（Bodoni 大写 0.3em 字距 + 发丝下划线，hover 酒红）→ **router 跳 `/vocabulary`**。全页无汉字。

**03 Théorème**：保留现有每日定理契约——kicker `RAPPEL MATHÉMATIQUE`（酒红小字）、
定理题、prelude、KaTeX 公式、note、Démonstration 折叠双语分步证明（①②③）。居中 640px 栏。

**04 Bibliothèque**：居中索引——kicker `BIBLIOTHÈQUE` + `资源与书目` →
**真实八书架**两列罗马数字索引（数据 = `resourceCategories` 的 label，顺序 I–VIII：
数学分析与证明 / 高等代数与线性代数 / 概率、随机过程与数理统计 / 法语与双语过渡 /
法语数学与课程参照 / AI、机器学习与计算机视觉 / 优化、博弈与相关方法 / 计算、排印与写作）
→ `CONSULTER →` 跳 `/resources`；单行点击跳对应 `#shelf-N` 锚点。

**05 Parole**：木色卡片页。数据用 `paroles` 池随机（保留现有逻辑与出处规矩）。
kicker `PAROLE DU JOUR` → 斜体法语引文 21px → 中译 note → 24px 发丝线 → 作者·出处。
页脚仅 `Connexion · 登录`。

## 6. 天气系统（封面）

Open-Meteo（苏州 31.30,120.62），localStorage 缓存 3h（`mcw_weather_cache`）。
canvas 粒子：**雨**（尾迹雨丝+底缘涟漪+溅珠）、**雷**（双闪节奏+锯齿闪电）、
**晴昼**（暖金呼吸光晕）、**晴夜**（深蓝暮色+月光池）。全部 dt 驱动帧率无关。
**cloud/snow 已删**：weathercode 1–48 → clear（按昼夜），71–77 → clear。
入场契约：文字与天气一起淡入（1.1s），API 超 1.2s 兜底直显。
Édition/Suzhou 行墨色映射：rain `#5f6e7d` / thunder `#565a6e` / clear-day `#8a7350` / clear-night `#525f7d`。

## 7. 翻页与登录编排（好玩但克制）

页面栈：绝对定位互叠，`zIndex = 10 + i`，当前页 `translate(0)`，未到页停在各自入场侧。
过渡 `transform 0.9s cubic-bezier(0.72,0,0.22,1)`，`transform-origin: 50% 100%`。

- **入场方向**：02 从右（+105%, rotate 2.2°）/ 03 从左（−105%, −2.2°）/
  **04 从上落下**（−105%Y, 1.2°）/ **05 从下升起**（+105%Y, −1.2°）；投影方向随入场侧翻转
- 交互：← → 键、触控板/滚轮（deltaY>24 防抖 950ms）、触摸横滑 >56px、右下 ‹ › 按钮
- 左下 folio `0X — 05`
- **Connexion 撕开转场**：点 Parole 页脚 Connexion → 克隆 Parole 两半
  （`clip-path: inset(0 50% 0 0)` / `inset(0 0 0 50%)`，zIndex 60）→
  双半 `translateX(±58%) rotate(±1.6°)`，`0.62s cubic-bezier(0.45,0,0.12,1)` →
  露出底下 Connexion 屏 → **动画完成后 router 跳 `/login`**（或原地渲染登录，Claude Code 二选一，
  但视觉必须等同）。**Retour 反向合拢**（对称动画）。
  Connexion 屏：斜体 Bodoni `Connexion` 44px → 居中发丝线输入框（e-mail / mot de passe，
  focus 下划线变酒红）→ `ENTRER` → `← RETOUR`。对接现有 Supabase auth。

## 8. 内页设计（见 `Interieur v2.dc.html`，含逐屏批注）

- **/vocabulary 背词器「Planche 图版」**：保留 Vocabulary.jsx 全部逻辑（SRS 队列、6 题型轮换、
  CEFR/主题筛选、云端进度、发音、导入导出），整页重排为图版跨页：
  左幅 = 词的标本（Bodoni 斜体 118px 词 + 音标 + ÉCOUTER ▷ 下划线链 + 斜体例句 +
  数学家邮票 82×104 带题注，词↔人映射自 portraits 资产）；右幅 400px = NIVEAU·THÈME
  下划线选择器 + 罗马数字（Ⅰ–Ⅳ）发丝线选项行（选中反白墨块，编号转金 #c9a06a）；
  底部细线 = 今日进度（酒红填充比例）；页脚 Série/正确率 + 新词/复习配额
- **/resources Bibliothèque 图录跨页**：超大斜体 Bodoni 刊头（104px）→ 八架「守护人」肖像
  索引带（Ⅰ Cauchy / Ⅱ Noether / Ⅲ Kolmogorov / Ⅳ Descartes / Ⅴ Poincaré / Ⅵ Turing /
  Ⅶ von Neumann / Ⅷ Lovelace，74×94 邮票 + 数字 + 双行架名，点击滚到对应架）→
  书架双列排布、架后衬 190px 幽灵罗马数字（墨 5.5%）、条目带目录号 Ⅰ·01 + 外链↗ +
  酒红小标签 + 中文简介；数据源 resourceCatalog 不动；DailyMeditation coda 保留
- **/assistant「Correspondance 书信体」**：Q.（酒红斜体 40px）/ R.（墨色）悬挂初号字母 +
  64px 首列网格；答句挂发丝左线、①②③ 分步 + KaTeX 公式行；日期分隔线同封面 Édition 行；
  拍题照片渲染为「Figure n」编号图框（无 emoji，入口 = JOINDRE UNE FIGURE 文字链）；
  Worker/限流/云端历史不动；未登录整页替换为居中 Connexion 提示
- **移动端**：三屏（背词器/Bibliothèque/Assistant）均为桌面语言直接缩排，选项与条目行 ≥44px；
  Bibliothèque 守护人带横向滑动；封面墙 5 行不变、横向裁切更多列；触摸横滑翻页；粒子数减半

## 9. 验收清单

- [ ] 100svh 无纵向滚动；五页翻页四方向正确，回翻对称
- [ ] 60 张肖像全部本地资产、按年代序、统一黑白、墙左右溢出截断
- [ ] 花体 Math 不遮角落导航（宽度收进字形）
- [ ] 每日定理与现站同源同轮换；KaTeX 正常；证明折叠可用
- [ ] Parole 木色页文字 multiply 通透感保留；随机引语有出处
- [ ] 撕开/合拢登录转场 60fps；Connexion 原地渲染对接 useAuth；/login 直链与 reset-password 不断链
- [ ] /vocabulary /resources /assistant 换皮后原功能与数据源零回归（vitest 全绿）
- [ ] 天气四模式正确、阴/雪回落 clear；缓存与入场契约不变
- [ ] 移动端：墙列数随 svh 自适应截断更多列即可，翻页触摸可用；44px 命中区
