// 导航管理主逻辑

let navData = { categories: [] };
let currentEditLinkIndex = -1;
let currentEditCategoryIndex = -1;

document.addEventListener('DOMContentLoaded', async function() {
    // 检查登录状态（通过加载数据验证）
    await loadNavData();
    
    // 保存按钮
    document.getElementById('saveBtn').addEventListener('click', saveNavData);
    
    // 退出按钮
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // 添加分类按钮
    document.getElementById('addCategoryBtn').addEventListener('click', showCategoryModal);
    
    // 链接弹窗
    document.getElementById('linkForm').addEventListener('submit', handleLinkSubmit);
    document.getElementById('cancelModalBtn').addEventListener('click', hideLinkModal);
    
    // 分类弹窗
    document.getElementById('categoryForm').addEventListener('submit', handleCategorySubmit);
    document.getElementById('cancelCategoryBtn').addEventListener('click', hideCategoryModal);
    
    // 点击弹窗背景关闭
    document.getElementById('linkModal').addEventListener('click', function(e) {
        if (e.target === this) hideLinkModal();
    });
    document.getElementById('categoryModal').addEventListener('click', function(e) {
        if (e.target === this) hideCategoryModal();
    });
});

// 加载导航数据
async function loadNavData() {
    try {
        const response = await fetch('/api/nav');
        const data = await response.json();
        
        if (data.success) {
            navData = data.data;
            renderNavData();
        } else {
            showStatus('加载失败: ' + (data.message || '未知错误'), 'error');
        }
    } catch (err) {
        // 如果是 401 或其他错误，可能是未登录，跳转到登录页
        window.location.href = '/nav-admin/login.html';
    }
}

// 渲染导航数据
function renderNavData() {
    const container = document.getElementById('categoriesContainer');
    container.innerHTML = '';
    
    if (!navData.categories || navData.categories.length === 0) {
        container.innerHTML = '<div class="empty-state">还没有分类，点击下方按钮添加第一个分类</div>';
        return;
    }
    
    navData.categories.forEach((category, catIndex) => {
        const categoryEl = document.createElement('div');
        categoryEl.className = 'category-card';
        
        // 分类头部
        const header = document.createElement('div');
        header.className = 'category-header';
        
        const title = document.createElement('div');
        title.className = 'category-title';
        title.innerHTML = `
            <span class="category-name" data-index="${catIndex}">${escapeHtml(category.name)}</span>
        `;
        
        const actions = document.createElement('div');
        actions.className = 'category-actions';
        actions.innerHTML = `
            <button class="btn-secondary btn-small" onclick="addLink(${catIndex})">+ 添加链接</button>
            <button class="btn-danger btn-small" onclick="deleteCategory(${catIndex})">删除分类</button>
        `;
        
        header.appendChild(title);
        header.appendChild(actions);
        categoryEl.appendChild(header);
        
        // 链接列表
        const linkList = document.createElement('div');
        linkList.className = 'link-list';
        
        if (!category.links || category.links.length === 0) {
            linkList.innerHTML = '<div class="empty-state">暂无链接</div>';
        } else {
            category.links.forEach((link, linkIndex) => {
                const linkItem = document.createElement('div');
                linkItem.className = 'link-item';
                linkItem.innerHTML = `
                    <span class="link-icon">${link.icon || '🔗'}</span>
                    <div class="link-info">
                        <div class="link-name">${escapeHtml(link.name)}</div>
                        <div class="link-url">${escapeHtml(link.url)}</div>
                    </div>
                    <div class="link-actions">
                        <button class="btn-secondary btn-small" onclick="editLink(${catIndex}, ${linkIndex})">编辑</button>
                        <button class="btn-danger btn-small" onclick="deleteLink(${catIndex}, ${linkIndex})">删除</button>
                    </div>
                `;
                linkList.appendChild(linkItem);
            });
        }
        
        categoryEl.appendChild(linkList);
        container.appendChild(categoryEl);
    });
}

// 添加链接
function addLink(categoryIndex) {
    currentEditCategoryIndex = categoryIndex;
    currentEditLinkIndex = -1;
    document.getElementById('modalTitle').textContent = '添加链接';
    document.getElementById('linkName').value = '';
    document.getElementById('linkUrl').value = '';
    document.getElementById('linkIcon').value = '';
    showLinkModal();
}

// 编辑链接
function editLink(categoryIndex, linkIndex) {
    currentEditCategoryIndex = categoryIndex;
    currentEditLinkIndex = linkIndex;
    
    const link = navData.categories[categoryIndex].links[linkIndex];
    document.getElementById('modalTitle').textContent = '编辑链接';
    document.getElementById('linkName').value = link.name || '';
    document.getElementById('linkUrl').value = link.url || '';
    document.getElementById('linkIcon').value = link.icon || '';
    
    showLinkModal();
}

// 删除链接
function deleteLink(categoryIndex, linkIndex) {
    if (confirm('确定要删除这个链接吗？')) {
        navData.categories[categoryIndex].links.splice(linkIndex, 1);
        renderNavData();
        showStatus('已删除，点击保存生效', 'success');
    }
}

// 处理链接表单提交
function handleLinkSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('linkName').value.trim();
    const url = document.getElementById('linkUrl').value.trim();
    const icon = document.getElementById('linkIcon').value.trim();
    
    if (!name || !url) return;
    
    const linkData = { name, url, icon: icon || '🔗' };
    
    if (currentEditLinkIndex >= 0) {
        // 编辑
        navData.categories[currentEditCategoryIndex].links[currentEditLinkIndex] = linkData;
    } else {
        // 新增
        if (!navData.categories[currentEditCategoryIndex].links) {
            navData.categories[currentEditCategoryIndex].links = [];
        }
        navData.categories[currentEditCategoryIndex].links.push(linkData);
    }
    
    hideLinkModal();
    renderNavData();
    showStatus('已修改，点击保存生效', 'success');
}

// 显示分类弹窗
function showCategoryModal() {
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryModal').style.display = 'flex';
    document.getElementById('categoryName').focus();
}

function hideCategoryModal() {
    document.getElementById('categoryModal').style.display = 'none';
}

// 处理分类表单提交
function handleCategorySubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('categoryName').value.trim();
    if (!name) return;
    
    navData.categories.push({
        name: name,
        links: []
    });
    
    hideCategoryModal();
    renderNavData();
    showStatus('分类已添加，点击保存生效', 'success');
}

// 删除分类
function deleteCategory(categoryIndex) {
    if (confirm('确定要删除这个分类吗？分类下的所有链接也会被删除。')) {
        navData.categories.splice(categoryIndex, 1);
        renderNavData();
        showStatus('已删除，点击保存生效', 'success');
    }
}

// 保存导航数据
async function saveNavData() {
    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.textContent = '保存中...';
    
    try {
        const response = await fetch('/api/nav', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: navData })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showStatus('保存成功！', 'success');
        } else {
            showStatus('保存失败: ' + (data.message || '未知错误'), 'error');
        }
    } catch (err) {
        showStatus('网络错误', 'error');
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.textContent = '保存更改';
    }
}

// 退出登录
async function logout() {
    // 清除 cookie 的方式：调用登出接口或者直接跳走
    window.location.href = '/';
}

// 显示状态消息
function showStatus(message, type) {
    const statusEl = document.getElementById('statusMsg');
    statusEl.textContent = message;
    statusEl.className = 'status-msg ' + type;
    
    setTimeout(() => {
        statusEl.className = 'status-msg';
    }, 3000);
}

// 显示/隐藏链接弹窗
function showLinkModal() {
    document.getElementById('linkModal').style.display = 'flex';
    document.getElementById('linkName').focus();
}

function hideLinkModal() {
    document.getElementById('linkModal').style.display = 'none';
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
