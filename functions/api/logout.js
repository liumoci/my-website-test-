// 登出接口
export async function onRequestPost(context) {
  const { request, env } = context;
  
  const cookieHeader = request.headers.get('Cookie') || '';
  const sessionToken = getCookieValue(cookieHeader, 'admin_session');
  
  if (sessionToken) {
    // 删除 session
    try {
      await env.ADMIN_KV.delete('session:' + sessionToken);
    } catch (e) {
      // 忽略删除错误
    }
  }
  
  // 清除 cookie
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'admin_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax'
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
