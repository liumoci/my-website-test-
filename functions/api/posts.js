// GET /api/posts - 获取已发布文章列表（公开）
// POST /api/posts - 创建文章（管理员）
import { getPostsData, savePostsData, generateId, generateSlug, verifyAdmin, jsonResponse } from './posts/_lib.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'GET') {
    return getPublicPosts(env);
  }

  if (request.method === 'POST') {
    const auth = await verifyAdmin(request, env);
    if (!auth.valid) return auth.response;
    return createPost(env, request);
  }

  return jsonResponse({ success: false, message: '不支持的方法' }, 405);
}

async function getPublicPosts(env) {
  try {
    const data = await getPostsData(env);
    // 只返回已发布且未删除的文章
    const posts = data.posts
      .filter(p => p.published && !p.deleted)
      .sort((a, b) => {
        // 置顶优先
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.date - a.date;
      })
      .map(p => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        cover: p.cover,
        category: p.category,
        tags: p.tags,
        date: p.date,
        pinned: p.pinned,
        readTime: p.readTime
      }));

    return jsonResponse({ success: true, data: posts }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '获取失败: ' + e.message }, 500);
  }
}

async function createPost(env, request) {
  try {
    const body = await request.json();
    const data = await getPostsData(env);

    const newPost = {
      id: generateId(),
      slug: body.slug || generateSlug(body.title || '未命名'),
      title: body.title || '未命名文章',
      content: body.content || '',
      excerpt: body.excerpt || (body.content || '').substring(0, 150),
      cover: body.cover || '',
      category: body.category || '未分类',
      tags: body.tags || [],
      date: body.date || Date.now(),
      pinned: body.pinned || false,
      published: body.published !== false,
      deleted: false,
      deletedAt: null,
      readTime: body.readTime || Math.ceil((body.content || '').length / 500) || 1
    };

    data.posts.push(newPost);
    await savePostsData(env, data);

    return jsonResponse({ success: true, data: newPost, message: '创建成功' }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '创建失败: ' + e.message }, 500);
  }
}
