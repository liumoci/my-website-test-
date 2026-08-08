// 管理路径中间件 - 验证登录状态
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // 登录页和静态资源不需要验证
  if (url.pathname === '/admin/login.html' || 
      url.pathname.startsWith('/admin/assets/')) {
    return context.next();
  }
  
  // 从 cookie 获取 session token
  const cookieHeader = request.headers.get('Cookie') || '';
  const sessionToken = getCookieValue(cookieHeader, 'admin_session');
  
  if (!sessionToken) {
    return Response.redirect(url.origin + '/admin/login.html', 302);
  }
  
  // 验证 session
  try {
    const sessionData = await env.ADMIN_KV.get('session:' + sessionToken, { type: 'json' });
    
    if (!sessionData || sessionData.expires < Date.now()) {
      // session 不存在或已过期
      const response = Response.redirect(url.origin + '/admin/login.html', 302);
      response.headers.append('Set-Cookie', 'admin_session=; Path=/admin; Max-Age=0; HttpOnly; SameSite=Lax');
      return response;
    }
    
    // session 有效，继续
    const response = await context.next();
    return response;
  } catch (e) {
    // KV 未配置或出错，重定向到登录页
    return Response.redirect(url.origin + '/admin/login.html', 302);
  }
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
