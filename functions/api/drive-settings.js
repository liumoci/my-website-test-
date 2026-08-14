// GET /api/drive-settings - 获取网盘设置（公开，不含密码）
// POST /api/drive-settings - 保存网盘设置（需管理员）
import { verifyAdmin, jsonResponse } from '../messages/_lib.js';

const DEFAULT_SETTINGS = {
  title: '我的云盘',
  description: '请输入提取密码访问云盘',
  redirectUrl: '',
  extractPassword: '',
  enabled: true
};

async function getDriveSettings(env) {
  try {
    const stored = await env.ADMIN_KV.get('drive_settings');
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
    return DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'GET') {
    const settings = await getDriveSettings(env);

    // 检查是否管理员登录
    const auth = await verifyAdmin(request, env);
    if (auth.valid) {
      // 管理员返回完整设置
      return jsonResponse({ success: true, data: settings }, 200);
    }

    // 普通访客不返回密码和真实链接
    const publicSettings = {
      title: settings.title,
      description: settings.description,
      enabled: settings.enabled,
      requirePassword: !!settings.extractPassword
    };
    return jsonResponse({ success: true, data: publicSettings }, 200);
  }

  if (request.method === 'POST') {
    const auth = await verifyAdmin(request, env);
    if (!auth.valid) return auth.response;

    try {
      const body = await request.json();
      const currentSettings = await getDriveSettings(env);
      const newSettings = { ...currentSettings, ...body };
      await env.ADMIN_KV.put('drive_settings', JSON.stringify(newSettings));
      return jsonResponse({ success: true, message: '保存成功' }, 200);
    } catch (e) {
      return jsonResponse({ success: false, message: '保存失败: ' + e.message }, 500);
    }
  }

  return jsonResponse({ success: false, message: '不支持的方法' }, 405);
}

export { getDriveSettings };
