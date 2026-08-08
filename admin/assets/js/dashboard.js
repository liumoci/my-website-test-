// ===== 管理面板功能 =====

document.addEventListener('DOMContentLoaded', async function() {
    // 检查登录状态（调用 API）
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        
        if (!data.loggedIn) {
            window.location.href = '/admin/login.html';
            return;
        }
        
        // 显示用户名
        const currentUserEl = document.getElementById('currentUser');
        if (currentUserEl && data.username) {
            currentUserEl.textContent = data.username;
        }
    } catch (e) {
        // API 调用失败，可能是本地预览
        console.warn('无法验证登录状态（本地预览时正常）');
    }
    
    // 初始化导航
    initNavigation();
    
    // 初始化统计数据（模拟）
    initStats();
    
    // 退出按钮
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            try {
                await fetch('/api/logout', { method: 'POST' });
            } catch (e) {
                // 忽略错误
            }
            window.location.href = '/admin/login.html';
        });
    }
    
    // 重置密钥功能
    initResetSecret();
});

// 初始化重置密钥功能
function initResetSecret() {
    const secretValue = document.getElementById('resetSecretValue');
    const copyBtn = document.getElementById('copySecretBtn');
    const refreshBtn = document.getElementById('refreshSecretBtn');
    const secretMsg = document.getElementById('secretMsg');
    
    if (!secretValue) return;
    
    // 加载重置密钥
    loadResetSecret();
    
    // 复制按钮
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            const secret = secretValue.textContent;
            if (secret && secret !== '加载中...' && secret !== '未生成') {
                navigator.clipboard.writeText(secret).then(() => {
                    showSecretMsg('已复制到剪贴板', 'success');
                }).catch(() => {
                    showSecretMsg('复制失败，请手动复制', 'error');
                });
            }
        });
    }
    
    // 刷新按钮
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function() {
            refreshBtn.disabled = true;
            refreshBtn.textContent = '刷新中...';
            
            try {
                const response = await fetch('/api/reset-secret', {
                    method: 'POST'
                });
                const data = await response.json();
                
                if (data.success) {
                    secretValue.textContent = data.resetSecret;
                    showSecretMsg('密钥已刷新，请保存新密钥', 'success');
                } else {
                    showSecretMsg(data.message || '刷新失败', 'error');
                }
            } catch (e) {
                showSecretMsg('网络错误', 'error');
            } finally {
                refreshBtn.disabled = false;
                refreshBtn.textContent = '刷新重置密钥';
            }
        });
    }
}

// 加载重置密钥
async function loadResetSecret() {
    const secretValue = document.getElementById('resetSecretValue');
    if (!secretValue) return;
    
    try {
        const response = await fetch('/api/reset-secret');
        const data = await response.json();
        
        if (data.success) {
            secretValue.textContent = data.resetSecret;
        } else {
            secretValue.textContent = '加载失败';
        }
    } catch (e) {
        secretValue.textContent = '加载失败';
    }
}

function showSecretMsg(msg, type) {
    const secretMsg = document.getElementById('secretMsg');
    if (!secretMsg) return;
    
    secretMsg.textContent = msg;
    secretMsg.className = 'secret-msg ' + type;
    
    setTimeout(() => {
        secretMsg.textContent = '';
        secretMsg.className = 'secret-msg';
    }, 3000);
}

// 导航切换
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pageSections = document.querySelectorAll('.page-section');
    const pageTitle = document.getElementById('pageTitle');
    
    const pageTitles = {
        'dashboard': '概览',
        'files': '文件管理',
        'posts': '文章管理',
        'stats': '访问统计',
        'settings': '系统设置'
    };
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const page = this.getAttribute('data-page');
            
            // 更新导航激活状态
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // 切换页面内容
            pageSections.forEach(section => section.classList.remove('active'));
            document.getElementById('page-' + page).classList.add('active');
            
            // 更新标题
            if (pageTitle && pageTitles[page]) {
                pageTitle.textContent = pageTitles[page];
            }
            
            // 更新 URL hash
            window.location.hash = page;
        });
    });
    
    // 根据 URL hash 切换页面
    const hash = window.location.hash.replace('#', '');
    if (hash && pageTitles[hash]) {
        const targetNav = document.querySelector(`.nav-item[data-page="${hash}"]`);
        if (targetNav) {
            targetNav.click();
        }
    }
}

// 模拟统计数据
function initStats() {
    // 模拟数据（实际项目中应从 API 获取）
    document.getElementById('totalVisits').textContent = '1,234';
    document.getElementById('totalPosts').textContent = '1';
    document.getElementById('totalFiles').textContent = '12';
    document.getElementById('storageUsed').textContent = '2.5 MB';
}
