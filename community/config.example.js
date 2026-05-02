// 拾卷 · 召唤社区 · 前端配置
// ==================================================
// 使用说明：
//   1. 复制此文件为 config.js
//   2. 填入你 Supabase 项目的 URL 和 anon key
//   3. 如果暂不接后端，保持 null，页面会降级到 mock 模式
//
// 找 URL 和 key：
//   Supabase Dashboard → 你的项目 → Settings → API
//   - Project URL          → SUPABASE_URL
//   - anon public key      → SUPABASE_ANON_KEY
//
// 注意：config.js 不要提交到 git（已在 .gitignore 里）
// ==================================================

window.APP_CONFIG = {
  // Supabase 配置（必填，若为 null 则走 mock 模式）
  SUPABASE_URL:       null, // 例：'https://abcdefg.supabase.co'
  SUPABASE_ANON_KEY:  null, // 例：'eyJhbGciOi...'

  // 站点基本信息
  SITE_NAME:          '拾卷 · 召唤社区',
  SITE_DESCRIPTION:   '召唤一个名家的思想方式与你对话',
  CONTACT_EMAIL:      'lickswan@gmail.com',

  // 注册策略
  AUTH: {
    ALLOW_SIGNUP:     true,      // 是否开放注册
    REQUIRE_EMAIL_CONFIRM: true, // 注册后是否必须点邮件链接确认
    ENABLE_GOOGLE:    true,      // Google OAuth（需在 Supabase Dashboard 配）
    ENABLE_GITHUB:    true,      // GitHub OAuth（同上）
    ENABLE_WECHAT:    false,     // 微信登录（需要企业认证，暂不开）
  },

  // 上传限制
  UPLOAD: {
    MAX_ZIP_SIZE_MB:  20,
    MAX_IMG_SIZE_MB:  5,
    ALLOWED_IMG_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  },

  // 榜单默认排序
  DEFAULT_SORT:       'hot',     // 'hot' | 'rating' | 'new' | 'official'
  PAGE_SIZE:          12,

  // 管理员邮箱白名单（初始化时用，后续用 profiles.is_admin 管理）
  ADMIN_EMAILS: [
    // 'your-email@example.com',
  ],

  // 举报原因候选
  REPORT_REASONS: [
    '内容质量低 / 明显不符合原人物',
    '严重事实错误 / 虚构引文',
    '涉嫌抄袭已发布 skill',
    '涉及仇恨言论 / 政治极端',
    '未经授权使用真实在世人物',
    '其他（请在下方说明）',
  ],

  // 开发 flag
  DEBUG:              false,     // true 时 console 输出更多日志
}
