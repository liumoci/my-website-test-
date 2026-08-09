// 获取或刷新重置密钥（需登录）
export async function onRequest(context) {
  const { request, env } = context;
  
  // 验证登录
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
  
  // GET 请求：获取当前重置密钥
  if (request.method === 'GET') {
    try {
      const currentSecret = await env.ADMIN_KV.get('current_reset_secret');
      return jsonResponse({ 
        success: true, 
        resetSecret: currentSecret || '未生成'
      }, 200);
    } catch (e) {
      return jsonResponse({ success: false, message: '获取失败: ' + e.message }, 500);
    }
  }
  
  // POST 请求：刷新重置密钥
  if (request.method === 'POST') {
    try {
      const newSecret = generateRandomSecret();
      await env.ADMIN_KV.put('current_reset_secret', newSecret);
      return jsonResponse({ 
        success: true, 
        message: '重置密钥已刷新',
        resetSecret: newSecret
      }, 200);
    } catch (e) {
      return jsonResponse({ success: false, message: '刷新失败: ' + e.message }, 500);
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

function generateRandomSecret() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  let result = '';
  for (let i = 0; i < array.length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}
