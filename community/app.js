// 拾卷 · 召唤社区 · 主应用逻辑
// ==================================================
// 依赖：window.api（来自 supabase-api.js）
// 职责：渲染 UI + 交互 + Auth 流程
// ==================================================

(function () {
  'use strict'

  // ===== 状态 =====
  const state = {
    sort: 'hot',
    currentSkill: null,
    user: null,
  }

  // ===== DOM 工具 =====
  const $ = sel => document.querySelector(sel)
  const $$ = sel => [...document.querySelectorAll(sel)]
  const h = (tag, attrs = {}, ...children) => {
    const el = document.createElement(tag)
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') el.className = v
      else if (k === 'html') el.innerHTML = v
      else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v)
      else if (v != null) el.setAttribute(k, v)
    })
    children.flat().forEach(c => {
      if (c == null) return
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c)
    })
    return el
  }
  const relative = iso => {
    const d = new Date(iso), now = new Date(), s = (now - d) / 1000
    if (s < 60) return '刚刚'
    if (s < 3600) return `${Math.floor(s / 60)} 分钟前`
    if (s < 86400) return `${Math.floor(s / 3600)} 小时前`
    if (s < 2592000) return `${Math.floor(s / 86400)} 天前`
    return d.toISOString().slice(0, 10)
  }

  // ===== Toast =====
  let toastTimer
  window.showToast = (msg, type = 'info') => {
    const t = $('#toast')
    t.textContent = msg
    t.className = 'toast show ' + type
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => t.classList.remove('show'), 2800)
  }

  // ===== Modal helpers =====
  window.openModal = id => $('#' + id).classList.add('show')
  window.closeModal = id => $('#' + id).classList.remove('show')

  // ===== 路由 =====
  window.go = (page, arg) => {
    $$('.page').forEach(p => p.classList.remove('active'))
    $('#page-' + page).classList.add('active')
    $$('.nav a').forEach(a => a.classList.remove('active'))
    const navA = document.querySelector(`.nav a[data-page="${page}"]`)
    if (navA) navA.classList.add('active')
    if (page === 'admin') renderAdmin()
    if (page === 'home') renderGrid()
    if (page === 'detail' && arg) openDetail(arg)
    window.scrollTo(0, 0)
  }

  // ===== 顶部横幅：mock 模式提示 =====
  function renderBanner() {
    if (api.MODE === 'mock') {
      const banner = h('div', { class: 'banner-mock' },
        '本地预览模式 · 数据不持久 · 接入真实后端请参见 ',
        h('a', { href: 'SUPABASE_SETUP.md', target: '_blank' }, 'SUPABASE_SETUP.md')
      )
      document.body.insertBefore(banner, document.body.firstChild)
    }
  }

  // ===== Auth UI =====
  async function refreshAuthUI() {
    state.user = await api.auth.getUser()
    const container = $('#authSlot')
    container.innerHTML = ''
    if (state.user) {
      const name = state.user.profile?.display_name || state.user.email?.split('@')[0] || '我'
      const isAdmin = state.user.profile?.is_admin
      container.appendChild(h('div', { class: 'user-menu' },
        h('div', { class: 'avatar', title: state.user.email }, name[0].toUpperCase()),
        h('span', { class: 'user-name' }, name),
        isAdmin ? h('span', { class: 'badge-admin' }, '管理员') : null,
        h('button', { class: 'btn btn-ghost', onClick: doSignOut }, '退出'),
      ))
    } else {
      container.appendChild(h('button', { class: 'btn btn-primary', onClick: () => openModal('authModal') }, '登录 / 注册'))
    }
    // 管理员 tab 可见性
    const adminNav = document.querySelector('.nav a[data-page="admin"]')
    if (adminNav) adminNav.style.display = (state.user?.profile?.is_admin || api.MODE === 'mock') ? '' : 'none'
  }

  async function doSignOut() {
    await api.auth.signOut()
    showToast('已退出登录')
    await refreshAuthUI()
    renderGrid()
  }

  // ===== 认证模态框 =====
  function setupAuthModal() {
    const tabs = ['signin', 'signup', 'reset']
    const switchTab = (tab) => {
      $$('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab))
      $$('.auth-form').forEach(f => f.classList.toggle('active', f.dataset.tab === tab))
    }
    $$('.auth-tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)))

    // Sign In
    $('#authSignIn').addEventListener('submit', async e => {
      e.preventDefault()
      const email = $('#siEmail').value.trim()
      const password = $('#siPassword').value
      if (!email || !password) return showToast('请填写完整', 'error')
      showToast('登录中...')
      const { user, error } = await api.auth.signInWithPassword(email, password)
      if (error) return showToast('登录失败：' + error.message, 'error')
      showToast('登录成功')
      closeModal('authModal')
      await refreshAuthUI()
      renderGrid()
    })

    // Sign Up
    $('#authSignUp').addEventListener('submit', async e => {
      e.preventDefault()
      const email = $('#suEmail').value.trim()
      const password = $('#suPassword').value
      const password2 = $('#suPassword2').value
      if (!email || !password) return showToast('请填写完整', 'error')
      if (password !== password2) return showToast('两次密码不一致', 'error')
      if (password.length < 8) return showToast('密码至少 8 位', 'error')
      const { user, error } = await api.auth.signUp(email, password)
      if (error) return showToast('注册失败：' + error.message, 'error')
      closeModal('authModal')
      openModal('signupSuccessModal')
    })

    // Reset Password
    $('#authReset').addEventListener('submit', async e => {
      e.preventDefault()
      const email = $('#rpEmail').value.trim()
      if (!email) return showToast('请填写邮箱', 'error')
      const { error } = await api.auth.resetPassword(email)
      if (error) return showToast('发送失败：' + error.message, 'error')
      closeModal('authModal')
      openModal('resetSentModal')
    })

    // OAuth
    $('#oauthGoogle').addEventListener('click', async () => {
      const { error } = await api.auth.signInOAuth('google')
      if (error) showToast('Google 登录失败：' + error.message, 'error')
      // OAuth 重定向后由 onChange 处理
    })
    $('#oauthGithub').addEventListener('click', async () => {
      const { error } = await api.auth.signInOAuth('github')
      if (error) showToast('GitHub 登录失败：' + error.message, 'error')
    })

    // Disable OAuth buttons based on config
    if (!api.cfg.AUTH?.ENABLE_GOOGLE) $('#oauthGoogle').style.display = 'none'
    if (!api.cfg.AUTH?.ENABLE_GITHUB) $('#oauthGithub').style.display = 'none'
  }

  // ===== 首页渲染 =====
  async function renderGrid() {
    const grid = $('#skillGrid')
    grid.innerHTML = '<div class="loading">加载中...</div>'
    const { data, error } = await api.skills.list({ sort: state.sort })
    if (error) { grid.innerHTML = `<div class="error">加载失败：${error.message}</div>`; return }
    if (!data || !data.length) { grid.innerHTML = '<div class="empty">暂无 skill</div>'; return }
    grid.innerHTML = ''
    data.forEach(s => grid.appendChild(renderSkillCard(s)))
    $('#skillCount').textContent = data.length
  }

  function renderSkillCard(s) {
    const badges = []
    if (s.is_official) badges.push(h('div', { class: 'badge badge-official' }, 'OFFICIAL'))
    const isNew = new Date() - new Date(s.published_at) < 86400000 * 2
    if (isNew && !s.is_official) badges.push(h('div', { class: 'badge badge-new' }, 'NEW'))

    return h('div', { class: 'skill-card', onClick: () => openDetail(s.slug) },
      h('div', { class: 'skill-portrait' },
        h('img', { src: s.portrait_url, alt: s.title, onError(e) { e.target.style.display = 'none' } }),
        h('div', { class: 'skill-badges' }, ...badges),
      ),
      h('div', { class: 'skill-body' },
        h('div', { class: 'skill-eyebrow' }, (s.period || '').split('·')[0]?.trim() || ''),
        h('div', { class: 'skill-title' }, s.title),
        h('div', { class: 'skill-subtitle' }, s.subtitle || ''),
        h('div', { class: 'skill-desc' }, s.description || ''),
        h('div', { class: 'skill-tags' },
          ...(s.tags || []).slice(0, 3).map(t => h('div', { class: 'tag' }, t))
        ),
        h('div', { class: 'skill-meta' },
          h('div', { class: 'meta-stats' },
            h('div', { class: 'meta-stat', html: svgHeart() + ' ' + (s.likes_count || 0) }),
            h('div', { class: 'meta-stat', html: svgComment() + ' ' + (s.comments_count || 0) }),
            h('div', { class: 'meta-stat', html: svgDownload() + ' ' + (s.downloads_count || 0) }),
          ),
          h('div', { class: 'meta-author' }, relative(s.published_at)),
        )
      )
    )
  }

  // ===== 详情页 =====
  async function openDetail(slug) {
    go('detail')
    const main = $('#detailMain')
    const side = $('#detailSide')
    main.innerHTML = '<div class="loading">加载中...</div>'
    side.innerHTML = ''
    const { data: s, error } = await api.skills.get(slug)
    if (error || !s) { main.innerHTML = `<div class="error">${error?.message || '未找到'}</div>`; return }
    state.currentSkill = s
    renderDetail(s)
    // 加载评论
    const { data: comments } = await api.comments.list(s.id)
    renderComments(s, comments || [])
  }

  function renderDetail(s) {
    $('#detailSide').innerHTML = ''
    $('#detailSide').appendChild(h('div', { class: 'detail-portrait' },
      h('img', { src: s.portrait_url, alt: s.title })))
    const downloadBtn = h('button', { class: 'action-btn primary', onClick: () => doDownload(s) })
    downloadBtn.innerHTML = svgDownload() + ' 下载 Skill'
    const likeBtn = h('button', {
      class: 'action-btn like' + (s.liked_by_me ? ' active' : ''),
      id: 'likeBtn', onClick: () => toggleLike(s)
    })
    likeBtn.innerHTML = svgHeart() + ' ' + (s.liked_by_me ? '已点赞' : '点赞') + ' · ' + (s.likes_count || 0)
    const shareBtn = h('button', { class: 'action-btn secondary', onClick: () => doShare(s) })
    shareBtn.innerHTML = svgShare() + ' 分享'
    const reportBtn = h('button', { class: 'action-btn secondary', onClick: () => openReport(s) })
    reportBtn.innerHTML = svgFlag() + ' 举报'
    $('#detailSide').appendChild(h('div', { class: 'detail-actions' },
      downloadBtn, likeBtn,
      h('div', { class: 'action-row' }, shareBtn, reportBtn)
    ))
    $('#detailSide').appendChild(h('div', { class: 'detail-info' },
      infoItem('Period', s.period),
      infoItem('Models', (s.core_models?.length || 0)),
      infoItem('Rating', (s.rating_avg || 0) + ' / 5'),
      infoItem('Likes', String(s.likes_count || 0)),
      infoItem('Downloads', String(s.downloads_count || 0)),
      infoItem('Published', relative(s.published_at)),
    ))

    $('#detailMain').innerHTML = ''
    $('#detailMain').appendChild(h('h1', {}, s.title))
    $('#detailMain').appendChild(h('div', { class: 'detail-period' },
      h('span', {}, h('span', { class: 'label' }, '时段'), h('span', { class: 'value' }, s.period || '')),
      h('span', {}, h('span', { class: 'label' }, '蒸馏'), h('span', { class: 'value' }, s.uploader_name || '匿名')),
      h('span', {}, h('span', { class: 'label' }, '发布'), h('span', { class: 'value' }, relative(s.published_at))),
      h('span', {}, h('span', { class: 'label' }, '评分'), h('span', { class: 'value' }, (s.rating_avg || 0) + ' / 5'))
    ))
    $('#detailMain').appendChild(h('div', { class: 'detail-desc' }, s.description))

    // 声明 · 低调但必有 —— 防止误解为本人真实观点
    $('#detailMain').appendChild(h('div', { class: 'detail-disclaimer' },
      h('strong', {}, '* '), '虚拟人格模型 · 基于公开著作蒸馏，不代表本人立场；肖像为 AI 艺术再现；AI 回答不可作学术引用。'
    ))

    // 心智模型
    const modelsSec = h('div', { class: 'section' },
      h('h3', {}, '核心心智模型'),
      h('div', { class: 'model-list' },
        ...(s.core_models || []).map((m, i) => h('div', { class: 'model-item' },
          h('div', { class: 'model-name' }, String(i + 1).padStart(2, '0') + ' · ' + m.name),
          h('div', { class: 'model-desc' }, m.desc)
        ))
      )
    )
    $('#detailMain').appendChild(modelsSec)

    // 文件
    const filesSec = h('div', { class: 'section' },
      h('h3', {}, '文件结构'),
      h('div', { class: 'files-list' },
        ...(s.files_manifest || []).map(f => h('div', { class: 'file-item',
          onClick: () => showToast(f.name + ' 预览将在下一版支持')
        },
          h('div', { class: 'file-icon' }, f.icon || 'MD'),
          h('div', { class: 'file-info' },
            h('div', { class: 'file-name' }, f.name),
            h('div', { class: 'file-size' }, f.size)
          )
        ))
      )
    )
    $('#detailMain').appendChild(filesSec)

    // 补充资料包（原典 / 后世评注等深度资料）
    const packs = s.supplementary_packs || []
    if (packs.length) {
      const packsSec = h('div', { class: 'section supplementary-packs' },
        h('h3', {}, '补充资料包 · 深度包'),
        h('div', { class: 'pack-list' },
          ...packs.map(p => h('div', { class: 'pack-card' },
            h('div', { class: 'pack-icon' }, '📦'),
            h('div', { class: 'pack-body' },
              h('div', { class: 'pack-label' }, p.label || '未命名资料包'),
              h('div', { class: 'pack-meta' },
                h('span', { class: 'pack-size' }, p.size || '—'),
                h('span', { class: 'pack-meta-sep' }, '·'),
                h('span', {}, '下载后在拾卷导入作为补充资料'),
              ),
              p.description ? h('div', { class: 'pack-desc' }, p.description) : null,
              h('div', { class: 'pack-actions' },
                h('button', {
                  class: 'pack-download-btn',
                  onClick: () => downloadPack(p)
                }, '下载 →')
              )
            )
          ))
        ),
        h('div', { class: 'pack-hint' },
          h('span', { class: 'pack-hint-icon' }, '💡'),
          h('span', {}, '下载后：在拾卷『召唤』→ 人物详情 → 补充资料 → 拖入 zip 即可')
        )
      )
      $('#detailMain').appendChild(packsSec)
    }

    // 模型建议（哪些模型最贴合这个人物 + 兼容性）
    const hint = MODEL_HINTS[s.slug]
    if (hint) {
      const modelSec = h('div', { class: 'section' },
        h('h3', {}, '模型建议'),
        h('div', { class: 'model-hint' },
          h('div', { class: 'model-hint-row' },
            h('span', { class: 'model-hint-label' }, '最贴合'),
            h('span', { class: 'model-hint-best' }, hint.best),
          ),
          h('div', { class: 'model-hint-reason' }, hint.reason),
          hint.secondary && hint.secondary.length ? h('div', { class: 'model-hint-row' },
            h('span', { class: 'model-hint-label' }, '次选'),
            h('span', { class: 'model-hint-secondary' }, hint.secondary.join(' · ')),
          ) : null,
        ),
        h('div', { class: 'model-compat' },
          h('div', { class: 'model-compat-row good' },
            h('span', { class: 'dot' }, '✓'),
            h('span', { class: 'compat-label' }, '可用'),
            h('span', { class: 'compat-list' }, 'Claude Opus/Sonnet 4.7 · GPT-5.5 · DeepSeek V4 · Kimi K2.5 · Gemini 3.1 · GLM-5.1 · Claude Haiku 4.5'),
          ),
          h('div', { class: 'model-compat-row bad' },
            h('span', { class: 'dot' }, '✕'),
            h('span', { class: 'compat-label' }, '不建议'),
            h('span', { class: 'compat-list' }, '豆包系列（32K 上下文，多轮对话易溢出）'),
          ),
          h('div', { class: 'model-compat-note' }, '加载大小约 ~15 KB / ~10-15K tokens（仅 SKILL.md；其他 7 个文件由 Claude Code 运行时按需加载）'),
        ),
      )
      $('#detailMain').appendChild(modelSec)
    }
  }

  // 模型建议（按 slug 映射到推荐模型 + 语言/风格匹配理由）
  // 这个映射是感性推荐——基于人物写作语体、论证复杂度、中/西语境偏好
  const MODEL_HINTS = {
    'kant-perspective':        { best: 'Claude Opus 4.7', secondary: ['Claude Sonnet 4.7', 'GPT-5.5'],  reason: '康德的德式长复句 + 三大批判系统哲学，需要最强推理和长文本连贯性' },
    'hegel-perspective':       { best: 'Claude Opus 4.7', secondary: ['Claude Sonnet 4.7', 'GPT-5.5'],  reason: '黑格尔的辩证法螺旋 + 精神现象学的密度，非一般模型可承受' },
    'weber-perspective':       { best: 'Claude Opus 4.7', secondary: ['Claude Sonnet 4.7', 'GPT-5.5'],  reason: '韦伯的"理想类型"方法 + 价值无涉 + 责任伦理的思辨张力' },
    'durkheim-perspective':    { best: 'Claude Sonnet 4.7', secondary: ['GPT-5.5', 'Claude Opus 4.7'],  reason: '涂尔干法式社会学的冷静客观笔法，Sonnet 够用' },
    'plato-perspective':       { best: 'Claude Sonnet 4.7', secondary: ['GPT-5.5', 'Claude Opus 4.7'],  reason: '古希腊对话体 + 苏格拉底式反诘，对话体 Sonnet 表现好' },
    'aristotle-perspective':   { best: 'Claude Sonnet 4.7', secondary: ['GPT-5.5', 'Claude Opus 4.7'],  reason: '亚里士多德讲学式分类学 + 四因论证链条' },
    'confucius-perspective':   { best: 'Kimi K2.5',         secondary: ['Claude Opus 4.7', 'DeepSeek V4'], reason: '孔子的古文语录简练、对话体、中文语境——Kimi 中文古文语感最贴合' },
    'laozi-perspective':       { best: 'Claude Opus 4.7',   secondary: ['Kimi K2.5', 'DeepSeek V4'],    reason: '老子 81 章极简悖论诗，需要最强的诗意把控 + 哲学深度' },
    'wangyangming-perspective':{ best: 'Kimi K2.5',         secondary: ['Claude Opus 4.7', 'DeepSeek V4'], reason: '王阳明《传习录》问答体 + 明代白话，Kimi 对晚期古文最熟' },
  }

  // ===== 评论 =====
  let replyTarget = null  // { commentId } 正在回复的评论

  function renderComments(s, comments) {
    replyTarget = null
    // Separate top-level vs replies
    const top = (comments || []).filter(c => !c.parent_id)
    const replies = (comments || []).filter(c => c.parent_id)

    const sec = h('div', { class: 'section' },
      h('h3', {}, '评论 · ' + comments.length),
      h('div', { class: 'comment-input' },
        h('textarea', { id: 'cmtInput', placeholder: state.user ? '分享你的使用体验...' : '登录后发表评论' }),
        h('div', { class: 'comment-input-actions' },
          h('span', { class: 'comment-input-hint' }, '支持 Markdown · 发布后可编辑 24 小时'),
          h('button', {
            class: 'btn btn-primary',
            onClick: () => postComment(s.id)
          }, '发布评论')
        )
      ),
      h('div', { class: 'comment-list' },
        ...top.map(c => {
          const childReplies = replies.filter(r => r.parent_id === c.id)
          return h('div', {},
            renderCommentItem(c, s),
            ...childReplies.map(r => renderCommentItem(r, s, true))
          )
        })
      )
    )
    $('#detailMain').appendChild(sec)
  }

  function renderCommentItem(c, s, isReply) {
    // Normalize: real mode has _profile.display_name, mock has author_name
    const profileName = c._profile?.display_name || c.profile?.display_name || c.author_name
    const name = profileName || '匿名'
    const initial = c.author_initial || name[0] || '?'
    const isOwn = state.user && (
      (c.user_id && state.user.id === c.user_id) ||
      (c.author_name && state.user.profile?.display_name === c.author_name)
    )
    const canEdit = isOwn && new Date() - new Date(c.created_at) < 86400000
    const wasEdited = !!c.edited_at

    const helpfulCount = c.helpful_count || 0
    const helpfulKey = state.user ? `sj-helpful:${state.user.id}:${c.id}` : null
    const alreadyHelpful = helpfulKey ? !!localStorage.getItem(helpfulKey) : false

    const body = h('div', { class: 'comment-body' },
      h('div', { class: 'comment-head' },
        h('div', { class: 'comment-author' }, name),
        h('div', { class: 'comment-time' },
          relative(c.created_at) + (wasEdited ? ' · (已编辑)' : '')
        )
      ),
      h('div', {
        class: 'comment-text',
        id: 'cmt-text-' + c.id,
      }, c.body),
      // Edit textarea (hidden by default)
      h('div', {
        class: 'comment-edit-area',
        id: 'cmt-edit-' + c.id,
        style: 'display:none',
      },
        h('textarea', { id: 'cmt-edit-ta-' + c.id }, c.body),
        h('div', { class: 'comment-input-actions', style: 'border-top:none;padding-top:0;margin-top:8px' },
          h('button', { class: 'btn btn-ghost', onClick: () => cancelEdit(c.id) }, '取消'),
          h('button', { class: 'btn btn-primary', onClick: () => submitEdit(c.id) }, '保存')
        )
      ),
      // Reply box (hidden by default)
      h('div', {
        class: 'comment-reply-box',
        id: 'cmt-reply-' + c.id,
        style: 'display:none',
      },
        h('textarea', { id: 'cmt-reply-ta-' + c.id, placeholder: '回复 ' + name + '...', rows: 2 }),
        h('div', { class: 'comment-input-actions', style: 'border-top:none;padding-top:0;margin-top:8px' },
          h('button', { class: 'btn btn-ghost', onClick: () => toggleReply(c.id, false) }, '取消'),
          h('button', { class: 'btn btn-primary', onClick: () => submitReply(s.id, c.id) }, '回复')
        )
      ),
      h('div', { class: 'comment-actions' },
        h('div', {
          class: 'comment-action' + (alreadyHelpful ? ' helpful-active' : ''),
          onClick: () => doCommentHelpful(c, alreadyHelpful)
        }, '有用' + (helpfulCount > 0 ? ' · ' + helpfulCount : '')),
        h('div', { class: 'comment-action', onClick: () => toggleReply(c.id, true) }, '回复'),
        canEdit ? h('div', { class: 'comment-action', onClick: () => startEdit(c.id) }, '编辑') : null,
        h('div', { class: 'comment-action', onClick: () => reportComment(c) }, '举报')
      )
    )

    return h('div', {
      class: 'comment' + (isReply ? ' comment-reply' : ''),
      id: 'comment-' + c.id,
    },
      h('div', { class: 'comment-avatar' }, initial),
      body,
    )
  }

  function doCommentHelpful(c, already) {
    if (!state.user) return openModal('authModal')
    if (already) { showToast('已标记过'); return }
    api.comments.helpful(c.id).then(() => {
      c.helpful_count = (c.helpful_count || 0) + 1
      // Re-render
      openDetail(state.currentSkill.slug)
    }).catch(() => {})
  }

  function toggleReply(commentId, show) {
    const box = document.getElementById('cmt-reply-' + commentId)
    if (!box) return
    replyTarget = show ? { commentId } : null
    box.style.display = show ? 'block' : 'none'
    if (show) {
      const ta = document.getElementById('cmt-reply-ta-' + commentId)
      if (ta) setTimeout(() => ta.focus(), 100)
    }
  }

  async function submitReply(skillId, parentId) {
    if (!state.user) return openModal('authModal')
    const ta = document.getElementById('cmt-reply-ta-' + parentId)
    if (!ta) return
    const body = ta.value.trim()
    if (!body) return showToast('回复不能为空', 'error')
    const { error } = await api.comments.create(skillId, body, parentId)
    if (error) return showToast('发布失败：' + error.message, 'error')
    showToast('回复已发布')
    openDetail(state.currentSkill.slug)
  }

  function startEdit(commentId) {
    const textEl = document.getElementById('cmt-text-' + commentId)
    const editEl = document.getElementById('cmt-edit-' + commentId)
    if (textEl) textEl.style.display = 'none'
    if (editEl) {
      editEl.style.display = 'block'
      const ta = document.getElementById('cmt-edit-ta-' + commentId)
      if (ta) setTimeout(() => ta.focus(), 100)
    }
  }

  function cancelEdit(commentId) {
    const textEl = document.getElementById('cmt-text-' + commentId)
    const editEl = document.getElementById('cmt-edit-' + commentId)
    if (textEl) textEl.style.display = ''
    if (editEl) editEl.style.display = 'none'
  }

  async function submitEdit(commentId) {
    const ta = document.getElementById('cmt-edit-ta-' + commentId)
    if (!ta) return
    const body = ta.value.trim()
    if (!body) return showToast('不能为空', 'error')
    const { error } = await api.comments.update(commentId, body)
    if (error) return showToast('编辑失败：' + error.message, 'error')
    showToast('已更新')
    openDetail(state.currentSkill.slug)
  }

  function reportComment(c) {
    if (!state.user) return openModal('authModal')
    openModal('reportModal')
    $('#reportModal').dataset.commentId = c.id
    // Clear skill report state
    delete $('#reportModal').dataset.skillId
    // Update reason list for comment reports
    const sel = $('#reportReason')
    sel.innerHTML = ''
    ;(api.cfg.REPORT_REASONS || ['其他']).forEach(r =>
      sel.appendChild(h('option', { value: r }, r)))
  }

  async function postComment(skillId) {
    if (!state.user) return openModal('authModal')
    const input = $('#cmtInput')
    const body = input.value.trim()
    if (!body) return showToast('评论不能为空', 'error')
    const { error } = await api.comments.create(skillId, body)
    if (error) return showToast('发布失败：' + error.message, 'error')
    input.value = ''
    showToast('评论已发布')
    openDetail(state.currentSkill.slug)
  }

  async function toggleLike(s) {
    if (!state.user) return openModal('authModal')
    if (s.liked_by_me) {
      const { error } = await api.skills.unlike(s.id)
      if (error) return showToast('取消失败：' + error.message, 'error')
      s.liked_by_me = false; s.likes_count = Math.max(0, s.likes_count - 1)
    } else {
      const { error } = await api.skills.like(s.id)
      if (error) return showToast('点赞失败：' + error.message, 'error')
      s.liked_by_me = true; s.likes_count += 1
    }
    renderDetail(s)
    renderComments(s, await api.comments.list(s.id).then(r => r.data || []))
  }

  async function doDownload(s) {
    await api.skills.incrementDownloads(s.id)
    if (s.file_url) {
      showToast('准备下载...')
      // 实际下载通过 Supabase Storage signed URL；此处简化
      window.open(s.file_url, '_blank')
    } else {
      showToast('这是官方精品 skill，请从 GitHub 仓库下载（开发中）')
    }
  }

  // 补充资料包下载：URL 为空或 #pending 占位时提示"正在整理"
  function downloadPack(p) {
    const url = (p && p.url || '').trim()
    if (!url || url === '#pending' || url === '#placeholder') {
      showToast('包正在整理中，请稍候', 'info')
      return
    }
    showToast('准备下载 · ' + (p.filename || p.label || '资料包'))
    window.open(url, '_blank')
  }

  function doShare(s) {
    const url = window.location.origin + window.location.pathname + '#' + s.slug
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => showToast('链接已复制'))
    } else {
      showToast(url)
    }
  }

  function openReport(s) {
    openModal('reportModal')
    const modal = $('#reportModal')
    modal.dataset.skillId = s.id
    delete modal.dataset.commentId
    // 填充原因列表
    const sel = $('#reportReason')
    sel.innerHTML = ''
    ;(api.cfg.REPORT_REASONS || ['其他']).forEach(r =>
      sel.appendChild(h('option', { value: r }, r)))
  }

  window.submitReport = async () => {
    if (!state.user) { closeModal('reportModal'); return openModal('authModal') }
    const modal = $('#reportModal')
    const skillId = modal.dataset.skillId
    const commentId = modal.dataset.commentId
    const reason = $('#reportReason').value
    const note = $('#reportNote').value.trim()
    if (!reason && !commentId) return showToast('请选择原因', 'error')
    const { error } = await api.reports.create({ skillId: skillId || null, commentId: commentId || null, reason, note })
    closeModal('reportModal')
    if (error) return showToast('举报失败：' + error.message, 'error')
    showToast('举报已提交 · 审核团队会在 24 小时内处理')
  }

  // ===== 上传表单 =====
  function setupUploadForm() {
    $('#uploadForm').addEventListener('submit', async e => {
      e.preventDefault()
      if (!state.user) return openModal('authModal')
      const title = $('#upTitle').value.trim()
      const subtitle = $('#upSubtitle').value.trim()
      const period = $('#upPeriod').value.trim()
      const description = $('#upDesc').value.trim()
      const tags = $('#upTags').value.trim()
      const anonymous = $('#upAnon').value === 'anon'
      const portraitFile = $('#upImg').files[0]
      const zipFile = $('#upZip').files[0]
      if (!title || !description || !zipFile) return showToast('请填写必填项', 'error')
      showToast('上传中...')
      const { data, error, info } = await api.skills.create({
        title, subtitle, period, description, tags,
        portraitFile, zipFile, anonymous
      })
      if (error) return showToast('提交失败：' + error.message, 'error')
      e.target.reset()
      go('home')
      openModal('submitSuccessModal')
      if (info) setTimeout(() => showToast(info), 3000)
    })
  }

  // ===== 管理员页 =====
  async function renderAdmin() {
    if (!state.user?.profile?.is_admin && api.MODE !== 'mock') {
      $('#queueList').innerHTML = '<div class="error">需要管理员权限。在 Supabase 的 profiles 表中把 is_admin 设为 true。</div>'
      return
    }
    $('#queueList').innerHTML = '<div class="loading">加载中 . . .</div>'
    const { data, error } = await api.admin.queue()
    if (error) { $('#queueList').innerHTML = `<div class="error">${error.message}</div>`; return }
    if (!data || !data.length) { $('#queueList').innerHTML = '<div class="empty">审核队列为空</div>'; return }
    $('#queueList').innerHTML = ''
    data.forEach(q => $('#queueList').appendChild(h('div', { class: 'queue-item' },
      h('div', { class: 'queue-thumb' }, h('img', { src: q.thumb || q.portrait_url, alt: q.title })),
      h('div', { class: 'queue-info' },
        h('h4', {}, q.title),
        h('p', {}, q.desc || q.description || ''),
        h('div', { class: 'meta' },
          (q.author || q.uploader_name || '—') + ' · ' + relative(q.created_at))
      ),
      h('div', { class: 'queue-actions' },
        h('button', { class: 'btn-approve', onClick: async () => {
          const { error } = await api.admin.approve(q.id)
          if (error) return showToast(error.message, 'error')
          showToast('已通过 · ' + q.title)
          renderAdmin()
        } }, '通过'),
        h('button', { class: 'btn-view', onClick: () => showToast('查看 · ' + q.title) }, '查看'),
        h('button', { class: 'btn-reject', onClick: async () => {
          const reason = prompt('驳回原因：')
          if (!reason) return
          const { error } = await api.admin.reject(q.id, reason)
          if (error) return showToast(error.message, 'error')
          showToast('已驳回')
          renderAdmin()
        } }, '驳回')
      )
    )))
  }

  // ===== Hero Stats =====
  async function loadHeroStats() {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val }
    const { data, error } = await api.skills.stats()
    if (error || !data) return
    set('statPublished', data.published || 0)
    set('statPending', data.pending || 0)
    set('statDownloads', formatNum(data.downloads || 0))
    set('statContributors', data.contributors || 0)
  }
  function formatNum(n) { return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : String(n) }

  // ===== 榜单 Tab =====
  function setupRankTabs() {
    $$('.rank-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.rank-tab').forEach(t => t.classList.remove('active'))
        tab.classList.add('active')
        state.sort = tab.dataset.sort
        renderGrid()
      })
    })
  }

  // ===== 监听外部 modal 关闭 =====
  function setupModals() {
    $$('.modal-overlay').forEach(o => {
      o.addEventListener('click', e => {
        if (e.target === o) o.classList.remove('show')
      })
    })
  }

  // ===== SVG Icons（精致 outline） =====
  const svgStyle = 'stroke:currentColor;fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;vertical-align:middle;'
  function svgHeart(s = 12) {
    return `<svg viewBox="0 0 24 24" style="width:${s}px;height:${s}px;${svgStyle}"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
  }
  function svgComment(s = 12) {
    return `<svg viewBox="0 0 24 24" style="width:${s}px;height:${s}px;${svgStyle}"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
  }
  function svgDownload(s = 12) {
    return `<svg viewBox="0 0 24 24" style="width:${s}px;height:${s}px;${svgStyle}"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>`
  }
  function svgShare(s = 12) {
    return `<svg viewBox="0 0 24 24" style="width:${s}px;height:${s}px;${svgStyle}"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`
  }
  function svgFlag(s = 12) {
    return `<svg viewBox="0 0 24 24" style="width:${s}px;height:${s}px;${svgStyle}"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`
  }

  function infoItem(label, value) {
    return h('div', { class: 'info-item' },
      h('span', {}, label),
      h('strong', {}, String(value))
    )
  }

  // ===== 初始化 =====
  async function init() {
    renderBanner()
    setupRankTabs()
    setupAuthModal()
    setupUploadForm()
    setupModals()
    await refreshAuthUI()
    if (api.MODE === 'real') {
      api.auth.onChange(async () => {
        await refreshAuthUI()
        renderGrid()
      })
    }

    // 加载实时 hero stats
    loadHeroStats()

    // URL hash 路由：#slug 打开详情
    const hash = window.location.hash.slice(1)
    if (hash) {
      openDetail(hash)
    } else {
      renderGrid()
    }

    // 检测 OAuth 回调
    const params = new URLSearchParams(window.location.search)
    if (params.get('auth') === 'confirmed') {
      showToast('邮箱已确认 · 欢迎登录', 'success')
      history.replaceState({}, '', window.location.pathname)
    }
    if (params.get('auth') === 'reset') {
      openModal('newPasswordModal')
      history.replaceState({}, '', window.location.pathname)
    }
  }

  // 更新密码（重设流程）
  window.submitNewPassword = async () => {
    const pw = $('#npPassword').value
    const pw2 = $('#npPassword2').value
    if (pw !== pw2) return showToast('两次密码不一致', 'error')
    if (pw.length < 8) return showToast('密码至少 8 位', 'error')
    const { error } = await api.auth.updatePassword(pw)
    if (error) return showToast(error.message, 'error')
    closeModal('newPasswordModal')
    showToast('密码已更新', 'success')
    await refreshAuthUI()
  }

  document.addEventListener('DOMContentLoaded', init)
})()
