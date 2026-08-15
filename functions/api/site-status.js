// GET /api/site-status - 获取站点状态（公开）
// POST /api/site-status - 设置站点状态（管理员）
import { verifyAdmin, jsonResponse } from './messages/_lib.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'GET') {
    try {
      const status = await env.ADMIN_KV.get('site_status');
      return jsonResponse({
        success: true,
        data: {
          closed: status === 'closed'
        }
      }, 200);
    } catch (e) {
      return jsonResponse({ success: true, data: { closed: false } }, 200);
    }
  }

  if (request.method === 'POST') {
    const auth = await verifyAdmin(request, env);
    if (!auth.valid) return auth.response;

    try {
      const body = await request.json();
      const closed = body.closed === true;
      await env.ADMIN_KV.put('site_status', closed ? 'closed' : 'open');
      return jsonResponse({
        success: true,
        message: closed ? '已开启跑路模式' : '已关闭跑路模式',
        data: { closed }
      }, 200);
    } catch (e) {
      return jsonResponse({ success: false, message: '操作失败: ' + e.message }, 500);
    }
  }

  return jsonResponse({ success: false, message: '不支持的方法' }, 405);
}
