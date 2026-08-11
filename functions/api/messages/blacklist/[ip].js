// DELETE /api/messages/blacklist/:ip - 从黑名单移除
import { verifyAdmin, getBlacklistData, jsonResponse } from '../../_lib.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  
  const auth = await verifyAdmin(request, env);
  if (!auth.valid) return auth.response;
  
  if (request.method !== 'DELETE') {
    return jsonResponse({ success: false, message: '不支持的方法' }, 405);
  }
  
  try {
    const ip = decodeURIComponent(params.ip);
    const data = await getBlacklistData(env);
    data.ips = data.ips.filter(item => item.ip !== ip);
    await env.ADMIN_KV.put('guestbook_blacklist', JSON.stringify(data));
    return jsonResponse({ success: true, message: '已从黑名单移除' }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '操作失败: ' + e.message }, 500);
  }
}
