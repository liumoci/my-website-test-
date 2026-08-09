// ===== 登录验证（调用后端 API） =====

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const initForm = document.getElementById('initForm');
    const resetForm = document.getElementById('resetForm');
    const toggleInit = document.getElementById('toggleInit');
    const toggleReset = document.getElementById('toggleReset');
    const formTitle = document.getElementById('formTitle');
    const formSubtitle = document.getElementById('formSubtitle');
    
    const errorMsg = document.getElementById('errorMsg');
    const successMsg = document.getElementById('successMsg');
    const initErrorMsg = document.getElementById('initErrorMsg');
    const initSuccessMsg = document.getElementById('initSuccessMsg');
    const resetErrorMsg = document.getElementById('resetErrorMsg');
    const resetSuccessMsg = document.getElementById('resetSuccessMsg');
    
    let currentMode = 'login'; // login / init / reset
    
    // 切换到登录模式
    function showLogin() {
        currentMode = 'login';
        loginForm.style.display = 'flex';
        initForm.style.display = 'none';
        resetForm.style.display = 'none';
        formTitle.textContent = '管理面板';
        formSubtitle.textContent = '请登录以继续';
        toggleInit.textContent = '首次使用？创建账号';
        toggleReset.style.display = '';
        clearMessages();
    }
    
    // 切换到初始化模式
    function showInit() {
        currentMode = 'init';
        loginForm.style.display = 'none';
        initForm.style.display = 'flex';
        resetForm.style.display = 'none';
        formTitle.textContent = '初始化';
        formSubtitle.textContent = '首次使用，请创建管理员账号';
        toggleInit.textContent = '已有账号？去登录';
        toggleReset.style.display = '';
        clearMessages();
    }
    
    // 切换到重置模式
    function showReset() {
        currentMode = 'reset';
        loginForm.style.display = 'none';
        initForm.style.display = 'none';
        resetForm.style.display = 'flex';
        formTitle.textContent = '重置密码';
        formSubtitle.textContent = '使用重置密钥设置新账号';
        toggleInit.style.display = 'none';
        toggleReset.textContent = '返回登录';
        clearMessages();
    }
    
    // 切换初始化
    toggleInit.addEventListener('click', function(e) {
        e.preventDefault();
        if (currentMode === 'login') {
            showInit();
        } else {
            showLogin();
        }
    });
    
    // 切换重置
    toggleReset.addEventListener('click', function(e) {
        e.preventDefault();
        if (currentMode === 'reset') {
            showLogin();
            toggleInit.style.display = '';
        } else {
            showReset();
        }
    });
    
    // 登录提交
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearMessages();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;
        
        const btn = loginForm.querySelector('.btn-login');
        btn.disabled = true;
        btn.textContent = '登录中...';
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, remember })
            });
            
            const data = await response.json();
            
            if (data.success) {
                successMsg.textContent = data.message;
                setTimeout(() => {
                    window.location.href = '/admin/';
                }, 500);
            } else {
                errorMsg.textContent = data.message || '登录失败';
            }
        } catch (err) {
            errorMsg.textContent = '网络错误，请检查 KV 是否配置正确';
            console.error(err);
        } finally {
            btn.disabled = false;
            btn.textContent = '登 录';
        }
    });
    
    // 初始化提交
    initForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearMessages();
        
        const secret = document.getElementById('initSecret').value;
        const username = document.getElementById('initUsername').value;
        const password = document.getElementById('initPassword').value;
        const password2 = document.getElementById('initPassword2').value;
        
        if (password !== password2) {
            initErrorMsg.textContent = '两次密码不一致';
            return;
        }
        
        if (password.length < 6) {
            initErrorMsg.textContent = '密码至少6位';
            return;
        }
        
        const btn = initForm.querySelector('.btn-login');
        btn.disabled = true;
        btn.textContent = '创建中...';
        
        try {
            const response = await fetch('/api/init', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, secret })
            });
            
            const data = await response.json();
            
            if (data.success) {
                initSuccessMsg.textContent = data.message;
                
                // 如果返回了重置密钥，显示给用户保存
                if (data.resetSecret) {
                    showSecretModal('初始化成功！', '请保存好你的重置密钥（忘记密码时用）：', data.resetSecret);
                }
                
                setTimeout(() => {
                    showLogin();
                    document.getElementById('username').value = username;
                    successMsg.textContent = '账号创建成功，请登录';
                }, data.resetSecret ? 5000 : 1000);
            } else {
                initErrorMsg.textContent = data.message || '创建失败';
            }
        } catch (err) {
            initErrorMsg.textContent = '网络错误，请检查 KV 是否配置正确';
            console.error(err);
        } finally {
            btn.disabled = false;
            btn.textContent = '创建账号';
        }
    });
    
    // 重置密码提交
    resetForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearMessages();
        
        const resetSecret = document.getElementById('resetSecret').value;
        const username = document.getElementById('resetUsername').value;
        const password = document.getElementById('resetPassword').value;
        const password2 = document.getElementById('resetPassword2').value;
        
        if (password !== password2) {
            resetErrorMsg.textContent = '两次密码不一致';
            return;
        }
        
        if (password.length < 6) {
            resetErrorMsg.textContent = '密码至少6位';
            return;
        }
        
        const btn = resetForm.querySelector('.btn-login');
        btn.disabled = true;
        btn.textContent = '重置中...';
        
        try {
            const response = await fetch('/api/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ resetSecret, username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                resetSuccessMsg.textContent = data.message;
                
                // 如果返回了新的重置密钥，显示给用户保存
                if (data.newResetSecret) {
                    showSecretModal('重置成功！', '重置密钥已自动更新，请保存好新密钥：', data.newResetSecret);
                }
                
                setTimeout(() => {
                    showLogin();
                    toggleInit.style.display = '';
                    document.getElementById('username').value = username;
                    successMsg.textContent = '密码重置成功，请用新账号登录';
                }, data.newResetSecret ? 5000 : 1000);
            } else {
                resetErrorMsg.textContent = data.message || '重置失败';
            }
        } catch (err) {
            resetErrorMsg.textContent = '网络错误，请检查配置';
            console.error(err);
        } finally {
            btn.disabled = false;
            btn.textContent = '重置密码';
        }
    });
    
    function clearMessages() {
        errorMsg.textContent = '';
        successMsg.textContent = '';
        initErrorMsg.textContent = '';
        initSuccessMsg.textContent = '';
        resetErrorMsg.textContent = '';
        resetSuccessMsg.textContent = '';
    }
    
    // 显示密钥弹窗
    function showSecretModal(title, desc, secret) {
        // 创建弹窗
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: var(--card-bg, white);
            color: var(--text-color, #333);
            padding: 2rem;
            border-radius: 1rem;
            max-width: 400px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        `;
        
        modalContent.innerHTML = `
            <h2 style="margin-bottom: 0.5rem; font-size: 1.25rem;">${title}</h2>
            <p style="color: var(--text-secondary, #666); margin-bottom: 1rem; font-size: 0.9rem;">${desc}</p>
            <div style="background: var(--bg-color, #f5f5f5); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                <code style="font-size: 1.25rem; letter-spacing: 2px; font-weight: bold;">${secret}</code>
            </div>
            <p style="color: var(--danger-color, #ef4444); font-size: 0.8rem; margin-bottom: 1rem;">
                ⚠️ 请立即保存，关闭后无法再次查看！
            </p>
            <button id="closeSecretModal" style="
                padding: 0.625rem 2rem;
                background: var(--primary-color, #3b82f6);
                color: white;
                border: none;
                border-radius: 0.5rem;
                cursor: pointer;
                font-size: 0.9rem;
            ">我已保存</button>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // 关闭按钮
        document.getElementById('closeSecretModal').addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        // 点击背景关闭
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
});
