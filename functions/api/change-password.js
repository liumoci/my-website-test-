// 修改密码 API
export async function onRequest(context) {
  const { request, env } = context;
  
  if (request.method !== 'POST') {
    return jsonResponse({ success: false, message: '不支持的方法' }, 405);
  }
  
  // 验证登录
  const cookieHeader = request.headers.get('Cookie') || '';
  const sessionToken = getCookieValue(cookieHeader, 'admin_session');
  
  if (!sessionToken) {
    return jsonResponse({ success: false, message: '未登录' }, 401);
  }
  
  let sessionData;
  try {
    sessionData = await env.ADMIN_KV.get('session:' + sessionToken, { type: 'json' });
    if (!sessionData || sessionData.expires < Date.now()) {
      return jsonResponse({ success: false, message: '登录已过期' }, 401);
    }
  } catch (e) {
    return jsonResponse({ success: false, message: '验证失败' }, 401);
  }
  
  const currentUsername = sessionData.username;
  
  try {
    const body = await request.json();
    const { oldPassword, newPassword, newUsername } = body;
    
    if (!oldPassword || !newPassword) {
      return jsonResponse({ success: false, message: '旧密码和新密码不能为空' }, 400);
    }
    
    if (newPassword.length < 6) {
      return jsonResponse({ success: false, message: '新密码至少6位' }, 400);
    }
    
    // 获取当前用户
    const userKey = 'user:' + currentUsername;
    const userData = await env.ADMIN_KV.get(userKey, { type: 'json' });
    
    if (!userData) {
      return jsonResponse({ success: false, message: '用户不存在' }, 404);
    }
    
    // 验证旧密码
    const oldPasswordHash = await sha256(oldPassword + 'admin_salt_2026');
    if (oldPasswordHash !== userData.passwordHash) {
      return jsonResponse({ success: false, message: '旧密码错误' }, 400);
    }
    
    // 计算新密码哈希
    const newPasswordHash = await sha256(newPassword + 'admin_salt_2026');
    
    // 如果要修改用户名
    if (newUsername && newUsername !== currentUsername) {
      // 检查新用户名是否已存在
      const newUserKey = 'user:' + newUsername;
      const existingUser = await env.ADMIN_KV.get(newUserKey);
      
      if (existingUser) {
        return jsonResponse({ success: false, message: '用户名已存在' }, 400);
      }
      
      // 创建新用户
      const newUserData = {
        ...userData,
        username: newUsername,
        passwordHash: newPasswordHash,
        updatedAt: Date.now()
      };
      
      await env.ADMIN_KV.put(newUserKey, JSON.stringify(newUserData));
      
      // 删除旧用户
      await env.ADMIN_KV.delete(userKey);
      
      // 更新 session 里的用户名
      sessionData.username = newUsername;
      await env.ADMIN_KV.put('session:' + sessionToken, JSON.stringify(sessionData));
      
      // 更新 master_password_hash
      await env.ADMIN_KV.put('master_password_hash', newPasswordHash);
      
      return jsonResponse({ success: true, message: '用户名和密码修改成功', username: newUsername }, 200);
    }
    
    // 只修改密码
    userData.passwordHash = newPasswordHash;
    userData.updatedAt = Date.now();
    
    await env.ADMIN_KV.put(userKey, JSON.stringify(userData));
    
    // 更新 master_password_hash
    await env.ADMIN_KV.put('master_password_hash', newPasswordHash);
    
    return jsonResponse({ success: true, message: '密码修改成功' }, 200);
    
  } catch (e) {
    return jsonResponse({ success: false, message: '修改失败: ' + e.message }, 500);
  }
}

async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
