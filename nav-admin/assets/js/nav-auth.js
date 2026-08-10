// 导航管理登录
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        errorMsg.textContent = '';
        
        const password = document.getElementById('password').value;
        
        const btn = loginForm.querySelector('.btn-login');
        btn.disabled = true;
        btn.textContent = '登录中...';
        
        try {
            const response = await fetch('/api/nav-login', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                window.location.href = '/nav-admin/';
            } else {
                errorMsg.textContent = data.message || '登录失败';
            }
        } catch (err) {
            errorMsg.textContent = '网络错误，请检查配置';
            console.error(err);
        } finally {
            btn.disabled = false;
            btn.textContent = '登 录';
        }
    });
});
