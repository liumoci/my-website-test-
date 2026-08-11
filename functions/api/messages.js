// GET /api/messages - 获取留言列表
// POST /api/messages - 提交留言
import { getClientIP, getMessagesData, saveMessagesData, getSettingsData, getBlacklistData, jsonResponse } from './messages/_lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;
  
  if (method === 'GET') {
    return getMessages(env);
  }
  
  if (method === 'POST') {
    return submitMessage(env, request);
  }
  
  return jsonResponse({ success: false, message: '不支持的方法' }, 405);
}

async function getMessages(env) {
  try {
    const data = await getMessagesData(env);
    const sorted = data.messages.sort((a, b) => b.time - a.time);
    return jsonResponse({ success: true, messages: sorted }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '获取失败: ' + e.message }, 500);
  }
}

async function submitMessage(env, request) {
  try {
    const clientIP = getClientIP(request);
    const body = await request.json();
    const name = (body.name || '').trim();
    const content = (body.content || '').trim();
    
    if (!name || !content) {
      return jsonResponse({ success: false, message: '昵称和内容不能为空' }, 400);
    }
    if (content.length > 500) {
      return jsonResponse({ success: false, message: '留言内容不能超过500字' }, 400);
    }
    if (name.length > 50) {
      return jsonResponse({ success: false, message: '昵称不能超过50字' }, 400);
    }
    
    // 检查黑名单
    const blacklist = await getBlacklistData(env);
    if (blacklist.ips.find(item => item.ip === clientIP)) {
      return jsonResponse({ success: false, message: '你已被禁止留言' }, 403);
    }
    
    // 检查频率限制
    const settings = await getSettingsData(env);
    const rateLimitMinutes = settings.rateLimitMinutes || 1;
    if (rateLimitMinutes > 0) {
      const data = await getMessagesData(env);
      const recent = data.messages.find(
        m => m.ip === clientIP && (Date.now() - m.time) < rateLimitMinutes * 60 * 1000
      );
      if (recent) {
        return jsonResponse({ success: false, message: `留言太频繁了，请 ${rateLimitMinutes} 分钟后再试` }, 429);
      }
    }
    
    // 添加留言
    const data = await getMessagesData(env);
    const newMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: name,
      content: content,
      time: Date.now(),
      ip: clientIP,
      reply: null
    };
    data.messages.push(newMessage);
    await saveMessagesData(env, data);
    
    return jsonResponse({ success: true, message: '留言成功', data: newMessage }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '提交失败: ' + e.message }, 500);
  }
}
