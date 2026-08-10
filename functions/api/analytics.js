// Cloudflare Analytics API (简化版 GraphQL，确保稳定)
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
        data = []; // 暂不支持
        break;
      case 'pages':
        data = []; // 暂不支持
        break;
      case 'sources':
        data = []; // 暂不支持
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

// 查询概览数据（7天总和）
async function getOverview(env) {
  const query = `
    query {
      viewer {
        zones(filter: { zoneTag: "${env.CF_ZONE_ID}" }) {
          httpRequests1dGroups(
            limit: 7
            filter: { date_geq: "${getDateDaysAgo(7)}" }
          ) {
            sum {
              requests
              pageViews
              bytes
            }
            uniq {
              uniques
            }
          }
        }
      }
    }
  `;
  
  const result = await callGraphQL(env, query);
  const groups = result.data.viewer.zones[0].httpRequests1dGroups || [];
  
  let totalRequests = 0;
  let totalPageViews = 0;
  let totalUniques = 0;
  let totalBytes = 0;
  
  groups.forEach(g => {
    totalRequests += g.sum.requests || 0;
    totalPageViews += g.sum.pageViews || 0;
    totalUniques += g.uniq.uniques || 0;
    totalBytes += g.sum.bytes || 0;
  });
  
  return {
    requests: totalRequests,
    pageViews: totalPageViews,
    uniques: totalUniques,
    bytes: totalBytes
  };
}

// 查询最近 7 天趋势
async function getTrend(env) {
  const query = `
    query {
      viewer {
        zones(filter: { zoneTag: "${env.CF_ZONE_ID}" }) {
          httpRequests1dGroups(
            limit: 7
            filter: { date_geq: "${getDateDaysAgo(7)}" }
          ) {
            date
            sum {
              requests
              pageViews
            }
            uniq {
              uniques
            }
          }
        }
      }
    }
  `;
  
  const result = await callGraphQL(env, query);
  const groups = result.data.viewer.zones[0].httpRequests1dGroups || [];
  
  return groups.map(g => ({
    date: g.date || '',
    requests: g.sum.requests || 0,
    pageViews: g.sum.pageViews || 0,
    uniques: g.uniq.uniques || 0
  }));
}

// 调用 Cloudflare GraphQL API
async function callGraphQL(env, query) {
  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CF_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  
  const data = await response.json();
  
  if (data.errors && data.errors.length > 0) {
    throw new Error(data.errors[0].message);
  }
  
  return data;
}

// 获取 N 天前的日期（YYYY-MM-DD）
function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
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