# math class 线重启 · 盘点与 roadmap 底稿(2026-08-13)

> 背景:2026-08-06 math 线切分为 Raccord / 班级网站两线(记录见
> `mcw-raccord-cutover/deployment/RACCORD_DEPLOY.md`)。本底稿记录班级网站线的重启
> 立线动作、五维盘点结论与分阶段 roadmap。盘点由 5 个并行读察 agent 完成,高危断言
> 经对抗复核或本席实证核实。

## 一、立线(已完成)

- **重启点**:`f6815b9`(= `backup/pre-worlds-2026-07-06` tag)。实证其与线上冻结
  构建 commit `65f75e5` 内容逐字节相同(diff 为空),不存在"合并未部署"悬空工作。
- **长期分支** `mathclass/main`,独立 worktree `math_网站/mcw-mathclass/`;Raccord
  线在途的 `wip/horizon-immobile` 主工作树未受任何影响。
- 已落两个 commit(均本地,未推远端):
  - `cbd2c4e` ci:CI 触发分支纳入 `mathclass/main`(否则该线 PR 无 lint/test/build 门禁);
  - `17206a5` chore:react-router-dom 7.17.0 → 7.18.2,清除 audit 唯一 high(锁文件级)。
- 质量闸:lint ✓ / 113 tests ✓ / build ✓ / `npm audit --omit=dev --audit-level=high` ✓。
- 线上实测:`rucmathclass.com` health = 2026-06-24 冻结构建,完好;Raccord 未首发
  (子域名 health 仍返回旧站构建)。

## 二、现状地图(站有什么)

4 个导航入口 + 页脚寄语墙,已高度收敛:

- **扉页 /**:每日定理(24 条,上海时区日序取模,KaTeX 构建期预渲)+ 每日冥想 +
  法语旁白(静态 mp3)。纯静态,date-driven,可无限期自然工作。
- **资源书架 /resources**:静态目录(8 书架 ~109 条)+ Supabase `resources` 表增补,
  Supabase 不可用时优雅降级;外链全部经 sanitizeStoredUrl 消毒(有单测)。
- **SRS 背词 /vocabulary**:3652 词,艾宾浩斯阶梯(纯核心 srsScheduler 已单测),
  进度存 `review_states`(per-user RLS)。发音走浏览器 TTS(`USE_WORKER_VOICE=false`)。
- **AI 助手 /assistant**:登录后经 Worker `/api/chat` 调 Gemini,支持拍题问图,
  云端历史 `ai_messages`。端点硬编码绝对地址(3 处)。
- **寄语墙 /witness**:本站唯一现存 Web3 界面,自写 Anchor 程序(Solana **devnet**),
  写入需 Phantom,读取 permissionless。
- 相册/黑客松/web3 个人页/审核中心均已下线为 redirect;**约 1500+ 行死码残留**
  (Comments.jsx、useOpsSubmissions、useClassMemoFeed、4 个孤儿数据模块等)。

**共享后端两线关系(重要结论)**:Raccord(main)对共享 Supabase 与 Worker 的演化
全部为**纯增量**——git 侧仅新增 `testimonials` 表 SQL(且实测线上未应用),Worker 仅
+raccord CORS 源与 +2 条路由;班级站依赖的 7 张表、全部策略、`/api` 契约零改动。
"main 侧演化破坏冻结班级站"的风险当前为零。线上 public schema 恰为班级站依赖的
7 表(comments 8 行 / profiles 4 / review_states 52 / ai_messages 4 / albums 0 /
album_photos 0 / resources 0),全部 RLS on。

## 三、风险清单

### 已确认

- **P1 · PII 列遮蔽未落地(本席实证)**:线上 `anon` 与 `authenticated` 对
  `comments` 保有**全部 7 列(含 `user_email`)的列级 SELECT/INSERT/UPDATE 授权**;
  `harden_rls.sql` 设计的列级 REVOKE 从未执行。当前无实际泄露仅因 anon 无任何行
  策略(单层兜底,而非设计的双层)。**红线推论:恢复任何公开读策略之前必须先做
  列级 REVOKE**;该修复改线上 DB,须作者原文授权。
- **P1 · 资源推荐闭环断裂**:`/resources/curate` 提交入 ops 队列,但站内审核 UI 已
  随 manage/review 下线(`useOpsSubmissions` 无任何调用者),提交安静堆积;发布只能
  Supabase 后台手工插行。二选一:恢复极简审核页(代码路径完好)或明确人工运营流程。
- **P1 · index.html 元信息过期**:仍是黑客松口径("first-year student"、Dev3pack、
  指向已 301 页面的 og 描述),2026-09 新学年起失真。
- **P1 · 寄语墙"永久保存"承诺建立在 devnet 上**:devnet 周期性 reset 会无预警清空
  全部 PDA(实测 2026-05-09 记录目前仍在)。二选一:文案如实化,或镜像进 Supabase
  作持久层、链上仅作见证。
- **P1 · TTS preview 模型**:Worker 用 `gemini-2.5-flash-preview-tts`(无稳定性承诺,
  实测目前 200);chat 用 `gemini-flash-latest` 相对安全。GA 后在 main 侧换型重部署。
- **护栏(拍板级)**:**Worker 只能从 main 侧部署**——从班级线旧 `wrangler.toml`
  部署会摘掉 Raccord 路由;反向 Raccord 改 Worker(prompt/模型/契约)会静默改写
  班级站行为,改动前须核过班级站 `{messages→text}` 契约。
- P2(择要):线上 `comments` 策略是历史混合体(游客留言墙为空、moderation 回执对
  目标用户不可见——冻结前即如此,非 Raccord 造成);realtime publication 为空
  (Comments 订阅收不到事件,但该组件本就是死码);词库 0 条 `exampleZh` → 拼句
  题型全部降级为拼写(6 题型实际 5 种);API 端点硬编码 3 处;sitemap/robots 指向
  3 个已 301 路由;`courseSchedule` 为 2025-26 春季快照(幸为死数据,不进 bundle);
  uuid moderate 链(Solana 依赖独有)无修复版、浏览器端暴露面近零。

### 无需动作(已核明)

依赖健康度总体可控(Node 24 与 .nvmrc 匹配;Vite/ESLint/Vitest 大版本升级各自立项
后置);Worker 契约两侧逐字节一致;每日轮换机制常青;health.json 如实报旧。

## 四、roadmap 草案

- **阶段 1 · 修断裂(✅ 全部完成,2026-08-13)**
  - [x] 立线 + CI 门禁 + react-router high 清除(`cbd2c4e`、`17206a5`)。
  - [x] `mathclass/main` 已推 origin(作者授权「12」)。
  - [x] PII 列级授权落地:Supabase migration
    `pii_column_grants_comments_harden_rls_s7`(= harden_rls.sql §7 原文)。
    验证:以线上 anon key 实测 `select=user_email` → 42501 permission denied,
    许可列正常返回。
  - 验收:audit 无 high ✓;anon 列授权不含 `user_email` ✓;三连绿 ✓。
- **补记(2026-08-13,减法拍板)**:产品身份定为班级手册 Carnet de classe,
  核心 = 读(每日定理与哲思)+ 练(背词)。导航收敛 4→2,Atelier 下线,
  寄语墙先隐藏后整线拆除(含全部 Solana 依赖,audit 归零),AI 退到背词
  答错后的上下文动作(`6afb1dc`)。
- **补记(2026-08-13,作者原话)**:「中文和法语是这个网站的灵魂」——减法
  减元素、减入口,**不减语言**。UI 文本保持中法并置:法语以 EB Garamond
  斜体作衬(与副题/kicker 同语法),中文承担功能重量;站面不用英语。
- **阶段 2 · 诚实性刷新(9 月前)**
  - index.html 元信息重写(去黑客松/first-year);sitemap/robots 重写为现役路由;
    witness 文案如实化(或拍板迁移方案);死码清理(~1500 行 + 4 孤儿数据模块)。
  - 验收:站面与元数据无过期声明;build 绿;bundle 不含孤儿模块。
- **阶段 3 · 新学年功能(等作者点方向)**
  - 资源审核闭环恢复 or 运营流程化;2026 秋课表录入 or 删除死数据;定理池扩充;
    词库补 `exampleZh` 激活拼句题型;外链存活检查;TTS GA 换型(main 侧)。
- **部署注记**:上线走 `mathclass-deploy` runbook,发布源 = `mathclass/main`,每次
  须原文点名;部署后双查两域名 health(Raccord 未首发前两者应同为新旧对照)。

## 五、待拍板

1. `mathclass/main` 是否推 origin(推荐:是,分支只在本机没有保命)。
2. PII 列级 REVOKE 是否现在落地(推荐:是,幂等且不改现行为,只收窄授权面)。
3. 阶段 2/3 的取舍与先后。
