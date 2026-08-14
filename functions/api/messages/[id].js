// DELETE /api/messages/:id - 删除留言
import { verifyAdmin, getMessagesData, saveMessagesData, jsonResponse } from './_lib.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  
  const auth = await verifyAdmin(request, env);
  if (!auth.valid) return auth.response;
  
  if (request.method !== 'DELETE') {
    return jsonResponse({ success: false, message: '不支持的方法' }, 405);
  }
  
  try {
    const messageId = params.id;
    const data = await getMessagesData(env);
    data.messages = data.messages.filter(m => m.id !== messageId);
    await saveMessagesData(env, data);
    return jsonResponse({ success: true, message: '删除成功' }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '删除失败: ' + e.message }, 500);
  }
}
