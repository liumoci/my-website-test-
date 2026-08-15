// 全站中间件 - 一键跑路模式
export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // 管理面板和API始终放行
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/')) {
    return next();
  }

  // 静态资源放行
  if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i)) {
    return next();
  }

  try {
    const siteStatus = await env.ADMIN_KV.get('site_status');
    if (siteStatus === 'closed') {
      // 返回跑路页面
      return new Response(CLOSED_PAGE, {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
  } catch (e) {
    // KV出错时正常放行
  }

  return next();
}

const CLOSED_PAGE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>404 - 站长已跑路</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: white;
    text-align: center;
    padding: 2rem;
  }
  .container {
    max-width: 500px;
  }
  .error-code {
    font-size: 8rem;
    font-weight: 900;
    line-height: 1;
    margin-bottom: 1rem;
    text-shadow: 0 4px 20px rgba(0,0,0,0.2);
    animation: float 3s ease-in-out infinite;
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-15px); }
  }
  .title {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }
  .message {
    font-size: 1.1rem;
    opacity: 0.9;
    margin-bottom: 2rem;
    line-height: 1.6;
  }
  .emoji {
    font-size: 4rem;
    margin-bottom: 1rem;
    display: block;
  }
  .footer {
    font-size: 0.85rem;
    opacity: 0.7;
    margin-top: 2rem;
  }
</style>
</head>
<body>
  <div class="container">
    <span class="emoji">🏃‍♂️💨</span>
    <div class="error-code">404</div>
    <h1 class="title">站长已跑路</h1>
    <p class="message">
      本站长已经提着小姨子跑路了<br>
      网站暂时关闭，请稍后再来看看<br>
      也许他会回来的...也许吧
    </p>
    <div class="footer">
      如果你是站长，请前往 /admin/ 登录恢复
    </div>
  </div>
</body>
</html>`;
