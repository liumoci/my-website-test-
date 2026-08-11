// GET /api/messages/blacklist - 获取黑名单
// POST /api/messages/blacklist - 添加黑名单
import { verifyAdmin, getBlacklistData, jsonResponse } from '../_lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  
  const auth = await verifyAdmin(request, env);
  if (!auth.valid) return auth.response;
  
  if (request.method === 'GET') {
    return getBlacklist(env);
  }
  
  if (request.method === 'POST') {
    return addToBlacklist(env, request);
  }
  
  return jsonResponse({ success: false, message: '不支持的方法' }, 405);
}

async function getBlacklist(env) {
  try {
    const data = await getBlacklistData(env);
    return jsonResponse({ success: true, data: data.ips }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '获取失败: ' + e.message }, 500);
  }
}

async function addToBlacklist(env, request) {
  try {
    const body = await request.json();
    const ip = (body.ip || '').trim();
    const reason = (body.reason || '').trim();
    
    if (!ip) {
      return jsonResponse({ success: false, message: 'IP不能为空' }, 400);
    }
    
    const data = await getBlacklistData(env);
    if (data.ips.find(item => item.ip === ip)) {
      return jsonResponse({ success: false, message: '该IP已在黑名单中' }, 400);
    }
    
    data.ips.push({ ip: ip, reason: reason, time: Date.now() });
    await env.ADMIN_KV.put('guestbook_blacklist', JSON.stringify(data));
    return jsonResponse({ success: true, message: '已加入黑名单' }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '操作失败: ' + e.message }, 500);
  }
}
