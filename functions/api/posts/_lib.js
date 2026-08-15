// 文章管理公共库
import { verifyAdmin, jsonResponse } from '../messages/_lib.js';

const STORAGE_KEY = 'blog_posts';

export async function getPostsData(env) {
  try {
    const stored = await env.ADMIN_KV.get(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return { posts: [] };
  } catch (e) {
    return { posts: [] };
  }
}

export async function savePostsData(env, data) {
  await env.ADMIN_KV.put(STORAGE_KEY, JSON.stringify(data));
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function generateSlug(title) {
  return title.toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) || generateId();
}

export { verifyAdmin, jsonResponse };
