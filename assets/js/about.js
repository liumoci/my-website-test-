// 个人主页脚本

document.addEventListener('DOMContentLoaded', function() {
    // 加载个人主页数据
    loadProfileData();
    
    // 留言表单
    document.getElementById('messageForm').addEventListener('submit', handleMessageSubmit);
});

// 加载个人主页数据
async function loadProfileData() {
    try {
        const response = await fetch('/api/profile');
        const data = await response.json();
        
        if (data.success && data.data) {
            renderProfile(data.data);
        }
    } catch (err) {
        console.error('加载个人主页数据失败:', err);
        // 加载失败时显示默认内容
        showDefaultProfile();
    }
}

// 渲染个人主页
function renderProfile(profile) {
    // 头像
    if (profile.avatar) {
        const avatarEl = document.getElementById('profileAvatar');
        avatarEl.innerHTML = `<img src="${profile.avatar}" alt="头像" width="150" height="150">`;
    }
    
    // 名字
    document.getElementById('profileName').textContent = profile.name || '我的名字';
    
    // 简介
    document.getElementById('profileBio').textContent = profile.bio || '';
    
    // 技能
    renderSkills(profile.skills || []);
    
    // 项目
    renderProjects(profile.projects || []);
    
    // 联系方式
    renderContact(profile.contact || {});
}

// 渲染技能
function renderSkills(skills) {
    const list = document.getElementById('skillsList');
    
    if (skills.length === 0) {
        document.getElementById('skillsSection').style.display = 'none';
        return;
    }
    
    list.innerHTML = '';
    skills.forEach(skill => {
        const li = document.createElement('li');
        li.textContent = skill;
        list.appendChild(li);
    });
}

// 渲染项目
function renderProjects(projects) {
    const list = document.getElementById('projectsList');
    
    if (projects.length === 0) {
        document.getElementById('projectsSection').style.display = 'none';
        return;
    }
    
    list.innerHTML = '';
    projects.forEach(project => {
        const item = document.createElement('div');
        item.className = 'project-item';
        
        let html = `<h3>${escapeHtml(project.name || '未命名项目')}</h3>`;
        
        if (project.desc) {
            html += `<p>${escapeHtml(project.desc)}</p>`;
        }
        
        if (project.url && project.url !== '#') {
            html += `<a href="${project.url}" target="_blank" rel="noopener noreferrer">查看详情 →</a>`;
        }
        
        item.innerHTML = html;
        list.appendChild(item);
    });
}

// 渲染联系方式
function renderContact(contact) {
    const list = document.getElementById('contactList');
    
    const items = [];
    
    if (contact.email) {
        items.push(`<p>📧 Email: <a href="mailto:${contact.email}">${contact.email}</a></p>`);
    }
    
    if (contact.github) {
        items.push(`<p>🐙 GitHub: <a href="https://github.com/${contact.github}" target="_blank" rel="noopener noreferrer">@${contact.github}</a></p>`);
    }
    
    if (contact.twitter) {
        items.push(`<p>🐦 Twitter: <a href="https://twitter.com/${contact.twitter}" target="_blank" rel="noopener noreferrer">@${contact.twitter}</a></p>`);
    }
    
    if (items.length === 0) {
        document.getElementById('contactSection').style.display = 'none';
        return;
    }
    
    list.innerHTML = items.join('');
}

// 显示默认个人主页
function showDefaultProfile() {
    document.getElementById('profileName').textContent = '我的名字';
    document.getElementById('profileBio').textContent = '这是我的个人简介。';
    document.getElementById('skillsList').innerHTML = '<li>JavaScript</li><li>HTML</li><li>CSS</li>';
}

// ===== 留言箱 =====
async function loadMessages() {
    try {
        const response = await fetch('/api/messages');
        const data = await response.json();
        
        if (data.success && data.messages) {
            renderMessages(data.messages);
        }
    } catch (err) {
        console.error('加载留言失败:', err);
        document.getElementById('messagesList').innerHTML = '<p style="color: var(--text-secondary);">加载失败</p>';
    }
}

function renderMessages(messages) {
    const list = document.getElementById('messagesList');
    const countEl = document.getElementById('messageCount');
    
    countEl.textContent = `(${messages.length})`;
    
    if (messages.length === 0) {
        list.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">还没有留言，来抢沙发吧！</p>';
        return;
    }
    
    list.innerHTML = '';
    
    messages.forEach(msg => {
        const item = document.createElement('div');
        item.className = 'guestbook-message';
        
        const date = new Date(msg.time);
        const timeStr = date.toLocaleString('zh-CN');
        
        item.innerHTML = `
            <div class="guestbook-message-header">
                <span class="guestbook-message-name">${escapeHtml(msg.name)}</span>
                <span class="guestbook-message-time">${timeStr}</span>
            </div>
            <div class="guestbook-message-content">${escapeHtml(msg.content)}</div>
        `;
        
        list.appendChild(item);
    });
}

async function handleMessageSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('messageName').value.trim();
    const content = document.getElementById('messageContent').value.trim();
    const msgEl = document.getElementById('messageFormMsg');
    
    if (!name || !content) {
        msgEl.textContent = '请填写昵称和内容';
        msgEl.className = 'form-msg error';
        return;
    }
    
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = '提交中...';
    
    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, content })
        });
        
        const data = await response.json();
        
        if (data.success) {
            msgEl.textContent = '留言成功！';
            msgEl.className = 'form-msg success';
            
            // 清空表单
            document.getElementById('messageContent').value = '';
            
            // 重新加载留言
            loadMessages();
            
            // 3秒后清除消息
            setTimeout(() => {
                msgEl.textContent = '';
                msgEl.className = 'form-msg';
            }, 3000);
        } else {
            msgEl.textContent = data.message || '提交失败';
            msgEl.className = 'form-msg error';
        }
    } catch (err) {
        msgEl.textContent = '网络错误';
        msgEl.className = 'form-msg error';
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.textContent = '提交留言';
    }
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
