// 系统设置 API
export async function onRequest(context) {
  const { request, env } = context;
  
  // 所有操作都需要登录
  const cookieHeader = request.headers.get('Cookie') || '';
  const sessionToken = getCookieValue(cookieHeader, 'admin_session');
  
  if (!sessionToken) {
    return jsonResponse({ success: false, message: '未登录' }, 401);
  }
  
  let sessionData;
  try {
    sessionData = await env.ADMIN_KV.get('session:' + sessionToken, { type: 'json' });
    if (!sessionData || sessionData.expires < Date.now()) {
      return jsonResponse({ success: false, message: '登录已过期' }, 401);
    }
  } catch (e) {
    return jsonResponse({ success: false, message: '验证失败' }, 401);
  }
  
  const currentUsername = sessionData.username;
  
  // GET：获取设置
  if (request.method === 'GET') {
    try {
      const settings = await env.ADMIN_KV.get('site_settings', { type: 'json' }) || {};
      
      return jsonResponse({
        success: true,
        data: {
          siteName: settings.site_name || 'My Site',
          username: currentUsername
        }
      }, 200);
    } catch (e) {
      return jsonResponse({ success: false, message: '获取失败: ' + e.message }, 500);
    }
  }
  
  // POST：保存设置（网站名称）
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { siteName } = body;
      
      let settings = await env.ADMIN_KV.get('site_settings', { type: 'json' }) || {};
      
      if (siteName !== undefined) {
        settings.site_name = siteName;
      }
      
      await env.ADMIN_KV.put('site_settings', JSON.stringify(settings));
      
      return jsonResponse({ success: true, message: '保存成功' }, 200);
    } catch (e) {
      return jsonResponse({ success: false, message: '保存失败: ' + e.message }, 500);
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
