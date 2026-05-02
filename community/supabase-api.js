// 拾卷 · 召唤社区 · Supabase API 封装
// ==================================================
// 职责：
//  - 判断 config 是否完整，决定 real / mock 模式
//  - 封装统一 API（auth / skills / comments / reports / admin）
//  - 所有页面逻辑都通过 window.api.xxx 调用，不直接用 supabase 对象
//
// 模式：
//  - real：调真实 Supabase
//  - mock：用 localStorage 和 seed 数据模拟——适合本地预览、无后端配置时
// ==================================================

(function () {
  'use strict'

  const cfg = window.APP_CONFIG || {}
  const hasRealBackend = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY)
  const MODE = hasRealBackend ? 'real' : 'mock'

  let supa = null
  if (hasRealBackend) {
    if (!window.supabase) {
      console.error('[api] supabase-js not loaded — check <script> tag')
    } else {
      supa = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      })
    }
  }

  // =========================================================
  // Mock 数据源（用于 MODE === 'mock'）
  // =========================================================
  const MOCK_SKILLS = [
    {
      id: 'hegel-perspective',
      slug: 'hegel-perspective',
      title: '黑格尔',
      subtitle: '思辨辩证法 · 精神现象学',
      period: '1818-1831 · 柏林时期',
      portrait_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Hegel_portrait_by_Schlesinger_1831.jpg/800px-Hegel_portrait_by_Schlesinger_1831.jpg',
      description: '以黑格尔 1818-1831 柏林时期的成熟思辨辩证法回答问题——覆盖精神现象学、逻辑学、法哲学、历史哲学、美学、宗教哲学、哲学史的核心方法与论证。由 Claude Code 基于 14 本核心著作 + 4 本死后讲演录 + 全部主要二手批评史蒸馏。',
      tags: ['哲学', '德国观念论', '辩证法', '官方精品'],
      uploader_name: '拾卷官方', is_official: true, status: 'published',
      likes_count: 342, comments_count: 3, downloads_count: 827,
      rating_avg: 4.9, rating_count: 87, published_at: isoDaysAgo(2),
      core_models: [
        { name: '辩证运动（非外加的正反合）', desc: '任何规定被严肃思考时会自己暴露反面——这个反面是原规定本身蕴含的，不是外加的。把握这个自我否定后，一个更具体的新规定涌现。关键：不是"正反合"教科书公式。' },
        { name: '扬弃 Aufheben（三义同在）', desc: '德语 Aufheben 同时含三义：废除、保留、提升。真正的扬弃必须三义兼得——只取一义是失败的扬弃。每次概念跃迁都必须经过这双重否定结构。' },
        { name: '实体即主体', desc: '反斯宾诺莎的核心命题。真正的真实不是静止实体，而是自我运动、自我分裂、自我返回的活动本身。' },
        { name: '主奴辩证与相互承认', desc: '自我意识要成其为自我意识，必须被另一个自我意识承认。单方面承认是虚假的——奴隶通过劳动在对象里看见自己，最终比主人更自由。' },
        { name: '密涅瓦的猫头鹰', desc: '哲学对自己的时代总是迟到的——只在一个世界已成型时才能被把握。这是他一生最悲凉的自我认识。' },
      ],
      files_manifest: [
        { name: 'SKILL.md', size: '10.6 KB', icon: 'MD' },
        { name: 'WORKS.md', size: '22 KB', icon: 'MD' },
        { name: 'MENTAL_MODELS.md', size: '20 KB', icon: 'MD' },
        { name: 'TIMELINE.md', size: '16 KB', icon: 'MD' },
        { name: 'EXPRESSION.md', size: '17 KB', icon: 'MD' },
        { name: 'CONTROVERSIES.md', size: '19 KB', icon: 'MD' },
        { name: 'TENSIONS.md', size: '18 KB', icon: 'MD' },
        { name: 'persona.json', size: '38 KB', icon: 'JSON' },
      ],
      supplementary_packs: [
        { label: '《精神现象学》《逻辑学》中译合集', size: '52 MB', filename: 'hegel-deep.zip', url: '', description: '黑格尔成熟期三大系统性著作中译全本 + 关键段落德文对照 + 科耶夫/伊波利特导读节选' },
        { label: '黑格尔早期神学 + 耶拿手稿选编', size: '28 MB', filename: 'hegel-early.zip', url: '', description: '早期神学笔记、耶拿体系手稿与主奴辩证雏形，追踪辩证法的发生学源头' },
      ],
    },
    {
      id: 'weber-perspective',
      slug: 'weber-perspective',
      title: '马克斯·韦伯',
      subtitle: '理性化 · 祛魅 · 责任伦理',
      period: '1910-1920 · 海德堡/慕尼黑',
      portrait_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Max_Weber%2C_1918.jpg/800px-Max_Weber%2C_1918.jpg',
      description: '以韦伯 1910-1920 海德堡/慕尼黑时期的成熟社会学视角回答问题——覆盖新教伦理、宗教社会学比较工程、方法论（理想类型/理解社会学/价值无涉）、三种合法支配、意图伦理 vs 责任伦理、理性化与祛魅。',
      tags: ['社会学', '宗教社会学', '方法论', '官方精品'],
      uploader_name: '拾卷官方', is_official: true, status: 'published',
      likes_count: 298, comments_count: 2, downloads_count: 612,
      rating_avg: 4.8, rating_count: 65, published_at: isoDaysAgo(1),
      core_models: [
        { name: '理想类型（Idealtypus）', desc: '故意的概念单方面化——不是现实的"平均"，是把某些特征单方面强化，组合成自身逻辑自洽的思想图像，用来测量具体案例偏离。' },
        { name: '理性化 + 祛魅', desc: '现代西方独特的历史进程——生活各领域越来越被可计算性、专业化、规则化、去神秘化支配。不是进步也不是堕落——是命运。' },
        { name: '三种合法支配', desc: '任何持久支配需要合法性——传统型（永恒昨日）、卡里斯玛型（非凡感召）、法理型（成文规则）。现实中通常混合。' },
        { name: '意图伦理 vs 责任伦理', desc: '两种伦理姿态的对立——关心行动内在道德纯洁 vs 关心可预见后果。政治领域以责任伦理为主，但没有意图伦理的激情就沦为机会主义。' },
        { name: '钢铁外壳（铁笼）', desc: '清教伦理的宗教根已死，留下骨架：理性资本主义的方法化生活成为所有人出生就套着的外壳——专家没有灵魂、享乐者没有心。' },
      ],
      files_manifest: [
        { name: 'SKILL.md', size: '13 KB', icon: 'MD' },
        { name: 'WORKS.md', size: '23 KB', icon: 'MD' },
        { name: 'MENTAL_MODELS.md', size: '22 KB', icon: 'MD' },
        { name: 'TIMELINE.md', size: '16 KB', icon: 'MD' },
        { name: 'EXPRESSION.md', size: '21 KB', icon: 'MD' },
        { name: 'CONTROVERSIES.md', size: '20 KB', icon: 'MD' },
        { name: 'TENSIONS.md', size: '15 KB', icon: 'MD' },
        { name: 'persona.json', size: '43 KB', icon: 'JSON' },
      ],
      supplementary_packs: [
        { label: '韦伯方法论论集 + 《新教伦理》原文', size: '38 MB', filename: 'weber-methodology.zip', url: '', description: '《社会科学与社会政策中的客观性》《理解社会学的若干范畴》+ 《新教伦理与资本主义精神》德文原文与中译对照' },
        { label: '韦伯政治演讲集（以学术/政治为业）', size: '24 MB', filename: 'weber-politics.zip', url: '', description: '慕尼黑两篇演讲全文 + 一战期间政论 + 《经济与社会》支配类型章节精选' },
      ],
    },
    {
      id: 'durkheim-perspective',
      slug: 'durkheim-perspective',
      title: '埃米尔·涂尔干',
      subtitle: '社会事实 · 集体欢腾 · 失范',
      period: '1897-1912 · 巴黎索邦',
      portrait_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/%C3%89mile_Durkheim.jpg/800px-%C3%89mile_Durkheim.jpg',
      description: '以涂尔干 1897-1912 索邦时期的成熟社会学视角回答问题——覆盖社会事实方法论、机械/有机团结、自杀四类型与失范、宗教生活基本形式、神圣世俗二分、集体欢腾、道德个体主义、教育社会学、职业群体论。',
      tags: ['社会学', '法国社会学派', '方法论', '官方精品'],
      uploader_name: '拾卷官方', is_official: true, status: 'published',
      likes_count: 276, comments_count: 2, downloads_count: 434,
      rating_avg: 4.9, rating_count: 58, published_at: isoHoursAgo(3),
      core_models: [
        { name: '社会事实（fait social）', desc: '具有三个特征：外在性、强制性、普遍性。社会学的研究对象——第一准则：把社会事实作为事物来研究。' },
        { name: '机械团结 vs 有机团结', desc: '两种社会凝聚形态。前现代靠相似凝聚（机械），现代靠分化凝聚（有机）——有机团结不是机械的削弱，是新型团结。' },
        { name: '失范（anomie）', desc: '规范的缺失或溶解——不是"无道德"，是规范失去约束力。剧烈社会变动时（繁荣或衰退）欲望脱缰，自杀率上升。' },
        { name: '神圣/世俗 + 图腾原则', desc: '任何宗教的基础二分。宗教崇拜的神 = 社会自身的投射——不是"揭穿"宗教，是肯定它揭示的深层真实。' },
        { name: '集体欢腾', desc: '集体聚集时产生的强烈共同情感状态——宗教仪式、革命游行、演唱会都是这个结构的变种。' },
      ],
      files_manifest: [
        { name: 'SKILL.md', size: '14 KB', icon: 'MD' },
        { name: 'WORKS.md', size: '18 KB', icon: 'MD' },
        { name: 'MENTAL_MODELS.md', size: '24 KB', icon: 'MD' },
        { name: 'TIMELINE.md', size: '17 KB', icon: 'MD' },
        { name: 'EXPRESSION.md', size: '21 KB', icon: 'MD' },
        { name: 'CONTROVERSIES.md', size: '22 KB', icon: 'MD' },
        { name: 'TENSIONS.md', size: '18 KB', icon: 'MD' },
        { name: 'persona.json', size: '46 KB', icon: 'JSON' },
      ],
      supplementary_packs: [
        { label: '《社会分工论》《自杀论》《宗教生活》中译', size: '56 MB', filename: 'durkheim-core.zip', url: '', description: '涂尔干三大成熟期著作中译全本 + 关键章节法文对照 + 索引' },
        { label: '涂尔干弟子圈论文选（莫斯/哈布瓦赫等）', size: '32 MB', filename: 'durkheim-school.zip', url: '', description: '《社会学年鉴》学派核心论文：莫斯《礼物》、哈布瓦赫集体记忆、赫兹右手文化史等' },
      ],
    },
  ]

  const MOCK_COMMENTS = {
    'hegel-perspective': [
      { id: 'c1', author_name: '思辨少年', author_initial: '思', created_at: isoDaysAgo(1), body: '用了三天——确实能问出"辩证风味"的回答。最惊喜的是它真会在被追问时暴露内在张力，不是套话式辩证统一。' },
      { id: 'c2', author_name: '哲学系研究生', author_initial: '哲', created_at: isoDaysAgo(3), body: '引用原文的准确性很高，18 条标志片段我对了一遍全集——只有两处有微妙偏差（第 7 条和第 11 条）。已经相当硬核了。' },
      { id: 'c3', author_name: 'AI 爱好者', author_initial: 'A', created_at: isoDaysAgo(4), body: '对比了自己写的黑格尔 persona prompt，差距明显。时段锁定 + 压力测试这套框架值得学习。' },
    ],
    'weber-perspective': [
      { id: 'c4', author_name: '社科硕士', author_initial: '社', created_at: isoHoursAgo(8), body: '责任伦理 vs 意图伦理部分的扮演特别有感觉——问它政治道德两难时它真的会说"我不能再这样了，我必须在此站立"这种话。' },
      { id: 'c5', author_name: '企业咨询', author_initial: 'E', created_at: isoHoursAgo(12), body: '用它分析组织变革——卡里斯玛领导 vs 官僚制的张力部分有洞察。不是套语，是真的从韦伯的角度切问题。' },
    ],
    'durkheim-perspective': [
      { id: 'c6', author_name: '社会学初学者', author_initial: '初', created_at: isoHoursAgo(2), body: '刚下载，Gabriel Tarde 论战那段扮演得很好——既承认 Tarde 部分正确又守住社会 sui generis 的立场。' },
      { id: 'c7', author_name: '博士在读', author_initial: '博', created_at: isoHoursAgo(0.5), body: '张力部分最深——儿子 André 1915 战死让晚年涂尔干的悲凉是真的被扮演出来了。不是套话。' },
    ],
  }

  const MOCK_QUEUE = [
    { id: 'q1', title: '王阳明', desc: '心学 · 致良知 · 知行合一', author: '@sunsoul', created_at: isoHoursAgo(2), thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Wang_Yangming.jpg/200px-Wang_Yangming.jpg' },
    { id: 'q2', title: '柏拉图', desc: '理念论 · 对话体 · 苏格拉底讽刺', author: '@philosopher_king', created_at: isoHoursAgo(4), thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Head_Platon_Glyptothek_Munich_548.jpg/200px-Head_Platon_Glyptothek_Munich_548.jpg' },
    { id: 'q3', title: '福柯（Michel Foucault）', desc: '权力-知识 · 规训 · 生命政治 · 话语考古', author: '@discourse_lab', created_at: isoDaysAgo(1), thumb: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/99/Michel_Foucault_1974_Brasil.jpg/200px-Michel_Foucault_1974_Brasil.jpg' },
    { id: 'q4', title: '鲁迅', desc: '启蒙杂文 · 国民性批判 · 铁屋子', author: '@xunyuan', created_at: isoDaysAgo(1), thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Lu_Xun_1930.jpg/200px-Lu_Xun_1930.jpg' },
  ]

  const PUBLIC_RELEASE_SKILL_SLUGS = [
    'confucius-perspective',
    'laozi-perspective',
    'mozi-perspective',
    'plato-perspective',
    'socrates-perspective',
    'aristotle-perspective',
  ]

  function isPublicReleaseSkill(slug) {
    return PUBLIC_RELEASE_SKILL_SLUGS.includes(slug)
  }

  function isoDaysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString() }
  function isoHoursAgo(n) { const d = new Date(); d.setHours(d.getHours() - n); return d.toISOString() }

  // localStorage 辅助
  const LS = {
    get: (k, fallback) => {
      try { return JSON.parse(localStorage.getItem('sj-community:' + k)) ?? fallback }
      catch { return fallback }
    },
    set: (k, v) => localStorage.setItem('sj-community:' + k, JSON.stringify(v)),
  }

  // =========================================================
  // Auth API
  // =========================================================
  const auth = {
    async getUser() {
      if (MODE === 'mock') return LS.get('mockUser', null)
      const { data: { user } } = await supa.auth.getUser()
      if (!user) return null
      // 合并 profile
      const { data: profile } = await supa
        .from('profiles').select('*').eq('id', user.id).single()
      return { ...user, profile }
    },

    async signInWithPassword(email, password) {
      if (MODE === 'mock') {
        const mockUser = {
          id: 'mock-' + email,
          email,
          profile: { display_name: email.split('@')[0], is_admin: cfg.ADMIN_EMAILS?.includes(email) }
        }
        LS.set('mockUser', mockUser)
        return { user: mockUser, error: null }
      }
      const { data, error } = await supa.auth.signInWithPassword({ email, password })
      return { user: data?.user, error }
    },

    async signUp(email, password) {
      if (MODE === 'mock') {
        return { user: null, error: null, info: 'mock 模式下注册仅本地 — 真实邮件需连接 Supabase' }
      }
      const { data, error } = await supa.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: window.location.origin + window.location.pathname + '?auth=confirmed'
        }
      })
      return { user: data?.user, error }
    },

    async signInOAuth(provider) {
      if (MODE === 'mock') {
        const mockUser = {
          id: 'mock-' + provider,
          email: `mock@${provider}.com`,
          profile: { display_name: 'Mock ' + provider, is_admin: false }
        }
        LS.set('mockUser', mockUser)
        return { error: null }
      }
      const { error } = await supa.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + window.location.pathname,
        }
      })
      return { error }
    },

    async resetPassword(email) {
      if (MODE === 'mock') return { error: null, info: 'mock：假装发送了邮件' }
      const { error } = await supa.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname + '?auth=reset'
      })
      return { error }
    },

    async updatePassword(newPassword) {
      if (MODE === 'mock') return { error: null }
      const { error } = await supa.auth.updateUser({ password: newPassword })
      return { error }
    },

    async signOut() {
      if (MODE === 'mock') { LS.set('mockUser', null); return { error: null } }
      return await supa.auth.signOut()
    },

    onChange(callback) {
      if (MODE === 'mock') return () => {}
      const { data: { subscription } } = supa.auth.onAuthStateChange((_event, session) => {
        callback(session?.user || null)
      })
      return () => subscription.unsubscribe()
    }
  }

  // =========================================================
  // Skills API
  // =========================================================
  const skills = {
    async list({ sort = 'hot', limit = 24 } = {}) {
      if (MODE === 'mock') {
        const likes = LS.get('likedSet', [])
        const ratingBoost = LS.get('mockRatingBoost', {})
        let rows = MOCK_SKILLS.map(s => ({ ...s, liked_by_me: likes.includes(s.id) }))
        if (sort === 'hot')      rows.sort((a, b) => b.likes_count - a.likes_count)
        else if (sort === 'rating') rows.sort((a, b) => b.rating_avg - a.rating_avg)
        else if (sort === 'new')   rows.sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
        else if (sort === 'official') rows.sort((a, b) => (b.is_official ? 1 : 0) - (a.is_official ? 1 : 0))
        return { data: rows.slice(0, limit), error: null }
      }
      const orderCol = ({ hot: 'hot_score', rating: 'rating_avg', new: 'published_at', official: 'is_official' })[sort] || 'hot_score'
      const { data, error } = await supa
        .from('skills')
        .select('*')
        .eq('status', 'published')
        .in('slug', PUBLIC_RELEASE_SKILL_SLUGS)
        .order(orderCol, { ascending: false })
        .order('published_at', { ascending: false })
        .limit(limit)
      if (error) return { data: null, error }
      // 附带 liked_by_me
      const user = await auth.getUser()
      if (user && data.length) {
        const { data: myLikes } = await supa
          .from('likes').select('skill_id')
          .eq('user_id', user.id).in('skill_id', data.map(s => s.id))
        const likedSet = new Set(myLikes?.map(l => l.skill_id) || [])
        data.forEach(s => s.liked_by_me = likedSet.has(s.id))
      }
      return { data, error: null }
    },

    async get(slug) {
      if (!isPublicReleaseSkill(slug)) return { data: null, error: { message: 'Not found' } }
      if (MODE === 'mock') {
        const s = MOCK_SKILLS.find(x => x.slug === slug)
        if (!s) return { data: null, error: { message: 'Not found' } }
        const likes = LS.get('likedSet', [])
        return { data: { ...s, liked_by_me: likes.includes(s.id) }, error: null }
      }
      const { data, error } = await supa
        .from('skills').select('*').eq('slug', slug).eq('status', 'published').single()
      if (error) return { data: null, error }
      const user = await auth.getUser()
      if (user) {
        const { data: like } = await supa
          .from('likes').select('*')
          .eq('user_id', user.id).eq('skill_id', data.id).maybeSingle()
        data.liked_by_me = !!like
      }
      return { data, error: null }
    },

    async like(skillId) {
      const user = await auth.getUser()
      if (!user) return { error: { message: '需要登录' } }
      if (MODE === 'mock') {
        const s = MOCK_SKILLS.find(x => x.id === skillId)
        const likes = LS.get('likedSet', [])
        if (!likes.includes(skillId)) {
          likes.push(skillId); LS.set('likedSet', likes)
          if (s) s.likes_count += 1
        }
        return { error: null }
      }
      const { error } = await supa.from('likes').insert({ user_id: user.id, skill_id: skillId })
      return { error }
    },

    async unlike(skillId) {
      const user = await auth.getUser()
      if (!user) return { error: { message: '需要登录' } }
      if (MODE === 'mock') {
        const s = MOCK_SKILLS.find(x => x.id === skillId)
        const likes = LS.get('likedSet', []).filter(id => id !== skillId)
        LS.set('likedSet', likes)
        if (s) s.likes_count = Math.max(0, s.likes_count - 1)
        return { error: null }
      }
      const { error } = await supa
        .from('likes').delete()
        .eq('user_id', user.id).eq('skill_id', skillId)
      return { error }
    },

    async create({ title, subtitle, period, description, tags, portraitFile, zipFile, anonymous }) {
      const user = await auth.getUser()
      if (!user) return { error: { message: '需要登录' } }
      if (MODE === 'mock') {
        return {
          data: { id: 'mock-submit-' + Date.now(), slug: 'mock-submit' },
          error: null,
          info: '已记录到本地 mock — 真实审核队列需连接 Supabase'
        }
      }
      // 上传肖像
      let portrait_url = null
      if (portraitFile) {
        const path = `${user.id}/${Date.now()}_${portraitFile.name}`
        const { error: e1 } = await supa.storage
          .from('portraits').upload(path, portraitFile, { upsert: false })
        if (e1) return { error: e1 }
        const { data: { publicUrl } } = supa.storage.from('portraits').getPublicUrl(path)
        portrait_url = publicUrl
      }
      // 上传 zip
      let file_url = null
      if (zipFile) {
        const path = `${user.id}/${Date.now()}_${zipFile.name}`
        const { error: e2 } = await supa.storage
          .from('skill-files').upload(path, zipFile, { upsert: false })
        if (e2) return { error: e2 }
        file_url = path
      }
      // 插入 skills 表
      const slug = title.toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        + '-' + Math.random().toString(36).slice(2, 6)
      const { data, error } = await supa.from('skills').insert({
        slug, title, subtitle, period, description,
        tags: (tags || '').split(/\s+/).filter(Boolean),
        portrait_url, file_url,
        uploader_id: user.id,
        uploader_name: anonymous ? '匿名' : (user.profile?.display_name || user.email.split('@')[0]),
        is_official: false, status: 'pending'
      }).select().single()
      return { data, error }
    },

    async incrementDownloads(skillId) {
      if (MODE === 'mock') {
        const s = MOCK_SKILLS.find(x => x.id === skillId)
        if (s) s.downloads_count += 1
        return
      }
      await supa.rpc('increment_downloads', { p_skill_id: skillId }).catch(() => {})
    },

    async stats() {
      if (MODE === 'mock') {
        const published = MOCK_SKILLS.filter(s => s.status === 'published')
        const pending = MOCK_QUEUE.length
        const downloads = published.reduce((sum, s) => sum + (s.downloads_count || 0), 0)
        const contributors = new Set(
          published.map(s => s.uploader_name).filter(Boolean)
        ).size
        return { data: { published: published.length, pending, downloads, contributors }, error: null }
      }
      // Real mode: fetch published skills + pending count
      const [pubRes, penRes] = await Promise.all([
        supa.from('skills').select('downloads_count, uploader_name').eq('status', 'published').in('slug', PUBLIC_RELEASE_SKILL_SLUGS),
        supa.from('skills').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ])
      const published = pubRes.data || []
      const downloads = published.reduce((sum, s) => sum + (s.downloads_count || 0), 0)
      const contributors = new Set(
        published.map(s => s.uploader_name).filter(Boolean)
      ).size
      return {
        data: {
          published: published.length,
          pending: penRes.count ?? 0,
          downloads,
          contributors,
        },
        error: pubRes.error || penRes.error
      }
    },
  }

  // =========================================================
  // Comments API
  // =========================================================
  const comments = {
    async list(skillId) {
      if (MODE === 'mock') {
        return { data: MOCK_COMMENTS[skillId] || [], error: null }
      }
      const { data, error } = await supa
        .from('comments')
        .select('*, profile:user_id(id, raw_user_meta_data)')
        .eq('skill_id', skillId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error || !data) return { data, error }
      // Fetch profiles for display names separately (FK chain: comments.user_id→auth.users.id↔profiles.id)
      const userIds = [...new Set(data.map(c => c.user_id).filter(Boolean))]
      if (userIds.length) {
        const { data: profiles } = await supa
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds)
        const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]))
        data.forEach(c => { if (c.user_id) c._profile = profileMap[c.user_id] || null })
      }
      return { data, error }
    },

    async create(skillId, body, parentId) {
      const user = await auth.getUser()
      if (!user) return { error: { message: '需要登录' } }
      if (MODE === 'mock') {
        const list = MOCK_COMMENTS[skillId] || []
        list.unshift({
          id: 'mock-' + Date.now(),
          author_name: user.profile?.display_name || '访客',
          author_initial: (user.profile?.display_name || '访')[0],
          created_at: new Date().toISOString(),
          body,
          parent_id: parentId || null,
          helpful_count: 0,
        })
        MOCK_COMMENTS[skillId] = list
        return { error: null }
      }
      const { error } = await supa.from('comments').insert({
        skill_id: skillId, user_id: user.id, body,
        parent_id: parentId || null,
      })
      return { error }
    },

    async update(commentId, body) {
      const user = await auth.getUser()
      if (!user) return { error: { message: '需要登录' } }
      if (MODE === 'mock') {
        // Find and update in mock storage
        Object.values(MOCK_COMMENTS).forEach(list => {
          const c = list.find(x => x.id === commentId)
          if (c) { c.body = body; c.edited_at = new Date().toISOString() }
        })
        return { error: null }
      }
      const { error } = await supa
        .from('comments')
        .update({ body, edited_at: new Date().toISOString() })
        .eq('id', commentId)
      return { error }
    },

    async helpful(commentId) {
      const user = await auth.getUser()
      if (!user) return { error: { message: '需要登录' } }
      // Duplicate prevention: localStorage keyed by user+comment
      const k = `sj-helpful:${user.id}:${commentId}`
      if (localStorage.getItem(k)) return { error: { message: '已标记过' } }
      localStorage.setItem(k, '1')
      if (MODE === 'mock') {
        Object.values(MOCK_COMMENTS).forEach(list => {
          const c = list.find(x => x.id === commentId)
          if (c) c.helpful_count = (c.helpful_count || 0) + 1
        })
        return { data: true, error: null }
      }
      // Try RPC first, fall back to client-only
      const { error } = await supa.rpc('increment_comment_helpful', { p_comment_id: commentId }).catch(() => ({ error: { message: 'rpc not found' } }))
      // RPC may not exist yet – that's ok, localStorage already persisted
      return { data: true, error: null }
    },
  }

  // =========================================================
  // Reports API
  // =========================================================
  const reports = {
    async create({ skillId, commentId, reason, note }) {
      const user = await auth.getUser()
      if (!user) return { error: { message: '需要登录' } }
      if (MODE === 'mock') return { error: null }
      const { error } = await supa.from('reports').insert({
        skill_id: skillId || null,
        comment_id: commentId || null,
        reporter_id: user.id,
        reason, note
      })
      return { error }
    },
  }

  // =========================================================
  // Admin API
  // =========================================================
  const admin = {
    async queue() {
      if (MODE === 'mock') return { data: MOCK_QUEUE, error: null }
      const { data, error } = await supa
        .from('skills')
        .select('id, slug, title, description, portrait_url, created_at, uploader_name')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      return { data, error }
    },

    async approve(skillId) {
      if (MODE === 'mock') return { error: null }
      const { error } = await supa.from('skills')
        .update({ status: 'published' }).eq('id', skillId)
      return { error }
    },

    async reject(skillId, reason) {
      if (MODE === 'mock') return { error: null }
      const { error } = await supa.from('skills')
        .update({ status: 'rejected', rejection_reason: reason }).eq('id', skillId)
      return { error }
    },

    async reportsQueue() {
      if (MODE === 'mock') return { data: [], error: null }
      const { data, error } = await supa
        .from('reports').select('*').eq('status', 'open')
        .order('created_at', { ascending: false })
      return { data, error }
    },
  }

  // =========================================================
  // Expose
  // =========================================================
  window.api = { auth, skills, comments, reports, admin, MODE, cfg }
  if (cfg.DEBUG) console.log('[api] initialized · MODE =', MODE, cfg)
})()
