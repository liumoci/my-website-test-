// 留言箱 API（简化可靠版）
export async function onRequest(context) {
  const { request, env } = context;
  
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;
  
  // 获取客户端 IP
  const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  
  // 工具函数：检查是否是管理员路径
  function isAdminRoute() {
    // 设置、黑名单、回复、删除 都需要管理员权限
    if (pathname.endsWith('/settings')) return true;
    if (pathname.includes('/blacklist')) return true;
    if (pathname.endsWith('/reply')) return true;
    if (method === 'DELETE' && !pathname.endsWith('/settings') && !pathname.includes('/blacklist')) return true;
    return false;
  }
  
  // 管理员权限验证
  if (isAdminRoute()) {
    const cookieHeader = request.headers.get('Cookie') || '';
    const sessionToken = getCookieValue(cookieHeader, 'admin_session');
    
    if (!sessionToken) {
      return jsonResponse({ success: false, message: '未登录' }, 401);
    }
    
    try {
      const sessionData = await env.ADMIN_KV.get('session:' + sessionToken, { type: 'json' });
      if (!sessionData || sessionData.expires < Date.now()) {
        return jsonResponse({ success: false, message: '登录已过期' }, 401);
      }
    } catch (e) {
      return jsonResponse({ success: false, message: '验证失败: ' + e.message }, 401);
    }
  }
  
  // ===== 路由分发 =====
  
  // GET /api/messages - 获取留言列表
  if (method === 'GET' && pathname === '/api/messages') {
    return getMessages(env);
  }
  
  // POST /api/messages - 提交留言
  if (method === 'POST' && pathname === '/api/messages') {
    return submitMessage(env, request, clientIP);
  }
  
  // GET /api/messages/settings - 获取设置
  if (method === 'GET' && pathname === '/api/messages/settings') {
    return getSettings(env);
  }
  
  // POST /api/messages/settings - 保存设置
  if (method === 'POST' && pathname === '/api/messages/settings') {
    return saveSettings(env, request);
  }
  
  // GET /api/messages/blacklist - 获取黑名单
  if (method === 'GET' && pathname === '/api/messages/blacklist') {
    return getBlacklist(env);
  }
  
  // POST /api/messages/blacklist - 添加黑名单
  if (method === 'POST' && pathname === '/api/messages/blacklist') {
    return addToBlacklist(env, request);
  }
  
  // DELETE /api/messages/blacklist/:ip - 移除黑名单
  if (method === 'DELETE' && pathname.startsWith('/api/messages/blacklist/')) {
    const ip = pathname.replace('/api/messages/blacklist/', '');
    return removeFromBlacklist(env, ip);
  }
  
  // POST /api/messages/:id/reply - 回复留言
  if (method === 'POST' && pathname.endsWith('/reply')) {
    const id = pathname.replace('/api/messages/', '').replace('/reply', '');
    return replyMessage(env, id, request);
  }
  
  // DELETE /api/messages/:id - 删除留言
  if (method === 'DELETE' && pathname.startsWith('/api/messages/') && !pathname.includes('/blacklist')) {
    const id = pathname.replace('/api/messages/', '');
    return deleteMessage(env, id);
  }
  
  return jsonResponse({ success: false, message: '不支持的请求: ' + method + ' ' + pathname }, 405);
}

// 获取留言列表
async function getMessages(env) {
  try {
    const messagesData = await env.ADMIN_KV.get('guestbook_messages', { type: 'json' });
    
    if (!messagesData || !messagesData.messages) {
      return jsonResponse({ success: true, messages: [] }, 200);
    }
    
    const sorted = messagesData.messages.sort((a, b) => b.time - a.time);
    return jsonResponse({ success: true, messages: sorted }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '获取失败: ' + e.message }, 500);
  }
}

// 提交留言
async function submitMessage(env, request, clientIP) {
  try {
    const body = await request.json();
    const name = (body.name || '').trim();
    const content = (body.content || '').trim();
    
    if (!name || !content) {
      return jsonResponse({ success: false, message: '昵称和内容不能为空' }, 400);
    }
    
    if (content.length > 500) {
      return jsonResponse({ success: false, message: '留言内容不能超过500字' }, 400);
    }
    
    if (name.length > 50) {
      return jsonResponse({ success: false, message: '昵称不能超过50字' }, 400);
    }
    
    // 检查黑名单
    const blacklist = await getBlacklistData(env);
    if (blacklist.includes(clientIP)) {
      return jsonResponse({ success: false, message: '你已被禁止留言' }, 403);
    }
    
    // 检查频率限制
    const settings = await getSettingsData(env);
    const rateLimitMinutes = settings.rateLimitMinutes || 1;
    
    if (rateLimitMinutes > 0) {
      const messagesData = await env.ADMIN_KV.get('guestbook_messages', { type: 'json' });
      if (messagesData && messagesData.messages) {
        const recent = messagesData.messages.find(
          m => m.ip === clientIP && (Date.now() - m.time) < rateLimitMinutes * 60 * 1000
        );
        if (recent) {
          return jsonResponse({ success: false, message: `留言太频繁了，请 ${rateLimitMinutes} 分钟后再试` }, 429);
        }
      }
    }
    
    // 获取现有数据
    let messagesData = await env.ADMIN_KV.get('guestbook_messages', { type: 'json' });
    if (!messagesData || !messagesData.messages) {
      messagesData = { messages: [] };
    }
    
    // 添加新留言
    const newMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: name,
      content: content,
      time: Date.now(),
      ip: clientIP,
      reply: null
    };
    
    messagesData.messages.push(newMessage);
    await env.ADMIN_KV.put('guestbook_messages', JSON.stringify(messagesData));
    
    return jsonResponse({ success: true, message: '留言成功', data: newMessage }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '提交失败: ' + e.message }, 500);
  }
}

// 回复留言
async function replyMessage(env, messageId, request) {
  try {
    const body = await request.json();
    const content = (body.content || '').trim();
    
    if (!content) {
      return jsonResponse({ success: false, message: '回复内容不能为空' }, 400);
    }
    
    let messagesData = await env.ADMIN_KV.get('guestbook_messages', { type: 'json' });
    
    if (!messagesData || !messagesData.messages) {
      return jsonResponse({ success: false, message: '留言不存在' }, 404);
    }
    
    const index = messagesData.messages.findIndex(m => m.id === messageId);
    if (index === -1) {
      return jsonResponse({ success: false, message: '留言不存在' }, 404);
    }
    
    messagesData.messages[index].reply = {
      content: content,
      time: Date.now()
    };
    
    await env.ADMIN_KV.put('guestbook_messages', JSON.stringify(messagesData));
    return jsonResponse({ success: true, message: '回复成功' }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '回复失败: ' + e.message }, 500);
  }
}

// 删除留言
async function deleteMessage(env, messageId) {
  try {
    let messagesData = await env.ADMIN_KV.get('guestbook_messages', { type: 'json' });
    
    if (!messagesData || !messagesData.messages) {
      return jsonResponse({ success: true, message: '删除成功' }, 200);
    }
    
    messagesData.messages = messagesData.messages.filter(m => m.id !== messageId);
    await env.ADMIN_KV.put('guestbook_messages', JSON.stringify(messagesData));
    
    return jsonResponse({ success: true, message: '删除成功' }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '删除失败: ' + e.message }, 500);
  }
}

// 获取设置
async function getSettings(env) {
  try {
    const settings = await getSettingsData(env);
    return jsonResponse({ success: true, data: settings }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '获取失败: ' + e.message }, 500);
  }
}

// 保存设置
async function saveSettings(env, request) {
  try {
    const body = await request.json();
    const currentSettings = await getSettingsData(env);
    const newSettings = { ...currentSettings, ...body };
    
    await env.ADMIN_KV.put('guestbook_settings', JSON.stringify(newSettings));
    return jsonResponse({ success: true, message: '保存成功' }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '保存失败: ' + e.message }, 500);
  }
}

// 获取黑名单
async function getBlacklist(env) {
  try {
    const data = await env.ADMIN_KV.get('guestbook_blacklist', { type: 'json' });
    const list = data && data.ips ? data.ips : [];
    return jsonResponse({ success: true, data: list }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '获取失败: ' + e.message }, 500);
  }
}

// 添加黑名单
async function addToBlacklist(env, request) {
  try {
    const body = await request.json();
    const ip = (body.ip || '').trim();
    const reason = (body.reason || '').trim();
    
    if (!ip) {
      return jsonResponse({ success: false, message: 'IP不能为空' }, 400);
    }
    
    let data = await env.ADMIN_KV.get('guestbook_blacklist', { type: 'json' });
    if (!data || !data.ips) {
      data = { ips: [] };
    }
    
    if (data.ips.find(item => item.ip === ip)) {
      return jsonResponse({ success: false, message: '该IP已在黑名单中' }, 400);
    }
    
    data.ips.push({
      ip: ip,
      reason: reason,
      time: Date.now()
    });
    
    await env.ADMIN_KV.put('guestbook_blacklist', JSON.stringify(data));
    return jsonResponse({ success: true, message: '已加入黑名单' }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '操作失败: ' + e.message }, 500);
  }
}

// 移除黑名单
async function removeFromBlacklist(env, ip) {
  try {
    const decodedIp = decodeURIComponent(ip);
    
    let data = await env.ADMIN_KV.get('guestbook_blacklist', { type: 'json' });
    
    if (!data || !data.ips) {
      return jsonResponse({ success: true, message: '已移除' }, 200);
    }
    
    data.ips = data.ips.filter(item => item.ip !== decodedIp);
    await env.ADMIN_KV.put('guestbook_blacklist', JSON.stringify(data));
    
    return jsonResponse({ success: true, message: '已从黑名单移除' }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '操作失败: ' + e.message }, 500);
  }
}

// ===== 工具函数 =====

async function getSettingsData(env) {
  try {
    const settings = await env.ADMIN_KV.get('guestbook_settings', { type: 'json' });
    if (settings) return settings;
  } catch (e) {}
  
  return {
    backgroundColor: '',
    cardColor: '',
    primaryColor: '',
    rateLimitMinutes: 1,
    enabled: true,
    backgroundImage: ''
  };
}

async function getBlacklistData(env) {
  try {
    const data = await env.ADMIN_KV.get('guestbook_blacklist', { type: 'json' });
    if (data && data.ips) {
      return data.ips.map(item => item.ip);
    }
  } catch (e) {}
  return [];
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function getCookieValue(cookieHeader, name) {
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const parts = cookie.trim().split('=');
    if (parts[0] === name) {
      return parts[1];
    }
  }
  return null;
}
