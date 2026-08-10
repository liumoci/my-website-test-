// 个人主页脚本

document.addEventListener('DOMContentLoaded', function() {
    // 加载个人主页数据
    loadProfileData();
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

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
