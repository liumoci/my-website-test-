// POST /api/drive-settings/verify - 验证提取密码，正确则返回跳转链接
import { jsonResponse } from '../messages/_lib.js';
import { getDriveSettings } from '../drive-settings.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return jsonResponse({ success: false, message: '不支持的方法' }, 405);
  }

  try {
    const body = await request.json();
    const { password } = body;
    const settings = await getDriveSettings(env);

    if (!settings.enabled) {
      return jsonResponse({ success: false, message: '云盘未启用' }, 403);
    }

    // 如果没有设置密码，直接返回链接
    if (!settings.extractPassword) {
      return jsonResponse({ success: true, redirectUrl: settings.redirectUrl }, 200);
    }

    // 验证密码
    if (password === settings.extractPassword) {
      return jsonResponse({ success: true, redirectUrl: settings.redirectUrl }, 200);
    } else {
      return jsonResponse({ success: false, message: '提取密码错误' }, 401);
    }
  } catch (e) {
    return jsonResponse({ success: false, message: '验证失败: ' + e.message }, 500);
  }
}
