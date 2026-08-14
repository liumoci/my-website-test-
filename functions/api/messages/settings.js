// GET /api/messages/settings - 获取设置
// POST /api/messages/settings - 保存设置
import { verifyAdmin, getSettingsData, jsonResponse } from './_lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  
  // 管理员权限验证
  const auth = await verifyAdmin(request, env);
  if (!auth.valid) return auth.response;
  
  if (request.method === 'GET') {
    return getSettings(env);
  }
  
  if (request.method === 'POST') {
    return saveSettings(env, request);
  }
  
  return jsonResponse({ success: false, message: '不支持的方法' }, 405);
}

async function getSettings(env) {
  try {
    const settings = await getSettingsData(env);
    return jsonResponse({ success: true, data: settings }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '获取失败: ' + e.message }, 500);
  }
}

async function saveSettings(env, request) {
  try {
    const body = await request.json();
    const currentSettings = await getSettingsData(env);
    const newSettings = { ...currentSettings, ...body };
    await env.ADMIN_KV.put('guestbook_settings', JSON.stringify(newSettings));
    return jsonResponse({ success: true, message: '保存成功' }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '保存失败: ' + e.message }, 500);
  }
}
