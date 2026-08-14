// POST /api/messages/:id/reply - 站长回复留言
import { verifyAdmin, getMessagesData, saveMessagesData, jsonResponse } from '../_lib.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  
  const auth = await verifyAdmin(request, env);
  if (!auth.valid) return auth.response;
  
  if (request.method !== 'POST') {
    return jsonResponse({ success: false, message: '不支持的方法' }, 405);
  }
  
  try {
    const messageId = params.id;
    const body = await request.json();
    const content = (body.content || '').trim();
    
    if (!content) {
      return jsonResponse({ success: false, message: '回复内容不能为空' }, 400);
    }
    
    const data = await getMessagesData(env);
    const parentMsg = data.messages.find(m => m.id === messageId);
    if (!parentMsg) {
      return jsonResponse({ success: false, message: '留言不存在' }, 404);
    }
    
    // 用新结构存储：作为独立的回复留言
    const replyMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: '站长',
      content: content,
      time: Date.now(),
      ip: 'admin',
      parentId: messageId,
      isAdmin: true,
      reply: null
    };
    data.messages.push(replyMessage);
    
    // 同时更新旧结构的 reply 字段（向后兼容）
    const index = data.messages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      data.messages[index].reply = {
        content: content,
        time: Date.now()
      };
    }
    
    await saveMessagesData(env, data);
    return jsonResponse({ success: true, message: '回复成功', data: replyMessage }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '回复失败: ' + e.message }, 500);
  }
}
