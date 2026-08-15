// GET /api/posts/:id - 获取文章详情（公开）
// PUT /api/posts/:id - 修改文章（管理员）
// DELETE /api/posts/:id - 移到回收站（管理员）
import { getPostsData, savePostsData, verifyAdmin, jsonResponse } from './_lib.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  const { id } = params;

  const data = await getPostsData(env);
  const post = data.posts.find(p => p.id === id);

  if (!post) {
    return jsonResponse({ success: false, message: '文章不存在' }, 404);
  }

  if (request.method === 'GET') {
    // 公开访问只能看已发布且未删除的
    if (!post.published || post.deleted) {
      return jsonResponse({ success: false, message: '文章不存在' }, 404);
    }
    return jsonResponse({ success: true, data: post }, 200);
  }

  // 以下需要管理员权限
  const auth = await verifyAdmin(request, env);
  if (!auth.valid) return auth.response;

  if (request.method === 'PUT') {
    try {
      const body = await request.json();
      Object.assign(post, {
        title: body.title !== undefined ? body.title : post.title,
        slug: body.slug !== undefined ? body.slug : post.slug,
        content: body.content !== undefined ? body.content : post.content,
        excerpt: body.excerpt !== undefined ? body.excerpt : post.excerpt,
        cover: body.cover !== undefined ? body.cover : post.cover,
        category: body.category !== undefined ? body.category : post.category,
        tags: body.tags !== undefined ? body.tags : post.tags,
        pinned: body.pinned !== undefined ? body.pinned : post.pinned,
        published: body.published !== undefined ? body.published : post.published,
        readTime: body.readTime !== undefined ? body.readTime : post.readTime,
        updatedAt: Date.now()
      });
      await savePostsData(env, data);
      return jsonResponse({ success: true, data: post, message: '修改成功' }, 200);
    } catch (e) {
      return jsonResponse({ success: false, message: '修改失败: ' + e.message }, 500);
    }
  }

  if (request.method === 'DELETE') {
    post.deleted = true;
    post.deletedAt = Date.now();
    await savePostsData(env, data);
    return jsonResponse({ success: true, message: '已移到回收站' }, 200);
  }

  return jsonResponse({ success: false, message: '不支持的方法' }, 405);
}
