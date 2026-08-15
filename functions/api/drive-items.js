// GET /api/drive-items - 获取文件列表（公开）
// POST /api/drive-items - 添加单个文件（管理员）
// POST /api/drive-items?action=batch - 批量添加（管理员）
// POST /api/drive-items?action=batch-delete - 批量删除（管理员）
import { verifyAdmin, jsonResponse } from './messages/_lib.js';

const STORAGE_KEY = 'drive_items';

async function getDriveItems(env) {
  try {
    const stored = await env.ADMIN_KV.get(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (e) {
    return [];
  }
}

async function saveDriveItems(env, items) {
  await env.ADMIN_KV.put(STORAGE_KEY, JSON.stringify(items));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (request.method === 'GET') {
    const items = await getDriveItems(env);
    return jsonResponse({ success: true, data: items }, 200);
  }

  // 以下操作需要管理员权限
  const auth = await verifyAdmin(request, env);
  if (!auth.valid) return auth.response;

  if (request.method === 'POST') {
    const body = await request.json();

    // 批量删除
    if (action === 'batch-delete') {
      const { ids } = body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return jsonResponse({ success: false, message: '请选择要删除的文件' }, 400);
      }
      const items = await getDriveItems(env);
      const newItems = items.filter(item => !ids.includes(item.id));
      await saveDriveItems(env, newItems);
      return jsonResponse({ success: true, message: `已删除 ${ids.length} 项` }, 200);
    }

    // 批量添加
    if (action === 'batch') {
      const { items: newItems } = body;
      if (!Array.isArray(newItems) || newItems.length === 0) {
        return jsonResponse({ success: false, message: '请提供要添加的文件' }, 400);
      }
      const items = await getDriveItems(env);
      const now = Date.now();
      newItems.forEach((item, index) => {
        items.push({
          id: generateId(),
          name: item.name || '未命名',
          description: item.description || '',
          extractCode: item.extractCode || '',
          url: item.url || '',
          type: item.type || 'file',
          icon: item.icon || (item.type === 'folder' ? '📁' : '📄'),
          createdAt: now + index
        });
      });
      await saveDriveItems(env, items);
      return jsonResponse({ success: true, message: `已添加 ${newItems.length} 项` }, 200);
    }

    // 单个添加
    const { name, description, extractCode, url, type, icon } = body;
    if (!name) {
      return jsonResponse({ success: false, message: '文件名不能为空' }, 400);
    }
    const items = await getDriveItems(env);
    const newItem = {
      id: generateId(),
      name,
      description: description || '',
      extractCode: extractCode || '',
      url: url || '',
      type: type || 'file',
      icon: icon || (type === 'folder' ? '📁' : '📄'),
      createdAt: Date.now()
    };
    items.push(newItem);
    await saveDriveItems(env, items);
    return jsonResponse({ success: true, data: newItem, message: '添加成功' }, 200);
  }

  return jsonResponse({ success: false, message: '不支持的方法' }, 405);
}

export { getDriveItems, saveDriveItems };
