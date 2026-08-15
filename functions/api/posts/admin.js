// GET /api/posts/admin - 获取所有文章（包括草稿和回收站，管理员）
import { getPostsData, verifyAdmin, jsonResponse } from './_lib.js';

export async function onRequest(context) {
  const { request, env } = context;

  const auth = await verifyAdmin(request, env);
  if (!auth.valid) return auth.response;

  try {
    const data = await getPostsData(env);
    const posts = data.posts.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.date - a.date;
    });
    return jsonResponse({ success: true, data: posts }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '获取失败: ' + e.message }, 500);
  }
}
