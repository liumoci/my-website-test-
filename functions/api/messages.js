// 留言箱 API（重构版）
export async function onRequest(context) {
  const { request, env } = context;
  
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const messageId = pathParts.length > 2 ? pathParts[2] : null;
  const action = pathParts.length > 3 ? pathParts[3] : null;
  
  // 获取客户端 IP
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  
  // 需要管理员登录的操作
  const adminActions = ['reply', 'delete', 'settings', 'blacklist'];
  const isAdminAction = adminActions.includes(pathParts[2]) || 
                        (messageId && action === 'reply') ||
                        (messageId && request.method === 'DELETE');
  
  if (isAdminAction) {
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
      return jsonResponse({ success: false, message: '验证失败' }, 401);
    }
  }
  
  // GET 请求路由
  if (request.method === 'GET') {
    // 获取留言设置
    if (pathParts[2] === 'settings') {
      return getSettings(env);
    }
    // 获取黑名单
    if (pathParts[2] === 'blacklist') {
      return getBlacklist(env);
    }
    // 获取留言列表
    return getMessages(env);
  }
  
  // POST 请求路由
  if (request.method === 'POST') {
    // 保存留言设置
    if (pathParts[2] === 'settings') {
      return saveSettings(env, request);
    }
    // 添加到黑名单
    if (pathParts[2] === 'blacklist') {
      return addToBlacklist(env, request);
    }
    // 回复留言
    if (messageId && action === 'reply') {
      return replyMessage(env, messageId, request);
    }
    // 提交留言
    return submitMessage(env, request, clientIP);
  }
  
  // DELETE 请求路由
  if (request.method === 'DELETE') {
    // 从黑名单移除
    if (pathParts[2] === 'blacklist' && pathParts[3]) {
      return removeFromBlacklist(env, pathParts[3]);
    }
    // 删除留言
    if (messageId) {
      return deleteMessage(env, messageId);
    }
  }
  
  return jsonResponse({ success: false, message: '不支持的方法' }, 405);
}

// 获取留言列表
async function getMessages(env) {
  try {
    const messagesData = await env.ADMIN_KV.get('guestbook_messages', { type: 'json' });
    
    if (!messagesData || !messagesData.messages) {
      return jsonResponse({ success: true, messages: [] }, 200);
    }
    
    // 按时间倒序
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
    const { name, content } = body;
    
    if (!name || !content) {
      return jsonResponse({ success: false, message: '昵称和内容不能为空' }, 400);
    }
    
    if (content.length > 500) {
      return jsonResponse({ success: false, message: '留言内容不能超过500字' }, 400);
    }
    
    if (name.length > 50) {
      return jsonResponse({ success: false, message: '昵称不能超过50字' }, 400);
    }
    
    // 检查是否在黑名单
    const blacklist = await getBlacklistData(env);
    if (blacklist.includes(clientIP)) {
      return jsonResponse({ success: false, message: '你已被禁止留言' }, 403);
    }
    
    // 检查留言频率
    const settings = await getSettingsData(env);
    const rateLimitMinutes = settings.rateLimitMinutes || 1; // 默认1分钟
    
    if (rateLimitMinutes > 0) {
      const messagesData = await env.ADMIN_KV.get('guestbook_messages', { type: 'json' });
      if (messagesData && messagesData.messages) {
        const recentMessage = messagesData.messages.find(
          m => m.ip === clientIP && (Date.now() - m.time) < rateLimitMinutes * 60 * 1000
        );
        if (recentMessage) {
          return jsonResponse({ 
            success: false, 
            message: `留言太频繁了，请 ${rateLimitMinutes} 分钟后再试` 
          }, 429);
        }
      }
    }
    
    // 获取现有留言
    let messagesData = await env.ADMIN_KV.get('guestbook_messages', { type: 'json' });
    if (!messagesData || !messagesData.messages) {
      messagesData = { messages: [] };
    }
    
    // 添加新留言
    const newMessage = {
      id: Date.now().toString(),
      name: name.trim(),
      content: content.trim(),
      time: Date.now(),
      ip: clientIP,
      reply: null
    };
    
    messagesData.messages.push(newMessage);
    
    // 保存
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
    const { content } = body;
    
    if (!content) {
      return jsonResponse({ success: false, message: '回复内容不能为空' }, 400);
    }
    
    let messagesData = await env.ADMIN_KV.get('guestbook_messages', { type: 'json' });
    
    if (!messagesData || !messagesData.messages) {
      return jsonResponse({ success: false, message: '留言不存在' }, 404);
    }
    
    const messageIndex = messagesData.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {
      return jsonResponse({ success: false, message: '留言不存在' }, 404);
    }
    
    messagesData.messages[messageIndex].reply = {
      content: content.trim(),
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
      return jsonResponse({ success: false, message: '留言不存在' }, 404);
    }
    
    // 过滤掉要删除的留言
    messagesData.messages = messagesData.messages.filter(m => m.id !== messageId);
    
    await env.ADMIN_KV.put('guestbook_messages', JSON.stringify(messagesData));
    
    return jsonResponse({ success: true, message: '删除成功' }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '删除失败: ' + e.message }, 500);
  }
}

// 获取留言设置
async function getSettings(env) {
  try {
    const settings = await getSettingsData(env);
    return jsonResponse({ success: true, data: settings }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '获取失败: ' + e.message }, 500);
  }
}

// 保存留言设置
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
    const blacklist = await getBlacklistData(env);
    return jsonResponse({ success: true, data: blacklist }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '获取失败: ' + e.message }, 500);
  }
}

// 添加到黑名单
async function addToBlacklist(env, request) {
  try {
    const body = await request.json();
    const { ip, reason } = body;
    
    if (!ip) {
      return jsonResponse({ success: false, message: 'IP不能为空' }, 400);
    }
    
    let blacklistData = await env.ADMIN_KV.get('guestbook_blacklist', { type: 'json' });
    if (!blacklistData || !blacklistData.ips) {
      blacklistData = { ips: [] };
    }
    
    // 检查是否已存在
    if (blacklistData.ips.find(item => item.ip === ip)) {
      return jsonResponse({ success: false, message: '该IP已在黑名单中' }, 400);
    }
    
    blacklistData.ips.push({
      ip,
      reason: reason || '',
      time: Date.now()
    });
    
    await env.ADMIN_KV.put('guestbook_blacklist', JSON.stringify(blacklistData));
    
    return jsonResponse({ success: true, message: '已加入黑名单' }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '操作失败: ' + e.message }, 500);
  }
}

// 从黑名单移除
async function removeFromBlacklist(env, ip) {
  try {
    let blacklistData = await env.ADMIN_KV.get('guestbook_blacklist', { type: 'json' });
    
    if (!blacklistData || !blacklistData.ips) {
      return jsonResponse({ success: false, message: '黑名单为空' }, 404);
    }
    
    blacklistData.ips = blacklistData.ips.filter(item => item.ip !== ip);
    
    await env.ADMIN_KV.put('guestbook_blacklist', JSON.stringify(blacklistData));
    
    return jsonResponse({ success: true, message: '已从黑名单移除' }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '操作失败: ' + e.message }, 500);
  }
}

// ===== 工具函数 =====

// 获取设置数据
async function getSettingsData(env) {
  try {
    const settings = await env.ADMIN_KV.get('guestbook_settings', { type: 'json' });
    if (settings) return settings;
  } catch (e) {
    // 忽略错误
  }
  
  // 默认设置
  return {
    backgroundColor: '',
    cardColor: '',
    primaryColor: '',
    rateLimitMinutes: 1,
    enabled: true
  };
}

// 获取黑名单数据（纯IP数组）
async function getBlacklistData(env) {
  try {
    const blacklistData = await env.ADMIN_KV.get('guestbook_blacklist', { type: 'json' });
    if (blacklistData && blacklistData.ips) {
      return blacklistData.ips.map(item => item.ip);
    }
  } catch (e) {
    // 忽略错误
  }
  return [];
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

function getCookieValue(cookieHeader, name) {
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) {
      return value;
    }
  }
  return null;
}
