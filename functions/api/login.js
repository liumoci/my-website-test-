// 登录接口
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { username, password, remember } = body;
    
    if (!username || !password) {
      return jsonResponse({ success: false, message: '请输入用户名和密码' }, 400);
    }
    
    // 从 KV 获取用户信息
    const userData = await env.ADMIN_KV.get('user:' + username, { type: 'json' });
    
    if (!userData) {
      return jsonResponse({ success: false, message: '用户名或密码错误' }, 401);
    }
    
    // 验证密码哈希
    const passwordHash = await hashPassword(password);
    if (passwordHash !== userData.passwordHash) {
      return jsonResponse({ success: false, message: '用户名或密码错误' }, 401);
    }
    
    // 生成 session token
    const sessionToken = generateToken();
    const expiresIn = remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30天 或 1天
    
    // 存储 session
    await env.ADMIN_KV.put('session:' + sessionToken, JSON.stringify({
      username: username,
      createdAt: Date.now(),
      expires: Date.now() + expiresIn
    }), {
      expirationTtl: Math.floor(expiresIn / 1000)
    });
    
    // 设置 cookie
    const cookie = `admin_session=${sessionToken}; Path=/admin; Max-Age=${Math.floor(expiresIn / 1000)}; HttpOnly; SameSite=Lax`;
    
    return jsonResponse({ success: true, message: '登录成功' }, 200, {
      'Set-Cookie': cookie
    });
    
  } catch (e) {
    return jsonResponse({ success: false, message: '服务器错误: ' + e.message }, 500);
  }
}

function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'admin_salt_2026'); // 加盐
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}
