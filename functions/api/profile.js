// 个人主页数据管理
export async function onRequest(context) {
  const { request, env } = context;
  
  // POST 需要验证登录
  if (request.method === 'POST') {
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
  }
  
  // GET：获取个人主页数据
  if (request.method === 'GET') {
    try {
      const profileData = await env.ADMIN_KV.get('profile_data', { type: 'json' });
      
      if (!profileData) {
        return jsonResponse({
          success: true,
          data: getDefaultProfile()
        }, 200);
      }
      
      return jsonResponse({ success: true, data: profileData }, 200);
    } catch (e) {
      return jsonResponse({ success: false, message: '获取失败: ' + e.message }, 500);
    }
  }
  
  // POST：保存个人主页数据
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const profileData = body.data;
      
      if (!profileData) {
        return jsonResponse({ success: false, message: '数据格式错误' }, 400);
      }
      
      await env.ADMIN_KV.put('profile_data', JSON.stringify(profileData));
      
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

function getDefaultProfile() {
  return {
    avatar: '',
    name: '我的名字',
    bio: '这是我的个人简介，介绍一下我自己。',
    skills: ['JavaScript', 'HTML', 'CSS', 'Node.js'],
    projects: [
      {
        name: '项目一',
        desc: '项目描述',
        url: '#'
      }
    ],
    contact: {
      email: 'your@email.com',
      github: '',
      twitter: ''
    }
  };
}
