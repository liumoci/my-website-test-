// 留言箱 API 公共库
export async function verifyAdmin(request, env) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const sessionToken = getCookieValue(cookieHeader, 'admin_session');
  
  if (!sessionToken) {
    return { valid: false, response: jsonResponse({ success: false, message: '未登录' }, 401) };
  }
  
  try {
    const sessionData = await env.ADMIN_KV.get('session:' + sessionToken, { type: 'json' });
    if (!sessionData || sessionData.expires < Date.now()) {
      return { valid: false, response: jsonResponse({ success: false, message: '登录已过期' }, 401) };
    }
  } catch (e) {
    return { valid: false, response: jsonResponse({ success: false, message: '验证失败: ' + e.message }, 401) };
  }
  
  return { valid: true };
}

export function getClientIP(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
}

export async function getMessagesData(env) {
  try {
    const data = await env.ADMIN_KV.get('guestbook_messages', { type: 'json' });
    return data && data.messages ? data : { messages: [] };
  } catch (e) {
    return { messages: [] };
  }
}

export async function saveMessagesData(env, data) {
  await env.ADMIN_KV.put('guestbook_messages', JSON.stringify(data));
}

export async function getSettingsData(env) {
  try {
    const settings = await env.ADMIN_KV.get('guestbook_settings', { type: 'json' });
    if (settings) return settings;
  } catch (e) {}
  return {
    backgroundColor: '', cardColor: '', primaryColor: '',
    rateLimitMinutes: 1, enabled: true, backgroundImage: ''
  };
}

export async function getBlacklistData(env) {
  try {
    const data = await env.ADMIN_KV.get('guestbook_blacklist', { type: 'json' });
    if (data && data.ips) return data;
  } catch (e) {}
  return { ips: [] };
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function getCookieValue(cookieHeader, name) {
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const parts = cookie.trim().split('=');
    if (parts[0] === name) return parts[1];
  }
  return null;
}
