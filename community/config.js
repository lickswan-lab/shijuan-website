// 拾卷 · 召唤社区 · 实际配置（不提交 git）
// ==================================================
// 从 config.example.js 复制而来——在此填入你的 Supabase 项目信息。
// 未填时会自动降级到 mock 模式，页面仍可打开查看视觉效果。
// ==================================================

window.APP_CONFIG = {
  // ⬇⬇⬇ 在 Supabase Dashboard → Settings → API 复制这两个值 ⬇⬇⬇
  SUPABASE_URL:       'https://ofydqoxyakxcozhuuebn.supabase.co',   // 例：'https://abcdefg.supabase.co'
  SUPABASE_ANON_KEY:  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9meWRxb3h5YWt4Y296aHV1ZWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjMyMzUsImV4cCI6MjA5MjQ5OTIzNX0.4V03zCKp2qR-nzbiz4WohyoINPXTzupUqbwXSw0tyWg',   // 例：'eyJhbGciOi...'

  SITE_NAME:          '拾卷 · 召唤社区',
  SITE_DESCRIPTION:   '召唤一个名家的思想方式与你对话',
  CONTACT_EMAIL:      'lickswan@gmail.com',

  AUTH: {
    ALLOW_SIGNUP:     true,
    REQUIRE_EMAIL_CONFIRM: true,
    ENABLE_GOOGLE:    true,
    ENABLE_GITHUB:    true,
    ENABLE_WECHAT:    false,
  },

  UPLOAD: {
    MAX_ZIP_SIZE_MB:  20,
    MAX_IMG_SIZE_MB:  5,
    ALLOWED_IMG_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  },

  DEFAULT_SORT:       'hot',
  PAGE_SIZE:          12,

  ADMIN_EMAILS: [
    'lickswan@gmail.com',
  ],

  REPORT_REASONS: [
    '内容质量低 / 明显不符合原人物',
    '严重事实错误 / 虚构引文',
    '涉嫌抄袭已发布 skill',
    '涉及仇恨言论 / 政治极端',
    '未经授权使用真实在世人物',
    '其他（请在下方说明）',
  ],

  DEBUG:              false,
}
