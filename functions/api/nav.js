// 导航数据管理
export async function onRequest(context) {
  const { request, env } = context;
  
  // POST/PUT 需要验证登录
  if (request.method === 'POST' || request.method === 'PUT') {
    const cookieHeader = request.headers.get('Cookie') || '';
    const sessionToken = getCookieValue(cookieHeader, 'nav_admin_session');
    
    if (!sessionToken) {
      return jsonResponse({ success: false, message: '未登录' }, 401);
    }
    
    try {
      const sessionData = await env.ADMIN_KV.get('nav_session:' + sessionToken, { type: 'json' });
      if (!sessionData || sessionData.expires < Date.now()) {
        return jsonResponse({ success: false, message: '登录已过期' }, 401);
      }
    } catch (e) {
      return jsonResponse({ success: false, message: '验证失败' }, 401);
    }
  }
  
  // GET：获取导航数据
  if (request.method === 'GET') {
    try {
      const navData = await env.ADMIN_KV.get('nav_data', { type: 'json' });
      
      // 如果没有数据，返回默认数据
      if (!navData) {
        return jsonResponse({
          success: true,
          data: getDefaultNavData()
        }, 200);
      }
      
      return jsonResponse({ success: true, data: navData }, 200);
    } catch (e) {
      return jsonResponse({ success: false, message: '获取失败: ' + e.message }, 500);
    }
  }
  
  // POST：保存导航数据
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const navData = body.data;
      
      if (!navData || !navData.categories || !Array.isArray(navData.categories)) {
        return jsonResponse({ success: false, message: '数据格式错误' }, 400);
      }
      
      await env.ADMIN_KV.put('nav_data', JSON.stringify(navData));
      
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

function getDefaultNavData() {
  return {
    background: {
      type: 'color',
      value: ''
    },
    cards: [
      {
        title: '个人主页',
        description: '关于我的介绍',
        icon: '👤',
        url: '/about/'
      },
      {
        title: '博客',
        description: '我的文章与思考',
        icon: '📝',
        url: '/blog/'
      },
      {
        title: '云盘',
        description: '文件分享与下载',
        icon: '☁️',
        url: '/drive/'
      },
      {
        title: '管理面板',
        description: '网站后台管理',
        icon: '⚙️',
        url: '/admin/'
      }
    ],
    categories: [
      {
        name: '常用链接',
        links: [
          { name: 'GitHub', url: 'https://github.com', icon: '🐙' },
          { name: 'Twitter', url: 'https://twitter.com', icon: '🐦' },
          { name: 'Email', url: 'mailto:your@email.com', icon: '📧' }
        ]
      }
    ]
  };
}
