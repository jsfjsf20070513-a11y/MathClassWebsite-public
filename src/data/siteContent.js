// Public-safe sample content. Real class photos, schedules, teacher names,
// room numbers, and activity details are intentionally anonymized before
// publishing this repository.

// Two-mode pattern for plate photos:
//   - Default (GitHub-public): use the anonymized PUBLIC_ALBUMS below.
//   - Production-private: deploy.sh writes a sibling file
//     `privateAlbumOverrides.js` (gitignored) and copies the matching
//     `public/uploads/*.{jpg,webp}` from the private repo. When that
//     file exists, the import.meta.glob below picks it up at build time
//     and replaces PUBLIC_ALBUMS — so the production VPS shows the real
//     plates while the GitHub repo never carries identifying class data.
const PUBLIC_ALBUMS = [
  {
    id: 1,
    title: 'Sample Class Activity',
    featured: true,
    count: 1,
    date: '2026-03-01',
    updatedAt: '2026-05-03',
    cover: '/placeholders/class-archive.svg',
    coverWidth: 1280,
    coverHeight: 852,
    description: 'An anonymized sample record for the public repository.',
    recordedBy: 'Sample archive',
    location: 'Campus location',
    photos: [
      {
        src: '/placeholders/class-archive.svg',
        width: 1280,
        height: 852,
        caption: 'Placeholder image. Real class photos are kept outside the public repository.',
      },
    ],
  },
  {
    id: 2,
    title: 'Sample Campus Note',
    featured: true,
    count: 1,
    date: '2026-03-15',
    updatedAt: '2026-05-03',
    cover: '/placeholders/campus-note.svg',
    coverWidth: 900,
    coverHeight: 1200,
    description: 'An anonymized campus note that preserves structure without exposing private people or places.',
    recordedBy: 'Sample archive',
    location: 'Classroom A101',
    photos: [
      {
        src: '/placeholders/campus-note.svg',
        width: 900,
        height: 1200,
        caption: 'Placeholder image. Replace privately deployed media outside the public repo.',
      },
    ],
  },
  {
    id: 3,
    title: 'Sample Field Trip',
    featured: true,
    count: 1,
    date: '2026-04-01',
    updatedAt: '2026-05-03',
    cover: '/placeholders/field-trip.svg',
    coverWidth: 1280,
    coverHeight: 960,
    description: 'A public-safe sample activity entry using a non-person placeholder image.',
    recordedBy: 'Sample archive',
    location: 'Off-campus site',
    photos: [
      {
        src: '/placeholders/field-trip.svg',
        width: 1280,
        height: 960,
        caption: 'Placeholder image. Real field-trip photos require private permission.',
      },
    ],
  },
]

// Vite inlines this glob result at build time. When the override file
// does not exist (GitHub repo or any plain `npm run build` from this
// public source), `overrideModules` is `{}` and `albums` falls back to
// the public-safe placeholders. The import path is intentionally a
// glob so the import is silent when missing.
//
// import.meta.glob is a Vite-only API. The prebuild scripts in
// scripts/*.mjs import this file with raw Node ESM, where the function
// doesn't exist — the try/catch keeps both environments happy. Raw
// Node always falls back to PUBLIC_ALBUMS, which is fine because the
// prebuild scripts only consume `dailyTheoremNotes`.
let overrideAlbums
try {
  const overrideModules = import.meta.glob('./privateAlbumOverrides.js', {
    eager: true,
    import: 'default',
  })
  overrideAlbums = Object.values(overrideModules)[0]
} catch {
  overrideAlbums = undefined
}

export const albums = Array.isArray(overrideAlbums) && overrideAlbums.length > 0
  ? overrideAlbums
  : PUBLIC_ALBUMS

export const courseSchedule = [
  {
    day: 'Mon',
    slots: [
      {
        time: '08:00-09:35',
        course: '初级法语视听说 II',
        note: 'BRAHAMI GUILLAUME · 修远206 · 1-2节 · 1-9,11-16周',
      },
      {
        time: '10:00-11:35',
        course: '初级法语 II',
        note: '段铭钰 / 朱波 · 修远204 / 317 · 3-4节 · 1-9,11-16周',
      },
      {
        time: '14:00-15:35',
        course: '高等代数 II',
        note: '刘晓艳 · 修远317 · 7-8节 · 1-9,11-16周',
      },
      {
        time: '16:00-17:35',
        course: '数学法语（法） / 高等代数（法）',
        note: '法方专业教师 M · 修远317 · 9-10节 · 分周段开设',
      },
    ],
  },
  {
    day: 'Tue',
    slots: [
      {
        time: '08:00-09:35',
        course: '数学分析 II',
        note: '朱来义 / 刘晓艳 · 修远315 · 1-2节 · 1-16周',
      },
      {
        time: '10:00-11:35',
        course: '大学英语 IV',
        note: '陈丽丽 · 修远311 · 3-4节 · 1-16周',
      },
      {
        time: '14:00-15:35',
        course: 'Python 程序设计 / 数据管理与数据挖掘',
        note: '修远楼 B 区 305 / 修远117 · 7-8节 · 1-16周',
      },
      {
        time: '18:00-19:35',
        course: '职业生涯教育（理论）',
        note: '于坤 · 修远报告厅 · 11-12节 · 13-16周',
      },
    ],
  },
  {
    day: 'Wed',
    slots: [
      {
        time: '08:00-09:35',
        course: '初级法语 II',
        note: '朱波 · 修远317 · 1-2节 · 1-16周',
      },
      {
        time: '10:00-11:35',
        course: '数学法语（法） / 高等代数（法）',
        note: '法方专业教师 M · 修远317 · 3-4节 · 分周段开设',
      },
      {
        time: '14:00-15:35',
        course: '法语音调与朗读 / 人工智能与数据技术基础',
        note: '修远207 / 225 · 7-8节 · 按周次与分组开设',
      },
      {
        time: '19:40-21:15',
        course: '法国地缘与历史',
        note: '郭兰芳 / 杨燕萍 / 张莉 · 晚间课程',
      },
    ],
  },
  {
    day: 'Thu',
    slots: [
      {
        time: '08:00-09:35',
        course: '初级法语 II',
        note: '朱波 · 修远317 · 1-2节 · 1-16周',
      },
      {
        time: '10:00-11:35',
        course: '数学分析 II',
        note: '朱来义 / 刘晓艳 · 修远315 · 3-5节 · 1-16周',
      },
      {
        time: '14:00-15:35',
        course: '初级法语 II',
        note: '段铭钰 · 修远214 · 7-8节 · 1-16周',
      },
      {
        time: '16:00-17:35',
        course: '初级法语视听说 II',
        note: 'Clément PEPIN · 修远315 · 9-10节 · 1-16周',
      },
    ],
  },
  {
    day: 'Fri',
    slots: [
      {
        time: '08:00-09:35',
        course: '数学法语（法）',
        note: '法方专业教师 M · 修远317 · 1-2节 · 6周',
      },
      {
        time: '10:00-11:35',
        course: '初级法语阅读与写作',
        note: 'BRAHAMI GUILLAUME / Clément PEPIN · 修远104 / 214 · 3-4节',
      },
      {
        time: '16:00-17:35',
        course: '毛泽东思想和中国特色社会主义理论体系概论',
        note: '孙愉慧 · 修远报告厅 · 11-14节 · 1-12周',
      },
    ],
  },
  {
    day: 'Sat',
    slots: [
      {
        time: '08:00-09:35',
        course: '初级法语视听说 II',
        note: 'BRAHAMI GUILLAUME · 修远206 · 1-2节 · 第 10 周',
      },
      {
        time: '10:00-11:35',
        course: '初级法语 II',
        note: '段铭钰 / 朱波 · 修远204 / 317 · 3-4节 · 第 10 周',
      },
      {
        time: '16:00-17:35',
        course: '高等代数（法）',
        note: '法方专业教师 M · 修远317 · 9-10节 · 第 10 周',
      },
    ],
  },
]

export const classProfile = {
  campus: '中国人民大学中法学院（苏州）',
  name: '中法 2025 级数学与应用数学班',
  slogan: '数学与法语并修，课程与记忆并存。',
  vision: '把班级网站从示意首页逐步编修成兼具法语语境、课程脉络与班级档案的长期记录。',
  keywords: ['中法学院', '数学', '法语', '长期编修'],
  intro: [
    '这个站点所记录的是中国人民大学中法学院 2025 级数学与应用数学班。课程结构并不只是普通数学课表，而是在数学分析、高等代数、Python 等课程之外，同时并入初级法语、法语阅读写作、数学法语与法语音调训练。',
    '因此这里的资源、纪事与相册都不再按单一工科班的方式整理，而是更强调双语课程的真实脉络、长期可回查的资料目录，以及一届人共同学习时留下的秩序感。',
  ],
}

export const dailyTheoremNotes = [
  {
    title: 'Bolzano-Weierstrass',
    prelude: '有界实数列必有收敛子列。',
    displayExpression: '(\\exists M>0\\;\\forall n\\in\\mathbb{N},\\ |x_n|\\le M)\\ \\Longrightarrow\\ \\exists x\\in\\mathbb{R},\\ \\exists\\, n_1<n_2<\\cdots,\\ x_{n_k}\\to x',
    fallback: '(exists M > 0, forall n, |x_n| <= M) => exists x in R and n_1 < n_2 < ... such that x_(n_k) -> x',
    note: '此处写的是实数列版本；有限维欧氏空间中有对应表述。',
  },
  {
    title: 'Cauchy 判别准则',
    prelude: '在实数域中，收敛与 Cauchy 性等价。',
    displayExpression: 'x_n\\to x\\in\\mathbb{R}\\ \\Longleftrightarrow\\ \\forall \\varepsilon>0\\ \\exists N\\ \\forall m,n\\ge N,\\ |x_m-x_n|<\\varepsilon',
    fallback: 'x_n converges in R iff for every epsilon > 0 there exists N such that m,n >= N implies |x_m-x_n| < epsilon',
    note: '这里用到的是实数域的完备性。',
  },
  {
    title: 'Lagrange 中值定理',
    prelude: '闭区间上连续、开区间上可导时，平均变化率在某点由导数实现。',
    displayExpression: 'f\\in C[a,b],\\ f\\in C^1(a,b)\\ \\Longrightarrow\\ \\exists \\xi\\in(a,b),\\ f\'(\\xi)=\\frac{f(b)-f(a)}{b-a}',
    fallback: 'f continuous on [a,b] and differentiable on (a,b) => exists xi in (a,b) with f\'(xi) = (f(b)-f(a))/(b-a)',
    note: '这里只写一元函数情形。',
  },
  {
    title: '秩-零空间定理',
    prelude: '有限维线性映射中，核与像的维数之和等于定义域维数。',
    displayExpression: '\\dim\\ker T + \\dim\\operatorname{Im} T = \\dim V',
    fallback: 'dim Ker(T) + dim Im(T) = dim V',
    note: '矩阵情形即 rank(A) + nullity(A) = n。',
  },
  {
    title: '实对称矩阵谱定理',
    prelude: '实对称矩阵可以正交对角化。',
    displayExpression: 'A=A^{\\mathsf T}\\ \\Longrightarrow\\ \\exists Q\\text{ orthogonal},\\ Q^{\\mathsf T}AQ=\\operatorname{diag}(\\lambda_1,\\dots,\\lambda_n)',
    fallback: 'A = A^T => exists orthogonal Q such that Q^T A Q is diagonal',
    note: '其特征值全为实数。',
  },
  {
    title: 'Bayes 公式',
    prelude: '条件概率换向时，公式写作如下。',
    displayExpression: 'P(B)>0\\ \\Longrightarrow\\ P(A\\mid B)=\\frac{P(B\\mid A)P(A)}{P(B)}',
    fallback: 'P(B) > 0 => P(A|B) = P(B|A)P(A)/P(B)',
    note: '条件是 P(B) 不为零。',
  },
  {
    title: '大数定律',
    prelude: '独立同分布且期望存在时，样本均值趋向共同期望。',
    displayExpression: '\\overline{X}_n\\to \\mathbb{E}[X_1]',
    fallback: 'Xbar_n -> E[X_1]',
    note: '这里故意只写常见表述，不区分弱式与强式。',
  },
  {
    title: 'Heine-Borel 定理',
    prelude: '在欧氏空间中，紧致与闭且有界等价。',
    displayExpression: 'K\\subset\\mathbb{R}^n\\ \\Longrightarrow\\ K\\text{ compact}\\ \\Longleftrightarrow\\ K\\text{ is closed and bounded}',
    fallback: 'For K subset of R^n, K is compact iff K is closed and bounded',
    note: '这里只写欧氏空间版本；一般度量空间中闭有界不必紧。',
  },
  {
    title: '微积分基本定理',
    prelude: '连续函数的积分函数可导，并把原函数恢复出来。',
    displayExpression: 'F(x)=\\int_a^x f(t)\\,dt\\ \\Longrightarrow\\ F\'(x)=f(x)',
    fallback: 'If F(x) = integral from a to x of f(t)dt, then F\'(x) = f(x)',
    note: '通常要求 f 在区间上连续。',
  },
  {
    title: 'Taylor 公式',
    prelude: '局部可导信息可以展开成有限阶多项式与余项。',
    displayExpression: 'f(x)=\\sum_{k=0}^{n}\\frac{f^{(k)}(a)}{k!}(x-a)^k+\\frac{f^{(n+1)}(\\xi)}{(n+1)!}(x-a)^{n+1}',
    fallback: 'f(x) = sum from k=0 to n of f^(k)(a)(x-a)^k/k! + remainder',
    note: '这里写的是 Lagrange 余项形式，且 \\xi 介于 a 与 x 之间。',
  },
  {
    title: 'Cauchy-Schwarz 不等式',
    prelude: '内积空间中，内积绝对值不超过范数乘积。',
    displayExpression: '|\\langle x,y\\rangle|\\le\\|x\\|\\,\\|y\\|',
    fallback: '|<x,y>| <= ||x|| ||y||',
    note: '等号成立当且仅当两个向量线性相关。',
  },
  {
    title: 'Gram-Schmidt 正交化',
    prelude: '线性无关向量组可以被整理成正交规范组。',
    displayExpression: 'v_k=u_k-\\sum_{j=1}^{k-1}\\langle u_k,e_j\\rangle e_j,\\qquad e_k=\\frac{v_k}{\\|v_k\\|}',
    fallback: 'v_k = u_k - sum <u_k,e_j>e_j, e_k = v_k / ||v_k||',
    note: '前提是每一步得到的 v_k 都不为零，也即原向量组线性无关。',
  },
  {
    title: 'Cayley-Hamilton 定理',
    prelude: '方阵满足自己的特征多项式。',
    displayExpression: 'p_A(\\lambda)=\\det(\\lambda I-A)\\ \\Longrightarrow\\ p_A(A)=0',
    fallback: 'If p_A(lambda) = det(lambda I - A), then p_A(A) = 0',
    note: '这是把特征多项式中的标量变量代回矩阵本身。',
  },
  {
    title: '奇异值分解',
    prelude: '任意实矩阵都可以分解成两个正交矩阵与一个非负对角矩阵。',
    displayExpression: 'A\\in\\mathbb{R}^{m\\times n}\\ \\Longrightarrow\\ \\exists U,V\\text{ orthogonal},\\ A=U\\Sigma V^{\\mathsf T}',
    fallback: 'For real matrix A, there exist orthogonal U,V with A = U Sigma V^T',
    note: '对角阵 \\Sigma 的对角元就是奇异值。',
  },
  {
    title: '正交投影定理',
    prelude: '内积空间中的向量可唯一拆成子空间部分与正交补部分。',
    displayExpression: 'x\\in V,\\ W\\subset V\\ \\Longrightarrow\\ \\exists!\\ p\\in W,\\ z\\in W^\\perp,\\ x=p+z',
    fallback: 'For x in V and subspace W, there exist unique p in W and z in W^perp with x = p + z',
    note: '有限维欧氏空间里，这就是“最近点”存在且唯一的原因。',
  },
  {
    title: 'Markov 不等式',
    prelude: '非负随机变量取到大值的概率可以由期望控制。',
    displayExpression: 'X\\ge0,\\ a>0\\ \\Longrightarrow\\ \\mathbb{P}(X\\ge a)\\le\\frac{\\mathbb{E}[X]}{a}',
    fallback: 'If X >= 0 and a > 0, then P(X >= a) <= E[X]/a',
    note: '这是许多概率上界估计的起点。',
  },
  {
    title: 'Chebyshev 不等式',
    prelude: '随机变量偏离均值的概率可由方差估计。',
    displayExpression: '\\mathbb{P}(|X-\\mu|\\ge\\varepsilon)\\le\\frac{\\operatorname{Var}(X)}{\\varepsilon^2}',
    fallback: 'P(|X - mu| >= epsilon) <= Var(X) / epsilon^2',
    note: '这里假定方差存在，且 \\varepsilon>0。',
  },
  {
    title: '全期望公式',
    prelude: '先做条件期望，再取一次期望，回到原期望。',
    displayExpression: '\\mathbb{E}[X]=\\mathbb{E}(\\mathbb{E}[X\\mid Y])',
    fallback: 'E[X] = E(E[X | Y])',
    note: '也常被称作 tower property 或 iterated expectation。',
  },
  {
    title: 'Jensen 不等式',
    prelude: '凸函数作用在期望上，不超过期望作用在凸函数上。',
    displayExpression: '\\varphi\\text{ convex}\\ \\Longrightarrow\\ \\varphi(\\mathbb{E}[X])\\le\\mathbb{E}[\\varphi(X)]',
    fallback: 'If phi is convex, then phi(E[X]) <= E[phi(X)]',
    note: '凹函数时不等号方向相反。',
  },
  {
    title: '中心极限定理',
    prelude: '独立同分布和有限方差下，标准化和趋近正态分布。',
    displayExpression: '\\frac{S_n-n\\mu}{\\sigma\\sqrt n}\\ \\Longrightarrow\\ \\mathcal{N}(0,1)',
    fallback: '(S_n - n mu) / (sigma sqrt n) converges in distribution to N(0,1)',
    note: '这里只写最经典的 i.i.d. 版本。',
  },
  {
    title: 'Banach 不动点定理',
    prelude: '压缩映射在完备度量空间中有唯一不动点。',
    displayExpression: 'd(Tx,Ty)\\le q\\,d(x,y),\\ 0<q<1\\ \\Longrightarrow\\ \\exists!\\ x^*,\\ Tx^*=x^*',
    fallback: 'If d(Tx,Ty) <= q d(x,y) with 0<q<1, then there exists a unique fixed point x*',
    note: '反复迭代 x_{n+1}=Tx_n 会收敛到这个不动点。',
  },
  {
    title: 'Fubini 定理',
    prelude: '在可积条件下，二重积分可以分步进行。',
    displayExpression: '\\int_{X\\times Y}f\\,d(\\mu\\times\\nu)=\\int_X\\left(\\int_Y f(x,y)\\,d\\nu(y)\\right)d\\mu(x)',
    fallback: 'Integral over XxY of f equals iterated integrals when f is integrable',
    note: 'Tonelli 定理处理非负函数，Fubini 定理处理绝对可积情形。',
  },
  {
    title: '逆函数定理',
    prelude: '导数可逆时，局部上存在可微逆映射。',
    displayExpression: '\\det Df(a)\\ne0\\ \\Longrightarrow\\ f\\text{ is locally invertible near }a',
    fallback: 'If det Df(a) != 0, then f is locally invertible near a',
    note: '这里只写多元情形的核心结论，不展开光滑性细节。',
  },
  {
    title: 'Lax-Milgram 定理',
    prelude: 'Hilbert 空间上的强制双线性型保证弱解存在唯一。',
    displayExpression: 'a(\\cdot,\\cdot)\\text{ coercive and continuous}\\ \\Longrightarrow\\ \\forall f\\in H^*,\\ \\exists!u\\in H,\\ a(u,v)=f(v)',
    fallback: 'If a is coercive and continuous, then for every f in H* there exists a unique u with a(u,v)=f(v)',
    note: '这是偏微分方程弱解理论中的基础工具之一。',
  },
]

export const paroles = [
  {
    text: 'La mathématique est l’art de donner le même nom à des choses différentes.',
    note: '数学是给不同事物取同一个名字的艺术。',
    author: 'Henri Poincaré',
    src: 'Science et méthode',
  },
  {
    text: 'C’est par la logique qu’on démontre, c’est par l’intuition qu’on invente.',
    note: '证明靠逻辑,发明靠直觉。',
    author: 'Henri Poincaré',
    src: 'Science et méthode',
  },
  {
    text: 'La pensée n’est qu’un éclair au milieu d’une longue nuit. Mais c’est cet éclair qui est tout.',
    note: '思想不过是漫漫长夜中的一道闪电,但这道闪电就是一切。',
    author: 'Henri Poincaré',
    src: 'La Valeur de la science',
  },
  {
    text: 'L’homme n’est qu’un roseau, le plus faible de la nature, mais c’est un roseau pensant.',
    note: '人只是一根苇草,是自然界最脆弱的东西,但他是一根会思想的苇草。',
    author: 'Blaise Pascal',
    src: 'Pensées',
  },
  {
    text: 'Le silence éternel de ces espaces infinis m’effraie.',
    note: '这些无限空间的永恒沉默,使我恐惧。',
    author: 'Blaise Pascal',
    src: 'Pensées',
  },
  {
    text: 'Ce n’est pas assez d’avoir l’esprit bon, mais le principal est de l’appliquer bien.',
    note: '有好的头脑还不够,要紧的是善用它。',
    author: 'René Descartes',
    src: 'Discours de la méthode',
  },
  {
    text: 'Diviser chacune des difficultés en autant de parcelles qu’il se pourrait et qu’il serait requis pour les mieux résoudre.',
    note: '把每一个难题分成尽可能多、也恰好足够的小块,以便更好地解决。',
    author: 'René Descartes',
    src: 'Discours de la méthode',
  },
  {
    text: 'Tu prieras publiquement Jacobi ou Gauss de donner leur avis, non sur la vérité, mais sur l’importance des théorèmes.',
    note: '请你公开地恳请雅可比或高斯发表意见——不是关于这些定理是否为真,而是关于它们有多重要。',
    author: 'Évariste Galois',
    src: '绝笔信,1832',
  },
  {
    text: 'L’attention est la forme la plus rare et la plus pure de la générosité.',
    note: '专注,是最稀有也最纯粹的慷慨。',
    author: 'Simone Weil',
    src: '书信',
  },
  {
    text: 'Craindre l’erreur et craindre la vérité est une seule et même chose.',
    note: '害怕错误与害怕真理,是同一件事。',
    author: 'Alexandre Grothendieck',
    src: 'Récoltes et semailles',
  },
  {
    text: 'La découverte est le privilège de l’enfant.',
    note: '发现,是孩子的特权。',
    author: 'Alexandre Grothendieck',
    src: 'Récoltes et semailles',
  },
  {
    text: 'Rien ne va de soi. Rien n’est donné. Tout est construit.',
    note: '没有什么不言自明,没有什么是给定的,一切都是构造出来的。',
    author: 'Gaston Bachelard',
    src: 'La Formation de l’esprit scientifique',
  },
  {
    text: 'Il faut être léger comme l’oiseau, et non comme la plume.',
    note: '要像鸟一样轻,而不是像羽毛。',
    author: 'Paul Valéry',
  },
  {
    text: 'Plutôt la tête bien faite que bien pleine.',
    note: '宁要构造得好的头脑,不要塞得满的头脑。',
    author: 'Michel de Montaigne',
    src: 'Essais',
  },
  {
    text: 'Ce que nous savons est peu de chose, ce que nous ignorons est immense.',
    note: '我们知道的微不足道,我们不知道的浩瀚无边。',
    author: 'Pierre-Simon de Laplace',
    src: '临终语',
  },
  {
    text: 'L’étude approfondie de la nature est la source la plus féconde des découvertes mathématiques.',
    note: '对自然的深入研究,是数学发现最丰饶的源泉。',
    author: 'Joseph Fourier',
    src: 'Théorie analytique de la chaleur',
  },
  {
    text: 'L’algèbre n’est qu’une géométrie écrite, la géométrie n’est qu’une algèbre figurée.',
    note: '代数不过是写下来的几何,几何不过是画出来的代数。',
    author: 'Sophie Germain',
  },
  {
    text: 'J’en ai découvert une démonstration véritablement merveilleuse, que cette marge est trop étroite pour contenir.',
    note: '我发现了一个真正奇妙的证明,可惜这页边太窄,写不下。',
    author: 'Pierre de Fermat',
    src: '页边批注(拉丁原文)',
  },
  {
    text: 'Nous devons savoir, nous saurons.',
    note: '我们必须知道,我们终将知道。',
    author: 'David Hilbert',
    src: '德语原文',
  },
  {
    text: 'L’essence des mathématiques, c’est la liberté.',
    note: '数学的本质,在于它的自由。',
    author: 'Georg Cantor',
    src: '德语原文',
  },
  {
    text: 'Allez en avant, et la foi vous viendra.',
    note: '往前走,信心自会到来。',
    author: 'Jean le Rond d’Alembert',
    src: '相传',
  },
  {
    text: 'Rien ne se produit dans le monde sans qu’une raison de maximum ou de minimum n’y apparaisse.',
    note: '世上发生的一切,无不显出某种极大或极小的道理。',
    author: 'Leonhard Euler',
    src: '拉丁原文',
  },
  {
    text: 'Il faut agir en homme de pensée et penser en homme d’action.',
    note: '要以思想者的方式行动,以行动者的方式思想。',
    author: 'Henri Bergson',
  },
  {
    text: 'Il faut imaginer Sisyphe heureux.',
    note: '应当想象西西弗斯是幸福的。',
    author: 'Albert Camus',
    src: 'Le Mythe de Sisyphe',
  },
  {
    text: 'Penser, c’est dire non.',
    note: '思考,就是说不。',
    author: 'Alain',
    src: 'Propos',
  },
  {
    text: 'Le doute est le sel de l’esprit.',
    note: '怀疑是精神的盐。',
    author: 'Alain',
    src: 'Propos',
  },
  {
    text: 'Étudier sans penser est vain; penser sans étudier est périlleux.',
    note: '学而不思则罔,思而不学则殆。',
    author: '孔子《论语》',
  },
  {
    text: 'Qui ravive l’ancien et y découvre du nouveau peut servir de maître.',
    note: '温故而知新,可以为师矣。',
    author: '孔子《论语》',
  },
  {
    text: 'Savoir vaut moins qu’aimer; aimer vaut moins que se réjouir.',
    note: '知之者不如好之者,好之者不如乐之者。',
    author: '孔子《论语》',
  },
  {
    text: 'Sans accumuler les demi-pas, nul n’atteint les mille lis; sans réunir les ruisseaux, nul fleuve ne devient mer.',
    note: '不积跬步,无以至千里;不积小流,无以成江海。',
    author: '《荀子·劝学》',
  },
  {
    text: 'Grave sans relâche: même le métal et la pierre se laissent ciseler.',
    note: '锲而不舍,金石可镂。',
    author: '《荀子·劝学》',
  },
  {
    text: 'L’art de lire: suivre l’ordre et avancer par degrés; lire jusqu’à la familiarité, penser jusqu’à la finesse.',
    note: '读书之法,在循序而渐进,熟读而精思。',
    author: '朱熹',
  },
  {
    text: 'D’où vient au canal une telle clarté ? De l’eau vive qui coule à sa source.',
    note: '问渠那得清如许?为有源头活水来。',
    author: '朱熹《观书有感》',
  },
  {
    text: 'S’établir commence par l’étude; l’étude a pour racine la lecture.',
    note: '立身以立学为先,立学以读书为本。',
    author: '欧阳修',
  },
  {
    text: 'L’intelligence tient à l’assiduité, le génie à l’accumulation.',
    note: '聪明在于勤奋,天才在于积累。',
    author: '华罗庚',
  },
  {
    text: 'Les mathématiques, c’est amusant.',
    note: '数学好玩。',
    author: '陈省身',
    src: '题词',
  },
  {
    text: 'C’est en étudiant qu’on découvre son manque; c’est en enseignant qu’on découvre sa peine.',
    note: '学然后知不足,教然后知困。',
    author: '《礼记·学记》',
  },
  {
    text: 'Le ciel avance avec vigueur: ainsi l’homme de bien se fortifie sans repos.',
    note: '天行健,君子以自强不息。',
    author: '《周易》',
  },
]
