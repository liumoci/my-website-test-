// PUT /api/drive-items/:id - 修改文件（管理员）
// DELETE /api/drive-items/:id - 删除文件（管理员）
import { verifyAdmin, jsonResponse } from '../messages/_lib.js';
import { getDriveItems, saveDriveItems } from '../drive-items.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  const { id } = params;

  // 以下操作需要管理员权限
  const auth = await verifyAdmin(request, env);
  if (!auth.valid) return auth.response;

  const items = await getDriveItems(env);
  const index = items.findIndex(item => item.id === id);

  if (index === -1) {
    return jsonResponse({ success: false, message: '文件不存在' }, 404);
  }

  if (request.method === 'PUT') {
    const body = await request.json();
    items[index] = {
      ...items[index],
      name: body.name !== undefined ? body.name : items[index].name,
      description: body.description !== undefined ? body.description : items[index].description,
      extractCode: body.extractCode !== undefined ? body.extractCode : items[index].extractCode,
      url: body.url !== undefined ? body.url : items[index].url,
      type: body.type !== undefined ? body.type : items[index].type,
      icon: body.icon !== undefined ? body.icon : items[index].icon
    };
    await saveDriveItems(env, items);
    return jsonResponse({ success: true, data: items[index], message: '修改成功' }, 200);
  }

  if (request.method === 'DELETE') {
    items.splice(index, 1);
    await saveDriveItems(env, items);
    return jsonResponse({ success: true, message: '删除成功' }, 200);
  }

  return jsonResponse({ success: false, message: '不支持的方法' }, 405);
}
