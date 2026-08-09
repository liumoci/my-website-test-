// 初始化管理员账号（仅首次可用）
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { username, password, secret } = body;
    
    if (!username || !password) {
      return jsonResponse({ success: false, message: '请输入用户名和密码' }, 400);
    }
    
    if (password.length < 6) {
      return jsonResponse({ success: false, message: '密码至少6位' }, 400);
    }
    
    // 验证初始化密钥（如果配置了的话）
    const initSecret = env.INIT_SECRET;
    if (initSecret && initSecret.length > 0) {
      if (!secret || secret !== initSecret) {
        return jsonResponse({ success: false, message: '初始化密钥错误' }, 403);
      }
    }
    
    // 检查是否已有用户
    const existingUser = await env.ADMIN_KV.get('user:' + username);
    if (existingUser) {
      return jsonResponse({ success: false, message: '用户已存在' }, 400);
    }
    
    // 检查是否已有任何用户（防止重复初始化）
    const initialized = await env.ADMIN_KV.get('system_initialized');
    if (initialized) {
      return jsonResponse({ success: false, message: '系统已初始化，无法重复创建' }, 403);
    }
    
    // 创建用户
    const passwordHash = await hashPassword(password);
    
    await env.ADMIN_KV.put('user:' + username, JSON.stringify({
      username: username,
      passwordHash: passwordHash,
      createdAt: Date.now()
    }));
    
    await env.ADMIN_KV.put('system_initialized', 'true');
    
    // 存储主密码哈希（用于只需要密码的场景，如导航管理）
    await env.ADMIN_KV.put('master_password_hash', passwordHash);
    
    // 生成初始重置密钥
    const initialResetSecret = generateRandomSecret();
    await env.ADMIN_KV.put('current_reset_secret', initialResetSecret);
    
    return jsonResponse({ 
      success: true, 
      message: '账号创建成功，请登录',
      resetSecret: initialResetSecret  // 返回重置密钥，让用户保存
    }, 200);
    
  } catch (e) {
    return jsonResponse({ success: false, message: '服务器错误: ' + e.message }, 500);
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

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'admin_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateRandomSecret() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  let result = '';
  for (let i = 0; i < array.length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}
