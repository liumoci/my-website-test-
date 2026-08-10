// 管理路径中间件 - 验证登录状态
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const fullUrl = request.url;
  
  // 登录页和静态资源直接放行（多种判断方式，确保生效）
  if (fullUrl.includes('/login.html') || 
      pathname.includes('/assets/') ||
      pathname.endsWith('login.html') ||
      pathname === '/admin/' ||
      pathname === '/admin') {
    return context.next();
  }
  
  // 从 cookie 获取 session token
  const cookieHeader = request.headers.get('Cookie') || '';
  const sessionToken = getCookieValue(cookieHeader, 'admin_session');
  
  // 没有 cookie，跳转到登录页
  if (!sessionToken) {
    // 防止循环：如果已经在登录页相关路径，直接放行
    if (fullUrl.includes('login')) {
      return context.next();
    }
    return Response.redirect(url.origin + '/admin/login.html', 302);
  }
  
  // 验证 session
  try {
    if (!env.ADMIN_KV) {
      // KV 未配置，直接放行，页面上会显示错误
      return context.next();
    }
    
    const sessionData = await env.ADMIN_KV.get('session:' + sessionToken, { type: 'json' });
    
    if (!sessionData || sessionData.expires < Date.now()) {
      // session 不存在或已过期，清除 cookie 并重定向到登录页
      const response = Response.redirect(url.origin + '/admin/login.html', 302);
      response.headers.append('Set-Cookie', 'admin_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
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
