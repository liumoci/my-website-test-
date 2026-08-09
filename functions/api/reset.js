// 重置管理员账号（使用重置密钥）
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { resetSecret, username, password } = body;
    
    if (!resetSecret) {
      return jsonResponse({ success: false, message: '请输入重置密钥' }, 400);
    }
    
    // 获取当前有效的重置密钥（从 KV）
    let currentSecret = null;
    try {
      currentSecret = await env.ADMIN_KV.get('current_reset_secret');
    } catch (e) {
      // KV 未配置
    }
    
    // 环境变量中的密钥作为万能钥匙（始终有效）
    const masterSecret = env.RESET_SECRET;
    
    // 验证密钥：KV 中的当前密钥 或 环境变量中的万能密钥
    const isValidSecret = (currentSecret && resetSecret === currentSecret) || 
                          (masterSecret && resetSecret === masterSecret);
    
    if (!isValidSecret) {
      return jsonResponse({ success: false, message: '重置密钥错误' }, 403);
    }
    
    if (!username || !password) {
      return jsonResponse({ success: false, message: '请输入新的用户名和密码' }, 400);
    }
    
    if (password.length < 6) {
      return jsonResponse({ success: false, message: '密码至少6位' }, 400);
    }
    
    // 删除初始化标记
    await env.ADMIN_KV.delete('system_initialized');
    
    // 创建新用户
    const passwordHash = await hashPassword(password);
    
    await env.ADMIN_KV.put('user:' + username, JSON.stringify({
      username: username,
      passwordHash: passwordHash,
      createdAt: Date.now(),
      resetAt: Date.now()
    }));
    
    await env.ADMIN_KV.put('system_initialized', 'true');
    
    // 更新主密码哈希
    await env.ADMIN_KV.put('master_password_hash', passwordHash);
    
    // 生成新的重置密钥（自动轮换）
    const newResetSecret = generateRandomSecret();
    await env.ADMIN_KV.put('current_reset_secret', newResetSecret);
    
    return jsonResponse({ 
      success: true, 
      message: '密码重置成功，请使用新账号登录',
      newResetSecret: newResetSecret  // 返回新密钥，让用户保存
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
  // 生成 16 位随机字符串
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  let result = '';
  for (let i = 0; i < array.length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}
