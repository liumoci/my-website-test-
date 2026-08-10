// 留言箱 API
export async function onRequest(context) {
  const { request, env } = context;
  
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const messageId = pathParts.length > 2 ? pathParts[2] : null;
  
  // DELETE 需要验证登录
  if (request.method === 'DELETE') {
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
  
  // GET：获取留言列表
  if (request.method === 'GET') {
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
  
  // POST：提交留言
  if (request.method === 'POST') {
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
        ip: request.headers.get('CF-Connecting-IP') || 'unknown'
      };
      
      messagesData.messages.push(newMessage);
      
      // 保存
      await env.ADMIN_KV.put('guestbook_messages', JSON.stringify(messagesData));
      
      return jsonResponse({ success: true, message: '留言成功', data: newMessage }, 200);
    } catch (e) {
      return jsonResponse({ success: false, message: '提交失败: ' + e.message }, 500);
    }
  }
  
  // DELETE：删除留言
  if (request.method === 'DELETE' && messageId) {
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
  
  return jsonResponse({ success: false, message: '不支持的方法' }, 405);
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
