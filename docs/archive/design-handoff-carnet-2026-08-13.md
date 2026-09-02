> ⛔ **已归档(2026-09-02)**:本文"作者拍板"第 4 条"居中/对称是硬约束"已被 2026-08-20 `docs/design-constitution.md`("居中不是教条,编排才是")推翻,"接手者不得推翻拍板项"对当前代码不再生效。视觉裁定以宪法与 `docs/aesthetic-profile.md` 为准;本文其余产品事实只作背景参考。

# Carnet de classe · 前端设计交接(2026-08-13)

> 交接对象:后续负责前端视觉的代理/会话("Claude Design")。
> 本文记录作者已拍板的设计事实与雷区,接手者**不得推翻拍板项**,只能在其内演化。
> 后端与数据管线继续由开发线负责,不在本文范围。

## 产品事实

- 站 = 班级手册 Carnet de classe,核心两件事:**读**(扉页:每日定理 + 每日哲思)
  与**练**(/vocabulary 背词)。导航只有这两项;资源与登录在页脚;
  /assistant、/resources/curate 为无入口路由;寄语墙已整线拆除。
- 桌面/移动同一 DOM(本站未做双端分线,与 Raccord 不同),靠居中列自然收窄。

## 作者拍板(按时间序,后者覆盖前者)

1. **中文和法语是这个网站的灵魂**——减元素、减入口,不减语言。UI 文本中法并置
   (Accueil · 扉页 / Rappel mathématique · 每日定理…),站面不用英语。
2. **法语一律正体**,不用斜体(作者:斜体不好看;全站 font-style italic 已清零)。
3. **中文字体 = Songti SC 打头**:`"Songti SC","SimSun","STSong","Noto Serif SC",serif`
   (青协正式站同款,俊秀细宋);拉丁/法语 = EB Garamond(webfont);
   微字/计数 = JetBrains Mono。
4. **居中/对称是硬约束**(作者:不居中不对称受不了):页眉招牌+导航居中、
   正文居中列、证明步骤逐行居中、页脚居中。对齐验证必须在真实渲染页上
   getComputedStyle 实测(见仓内 AGENTS.md 对齐契约,禁止注入式验证)。
5. **刊头素净**:不要朱印小方、日期不带年份(「八月十三日 · Édition du 13 août」)。
6. **标题数字用齐线体**:全局默认 oldstyle-nums(配法语正文),但含数字的中文
   标题(如 2025 级数学班)必须 `font-variant-numeric: lining-nums`,否则数字下沉。
7. **证明思路 = 朱批夹注**:中文步骤汉字序数「一、」、法文步骤 Garamond 数字
   「1. 」,序数行内、逐行居中;注文 16px / 行距 1.85;行内 KaTeX 1.04em。
   展开器是安静的「+ Démonstration · 证明思路」。
8. **登录不进页眉**:页脚功能小字(Connexion · 登录);页眉只有招牌 + 导航。

## Token 现状(src/index.css)

- 色:`--paper #fdfcf8 · --ink #221d18 · --muted #6f675e · --accent #7f302b(氧化酒红)
  · --rule rgba(34,29,24,.16)`。同温度暖调;红只作朱批/活性信号,禁大面积。
- 间距:8px 刻度;`--section-gap 80/52/40`;扉页顶距 64。
- 布局:`--page-width 900`,各页收窄见 App.css 注释;页脚以 56px 居中发丝线起头。

## 雷区(全局审美档案 + 本线实录)

- 大面积 glow / 粒子 / 渐变紫 / 毛玻璃 / hover 放大 / 永续动画(boot 骨架的光晕
  卡片就是因此被拆的,现为纸底 + 发丝扫描线,见 index.html 内联)。
- 装饰性字符画线(「─────」已废,一律真发丝线)。
- 双语等权堆叠造成的信息翻倍感——并置要有层级(法语衬、中文承重)。
- 通用圆角卡片、emoji、咨询腔文案。

## 未做完 / 可做的

- 背词页(/vocabulary)未经过这轮设计语言的精修(字阶、间距、题卡)。
- 资源页、登录页、404 同上。
- og-cover.png 仍是旧站截图,与现版式不符。
- 移动端只做过回归性验收,未做专门打磨。

## 工作方式约定

- 分支 `mathclass/main`,worktree `math_网站/mcw-mathclass/`;每 commit 独立可构建;
  提交前 `git restore public/health.json`;lint / test / build 三连绿再交。
- 改动以预览实物 + 截图向作者收敛(对/不对),不要长篇方案文。
