// POST /api/posts/batch - 批量操作（管理员）
// action: trash（移到回收站）/ restore（恢复）/ delete（永久删除）
import { getPostsData, savePostsData, verifyAdmin, jsonResponse } from './_lib.js';

export async function onRequest(context) {
  const { request, env } = context;

  const auth = await verifyAdmin(request, env);
  if (!auth.valid) return auth.response;

  if (request.method !== 'POST') {
    return jsonResponse({ success: false, message: '不支持的方法' }, 405);
  }

  try {
    const body = await request.json();
    const { ids, action } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return jsonResponse({ success: false, message: '请选择文章' }, 400);
    }

    const data = await getPostsData(env);
    let count = 0;

    if (action === 'trash') {
      data.posts.forEach(p => {
        if (ids.includes(p.id) && !p.deleted) {
          p.deleted = true;
          p.deletedAt = Date.now();
          count++;
        }
      });
    } else if (action === 'restore') {
      data.posts.forEach(p => {
        if (ids.includes(p.id) && p.deleted) {
          p.deleted = false;
          p.deletedAt = null;
          count++;
        }
      });
    } else if (action === 'delete') {
      const before = data.posts.length;
      data.posts = data.posts.filter(p => !ids.includes(p.id));
      count = before - data.posts.length;
    } else {
      return jsonResponse({ success: false, message: '未知操作' }, 400);
    }

    await savePostsData(env, data);
    return jsonResponse({ success: true, message: `操作完成，共处理 ${count} 篇`, count }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '操作失败: ' + e.message }, 500);
  }
}
