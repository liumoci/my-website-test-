// ===== 管理面板功能 =====

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
    
    // 个人主页管理
    initProfileManager();
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

// ===== 个人主页管理 =====
let profileData = null;
let messagesData = [];

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
    loadMessages();
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
    
    if (file.size > 200 * 1024) {
        alert('图片大小不能超过 200KB');
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

// ===== 留言管理 =====
async function loadMessages() {
    try {
        const response = await fetch('/api/messages');
        const data = await response.json();
        
        if (data.success && data.messages) {
            messagesData = data.messages;
            renderMessages();
        }
    } catch (e) {
        console.error('加载留言失败:', e);
    }
}

function renderMessages() {
    const container = document.getElementById('messagesList');
    const countEl = document.getElementById('messageCount');
    
    if (!container) return;
    
    countEl.textContent = messagesData.length;
    
    if (messagesData.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无留言</div>';
        return;
    }
    
    container.innerHTML = '';
    
    messagesData.forEach(msg => {
        const item = document.createElement('div');
        item.className = 'message-item';
        
        const date = new Date(msg.time);
        const timeStr = date.toLocaleString('zh-CN');
        
        item.innerHTML = `
            <div class="message-header">
                <span class="message-name">${escapeHtml(msg.name)}</span>
                <span class="message-time">${timeStr}</span>
            </div>
            <div class="message-content">${escapeHtml(msg.content)}</div>
            <div class="message-actions">
                <button class="btn-danger btn-small" onclick="deleteMessage('${msg.id}')">删除</button>
            </div>
        `;
        container.appendChild(item);
    });
}

async function deleteMessage(id) {
    if (!confirm('确定要删除这条留言吗？')) return;
    
    try {
        const response = await fetch('/api/messages/' + id, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            messagesData = messagesData.filter(m => m.id !== id);
            renderMessages();
        } else {
            alert('删除失败: ' + (data.message || '未知错误'));
        }
    } catch (e) {
        alert('删除失败');
        console.error(e);
    }
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
