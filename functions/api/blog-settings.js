// 博客设置管理
// GET /api/blog-settings - 获取博客设置（公开）
// POST /api/blog-settings - 保存博客设置（管理员）
import { verifyAdmin, jsonResponse } from './messages/_lib.js';

const DEFAULT_SETTINGS = {
  backgroundImage: '',
  backgroundOpacity: 1,
  contacts: {
    qq: '',
    email: '',
    github: '',
    telegram: '',
    bilibili: '',
    guestbook: '/guestbook/'
  }
};

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'GET') {
    try {
      const settings = await env.ADMIN_KV.get('blog_settings', { type: 'json' });
      return jsonResponse({
        success: true,
        data: settings || DEFAULT_SETTINGS
      }, 200);
    } catch (e) {
      return jsonResponse({ success: true, data: DEFAULT_SETTINGS }, 200);
    }
  }

  if (request.method === 'POST') {
    const auth = await verifyAdmin(request, env);
    if (!auth.valid) return auth.response;

    try {
      const body = await request.json();
      const currentSettings = await env.ADMIN_KV.get('blog_settings', { type: 'json' }) || DEFAULT_SETTINGS;
      const newSettings = { ...currentSettings, ...body };
      // 确保 contacts 合并
      if (body.contacts) {
        newSettings.contacts = { ...currentSettings.contacts, ...body.contacts };
      }
      await env.ADMIN_KV.put('blog_settings', JSON.stringify(newSettings));
      return jsonResponse({
        success: true,
        message: '博客设置已保存',
        data: newSettings
      }, 200);
    } catch (e) {
      return jsonResponse({ success: false, message: '保存失败: ' + e.message }, 500);
    }
  }

  return jsonResponse({ success: false, message: '不支持的方法' }, 405);
}
