// 导航管理中间件 - 验证登录状态
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // 登录页和静态资源直接放行
  if (pathname.includes('login') || 
      pathname.includes('/assets/')) {
    return context.next();
  }
  
  // 从 cookie 获取 session token
  const cookieHeader = request.headers.get('Cookie') || '';
  const sessionToken = getCookieValue(cookieHeader, 'nav_admin_session');
  
  // 没有 cookie，跳转到登录页
  if (!sessionToken) {
    return Response.redirect(url.origin + '/nav-admin/login.html', 302);
  }
  
  // 验证 session
  try {
    if (!env.ADMIN_KV) {
      // KV 未配置，直接放行，页面上会显示错误
      return context.next();
    }
    
    const sessionData = await env.ADMIN_KV.get('nav_session:' + sessionToken, { type: 'json' });
    
    if (!sessionData || sessionData.expires < Date.now()) {
      // session 不存在或已过期，清除 cookie 并重定向到登录页
      const response = Response.redirect(url.origin + '/nav-admin/login.html', 302);
      response.headers.append('Set-Cookie', 'nav_admin_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
      return response;
    }
    
    // session 有效，继续
    return context.next();
  } catch (e) {
    // 出错直接放行，避免重定向循环
    return context.next();
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
