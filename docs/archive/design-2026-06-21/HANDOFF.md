> ⛔ **已归档(2026-09-02)**:本文件是 2026-06-21 的旧契约,已被 `docs/design-constitution.md` 取代,勿照此执行。说明见同目录 `README.md`。

# 交接:数学班网站 UI 重做 → 工程落地

## ⛔ 铁律(违反任何一条 = 返工,不接受)

1. **`*.dc.html` 是逐像素的硬契约,不是「参考」。** 动手前**逐个用浏览器打开**对应原型,照着做;做完**并排对照**,不一致就改到一致。
2. **照抄,不要重设计。** 布局、结构、间距、字号、颜色、字体、文案、交互顺序 —— 全部以原型为准。**不准**自己另画一套、不准「优化」、不准换布局。
3. **不准凭空加内容。** 没有出现在原型里的页面、区块、按钮、统计、图标、说明文字 —— **一律不加**。觉得该加,先问人。
4. **禁止设计系统以外的样式。** 只用 §0 的变量与类(`--accent #8b0000`、`--ink`、`--muted`、`--paper`、`--rule`、`--ok #3f7a4e`;EB Garamond / Noto Serif SC / JetBrains Mono)。**零** emoji、**零**渐变、**零**圆角奶油盒子、**零**新造颜色。原型里没有的视觉,你也不准有。
5. **交互一个都不能少、不能改。** 能点/翻/判分/连击/听写的,真实页必须一模一样;键盘快捷键、自动聚焦、绿红 + ✓/✗ 反馈、提示音 —— 全保留。
6. **拿不准就开原型对照,或问人。** 不要猜,不要发挥。

> 移植方式:把原型的内联样式先**逐字搬过去保证像素一致**,跑通后再把可复用部分抽进 `src/App.css` 现有类 —— 抽取**只能保持值不变**,不是借机重写。

---

## ✍️ 文案规范(移植时严格照此,别混回英文)

**双语格式:`中文 · Français`(中文在前,中点 ` · ` 分隔,法语在后)。**
- 导航 / 报头眼标 / 按钮 / 表单标签 一律走这个格式;眼标(eyebrow)可纯法语大写(如 `AUTHENTIFICATION`)。
- 页面 h1 标题用中文;法语作副标题/斜体引文。
- 表单标签照原型:真实姓名 · Nom / 昵称 · Pseudo / 邮箱 · E-mail / 手机号 · Téléphone / 密码 · Mot de passe / 确认密码 · Confirmer / 验证码 · Code。
- 按钮照原型:登录 · Connexion / 注册 · Créer un compte / 发送验证码 · Envoyer le code / 发送重置链接 · Envoyer le lien / 重新发送 · Renvoyer。

**禁止项:**
- ❌ **零英文 UI 文案。** 不准出现 `Sign in / Email / Password / Resend / Submit` 等英文标签 —— 全部用「中文 · Français」。(背词的法语沉浸式题面除外,那是教学内容。)
- ❌ **零技术黑话泄露给用户。** 不准把 `Cloudflare Worker / PDA / devnet / memo / Anchor / Supabase / RLS` 等写进用户可见文案。寄语墙已把这些翻译成人话(永久保存 / 公开可见 / 不可篡改 / 凭证 / 核验),照搬,别还原成黑话。
- ❌ **零生僻字 / 乱码。** 中文用通用字,移植后通读一遍,任何方块字/乱码立即修。
- ❌ **中英混搭 + 半角标点。** 别写「在席:林同学」这种,用「已登录 · 林同学」。

**标点:** 中文句内用半角逗号 `,`(本站既定风格,保持一致,别改全角);法语引号用 `« … »`;分隔符统一 ` · `(两侧各一空格)。
> 目标仓库:`MathClassWebsite-public`(React 18 + Vite 5)。

---

## 0. 设计系统(必须遵守,别造新样式)

CSS 变量(`src/index.css :root`):
- `--accent:#8b0000`(暗红,强调/正确/数字)· `--ink:#1a1a1a`(正文)· `--muted:#6b6b6b`(次要)
- `--paper:#fdfcf8`(背景)· `--rule:rgba(26,26,26,.14)`(细线)
- **新增建议**:`--ok:#3f7a4e`(反馈绿,原型已用,请正式定义为变量)

字体:EB Garamond(衬线正文)· Noto Serif SC / 思源宋体(中文标题)· JetBrains Mono(等宽/keycap/数字)。

复用类:`.text-button`(无底色、下划线、暗红→hover 墨色;`.subtle` 灰、`.active` 暗红)·
`.editorial-actions(.tabs)` · `.daily-entry-kicker` · `.daily-entry-meta` ·
`.theorem-explanation-block` + `.theorem-explanation-lang` · `.section-title`。

美学红线:细线分隔 + 留白(不是盒子)· 零 emoji · 暗红只做强调 · 衬线大字做焦点 · 反馈用绿/红双色 + ✓/✗ 符号(不能只靠颜色)。

---

## 1. 原型 → 真实文件映射

| 原型 (.dc.html) | 真实文件 | 路由 | 说明 |
|---|---|---|---|
| `Home.dc.html` | `src/pages/Home.jsx` | `/` | 封面 → 每日定理(KaTeX+折叠证明)→ 一句冥想 → 细页脚。删掉旧课表/图版铺陈。 |
| `Resources.dc.html` | `src/pages/Resources.jsx` | `/resources` | BIBLIOTHÈQUE 报头 + 编号书架 I–VIII。数据用 `src/data/resourceCatalog.js`。删掉 Appendix。 |
| `Vocabulary.dc.html` | `src/pages/Vocabulary.jsx` | `/vocabulary` | **重点**:多题型背词器(见 §3)。逻辑必须接真实 SRS。 |
| `Atelier.dc.html` | `src/pages/ManageHub.jsx` | `/atelier`(原 `/manage`?) | 共建:① 班级寄语墙入口 ② 资源增补。AI 助手作「即将·登录可用」预告。 |
| `SolanaWitness.dc.html` | `src/pages/SolanaWitness.jsx` | `/witness`(原 `/hackathon` 系) | 「班级寄语墙」。链上逻辑保留,文案已人情化。 |
| `Login.dc.html` | `src/pages/Login.jsx` | `/login` | 登录/注册/验证码/找回 四态 + 邮箱/手机。价值=背词同步+AI 助手。 |
| `NotFound.dc.html` | `src/pages/NotFound.jsx` | `*` | 404 + 三个出口链接。 |
| `PageLoading.dc.html` | `src/components/PageLoading.jsx` | 路由切换/启动 | 碩卷式加载页:法语斜体 + 中文 + 细扫光进度线,按页轮换。删掉旧版发光球/渐变/调色板。 |
| `ResetPassword.dc.html` | `src/pages/ResetPassword.jsx` | `/reset-password` | 设置新密码:表单 / 成功 / 链接失效 三态。 |
| `ResourceCurate.dc.html` | `src/pages/ResourceCurate.jsx` | `/resources/curate` | 资源增补提交表单(标题/链接/书架/理由)→ 待审。 |

**导航(`src/components/Layout.jsx` 的 `navItems`)统一为四项:**
`Accueil·扉页` · `Ressources·资源` · `Vocabulaire·背词` · `Atelier·协作`。

---

## 2. 路由与清理(先做,低风险)

- [ ] 删除路由与页面:`/gallery`、`/album/*`、`Gallery.jsx`、`AlbumDetail.jsx`、`GalleryContribute.jsx`(图版已下线,涉及同学人脸)。
- [ ] 删除 `HackathonShowcase.jsx`、`Web3StudentProfile.jsx`(黑客松陈列页已撤;原型对应文件已删)。
- [ ] `SolanaWitness` 从 `/hackathon` 系迁到协作之下,导航不暴露「黑客松」。
- [ ] `Layout.jsx` 的 `navItems` 改成上面四项;`Home.jsx` 页脚 + 各页页脚加「班级寄语墙 →」链接。
- [ ] 全局删除原型里的 `onClick="{{ noop }}"` 假链接,换成真 `<Link to>`。

### 2.1 删除这些边角页(已确认,连路由一起砍)
- [ ] `ResourceDetail.jsx`（`/resources/:id` 资源详情）—— 资源页直接外链即可,详情页多余。
- [ ] `MaterialsDesk.jsx`（`/atelier/materials` 材料桌)—— 旧协作残留,协作已收敛成「寄语墙 + 资源增补」。
- [ ] `ModerationCenter.jsx`（`/atelier/review` 审核中心)—— 同上,旧协作残留,删。
- [ ] 删除对应路由、导航/页内入口、以及只被它们引用的数据与组件(确认无其他引用再删)。

### 2.2 保留并补设计(流程需要)
- `ResetPassword.jsx`（`/reset-password`)—— 登录「找回密码」点完邮件链接的落地页。**已设计**:`ResetPassword.dc.html` + `spec/ResetPassword.md`。
- `ResourceCurate.jsx`（`/resources/curate`）—— 协作「资源增补」入口的提交表单页。**已设计**:`ResourceCurate.dc.html` + `spec/ResourceCurate.md`。

---

## 3. 背词器(Vocabulary)—— 最大的一块

原型是**多邻国/百词斩式六题型**轮换,UI/交互是契约,**判分与调度要接真实逻辑**:

题型:① 配对 ② 认词(看法→选中) ③ 词块拼句 ④ 例句填空 ⑤ 听写 ⑥ 拼写(中→打法)。
共享:绿/红反馈横幅(✓/✗ + 正确答案)、连击计数、错词进复习、键盘 1–4 / 回车、输入自动聚焦、WebAudio 提示音。

**要接的真实逻辑(`src/lib/` 已有,逐字保留其纯逻辑):**
- [ ] `srsScheduler.js` —— 按到期日动态组卷,而非原型里的固定轮换;错词进「重学」队列跨天回考。
- [ ] `vocabularyBackend.js` / `vocabularyProgress.js` —— 进度按账号存 Supabase `review_states` 表。
- [ ] 词库:原型 18 条是 TCF/TEF/DELF B2–C1 **种子**,接真实词库数据源。
- [ ] **听写音频**:原型用浏览器 `speechSynthesis`(设备音质不稳)。改用 **ElevenLabs 预生成 mp3**(你 roadmap 已有,key 只在构建期,不进产物)。
- [ ] 题型生成的干扰项:优先取相同词性/相近长度,难度更合理。
- [ ] WebAudio 提示音需用户首次交互后 `resume()`,确保首次答题能出声。
- [ ] 状态要全:loading / ready / disabled / compat / empty / error / done + 未登录。
- [ ] `npm run lint && npm test && npm run build` 三连绿(94 个单测不能破)。

---

## 4. 登录(Login)的存在理由

价值已定:**跨设备同步背词进度 + 班级 AI 助手(即将)**。不再提「协作工作台」。
- [ ] 接 Supabase Auth(仅 anon key + RLS,前端无 service-role key)。
- [ ] 表单即时校验:邮箱格式、密码强度、两次密码一致、手机号 11 位。
- [ ] 验证码登录 60s 倒计时 + 重新发送禁用态。
- [ ] 窄屏四个模式 tab 改下拉 select(原型是 flex-wrap)。
- [ ] 登录成功给去向选择(去背词 / 去寄语墙),别默认跳首页。

---

## 5. 班级 AI 助手(新功能,登录后可用)

这是登录价值的另一半,roadmap 里有依据(Cloudflare Worker 代理 Anthropic key)。
- [ ] Cloudflare Worker 代理 Anthropic,key 不进前端产物。
- [ ] 双语数学答疑:可就任意定理 / 法语词条提问。
- [ ] 仅登录用户可用;协作页已有「即将·登录可用」预告位。
- [ ] UI 沿用碩卷调性(衬线、细线、暗红),零卡通色 / emoji。

---

## 6. 班级寄语墙(SolanaWitness)真实化

文案已从区块链黑话翻译成人话(标题=班级寄语墙,技术降为脚注)。要补的工程:
- [ ] 真实链上三态:提交中 / 失败 / 成功;钱包未安装时给「装 Phantom」引导(原型已有静态版)。
- [ ] 留言列表按时间倒序 + 分页;可选「只读浏览」(不连钱包也能看)。
- [ ] 字数限制按字符(原型 80 字),实时计数。
- [ ] 可选署名 / 匿名。

---

## 7. 资源增补(Atelier)真实化

- [ ] 「资源增补」入口接真实提交表单(标题 + 链接 + 理由)→ 审核 → 并入 `resourceCatalog.js`。
- [ ] `resourceCatalog.js` 做成单一数据源,页面只渲染。
- [ ] 77 条外链:`rel="noopener noreferrer"` 全量检查 + CI 死链检测。

---

## 8. 工程 / 性能 / 无障碍(上线前)

- [ ] **字体自托管** + `font-display:swap`(现在 Google Fonts 外链,首屏会 FOUT)。
- [ ] **KaTeX** 首页只用一个公式 —— 改 `renderToString` 构建期预渲染,运行时不加载 KaTeX JS。
- [ ] localStorage 背词进度加 schema 版本号,便于将来迁移。
- [ ] 移植时把原型内联样式归并进 `App.css` 现有类,别带入大片 inline style。
- [ ] 无障碍:反馈带 ✓/✗ 符号(已有)· 进度条 `role="progressbar"` + `aria-valuenow` · 按钮 `aria-pressed` · 焦点环别 `outline:none` · `lang="fr"` 标注。
- [ ] 移动端 375px 过一遍:寄语墙三列、登录四 tab、长公式 `overflow-x:auto`。
- [ ] 上线前跑一次 Lighthouse(重点无障碍 + 最佳实践),作体检基线。
- [ ] 各页 `<title>` / `<meta description>` 中法双语;favicon。
- [ ] 统一 `prefers-reduced-motion` 关掉进度条 / 反馈 / 提示音动效。

---

## 9. 上线流程(别自作主张)

走 `mathclass-dev-workflow` skill:开分支 → commit(`git restore public/health.json` 后)→ PR → **等用户点名授权合并**(不自合)。
部署走 `mathclass-deploy` skill,需用户**新的点名授权**:SSH host `mathclass-server` → 149.28.69.75 root,key `~/.ssh/mathclass_deploy`。
共享 Supabase + RLS 红线:改表/权限前读仓内 `CLAUDE.md` 与 `harden_rls.sql`。
无关的 `M CLAUDE.md`(文档改动)别动、别一起提交。

---

## 优先级建议

1. **路由清理(§2)** —— 低风险,先把站点收敛到四线。
2. **背词器接 SRS + 音频(§3)** —— 核心价值,工量最大。
3. **登录接 Auth + AI 助手(§4/§5)** —— 让「登录」真正有用。
4. **寄语墙 / 资源增补真实化(§6/§7)**。
5. **工程打磨(§8)** —— 上线前体检。

> 视觉细节如有疑问,直接打开对应 `*.dc.html` 对照 —— 那是像素级契约。

---

## 10. 逐页验收清单(每条都要能打勾,否则返工)

**通用(每一页)**
- [ ] 顶部页头 `CARNET DE CLASSE` 字标(13px、`letter-spacing:.24em`、大写),右侧 `Sign in · 登录`。
- [ ] 导航四项:`Accueil·扉页 / Ressources·资源 / Vocabulaire·背词 / Atelier·协作`,当前页暗红 + 下划线。
- [ ] 报头(masthead)**居中**;表单步骤左对齐。
- [ ] 背景 `#fdfcf8`、正文 `#1a1a1a`、次要 `#6b6b6b`、细线 `rgba(26,26,26,.14)`。
- [ ] 零 emoji、零渐变、零圆角盒子。按钮是下划线文字按钮,不是方框填色按钮(主操作除外)。

**背词 Vocabulary**(最易跑偏 —— 逐条核)
- [ ] 六题型俱全:配对 / 认词 / 词块拼句 / 例句填空 / 听写 / 拼写,且**轮换**出现。
- [ ] 顶部细进度条 + 右侧连击数;答题区**居中**,焦点词大字衬线。
- [ ] 反馈横幅:对=绿(`#3f7a4e`)底+顶线+`答对 ✓ Juste`;错=暗红底+顶线+`答错 ✗ Faux`+大字正确答案。**必须有 ✓/✗ 符号**,不能只靠颜色。
- [ ] 选项答对染绿打 ✓、选错染红划掉打 ✗、其余淡化。
- [ ] 键盘:空格/回车判分与继续、1–4 选项、输入框自动聚焦。答对/答错有提示音。
- [ ] 词库是 TCF/TEF/DELF B2–C1(l'essor / entraver / insidieux …),**不是**简单词。
- [ ] 底部:等级筛选(全部/B2/C1)+ 词数,安静地放在最下。

**首页 Home**
- [ ] 居中封面(中国人民大学中法学院 / 2025 级数学班 / Trente mathématiciens)→ 每日定理(KaTeX 公式 + 折叠证明)→ 一句冥想 → 细页脚。**没有**课表、**没有**图版铺陈。

**资源 Resources**
- [ ] BIBLIOTHÈQUE 报头 → 编号书架 I–VIII(细线分隔的条目,标题→来源+暗红 mono 标签)。**没有** Appendix。

**协作 Atelier**
- [ ] 共建两入口:① 班级寄语墙 ② 资源增补;底部「班级 AI 助手 · 即将 · 登录可用」预告。**没有**旧的图版补录/审核/案头工作台。

**班级寄语墙 Witness**
- [ ] 标题「班级寄语墙」,三特质(永久保存 / 公开可见 / 不可篡改),区块链信息是一行灰色脚注。
- [ ] 流程 01 连钱包 → 02 写寄语(中文字数计数)→ 03 已留下的话。没钱包有引导链接。

**登录 Login**
- [ ] 居中,四模式 tab(登录/注册/验证码/找回)+ 邮箱/手机;表单整列居中。
- [ ] 登录态下方两条好处点(背词同步 / AI 助手),**不提**协作工作台。

**404**
- [ ] 居中,实数轴比喻法语句 + 三个出口(资源/背词/协作)+ 返回扉页。
