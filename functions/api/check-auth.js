// 检查登录状态接口
export async function onRequestGet(context) {
  const { request, env } = context;
  
  const cookieHeader = request.headers.get('Cookie') || '';
  const sessionToken = getCookieValue(cookieHeader, 'admin_session');
  
  if (!sessionToken) {
    return jsonResponse({ loggedIn: false }, 200);
  }
  
  try {
    const sessionData = await env.ADMIN_KV.get('session:' + sessionToken, { type: 'json' });
    
    if (!sessionData || sessionData.expires < Date.now()) {
      return jsonResponse({ loggedIn: false }, 200);
    }
    
    return jsonResponse({
      loggedIn: true,
      username: sessionData.username
    }, 200);
    
  } catch (e) {
    return jsonResponse({ loggedIn: false, error: e.message }, 200);
  }
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
