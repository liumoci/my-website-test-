// Cloudflare Analytics API (使用 REST API，确保稳定)
export async function onRequest(context) {
  const { request, env } = context;
  
  // 需要登录
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
  
  // 检查环境变量
  if (!env.CF_API_TOKEN || !env.CF_ZONE_ID) {
    return jsonResponse({ 
      success: false, 
      message: '未配置 Cloudflare API，请先设置 CF_API_TOKEN 和 CF_ZONE_ID 环境变量' 
    }, 400);
  }
  
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'overview';
  
  try {
    let data;
    
    switch (type) {
      case 'overview':
        data = await getOverview(env);
        break;
      case 'countries':
        data = await getCountries(env);
        break;
      case 'pages':
        data = await getTopPages(env);
        break;
      case 'sources':
        data = await getTopSources(env);
        break;
      case 'trend':
        data = await getTrend(env);
        break;
      default:
        return jsonResponse({ success: false, message: '未知类型' }, 400);
    }
    
    return jsonResponse({ success: true, data }, 200);
  } catch (e) {
    return jsonResponse({ success: false, message: '获取数据失败: ' + e.message }, 500);
  }
}

// 调用 Cloudflare REST API
async function callCFAPI(env, endpoint, params = {}) {
  const url = new URL(`https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}/analytics/${endpoint}`);
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${env.CF_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.errors && data.errors[0] ? data.errors[0].message : 'API 请求失败');
  }
  
  return data.result;
}

// 查询概览数据
async function getOverview(env) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const until = new Date().toISOString();
  
  const result = await callCFAPI(env, 'dashboard', { since, until });
  
  const totals = result.totals || {};
  
  return {
    requests: totals.requests ? totals.requests.all || 0 : 0,
    pageViews: totals.page_views ? totals.page_views.all || 0 : 0,
    uniques: totals.uniques ? totals.uniques.all || 0 : 0,
    bytes: totals.bytes ? totals.bytes.all || 0 : 0
  };
}

// 查询国家分布（暂用空数据，后续完善）
async function getCountries(env) {
  return [];
}

// 查询热门页面（暂用空数据，后续完善）
async function getTopPages(env) {
  return [];
}

// 查询流量来源（暂用空数据，后续完善）
async function getTopSources(env) {
  return [];
}

// 查询最近 7 天趋势
async function getTrend(env) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const until = new Date().toISOString();
  
  const result = await callCFAPI(env, 'dashboard', { since, until });
  
  const timeseries = result.timeseries || [];
  
  return timeseries.map(t => ({
    date: t.since ? t.since.split('T')[0] : '',
    requests: t.requests ? t.requests.all || 0 : 0,
    pageViews: t.page_views ? t.page_views.all || 0 : 0,
    uniques: t.uniques ? t.uniques.all || 0 : 0
  }));
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