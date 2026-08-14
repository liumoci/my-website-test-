// DELETE /api/messages/:id - 删除留言（同时删除所有子回复）
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
    
    // 递归收集所有要删除的ID（包括子回复）
    const toDelete = new Set([messageId]);
    let changed = true;
    while (changed) {
      changed = false;
      data.messages.forEach(m => {
        if (m.parentId && toDelete.has(m.parentId) && !toDelete.has(m.id)) {
          toDelete.add(m.id);
          changed = true;
        }
      });
    }
    
    data.messages = data.messages.filter(m => !toDelete.has(m.id));
    await saveMessagesData(env, data);
    return jsonResponse({ success: true, message: '删除成功', deletedCount: toDelete.size }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '删除失败: ' + e.message }, 500);
  }
}
