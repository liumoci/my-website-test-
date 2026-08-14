// 导航数据管理
export async function onRequest(context) {
  const { request, env } = context;
  
  // POST/PUT 需要验证登录
  if (request.method === 'POST' || request.method === 'PUT') {
    const cookieHeader = request.headers.get('Cookie') || '';
    
    // 支持两种登录方式：管理面板登录(admin_session)和导航管理登录(nav_admin_session)
    let loggedIn = false;
    
    // 检查管理面板登录
    const adminToken = getCookieValue(cookieHeader, 'admin_session');
    if (adminToken) {
      try {
        const adminSession = await env.ADMIN_KV.get('session:' + adminToken, { type: 'json' });
        if (adminSession && adminSession.expires > Date.now()) {
          loggedIn = true;
        }
      } catch (e) {
        // 忽略错误，继续检查其他方式
      }
    }
    
    // 检查导航管理登录
    if (!loggedIn) {
      const navToken = getCookieValue(cookieHeader, 'nav_admin_session');
      if (navToken) {
        try {
          const navSession = await env.ADMIN_KV.get('nav_session:' + navToken, { type: 'json' });
          if (navSession && navSession.expires > Date.now()) {
            loggedIn = true;
          }
        } catch (e) {
          // 忽略错误
        }
      }
    }
    
    if (!loggedIn) {
      return jsonResponse({ success: false, message: '未登录' }, 401);
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
      const navData = await request.json();
      
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
