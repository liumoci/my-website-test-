// ===== 管理面板功能 =====

// 全局消息提示
function showMessage(text, type = 'info') {
    // 移除已有的提示
    const existing = document.getElementById('globalToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.textContent = text;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-20px);
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        color: white;
        font-size: 0.9rem;
        font-weight: 500;
        z-index: 9999;
        opacity: 0;
        transition: all 0.3s;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    `;
    document.body.appendChild(toast);

    // 显示
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    // 3秒后消失
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

document.addEventListener('DOMContentLoaded', async function() {
    // 检查登录状态（调用 API）
    try {
        const response = await fetch('/api/check-auth', {
            credentials: 'include'
        });
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
                await fetch('/api/logout', { 
                    method: 'POST',
                    credentials: 'include'
                });
            } catch (e) {
                // 忽略错误
            }
            window.location.href = '/admin/login.html';
        });
    }
    
    // 重置密钥功能
    initResetSecret();
    
    // 系统设置
    initSettings();
    
    // 留言管理
    initMessagesManager();
    
    // 网盘管理
    initDriveManager();

    // 文章管理
    initPostManager();

    // 导航管理
    initNavManager();
    
    // 访问统计
    initStatsPage();
    
    // 个人主页管理
    initProfileManager();
    
    // 留言箱背景图上传
    initMsgBgUpload();
    
    // 隐藏页面加载动画
    setTimeout(() => {
        const loader = document.getElementById('pageLoader');
        if (loader) {
            loader.classList.add('hidden');
        }
    }, 300);
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
                    method: 'POST',
                    credentials: 'include'
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
        const response = await fetch('/api/reset-secret', {
            credentials: 'include'
        });
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
        'posts': '文章管理',
        'profile': '个人主页',
        'nav': '导航管理',
        'stats': '访问统计',
        'messages': '留言管理',
        'drive': '网盘管理',
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
            
            // 切换到留言管理页面时加载数据
            if (page === 'messages') {
                loadAdminMessages();
                loadMsgSettings();
                loadBlacklist();
            }

            // 切换到统计页面时加载数据
            if (page === 'stats') {
                loadAllStats();
            }

            // 切换到概览页面时加载数据
            if (page === 'dashboard') {
                loadDashboardStats();
            }

            // 切换到网盘管理页面时加载数据
            if (page === 'drive') {
                loadDriveSettings();
            }

            // 切换到文章管理页面时加载数据
            if (page === 'posts') {
                loadAdminPosts();
            }
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

// 旧的模拟统计数据（已废弃，保留兼容）
function initStats() {
    // 已改为真实的 Cloudflare Analytics
    // 见 initStatsPage()
}

// ===== 个人主页管理 =====
let profileData = null;

function initProfileManager() {
    // 检查是否有个人主页页面
    if (!document.getElementById('page-profile')) return;
    
    // 头像上传
    document.getElementById('uploadAvatarBtn').addEventListener('click', () => {
        document.getElementById('avatarFileInput').click();
    });
    
    document.getElementById('avatarFileInput').addEventListener('change', handleAvatarUpload);
    document.getElementById('removeAvatarBtn').addEventListener('click', removeAvatar);
    
    // 技能管理
    document.getElementById('addSkillBtn').addEventListener('click', addSkill);
    document.getElementById('newSkillInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addSkill();
    });
    
    // 项目管理
    document.getElementById('addProjectBtn').addEventListener('click', addProject);
    
    // 保存按钮
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
    
    // 加载数据
    loadProfileData();
}

// 加载个人主页数据
async function loadProfileData() {
    try {
        const response = await fetch('/api/profile', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.data) {
            profileData = data.data;
            renderProfileForm();
        }
    } catch (e) {
        console.error('加载个人主页数据失败:', e);
    }
}

// 渲染个人主页表单
function renderProfileForm() {
    if (!profileData) return;
    
    // 头像
    if (profileData.avatar) {
        const preview = document.getElementById('avatarPreview');
        preview.innerHTML = `<img src="${profileData.avatar}" alt="头像">`;
    }
    
    // 基本信息
    document.getElementById('profileName').value = profileData.name || '';
    document.getElementById('profileBio').value = profileData.bio || '';
    
    // 技能
    renderSkills();
    
    // 项目
    renderProjects();
    
    // 联系方式
    if (profileData.contact) {
        document.getElementById('contactEmail').value = profileData.contact.email || '';
        document.getElementById('contactGithub').value = profileData.contact.github || '';
        document.getElementById('contactTwitter').value = profileData.contact.twitter || '';
    }
}

// 头像上传
function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过 5MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;
        profileData.avatar = base64;
        
        const preview = document.getElementById('avatarPreview');
        preview.innerHTML = `<img src="${base64}" alt="头像">`;
        
        showProfileMsg('头像已上传，点击保存生效', 'success');
    };
    reader.readAsDataURL(file);
}

// 移除头像
function removeAvatar() {
    if (!confirm('确定要移除头像吗？')) return;
    
    profileData.avatar = '';
    document.getElementById('avatarPreview').innerHTML = '<span style="color: var(--text-secondary);">暂无头像</span>';
    showProfileMsg('已移除，点击保存生效', 'success');
}

// 渲染技能列表
function renderSkills() {
    const container = document.getElementById('skillsList');
    if (!container || !profileData.skills) return;
    
    container.innerHTML = '';
    
    profileData.skills.forEach((skill, index) => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag';
        tag.innerHTML = `
            ${escapeHtml(skill)}
            <button class="skill-remove" onclick="removeSkill(${index})">×</button>
        `;
        container.appendChild(tag);
    });
}

// 添加技能
function addSkill() {
    const input = document.getElementById('newSkillInput');
    const skill = input.value.trim();
    
    if (!skill) return;
    if (!profileData.skills) profileData.skills = [];
    if (profileData.skills.includes(skill)) {
        alert('该技能已存在');
        return;
    }
    
    profileData.skills.push(skill);
    input.value = '';
    renderSkills();
}

// 删除技能
function removeSkill(index) {
    if (!profileData.skills) return;
    profileData.skills.splice(index, 1);
    renderSkills();
}

// 渲染项目列表
function renderProjects() {
    const container = document.getElementById('projectsList');
    if (!container || !profileData.projects) return;
    
    container.innerHTML = '';
    
    profileData.projects.forEach((project, index) => {
        const item = document.createElement('div');
        item.className = 'project-edit-item';
        item.innerHTML = `
            <div class="project-edit-info">
                <input type="text" class="project-name-input" value="${escapeHtml(project.name || '')}" placeholder="项目名称" onchange="updateProject(${index}, 'name', this.value)">
                <textarea class="project-desc-input" rows="2" placeholder="项目描述" onchange="updateProject(${index}, 'desc', this.value)">${escapeHtml(project.desc || '')}</textarea>
                <input type="text" class="project-url-input" value="${escapeHtml(project.url || '')}" placeholder="项目链接" onchange="updateProject(${index}, 'url', this.value)">
            </div>
            <div class="project-edit-actions">
                <button class="btn-danger btn-small" onclick="removeProject(${index})">删除</button>
            </div>
        `;
        container.appendChild(item);
    });
}

// 添加项目
function addProject() {
    if (!profileData.projects) profileData.projects = [];
    
    profileData.projects.push({
        name: '新项目',
        desc: '项目描述',
        url: '#'
    });
    
    renderProjects();
}

// 更新项目
function updateProject(index, field, value) {
    if (!profileData.projects || !profileData.projects[index]) return;
    profileData.projects[index][field] = value;
}

// 删除项目
function removeProject(index) {
    if (!confirm('确定要删除这个项目吗？')) return;
    if (!profileData.projects) return;
    
    profileData.projects.splice(index, 1);
    renderProjects();
}

// 保存个人主页数据
async function saveProfile() {
    const btn = document.getElementById('saveProfileBtn');
    btn.disabled = true;
    btn.textContent = '保存中...';
    
    // 收集表单数据
    profileData.name = document.getElementById('profileName').value.trim();
    profileData.bio = document.getElementById('profileBio').value.trim();
    profileData.contact = {
        email: document.getElementById('contactEmail').value.trim(),
        github: document.getElementById('contactGithub').value.trim(),
        twitter: document.getElementById('contactTwitter').value.trim()
    };
    
    try {
        const response = await fetch('/api/profile', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: profileData })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showProfileMsg('保存成功！', 'success');
        } else {
            showProfileMsg('保存失败: ' + (data.message || '未知错误'), 'error');
        }
    } catch (err) {
        showProfileMsg('网络错误', 'error');
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.textContent = '保存个人主页设置';
    }
}

// 显示保存消息
function showProfileMsg(msg, type) {
    const msgEl = document.getElementById('profileSaveMsg');
    msgEl.textContent = msg;
    msgEl.className = 'save-msg ' + type;
    
    setTimeout(() => {
        msgEl.textContent = '';
        msgEl.className = 'save-msg';
    }, 3000);
}

// ===== 系统设置 =====
function initSettings() {
    // 检查是否有设置页面
    if (!document.getElementById('page-settings')) return;
    
    // 加载设置
    loadSettings();
    
    // 网站设置表单
    document.getElementById('siteSettingsForm').addEventListener('submit', saveSiteSettings);

    // 修改密码表单
    document.getElementById('passwordForm').addEventListener('submit', changePassword);

    // 一键跑路
    initSiteClosedToggle();
}

function initSiteClosedToggle() {
    const btn = document.getElementById('siteClosedBtn');
    if (!btn) return;

    // 加载状态
    loadSiteClosedStatus();

    // 点击切换
    btn.addEventListener('click', async function() {
        const isClosed = this.dataset.closed === 'true';
        const newState = !isClosed;

        if (newState && !confirm('确定要开启跑路模式吗？开启后除管理面板外所有页面将显示404！')) {
            return;
        }

        const originalText = this.textContent;
        this.disabled = true;
        this.textContent = '处理中...';

        try {
            const response = await fetch('/api/site-status', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ closed: newState })
            });
            const data = await response.json();
            if (data.success) {
                showMessage(data.message, 'success');
                updateSiteClosedUI(newState);
            } else {
                showMessage(data.message || '操作失败', 'error');
            }
        } catch (e) {
            showMessage('网络错误', 'error');
        } finally {
            this.disabled = false;
        }
    });
}

async function loadSiteClosedStatus() {
    try {
        const response = await fetch('/api/site-status');
        const data = await response.json();
        if (data.success) {
            updateSiteClosedUI(data.data.closed);
        }
    } catch (e) {
        const btn = document.getElementById('siteClosedBtn');
        if (btn) btn.textContent = '加载失败';
    }
}

function updateSiteClosedUI(closed) {
    const btn = document.getElementById('siteClosedBtn');
    const statusEl = document.getElementById('siteClosedStatus');
    if (!btn) return;

    btn.dataset.closed = closed;
    if (closed) {
        btn.textContent = '关闭跑路模式';
        btn.style.background = '#10b981';
        if (statusEl) {
            statusEl.textContent = '🔴 跑路模式已开启';
            statusEl.style.color = '#ef4444';
        }
    } else {
        btn.textContent = '开启跑路模式';
        btn.style.background = '#ef4444';
        if (statusEl) {
            statusEl.textContent = '🟢 网站正常运行';
            statusEl.style.color = '#10b981';
        }
    }
}

async function loadSettings() {
    try {
        const response = await fetch('/api/settings', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.data) {
            document.getElementById('siteNameInput').value = data.data.siteName || 'My Site';
            document.getElementById('currentUsername').value = data.data.username || 'admin';
        }
    } catch (e) {
        console.error('加载设置失败:', e);
    }
}

async function saveSiteSettings(e) {
    e.preventDefault();
    
    const btn = e.target.querySelector('button[type="submit"]');
    const msgEl = document.getElementById('siteSettingsMsg');
    const siteName = document.getElementById('siteNameInput').value.trim();
    
    btn.disabled = true;
    btn.textContent = '保存中...';
    
    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ siteName })
        });
        
        const data = await response.json();
        
        if (data.success) {
            msgEl.textContent = '保存成功！';
            msgEl.className = 'form-msg success';
        } else {
            msgEl.textContent = data.message || '保存失败';
            msgEl.className = 'form-msg error';
        }
    } catch (err) {
        msgEl.textContent = '网络错误';
        msgEl.className = 'form-msg error';
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.textContent = '保存网站设置';
        
        setTimeout(() => {
            msgEl.textContent = '';
            msgEl.className = 'form-msg';
        }, 3000);
    }
}

async function changePassword(e) {
    e.preventDefault();
    
    const btn = e.target.querySelector('button[type="submit"]');
    const msgEl = document.getElementById('passwordMsg');
    
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const newUsername = document.getElementById('newUsername').value.trim();
    
    if (!oldPassword || !newPassword) {
        msgEl.textContent = '请填写旧密码和新密码';
        msgEl.className = 'form-msg error';
        return;
    }
    
    btn.disabled = true;
    btn.textContent = '修改中...';
    
    try {
        const response = await fetch('/api/change-password', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                oldPassword,
                newPassword,
                newUsername: newUsername || undefined
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            msgEl.textContent = data.message || '修改成功！';
            msgEl.className = 'form-msg success';
            
            // 清空表单
            document.getElementById('oldPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('newUsername').value = '';
            
            // 更新显示的用户名
            if (data.username) {
                document.getElementById('currentUsername').value = data.username;
                document.getElementById('currentUser').textContent = data.username;
            }
        } else {
            msgEl.textContent = data.message || '修改失败';
            msgEl.className = 'form-msg error';
        }
    } catch (err) {
        msgEl.textContent = '网络错误';
        msgEl.className = 'form-msg error';
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.textContent = '修改账号密码';
        
        setTimeout(() => {
            msgEl.textContent = '';
            msgEl.className = 'form-msg';
        }, 5000);
    }
}

// ===== 导航管理 =====
let navData = {
    background: { type: 'color', value: '' },
    cards: [],
    categories: []
};

let currentEditCategoryIndex = -1;
let currentEditLinkIndex = -1;
let currentEditLinkCategoryIndex = -1;
let currentEditCardIndex = -1;

function initNavManager() {
    // 检查是否有导航管理页面
    if (!document.getElementById('page-nav')) return;
    
    // 标签页切换
    document.querySelectorAll('#page-nav .tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchNavTab(tab);
        });
    });
    
    // 添加分类按钮
    document.getElementById('addNavCategoryBtn').addEventListener('click', addNavCategory);
    
    // 添加卡片按钮
    document.getElementById('addNavCardBtn').addEventListener('click', addNavCard);
    
    // 保存按钮
    document.getElementById('saveNavBtn').addEventListener('click', saveNavData);
    
    // 背景设置
    initNavBackgroundManager();
    
    // 加载数据
    loadNavData();
}

function switchNavTab(tabName) {
    // 更新按钮状态
    document.querySelectorAll('#page-nav .tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        }
    });
    
    // 切换内容
    document.querySelectorAll('#page-nav .tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById('tab-' + tabName).classList.add('active');
}

// 加载导航数据
async function loadNavData() {
    try {
        const response = await fetch('/api/nav');
        const data = await response.json();
        
        if (data.success && data.data) {
            navData = data.data;
            renderNavCategories();
            renderNavCards();
            renderNavBackground();
        }
    } catch (err) {
        console.error('加载导航数据失败:', err);
    }
}

// 保存导航数据
async function saveNavData() {
    const btn = document.getElementById('saveNavBtn');
    const msgEl = document.getElementById('navSaveMsg');
    
    btn.disabled = true;
    btn.textContent = '保存中...';
    
    try {
        const response = await fetch('/api/nav', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(navData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            msgEl.textContent = '保存成功！';
            msgEl.className = 'save-msg success';
        } else {
            msgEl.textContent = data.message || '保存失败';
            msgEl.className = 'save-msg error';
        }
    } catch (err) {
        msgEl.textContent = '网络错误';
        msgEl.className = 'save-msg error';
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.textContent = '保存导航设置';
        
        setTimeout(() => {
            msgEl.textContent = '';
            msgEl.className = 'save-msg';
        }, 3000);
    }
}

// ===== 分类和链接管理 =====
function renderNavCategories() {
    const container = document.getElementById('navCategoriesContainer');
    if (!container) return;
    
    if (!navData.categories || navData.categories.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">暂无分类，点击下方按钮添加</p>';
        return;
    }
    
    container.innerHTML = '';
    
    navData.categories.forEach((category, catIndex) => {
        const catEl = document.createElement('div');
        catEl.className = 'category-item';
        
        let linksHtml = '';
        if (category.links && category.links.length > 0) {
            category.links.forEach((link, linkIndex) => {
                linksHtml += `
                    <div class="link-item">
                        <span class="link-icon">${link.icon || '🔗'}</span>
                        <span class="link-name">${escapeHtml(link.name)}</span>
                        <span class="link-url">${escapeHtml(link.url)}</span>
                        <div class="link-actions">
                            <button class="btn-secondary btn-small" onclick="editNavLink(${catIndex}, ${linkIndex})">编辑</button>
                            <button class="btn-danger btn-small" onclick="deleteNavLink(${catIndex}, ${linkIndex})">删除</button>
                        </div>
                    </div>
                `;
            });
        } else {
            linksHtml = '<p style="color: var(--text-secondary); font-size: 0.9rem;">暂无链接</p>';
        }
        
        catEl.innerHTML = `
            <div class="category-header">
                <h3>${escapeHtml(category.name)}</h3>
                <div class="category-actions">
                    <button class="btn-secondary btn-small" onclick="editNavCategory(${catIndex})">编辑</button>
                    <button class="btn-danger btn-small" onclick="deleteNavCategory(${catIndex})">删除</button>
                    <button class="btn-primary btn-small" onclick="addNavLink(${catIndex})">+ 添加链接</button>
                </div>
            </div>
            <div class="links-list">
                ${linksHtml}
            </div>
        `;
        
        container.appendChild(catEl);
    });
}

function addNavCategory() {
    const name = prompt('请输入分类名称：');
    if (!name) return;
    
    if (!navData.categories) navData.categories = [];
    
    navData.categories.push({
        name: name.trim(),
        links: []
    });
    
    renderNavCategories();
    showNavSaveHint();
}

function editNavCategory(index) {
    const category = navData.categories[index];
    const name = prompt('请输入新的分类名称：', category.name);
    if (!name) return;
    
    navData.categories[index].name = name.trim();
    renderNavCategories();
    showNavSaveHint();
}

function deleteNavCategory(index) {
    if (!confirm('确定要删除这个分类吗？分类下的所有链接也会被删除。')) return;
    
    navData.categories.splice(index, 1);
    renderNavCategories();
    showNavSaveHint();
}

function addNavLink(catIndex) {
    currentEditLinkCategoryIndex = catIndex;
    currentEditLinkIndex = -1;
    
    const name = prompt('链接名称：');
    if (!name) return;
    
    const url = prompt('链接地址：');
    if (!url) return;
    
    const icon = prompt('图标（emoji，可选）：', '🔗') || '🔗';
    
    if (!navData.categories[catIndex].links) {
        navData.categories[catIndex].links = [];
    }
    
    navData.categories[catIndex].links.push({
        name: name.trim(),
        url: url.trim(),
        icon: icon.trim()
    });
    
    renderNavCategories();
    showNavSaveHint();
}

function editNavLink(catIndex, linkIndex) {
    const link = navData.categories[catIndex].links[linkIndex];
    
    const name = prompt('链接名称：', link.name);
    if (!name) return;
    
    const url = prompt('链接地址：', link.url);
    if (!url) return;
    
    const icon = prompt('图标（emoji）：', link.icon || '🔗') || '🔗';
    
    navData.categories[catIndex].links[linkIndex] = {
        name: name.trim(),
        url: url.trim(),
        icon: icon.trim()
    };
    
    renderNavCategories();
    showNavSaveHint();
}

function deleteNavLink(catIndex, linkIndex) {
    if (!confirm('确定要删除这个链接吗？')) return;
    
    navData.categories[catIndex].links.splice(linkIndex, 1);
    renderNavCategories();
    showNavSaveHint();
}

function showNavSaveHint() {
    const msgEl = document.getElementById('navSaveMsg');
    msgEl.textContent = '已修改，点击保存生效';
    msgEl.className = 'save-msg';
}

// ===== 卡片管理 =====
function renderNavCards() {
    const container = document.getElementById('navCardsList');
    if (!container) return;
    
    if (!navData.cards || navData.cards.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">暂无卡片，点击下方按钮添加</p>';
        return;
    }
    
    container.innerHTML = '';
    
    navData.cards.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card-edit-item';
        cardEl.innerHTML = `
            <div class="card-edit-icon">${card.icon || '📄'}</div>
            <div class="card-edit-info">
                <div class="card-edit-title">${escapeHtml(card.title || '未命名')}</div>
                <div class="card-edit-desc">${escapeHtml(card.description || '')}</div>
                <div class="card-edit-url">${escapeHtml(card.url || '')}</div>
            </div>
            <div class="card-edit-actions">
                <button class="btn-secondary btn-small" onclick="editNavCard(${index})">编辑</button>
                <button class="btn-danger btn-small" onclick="deleteNavCard(${index})">删除</button>
            </div>
        `;
        container.appendChild(cardEl);
    });
}

function addNavCard() {
    const title = prompt('卡片标题：');
    if (!title) return;
    
    const description = prompt('卡片描述：') || '';
    const icon = prompt('图标（emoji）：', '📄') || '📄';
    const url = prompt('链接地址：') || '#';
    
    if (!navData.cards) navData.cards = [];
    
    navData.cards.push({
        title: title.trim(),
        description: description.trim(),
        icon: icon.trim(),
        url: url.trim()
    });
    
    renderNavCards();
    showNavSaveHint();
}

function editNavCard(index) {
    const card = navData.cards[index];
    
    const title = prompt('卡片标题：', card.title);
    if (!title) return;
    
    const description = prompt('卡片描述：', card.description || '') || '';
    const icon = prompt('图标（emoji）：', card.icon || '📄') || '📄';
    const url = prompt('链接地址：', card.url || '#') || '#';
    
    navData.cards[index] = {
        title: title.trim(),
        description: description.trim(),
        icon: icon.trim(),
        url: url.trim()
    };
    
    renderNavCards();
    showNavSaveHint();
}

function deleteNavCard(index) {
    if (!confirm('确定要删除这个卡片吗？')) return;
    
    navData.cards.splice(index, 1);
    renderNavCards();
    showNavSaveHint();
}

// ===== 背景设置 =====
function initNavBackgroundManager() {
    // 背景类型切换
    document.querySelectorAll('input[name="navBgType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const type = this.value;
            document.getElementById('navBgColorSection').style.display = type === 'color' ? 'block' : 'none';
            document.getElementById('navBgImageSection').style.display = type === 'image' ? 'block' : 'none';
            updateNavBgPreview();
        });
    });
    
    // 颜色选择器联动
    document.getElementById('navBgColorPicker').addEventListener('input', function() {
        document.getElementById('navBgColorText').value = this.value;
        updateNavBgPreview();
    });
    
    document.getElementById('navBgColorText').addEventListener('input', function() {
        const color = this.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
            document.getElementById('navBgColorPicker').value = color;
        }
        updateNavBgPreview();
    });
    
    // 图片URL输入
    document.getElementById('navBgImageUrl').addEventListener('input', function() {
        updateNavBgPreview();
        navData.background.value = this.value;
        showNavSaveHint();
    });
    
    // 拖拽上传
    initNavDragAndDrop();
}

function initNavDragAndDrop() {
    const dropZone = document.getElementById('navBgDropZone');
    const fileInput = document.getElementById('navBgFileInput');
    
    if (!dropZone || !fileInput) return;
    
    // 点击选择文件
    dropZone.addEventListener('click', () => fileInput.click());
    
    // 文件选择
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleNavImageFile(file);
    });
    
    // 拖拽事件
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleNavImageFile(file);
        }
    });
}

function handleNavImageFile(file) {
    if (file.size > 10 * 1024 * 1024) {
        alert('图片大小不能超过 10MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;
        document.getElementById('navBgImageUrl').value = base64;
        navData.background.value = base64;
        updateNavBgPreview();
        showNavSaveHint();
    };
    reader.readAsDataURL(file);
}

function renderNavBackground() {
    if (!navData.background) return;
    
    if (navData.background.type === 'image') {
        document.querySelector('input[name="navBgType"][value="image"]').checked = true;
        document.getElementById('navBgColorSection').style.display = 'none';
        document.getElementById('navBgImageSection').style.display = 'block';
        document.getElementById('navBgImageUrl').value = navData.background.value || '';
    } else {
        document.querySelector('input[name="navBgType"][value="color"]').checked = true;
        document.getElementById('navBgColorSection').style.display = 'block';
        document.getElementById('navBgImageSection').style.display = 'none';
        
        if (navData.background.value) {
            document.getElementById('navBgColorPicker').value = navData.background.value;
            document.getElementById('navBgColorText').value = navData.background.value;
        }
    }
    
    updateNavBgPreview();
}

function updateNavBgPreview() {
    const preview = document.getElementById('navBgPreview');
    const type = document.querySelector('input[name="navBgType"]:checked').value;
    
    if (type === 'color') {
        const color = document.getElementById('navBgColorText').value;
        preview.style.background = color || 'var(--bg-color)';
        navData.background.type = 'color';
        navData.background.value = color || '';
    } else {
        const url = document.getElementById('navBgImageUrl').value;
        if (url) {
            preview.style.background = `url('${url}') center/cover no-repeat`;
        } else {
            preview.style.background = 'var(--bg-color)';
        }
        navData.background.type = 'image';
        navData.background.value = url || '';
    }
}

// ===== 概览数据 =====
async function loadDashboardStats() {
    // 文章数量
    try {
        const postsRes = await fetch('/api/posts/admin', { credentials: 'include' });
        const postsData = await postsRes.json();
        if (postsData.success) {
            const publishedCount = postsData.data.filter(p => p.published && !p.deleted).length;
            document.getElementById('totalPosts').textContent = publishedCount;
        }
    } catch (e) {
        document.getElementById('totalPosts').textContent = '0';
    }

    // 网盘文件数量
    try {
        const driveRes = await fetch('/api/drive-items');
        const driveData = await driveRes.json();
        if (driveData.success) {
            document.getElementById('totalFiles').textContent = driveData.data.length;
        }
    } catch (e) {
        document.getElementById('totalFiles').textContent = '0';
    }

    // 总访问量（从 Analytics 获取）
    try {
        const analyticsRes = await fetch('/api/analytics?type=overview', { credentials: 'include' });
        const analyticsData = await analyticsRes.json();
        if (analyticsData.success && analyticsData.data) {
            const total = analyticsData.data.totalRequests || analyticsData.data.requests || '--';
            document.getElementById('totalVisits').textContent = total;
        } else {
            document.getElementById('totalVisits').textContent = '--';
        }
    } catch (e) {
        document.getElementById('totalVisits').textContent = '--';
    }

    // 存储空间（估算，显示KV使用情况或留空）
    document.getElementById('storageUsed').textContent = 'KV存储';
}

// ===== 访问统计 =====
function initStatsPage() {
    // 检查是否有统计页面
    if (!document.getElementById('page-stats')) return;
    
    // 刷新按钮
    document.getElementById('refreshStatsBtn').addEventListener('click', loadAllStats);
    
    // 切换到统计页面时加载数据
    // （在导航切换里已经处理了）
}

// 加载所有统计数据
async function loadAllStats() {
    const loading = document.getElementById('statsLoading');
    const content = document.getElementById('statsContent');
    const error = document.getElementById('statsError');
    
    loading.style.display = 'flex';
    content.style.display = 'none';
    error.style.display = 'none';
    
    try {
        // 并行加载所有数据
        const [overview, countries, pages, sources, trend] = await Promise.all([
            fetchStats('overview'),
            fetchStats('countries'),
            fetchStats('pages'),
            fetchStats('sources'),
            fetchStats('trend')
        ]);
        
        // 渲染概览
        renderOverview(overview);
        renderCountries(countries);
        renderTopPages(pages);
        renderTopSources(sources);
        renderTrend(trend);
        
        loading.style.display = 'none';
        content.style.display = 'block';
    } catch (err) {
        loading.style.display = 'none';
        error.style.display = 'block';
        document.getElementById('statsErrorMsg').textContent = err.message || '加载失败';
        console.error('加载统计数据失败:', err);
    }
}

// 获取统计数据
async function fetchStats(type) {
    const response = await fetch(`/api/analytics?type=${type}`, {
        credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.message || '获取失败');
    }
    
    return data.data;
}

// 渲染概览
function renderOverview(data) {
    document.getElementById('statRequests').textContent = formatNumber(data.requests);
    document.getElementById('statUniques').textContent = formatNumber(data.uniques);
    document.getElementById('statPageViews').textContent = formatNumber(data.pageViews);
    document.getElementById('statBytes').textContent = formatBytes(data.bytes);
}

// 渲染热门页面
function renderTopPages(pages) {
    const container = document.getElementById('topPagesList');
    
    if (!pages || pages.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无数据</div>';
        return;
    }
    
    const maxViews = Math.max(...pages.map(p => p.pageViews));
    
    container.innerHTML = '';
    
    pages.forEach((page, index) => {
        const percent = maxViews > 0 ? (page.pageViews / maxViews) * 100 : 0;
        
        const item = document.createElement('div');
        item.className = 'rank-item';
        item.innerHTML = `
            <div class="rank-number">${index + 1}</div>
            <div class="rank-info">
                <div class="rank-name">${escapeHtml(page.path)}</div>
                <div class="rank-bar">
                    <div class="rank-bar-fill" style="width: ${percent}%"></div>
                </div>
            </div>
            <div class="rank-value">${formatNumber(page.pageViews)}</div>
        `;
        container.appendChild(item);
    });
}

// 渲染国家分布
function renderCountries(countries) {
    const container = document.getElementById('countriesList');
    
    if (!countries || countries.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无数据</div>';
        return;
    }
    
    const maxRequests = Math.max(...countries.map(c => c.requests));
    
    container.innerHTML = '';
    
    countries.forEach((country, index) => {
        const percent = maxRequests > 0 ? (country.requests / maxRequests) * 100 : 0;
        
        const item = document.createElement('div');
        item.className = 'rank-item';
        item.innerHTML = `
            <div class="rank-number">${index + 1}</div>
            <div class="rank-info">
                <div class="rank-name">${escapeHtml(country.country)}</div>
                <div class="rank-bar">
                    <div class="rank-bar-fill" style="width: ${percent}%"></div>
                </div>
            </div>
            <div class="rank-value">${formatNumber(country.requests)}</div>
        `;
        container.appendChild(item);
    });
}

// 渲染流量来源
function renderTopSources(sources) {
    const container = document.getElementById('sourcesList');
    
    if (!sources || sources.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无数据</div>';
        return;
    }
    
    const maxRequests = Math.max(...sources.map(s => s.requests));
    
    container.innerHTML = '';
    
    sources.forEach((source, index) => {
        const percent = maxRequests > 0 ? (source.requests / maxRequests) * 100 : 0;
        
        const item = document.createElement('div');
        item.className = 'rank-item';
        item.innerHTML = `
            <div class="rank-number">${index + 1}</div>
            <div class="rank-info">
                <div class="rank-name">${escapeHtml(source.host)}</div>
                <div class="rank-bar">
                    <div class="rank-bar-fill" style="width: ${percent}%"></div>
                </div>
            </div>
            <div class="rank-value">${formatNumber(source.requests)}</div>
        `;
        container.appendChild(item);
    });
}

// 渲染趋势图
function renderTrend(trend) {
    const container = document.getElementById('trendChart');
    
    if (!trend || trend.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无数据</div>';
        return;
    }
    
    const maxRequests = Math.max(...trend.map(t => t.requests));
    
    let html = '<div class="trend-bars">';
    
    trend.forEach(day => {
        const percent = maxRequests > 0 ? (day.requests / maxRequests) * 100 : 0;
        const date = day.date ? day.date.substring(5) : ''; // MM-DD
        
        html += `
            <div class="trend-bar-item">
                <div class="trend-bar-wrapper">
                    <div class="trend-bar-fill" style="height: ${percent}%"></div>
                </div>
                <div class="trend-bar-label">${date}</div>
                <div class="trend-bar-value">${formatNumber(day.requests)}</div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// 格式化数字（加千分位）
function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('zh-CN');
}

// 格式化字节
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ===== 留言管理 =====

// 初始化留言管理
function initMessagesManager() {
    // 标签页切换
    initMessagesTabs();
    
    // 刷新按钮
    const refreshBtn = document.getElementById('refreshMessagesBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadAdminMessages);
    }
    
    // 批量模式
    initBatchMode();
    
    // 保存设置按钮
    const saveSettingsBtn = document.getElementById('saveMsgSettingsBtn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveMsgSettings);
    }
    
    // 添加黑名单按钮
    const addBlacklistBtn = document.getElementById('addBlacklistBtn');
    if (addBlacklistBtn) {
        addBlacklistBtn.addEventListener('click', addToBlacklist);
    }
    
    // 颜色选择器同步
    const colorInputs = ['msgBgColor', 'msgCardColor', 'msgPrimaryColor'];
    colorInputs.forEach(id => {
        const colorInput = document.getElementById(id);
        const textInput = document.getElementById(id + 'Text');
        if (colorInput && textInput) {
            colorInput.addEventListener('input', function() {
                textInput.value = this.value;
            });
            textInput.addEventListener('input', function() {
                if (/^#[0-9A-Fa-f]{6}$/.test(this.value)) {
                    colorInput.value = this.value;
                }
            });
        }
    });
}

// ===== 网盘管理 =====

function initDriveManager() {
    const saveBtn = document.getElementById('saveDriveSettingsBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveDriveSettings);

    // 添加文件
    const addBtn = document.getElementById('addDriveItemBtn');
    if (addBtn) addBtn.addEventListener('click', () => openDriveItemModal());

    // 批量添加
    const batchAddBtn = document.getElementById('batchAddDriveItemBtn');
    if (batchAddBtn) batchAddBtn.addEventListener('click', openDriveBatchModal);

    // 批量删除模式
    const batchDeleteBtn = document.getElementById('batchDeleteDriveItemBtn');
    if (batchDeleteBtn) batchDeleteBtn.addEventListener('click', enterDriveBatchMode);

    const exitBatchBtn = document.getElementById('driveExitBatch');
    if (exitBatchBtn) exitBatchBtn.addEventListener('click', exitDriveBatchMode);

    const selectAll = document.getElementById('driveSelectAll');
    if (selectAll) selectAll.addEventListener('change', function() {
        document.querySelectorAll('.drive-item-checkbox:enabled').forEach(cb => cb.checked = this.checked);
        updateDriveSelectedCount();
    });

    const confirmBatchDelete = document.getElementById('driveConfirmBatchDelete');
    if (confirmBatchDelete) confirmBatchDelete.addEventListener('click', batchDeleteDriveItems);

    // 弹窗按钮
    const itemCancel = document.getElementById('driveItemCancelBtn');
    if (itemCancel) itemCancel.addEventListener('click', closeDriveItemModal);
    const itemSave = document.getElementById('driveItemSaveBtn');
    if (itemSave) itemSave.addEventListener('click', saveDriveItem);

    const batchCancel = document.getElementById('driveBatchCancelBtn');
    if (batchCancel) batchCancel.addEventListener('click', closeDriveBatchModal);
    const batchSave = document.getElementById('driveBatchSaveBtn');
    if (batchSave) batchSave.addEventListener('click', batchAddDriveItems);

    // 点击弹窗背景关闭
    document.querySelectorAll('#driveItemModal, #driveBatchModal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    });

    // 图标选择器
    initIconPicker();
}

// 图标选择器
const ICON_OPTIONS = ['📁','📂','📄','📝','📊','📈','📉','🎵','🎬','📷','🖼️','📚','📦','💾','🗂️','📋','📌','🔖','⭐','🌟','🔥','💡','🎯','🚀','📱','💻','🎮','🎨','🎭','🏠'];

function initIconPicker() {
    const picker = document.getElementById('iconPicker');
    const btn = document.getElementById('iconPickerBtn');
    if (!picker || !btn) return;

    // 生成图标选项
    picker.innerHTML = ICON_OPTIONS.map(icon => 
        `<button type="button" data-icon="${icon}" style="background:none;border:none;font-size:1.25rem;padding:0.375rem;cursor:pointer;border-radius:0.25rem;transition:background 0.2s;">${icon}</button>`
    ).join('');

    // 点击按钮切换选择器
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        picker.style.display = picker.style.display === 'grid' ? 'none' : 'grid';
    });

    // 选择图标
    picker.addEventListener('click', function(e) {
        const btn = e.target.closest('button[data-icon]');
        if (btn) {
            const icon = btn.dataset.icon;
            document.getElementById('driveItemIcon').value = icon;
            document.getElementById('iconPickerBtn').textContent = icon;
            picker.style.display = 'none';
        }
    });

    // 点击其他地方关闭
    document.addEventListener('click', function() {
        picker.style.display = 'none';
    });
}

let editingDriveItemId = null;
let driveBatchMode = false;

async function loadDriveSettings() {
    try {
        const response = await fetch('/api/drive-settings', { credentials: 'include' });
        const data = await response.json();
        if (data.success) {
            document.getElementById('driveTitle').value = data.data.title || '';
            document.getElementById('driveDesc').value = data.data.description || '';
            document.getElementById('driveEnabled').checked = data.data.enabled !== false;
        }
    } catch (err) {
        console.error('加载网盘设置失败:', err);
    }
    // 同时加载文件列表
    loadDriveItems();
}

async function saveDriveSettings() {
    const title = document.getElementById('driveTitle').value;
    const description = document.getElementById('driveDesc').value;
    const enabled = document.getElementById('driveEnabled').checked;

    const saveBtn = document.getElementById('saveDriveSettingsBtn');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = '保存中...';

    try {
        const response = await fetch('/api/drive-settings', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, enabled })
        });
        const data = await response.json();
        if (data.success) {
            showMessage('设置保存成功', 'success');
        } else {
            showMessage(data.message || '保存失败', 'error');
        }
    } catch (err) {
        showMessage('网络错误', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

// ===== 文件列表管理 =====
async function loadDriveItems() {
    try {
        const response = await fetch('/api/drive-items');
        const data = await response.json();
        if (data.success) {
            renderDriveItems(data.data);
        }
    } catch (err) {
        console.error('加载文件列表失败:', err);
        document.getElementById('driveItemsBody').innerHTML = 
            '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-secondary);">加载失败</td></tr>';
    }
}

function renderDriveItems(items) {
    const tbody = document.getElementById('driveItemsBody');
    if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-secondary);">暂无文件，点击"添加文件"开始</td></tr>';
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr data-id="${item.id}">
            <td class="col-checkbox">
                <input type="checkbox" class="drive-item-checkbox" data-id="${item.id}" style="${driveBatchMode ? '' : 'display:none;'}">
            </td>
            <td class="col-icon">${escapeHtml(item.icon || '📄')}</td>
            <td class="col-name">${escapeHtml(item.name)}</td>
            <td class="col-desc">${escapeHtml(item.description || '-')}</td>
            <td class="col-code">${item.extractCode ? escapeHtml(item.extractCode) : '-'}</td>
            <td class="col-url" title="${escapeHtml(item.url || '')}">${item.url ? escapeHtml(item.url) : '-'}</td>
            <td class="col-action">
                <button class="btn-link" onclick="editDriveItem('${item.id}')">编辑</button>
                <button class="btn-link danger" onclick="deleteDriveItem('${item.id}')">删除</button>
            </td>
        </tr>
    `).join('');
}

// 添加/编辑弹窗
function openDriveItemModal(item = null) {
    editingDriveItemId = item ? item.id : null;
    document.getElementById('driveItemModalTitle').textContent = item ? '编辑文件' : '添加文件';
    const defaultIcon = item ? (item.icon || '📁') : '📁';
    document.getElementById('driveItemIcon').value = defaultIcon;
    document.getElementById('iconPickerBtn').textContent = defaultIcon;
    document.getElementById('driveItemName').value = item ? (item.name || '') : '';
    document.getElementById('driveItemDesc').value = item ? (item.description || '') : '';
    document.getElementById('driveItemCode').value = item ? (item.extractCode || '') : '';
    document.getElementById('driveItemUrl').value = item ? (item.url || '') : '';
    document.getElementById('driveItemModal').classList.add('show');
}

function closeDriveItemModal() {
    document.getElementById('driveItemModal').classList.remove('show');
    editingDriveItemId = null;
}

async function saveDriveItem() {
    const icon = document.getElementById('driveItemIcon').value || '📁';
    const name = document.getElementById('driveItemName').value.trim();
    const description = document.getElementById('driveItemDesc').value.trim();
    const extractCode = document.getElementById('driveItemCode').value.trim();
    const url = document.getElementById('driveItemUrl').value.trim();

    if (!name) {
        showMessage('文件名不能为空', 'error');
        return;
    }

    const saveBtn = document.getElementById('driveItemSaveBtn');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = '保存中...';

    const body = { name, description, extractCode, url, icon };
    const urlPath = editingDriveItemId ? `/api/drive-items/${editingDriveItemId}` : '/api/drive-items';
    const method = editingDriveItemId ? 'PUT' : 'POST';

    try {
        const response = await fetch(urlPath, {
            method,
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        if (data.success) {
            showMessage(editingDriveItemId ? '修改成功' : '添加成功', 'success');
            closeDriveItemModal();
            loadDriveItems();
        } else {
            showMessage(data.message || '操作失败', 'error');
        }
    } catch (err) {
        showMessage('网络错误', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

function editDriveItem(id) {
    // 从当前渲染的数据中找到对应项
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (!row) return;
    const cells = row.querySelectorAll('td');
    const item = {
        id,
        icon: cells[1].textContent.trim(),
        name: cells[2].textContent.trim(),
        description: cells[3].textContent.trim() === '-' ? '' : cells[3].textContent.trim(),
        extractCode: cells[4].textContent.trim() === '-' ? '' : cells[4].textContent.trim(),
        url: cells[5].getAttribute('title') || ''
    };
    openDriveItemModal(item);
}

async function deleteDriveItem(id) {
    if (!confirm('确定要删除这个文件吗？')) return;
    try {
        const response = await fetch(`/api/drive-items/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
            showMessage('删除成功', 'success');
            loadDriveItems();
        } else {
            showMessage(data.message || '删除失败', 'error');
        }
    } catch (err) {
        showMessage('网络错误', 'error');
    }
}

// 批量添加
function openDriveBatchModal() {
    document.getElementById('driveBatchInput').value = '';
    document.getElementById('driveBatchModal').classList.add('show');
}

function closeDriveBatchModal() {
    document.getElementById('driveBatchModal').classList.remove('show');
}

async function batchAddDriveItems() {
    const input = document.getElementById('driveBatchInput').value.trim();
    if (!input) {
        showMessage('请输入文件内容', 'error');
        return;
    }

    const lines = input.split('\n').filter(line => line.trim());
    const items = lines.map(line => {
        const parts = line.split('|').map(p => p.trim());
        return {
            name: parts[0] || '未命名',
            description: parts[1] || '',
            extractCode: parts[2] || '',
            url: parts[3] || '',
            icon: '📁'
        };
    });

    const saveBtn = document.getElementById('driveBatchSaveBtn');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = '添加中...';

    try {
        const response = await fetch('/api/drive-items?action=batch', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items })
        });
        const data = await response.json();
        if (data.success) {
            showMessage(`成功添加 ${items.length} 个文件`, 'success');
            closeDriveBatchModal();
            loadDriveItems();
        } else {
            showMessage(data.message || '添加失败', 'error');
        }
    } catch (err) {
        showMessage('网络错误', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

// 批量删除模式
function enterDriveBatchMode() {
    driveBatchMode = true;
    document.getElementById('driveBatchToolbar').style.display = 'flex';
    document.getElementById('batchDeleteDriveItemBtn').style.display = 'none';
    loadDriveItems();
}

function exitDriveBatchMode() {
    driveBatchMode = false;
    document.getElementById('driveBatchToolbar').style.display = 'none';
    document.getElementById('batchDeleteDriveItemBtn').style.display = 'inline-block';
    document.getElementById('driveSelectAll').checked = false;
    loadDriveItems();
}

function updateDriveSelectedCount() {
    const checked = document.querySelectorAll('.drive-item-checkbox:checked');
    document.getElementById('driveSelectedCount').textContent = `已选 ${checked.length} 项`;
}

async function batchDeleteDriveItems() {
    const checked = document.querySelectorAll('.drive-item-checkbox:checked');
    if (checked.length === 0) {
        showMessage('请先选择要删除的文件', 'error');
        return;
    }
    if (!confirm(`确定要删除选中的 ${checked.length} 个文件吗？`)) return;

    const ids = Array.from(checked).map(cb => cb.dataset.id);
    try {
        const response = await fetch('/api/drive-items?action=batch-delete', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
        });
        const data = await response.json();
        if (data.success) {
            showMessage(`成功删除 ${ids.length} 个文件`, 'success');
            exitDriveBatchMode();
        } else {
            showMessage(data.message || '删除失败', 'error');
        }
    } catch (err) {
        showMessage('网络错误', 'error');
    }
}

// ===== 文章管理 =====
let editingPostId = null;
let postCurrentTab = 'all';
let postBatchMode = false;

function initPostManager() {
    // 新建文章
    document.getElementById('newPostBtn')?.addEventListener('click', () => openPostEditor());

    // 上传文件
    document.getElementById('uploadPostBtn')?.addEventListener('click', () => {
        document.getElementById('postFileInput').click();
    });
    document.getElementById('postFileInput')?.addEventListener('change', handlePostFileUpload);

    // 批量删除模式
    document.getElementById('batchPostDeleteBtn')?.addEventListener('click', enterPostBatchMode);
    document.getElementById('postExitBatchBtn')?.addEventListener('click', exitPostBatchMode);
    document.getElementById('postSelectAll')?.addEventListener('change', function() {
        document.querySelectorAll('.post-item-checkbox:enabled').forEach(cb => cb.checked = this.checked);
        updatePostSelectedCount();
    });
    document.getElementById('postBatchTrashBtn')?.addEventListener('click', batchPostAction('trash'));
    document.getElementById('postBatchRestoreBtn')?.addEventListener('click', batchPostAction('restore'));
    document.getElementById('postBatchForceDeleteBtn')?.addEventListener('click', batchPostAction('delete'));

    // 编辑器
    document.getElementById('postEditorCancelBtn')?.addEventListener('click', closePostEditor);
    document.getElementById('postEditorSaveBtn')?.addEventListener('click', savePost);

    // 标签页切换
    document.querySelectorAll('[data-post-tab]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('[data-post-tab]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            postCurrentTab = this.dataset.postTab;
            exitPostBatchMode();
            loadAdminPosts();
        });
    });

    // 点击弹窗背景关闭
    document.getElementById('postEditorModal')?.addEventListener('click', function(e) {
        if (e.target === this) closePostEditor();
    });
}

async function loadAdminPosts() {
    try {
        const response = await fetch('/api/posts/admin', { credentials: 'include' });
        const data = await response.json();
        if (data.success) {
            renderAdminPosts(data.data);
        }
    } catch (err) {
        console.error('加载文章失败:', err);
        document.getElementById('postsAdminList').innerHTML = 
            '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-secondary);">加载失败</td></tr>';
    }
}

function renderAdminPosts(posts) {
    const tbody = document.getElementById('postsAdminList');
    let filtered = posts;

    if (postCurrentTab === 'trash') {
        filtered = posts.filter(p => p.deleted);
    } else {
        filtered = posts.filter(p => !p.deleted);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-secondary);">${postCurrentTab === 'trash' ? '回收站为空' : '暂无文章，点击"新建文章"开始'}</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(post => {
        const date = new Date(post.date).toLocaleDateString('zh-CN');
        const statusBadge = post.deleted ? 
            '<span style="color:#ef4444;">已删除</span>' :
            (post.published ? '<span style="color:#10b981;">已发布</span>' : '<span style="color:#f59e0b;">草稿</span>');

        let actions = '';
        if (post.deleted) {
            actions = `
                <button class="btn-link" onclick="restorePost('${post.id}')">恢复</button>
                <button class="btn-link danger" onclick="forceDeletePost('${post.id}')">永久删除</button>
            `;
        } else {
            actions = `
                <button class="btn-link" onclick="editPost('${post.id}')">编辑</button>
                <button class="btn-link danger" onclick="deletePost('${post.id}')">删除</button>
            `;
        }

        return `
            <tr data-id="${post.id}">
                <td class="col-checkbox">
                    <input type="checkbox" class="post-item-checkbox" data-id="${post.id}" style="${postBatchMode ? '' : 'display:none;'}">
                </td>
                <td style="font-weight:500;">${post.pinned ? '📌 ' : ''}${escapeHtml(post.title)}</td>
                <td>${escapeHtml(post.category || '未分类')}</td>
                <td>${statusBadge}</td>
                <td style="font-size:0.85rem;color:var(--text-secondary);">${date}</td>
                <td class="col-action">${actions}</td>
            </tr>
        `;
    }).join('');
}

function openPostEditor(post = null) {
    editingPostId = post ? post.id : null;
    document.getElementById('postEditorTitle').textContent = post ? '编辑文章' : '新建文章';
    document.getElementById('postTitleInput').value = post ? (post.title || '') : '';
    document.getElementById('postCategoryInput').value = post ? (post.category || '') : '';
    document.getElementById('postTagsInput').value = post ? (post.tags || []).join(',') : '';
    document.getElementById('postCoverInput').value = post ? (post.cover || '') : '';
    document.getElementById('postExcerptInput').value = post ? (post.excerpt || '') : '';
    document.getElementById('postContentInput').value = post ? (post.content || '') : '';
    document.getElementById('postPublishedInput').checked = post ? post.published !== false : true;
    document.getElementById('postPinnedInput').checked = post ? post.pinned || false : false;
    document.getElementById('postEditorModal').classList.add('show');
}

function closePostEditor() {
    document.getElementById('postEditorModal').classList.remove('show');
    editingPostId = null;
}

function editPost(id) {
    // 从当前数据中获取文章
    fetch(`/api/posts/${id}`).then(r => r.json()).then(data => {
        if (data.success) openPostEditor(data.data);
    });
}

async function savePost() {
    const title = document.getElementById('postTitleInput').value.trim();
    if (!title) {
        showMessage('请输入文章标题', 'error');
        return;
    }

    const content = document.getElementById('postContentInput').value;
    const tags = document.getElementById('postTagsInput').value.split(',').map(t => t.trim()).filter(Boolean);

    const body = {
        title,
        content,
        excerpt: document.getElementById('postExcerptInput').value.trim() || content.substring(0, 150),
        category: document.getElementById('postCategoryInput').value.trim() || '未分类',
        tags,
        cover: document.getElementById('postCoverInput').value.trim(),
        published: document.getElementById('postPublishedInput').checked,
        pinned: document.getElementById('postPinnedInput').checked,
        readTime: Math.ceil(content.length / 500) || 1
    };

    const saveBtn = document.getElementById('postEditorSaveBtn');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = '保存中...';

    try {
        const url = editingPostId ? `/api/posts/${editingPostId}` : '/api/posts';
        const method = editingPostId ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method,
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        if (data.success) {
            showMessage(editingPostId ? '修改成功' : '创建成功', 'success');
            closePostEditor();
            loadAdminPosts();
        } else {
            showMessage(data.message || '保存失败', 'error');
        }
    } catch (err) {
        showMessage('网络错误', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

async function deletePost(id) {
    if (!confirm('确定要将这篇文章移到回收站吗？')) return;
    try {
        const response = await fetch(`/api/posts/${id}`, { method: 'DELETE', credentials: 'include' });
        const data = await response.json();
        if (data.success) {
            showMessage('已移到回收站', 'success');
            loadAdminPosts();
        } else {
            showMessage(data.message || '操作失败', 'error');
        }
    } catch (err) {
        showMessage('网络错误', 'error');
    }
}

async function restorePost(id) {
    try {
        const response = await fetch('/api/posts/batch', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: [id], action: 'restore' })
        });
        const data = await response.json();
        if (data.success) {
            showMessage('已恢复', 'success');
            loadAdminPosts();
        } else {
            showMessage(data.message || '操作失败', 'error');
        }
    } catch (err) {
        showMessage('网络错误', 'error');
    }
}

async function forceDeletePost(id) {
    if (!confirm('确定要永久删除这篇文章吗？此操作不可恢复！')) return;
    try {
        const response = await fetch('/api/posts/batch', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: [id], action: 'delete' })
        });
        const data = await response.json();
        if (data.success) {
            showMessage('已永久删除', 'success');
            loadAdminPosts();
        } else {
            showMessage(data.message || '操作失败', 'error');
        }
    } catch (err) {
        showMessage('网络错误', 'error');
    }
}

// 批量模式
function enterPostBatchMode() {
    postBatchMode = true;
    document.getElementById('postBatchToolbar').style.display = 'flex';
    document.getElementById('batchPostDeleteBtn').style.display = 'none';
    const isTrash = postCurrentTab === 'trash';
    document.getElementById('postBatchTrashBtn').style.display = isTrash ? 'none' : 'inline-block';
    document.getElementById('postBatchRestoreBtn').style.display = isTrash ? 'inline-block' : 'none';
    document.getElementById('postBatchForceDeleteBtn').style.display = isTrash ? 'inline-block' : 'none';
    loadAdminPosts();
}

function exitPostBatchMode() {
    postBatchMode = false;
    document.getElementById('postBatchToolbar').style.display = 'none';
    document.getElementById('batchPostDeleteBtn').style.display = 'inline-block';
    document.getElementById('postSelectAll').checked = false;
    loadAdminPosts();
}

function updatePostSelectedCount() {
    const checked = document.querySelectorAll('.post-item-checkbox:checked');
    document.getElementById('postSelectedCount').textContent = `已选 ${checked.length} 篇`;
}

function batchPostAction(action) {
    return async function() {
        const checked = document.querySelectorAll('.post-item-checkbox:checked');
        if (checked.length === 0) {
            showMessage('请先选择文章', 'error');
            return;
        }
        const ids = Array.from(checked).map(cb => cb.dataset.id);
        const actionText = action === 'trash' ? '移到回收站' : action === 'restore' ? '恢复' : '永久删除';
        if (!confirm(`确定要${actionText}选中的 ${ids.length} 篇文章吗？`)) return;

        try {
            const response = await fetch('/api/posts/batch', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids, action })
            });
            const data = await response.json();
            if (data.success) {
                showMessage(`${actionText}成功`, 'success');
                exitPostBatchMode();
            } else {
                showMessage(data.message || '操作失败', 'error');
            }
        } catch (err) {
            showMessage('网络错误', 'error');
        }
    };
}

// 文件上传
async function handlePostFileUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    let success = 0;
    let failed = 0;

    for (const file of files) {
        try {
            let content = '';
            if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
                content = await file.text();
            } else if (file.name.endsWith('.docx')) {
                // docx 简单处理：提示用户转换
                showMessage(`文件 ${file.name} 为 docx 格式，请先转换为 txt/md 后上传`, 'error');
                failed++;
                continue;
            } else {
                content = await file.text();
            }

            const title = file.name.replace(/\.(txt|md|docx)$/i, '');
            const response = await fetch('/api/posts', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content: content.replace(/\n/g, '<br>'),
                    excerpt: content.substring(0, 150),
                    category: '未分类',
                    tags: [],
                    published: true,
                    readTime: Math.ceil(content.length / 500) || 1
                })
            });
            const data = await response.json();
            if (data.success) success++;
            else failed++;
        } catch (err) {
            failed++;
        }
    }

    showMessage(`上传完成：成功 ${success} 篇，失败 ${failed} 篇`, success > 0 ? 'success' : 'error');
    e.target.value = '';
    loadAdminPosts();
}

// 留言管理标签页切换
function initMessagesTabs() {
    const tabBtns = document.querySelectorAll('#page-messages .tab-btn');
    const tabContents = document.querySelectorAll('#page-messages .tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById('tab-' + tab).classList.add('active');
        });
    });
}

// 加载留言列表（管理端）
async function loadAdminMessages() {
    const container = document.getElementById('messagesAdminList');
    if (!container) return;
    
    try {
        const response = await fetch('/api/messages', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.messages) {
            renderAdminMessages(data.messages);
        } else {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">加载失败</p>';
        }
    } catch (err) {
        console.error('加载留言失败:', err);
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">加载失败</p>';
    }
}

// 渲染管理端留言列表
function renderAdminMessages(messages) {
    const container = document.getElementById('messagesAdminList');
    
    if (messages.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">还没有留言</p>';
        return;
    }
    
    // 组装成树
    const tree = buildAdminMessageTree(messages);
    let html = '';
    tree.forEach(msg => {
        html += renderAdminMessageItem(msg, 0);
    });
    
    container.innerHTML = html;
}

// 组装留言树
function buildAdminMessageTree(messages) {
    const map = {};
    const roots = [];
    
    messages.forEach(msg => {
        msg.replies = [];
        map[msg.id] = msg;
    });
    
    // 处理旧格式的 reply 字段，转换成独立的回复项
    messages.forEach(msg => {
        if (msg.reply && msg.reply.content) {
            const hasNewReply = messages.some(m => m.parentId === msg.id && m.isAdmin);
            if (!hasNewReply) {
                const oldReply = {
                    id: msg.id + '_old_reply',
                    name: '站长',
                    content: msg.reply.content,
                    time: msg.reply.time,
                    ip: 'admin',
                    parentId: msg.id,
                    isAdmin: true,
                    reply: null,
                    replies: []
                };
                map[oldReply.id] = oldReply;
                messages.push(oldReply);
            }
        }
    });
    
    messages.forEach(msg => {
        if (msg.parentId && map[msg.parentId]) {
            map[msg.parentId].replies.push(msg);
        } else if (!msg.parentId) {
            roots.push(msg);
        }
    });
    
    roots.sort((a, b) => b.time - a.time);
    function sortReplies(msg) {
        msg.replies.sort((a, b) => a.time - b.time);
        msg.replies.forEach(sortReplies);
    }
    roots.forEach(sortReplies);
    
    return roots;
}

// 渲染单条管理端留言（递归）
function renderAdminMessageItem(msg, depth) {
    const date = new Date(msg.time);
    const timeStr = date.toLocaleString('zh-CN');
    const isAdmin = msg.isAdmin === true;
    const nameLabel = isAdmin ? '📢 站长' : escapeHtml(msg.name);
    const nameClass = isAdmin ? 'admin-message-name admin-reply-name' : 'admin-message-name';
    
    // 缩进样式
    const marginLeft = depth > 0 ? 'margin-left: 1.5rem; padding-left: 1rem; border-left: 2px solid var(--border-color);' : '';
    
    // 递归渲染子回复
    let repliesHtml = '';
    if (msg.replies && msg.replies.length > 0) {
        msg.replies.forEach(reply => {
            repliesHtml += renderAdminMessageItem(reply, depth + 1);
        });
    }
    
    return `
        <div class="admin-message-item" data-id="${msg.id}" style="${marginLeft}">
            <div class="admin-message-header">
                <div class="admin-message-info" style="display:flex;align-items:center;gap:0.5rem;">
                    ${batchMode ? `<input type="checkbox" class="batch-checkbox" data-id="${msg.id}" data-ip="${msg.ip || ''}" data-isadmin="${isAdmin}" onchange="updateSelectedCount()">` : ''}
                    <span class="${nameClass}">${nameLabel}</span>
                    <span class="admin-message-ip">IP: ${msg.ip || 'unknown'}</span>
                </div>
                <span class="admin-message-time">${timeStr}</span>
            </div>
            <div class="admin-message-content">${escapeHtml(msg.content)}</div>
            ${batchMode ? '' : `
            <div class="admin-message-actions">
                <button class="btn-primary btn-small" onclick="showReplyForm('${msg.id}')">回复</button>
                <button class="btn-danger btn-small" onclick="deleteAdminMessage('${msg.id}')">删除</button>
                ${!isAdmin ? `<button class="btn-secondary btn-small" onclick="blacklistIP('${msg.ip}')">拉黑IP</button>` : ''}
            </div>
            <div id="replyForm-${msg.id}" class="reply-form" style="display: none;">
                <textarea placeholder="输入回复内容..." rows="3" id="replyInput-${msg.id}"></textarea>
                <div class="reply-form-actions">
                    <button class="btn-primary btn-small" onclick="submitReply('${msg.id}')">提交回复</button>
                    <button class="btn-secondary btn-small" onclick="hideReplyForm('${msg.id}')">取消</button>
                </div>
            </div>`}
            ${repliesHtml}
        </div>
    `;
}

// 显示回复表单
function showReplyForm(msgId) {
    const form = document.getElementById('replyForm-' + msgId);
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
}

// 隐藏回复表单
function hideReplyForm(msgId) {
    const form = document.getElementById('replyForm-' + msgId);
    if (form) {
        form.style.display = 'none';
    }
}

// 提交回复
async function submitReply(msgId) {
    const input = document.getElementById('replyInput-' + msgId);
    const content = input.value.trim();
    
    if (!content) {
        alert('回复内容不能为空');
        return;
    }
    
    try {
        const response = await fetch(`/api/messages/${msgId}/reply`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadAdminMessages();
        } else {
            alert(data.message || '回复失败');
        }
    } catch (err) {
        console.error(err);
        alert('网络错误');
    }
}

// 删除留言
async function deleteAdminMessage(msgId) {
    if (!confirm('确定要删除这条留言吗？')) return;
    
    try {
        const response = await fetch(`/api/messages/${msgId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadAdminMessages();
        } else {
            alert(data.message || '删除失败');
        }
    } catch (err) {
        console.error(err);
        alert('网络错误');
    }
}

// 拉黑IP
async function blacklistIP(ip) {
    if (!ip || ip === 'unknown') {
        alert('无法获取IP地址');
        return;
    }
    
    if (!confirm(`确定要拉黑 IP: ${ip} 吗？`)) return;
    
    try {
        const response = await fetch('/api/messages/blacklist', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ip, reason: '违规留言' })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('已加入黑名单');
            loadBlacklist();
        } else {
            alert(data.message || '操作失败');
        }
    } catch (err) {
        console.error(err);
        alert('网络错误');
    }
}

// ===== 批量模式 =====
let batchMode = false;

function initBatchMode() {
    const batchBtn = document.getElementById('batchModeBtn');
    const exitBtn = document.getElementById('exitBatchBtn');
    const selectAll = document.getElementById('selectAllCheckbox');
    const batchDeleteBtn = document.getElementById('batchDeleteBtn');
    const batchBlacklistBtn = document.getElementById('batchBlacklistBtn');
    
    if (batchBtn) {
        batchBtn.addEventListener('click', () => toggleBatchMode(true));
    }
    if (exitBtn) {
        exitBtn.addEventListener('click', () => toggleBatchMode(false));
    }
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.batch-checkbox:enabled');
            checkboxes.forEach(cb => cb.checked = this.checked);
            updateSelectedCount();
        });
    }
    if (batchDeleteBtn) {
        batchDeleteBtn.addEventListener('click', batchDelete);
    }
    if (batchBlacklistBtn) {
        batchBlacklistBtn.addEventListener('click', batchBlacklist);
    }
}

function toggleBatchMode(enable) {
    batchMode = enable;
    const toolbar = document.getElementById('batchToolbar');
    const batchBtn = document.getElementById('batchModeBtn');
    
    if (toolbar) {
        toolbar.style.display = enable ? 'flex' : 'none';
    }
    if (batchBtn) {
        batchBtn.style.display = enable ? 'none' : 'inline-block';
    }
    
    // 清除所有选中
    const checkboxes = document.querySelectorAll('.batch-checkbox');
    checkboxes.forEach(cb => cb.checked = false);
    const selectAll = document.getElementById('selectAllCheckbox');
    if (selectAll) selectAll.checked = false;
    updateSelectedCount();
    
    // 重新渲染留言列表
    loadAdminMessages();
}

function updateSelectedCount() {
    const checkboxes = document.querySelectorAll('.batch-checkbox:checked');
    const countEl = document.getElementById('selectedCount');
    if (countEl) {
        countEl.textContent = `已选 ${checkboxes.length} 条`;
    }
    
    // 同步全选框状态
    const allCheckboxes = document.querySelectorAll('.batch-checkbox:enabled');
    const selectAll = document.getElementById('selectAllCheckbox');
    if (selectAll && allCheckboxes.length > 0) {
        selectAll.checked = checkboxes.length === allCheckboxes.length;
    }
}

function getSelectedMessages() {
    const checkboxes = document.querySelectorAll('.batch-checkbox:checked');
    const selected = [];
    checkboxes.forEach(cb => {
        selected.push({
            id: cb.dataset.id,
            ip: cb.dataset.ip,
            isAdmin: cb.dataset.isadmin === 'true'
        });
    });
    return selected;
}

async function batchDelete() {
    const selected = getSelectedMessages();
    if (selected.length === 0) {
        alert('请先选择要删除的留言');
        return;
    }
    
    if (!confirm(`确定要删除选中的 ${selected.length} 条留言吗？（包含所有子回复）`)) return;
    
    let success = 0;
    let failed = 0;
    
    for (const msg of selected) {
        try {
            const response = await fetch(`/api/messages/${msg.id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                success++;
            } else {
                failed++;
            }
        } catch (err) {
            failed++;
        }
    }
    
    alert(`批量删除完成：成功 ${success} 条，失败 ${failed} 条`);
    loadAdminMessages();
}

async function batchBlacklist() {
    const selected = getSelectedMessages();
    if (selected.length === 0) {
        alert('请先选择要拉黑的留言');
        return;
    }
    
    // 只对非站长留言且有有效IP的进行拉黑
    const validIPs = [...new Set(selected.filter(m => !m.isAdmin && m.ip && m.ip !== 'unknown').map(m => m.ip))];
    
    if (validIPs.length === 0) {
        alert('选中的留言中没有可拉黑的有效IP（站长回复不支持拉黑）');
        return;
    }
    
    if (!confirm(`确定要拉黑选中的 ${validIPs.length} 个IP吗？`)) return;
    
    let success = 0;
    let failed = 0;
    
    for (const ip of validIPs) {
        try {
            const response = await fetch('/api/messages/blacklist', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ip, reason: '批量拉黑' })
            });
            const data = await response.json();
            if (data.success) {
                success++;
            } else {
                failed++;
            }
        } catch (err) {
            failed++;
        }
    }
    
    alert(`批量拉黑完成：成功 ${success} 个IP，失败 ${failed} 个IP`);
    loadBlacklist();
}

// ===== 留言设置 =====

// 加载留言设置
async function loadMsgSettings() {
    try {
        const response = await fetch('/api/messages/settings', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.data) {
            const settings = data.data;
            
            // 背景颜色
            if (settings.backgroundColor) {
                document.getElementById('msgBgColor').value = settings.backgroundColor;
                document.getElementById('msgBgColorText').value = settings.backgroundColor;
            }
            
            // 卡片颜色
            if (settings.cardColor) {
                document.getElementById('msgCardColor').value = settings.cardColor;
                document.getElementById('msgCardColorText').value = settings.cardColor;
            }
            
            // 主题颜色
            if (settings.primaryColor) {
                document.getElementById('msgPrimaryColor').value = settings.primaryColor;
                document.getElementById('msgPrimaryColorText').value = settings.primaryColor;
            }
            
            // 频率限制
            document.getElementById('msgRateLimit').value = settings.rateLimitMinutes || 1;
            
            // 启用状态
            document.getElementById('msgEnabled').checked = settings.enabled !== false;
            
            // 背景图
            if (settings.backgroundImage) {
                showMsgBgPreview(settings.backgroundImage);
            }
        }
    } catch (err) {
        console.error('加载设置失败:', err);
    }
}

// 保存留言设置
async function saveMsgSettings() {
    const btn = document.getElementById('saveMsgSettingsBtn');
    const msgEl = document.getElementById('msgSettingsMsg');
    
    btn.disabled = true;
    btn.textContent = '保存中...';
    
    try {
        const settings = {
            backgroundColor: document.getElementById('msgBgColorText').value || '',
            cardColor: document.getElementById('msgCardColorText').value || '',
            primaryColor: document.getElementById('msgPrimaryColorText').value || '',
            rateLimitMinutes: parseInt(document.getElementById('msgRateLimit').value) || 0,
            enabled: document.getElementById('msgEnabled').checked,
            backgroundImage: window._msgBgImage || ''
        };
        
        const response = await fetch('/api/messages/settings', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        
        const data = await response.json();
        
        if (data.success) {
            msgEl.textContent = '保存成功！';
            msgEl.className = 'form-msg success';
        } else {
            msgEl.textContent = data.message || '保存失败';
            msgEl.className = 'form-msg error';
        }
    } catch (err) {
        msgEl.textContent = '网络错误';
        msgEl.className = 'form-msg error';
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.textContent = '保存设置';
        
        setTimeout(() => {
            msgEl.textContent = '';
            msgEl.className = 'form-msg';
        }, 3000);
    }
}

// ===== 留言箱背景图上传 =====
function initMsgBgUpload() {
    const dropZone = document.getElementById('msgBgDropZone');
    const fileInput = document.getElementById('msgBgFileInput');
    const removeBtn = document.getElementById('msgBgRemoveBtn');
    
    if (!dropZone || !fileInput) return;
    
    // 点击选择文件
    dropZone.addEventListener('click', () => fileInput.click());
    
    // 文件选择
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleMsgBgFile(file);
    });
    
    // 拖拽事件
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#3b82f6';
        dropZone.style.background = 'rgba(59, 130, 246, 0.05)';
    });
    
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ccc';
        dropZone.style.background = 'transparent';
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ccc';
        dropZone.style.background = 'transparent';
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleMsgBgFile(file);
        }
    });
    
    // 移除图片
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            window._msgBgImage = '';
            document.getElementById('msgBgPreview').style.display = 'none';
            document.getElementById('msgBgPreviewImg').src = '';
        });
    }
}

function handleMsgBgFile(file) {
    if (file.size > 10 * 1024 * 1024) {
        alert('图片大小不能超过 10MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const base64 = e.target.result;
        window._msgBgImage = base64;
        showMsgBgPreview(base64);
    };
    reader.readAsDataURL(file);
}

function showMsgBgPreview(base64) {
    window._msgBgImage = base64;
    const preview = document.getElementById('msgBgPreview');
    const img = document.getElementById('msgBgPreviewImg');
    if (preview && img) {
        img.src = base64;
        preview.style.display = 'block';
    }
}

// ===== 黑名单管理 =====

// 加载黑名单
async function loadBlacklist() {
    const container = document.getElementById('blacklistContainer');
    if (!container) return;
    
    try {
        const response = await fetch('/api/messages/blacklist', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.data) {
            renderBlacklist(data.data);
        }
    } catch (err) {
        console.error('加载黑名单失败:', err);
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">加载失败</p>';
    }
}

// 渲染黑名单
function renderBlacklist(blacklist) {
    const container = document.getElementById('blacklistContainer');
    
    if (!blacklist || blacklist.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">黑名单为空</p>';
        return;
    }
    
    let html = '<div class="blacklist-items">';
    
    blacklist.forEach(item => {
        const date = new Date(item.time);
        const timeStr = date.toLocaleString('zh-CN');
        
        html += `
            <div class="blacklist-item">
                <div class="blacklist-info">
                    <span class="blacklist-ip">${escapeHtml(item.ip)}</span>
                    <span class="blacklist-reason">${escapeHtml(item.reason || '无')}</span>
                </div>
                <div class="blacklist-actions">
                    <span class="blacklist-time">${timeStr}</span>
                    <button class="btn-danger btn-small" onclick="removeBlacklist('${escapeHtml(item.ip)}')">移除</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// 添加到黑名单
async function addToBlacklist() {
    const ip = prompt('请输入要拉黑的IP地址：');
    if (!ip) return;
    
    const reason = prompt('请输入拉黑原因（可选）：') || '';
    
    try {
        const response = await fetch('/api/messages/blacklist', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ip, reason })
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadBlacklist();
        } else {
            alert(data.message || '添加失败');
        }
    } catch (err) {
        console.error(err);
        alert('网络错误');
    }
}

// 从黑名单移除
async function removeBlacklist(ip) {
    if (!confirm(`确定要从黑名单移除 IP: ${ip} 吗？`)) return;
    
    try {
        const response = await fetch(`/api/messages/blacklist/${encodeURIComponent(ip)}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadBlacklist();
        } else {
            alert(data.message || '移除失败');
        }
    } catch (err) {
        console.error(err);
        alert('网络错误');
    }
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
