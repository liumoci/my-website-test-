// 导航管理主逻辑

let navData = { 
    background: { type: 'color', value: '' },
    cards: [],
    categories: [] 
};

let currentEditLinkIndex = -1;
let currentEditCategoryIndex = -1;
let currentEditCardIndex = -1;

document.addEventListener('DOMContentLoaded', async function() {
    // 加载导航数据
    await loadNavData();
    
    // 保存按钮
    document.getElementById('saveBtn').addEventListener('click', saveNavData);
    
    // 退出按钮
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // 标签页切换
    initTabs();
    
    // 链接管理
    initLinkManager();
    
    // 卡片管理
    initCardManager();
    
    // 背景设置
    initBackgroundManager();
});

// ===== 标签页切换 =====
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById('tab-' + tab).classList.add('active');
            
            // 切换到对应标签时刷新
            if (tab === 'cards') renderCards();
            if (tab === 'background') updateBgPreview();
        });
    });
}

// ===== 加载导航数据 =====
async function loadNavData() {
    try {
        const response = await fetch('/api/nav', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            navData = data.data;
            // 确保有默认结构
            if (!navData.background) navData.background = { type: 'color', value: '' };
            if (!navData.cards) navData.cards = [];
            if (!navData.categories) navData.categories = [];
            
            renderNavData();
        } else {
            showStatus('加载失败: ' + (data.message || '未知错误'), 'error');
        }
    } catch (err) {
        // 如果是 401 或其他错误，可能是未登录，跳转到登录页
        window.location.href = '/nav-admin/login.html';
    }
}

// ===== 渲染导航数据 =====
function renderNavData() {
    renderCategories();
    renderCards();
    renderBackground();
}

// ===== 链接管理 =====
function initLinkManager() {
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
}

function renderCategories() {
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
        title.innerHTML = `<span class="category-name">${escapeHtml(category.name)}</span>`;
        
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

function addLink(categoryIndex) {
    currentEditCategoryIndex = categoryIndex;
    currentEditLinkIndex = -1;
    document.getElementById('modalTitle').textContent = '添加链接';
    document.getElementById('linkName').value = '';
    document.getElementById('linkUrl').value = '';
    document.getElementById('linkIcon').value = '';
    showLinkModal();
}

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

function deleteLink(categoryIndex, linkIndex) {
    if (confirm('确定要删除这个链接吗？')) {
        navData.categories[categoryIndex].links.splice(linkIndex, 1);
        renderCategories();
        showStatus('已删除，点击保存生效', 'success');
    }
}

function handleLinkSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('linkName').value.trim();
    const url = document.getElementById('linkUrl').value.trim();
    const icon = document.getElementById('linkIcon').value.trim();
    
    if (!name || !url) return;
    
    const linkData = { name, url, icon: icon || '🔗' };
    
    if (currentEditLinkIndex >= 0) {
        navData.categories[currentEditCategoryIndex].links[currentEditLinkIndex] = linkData;
    } else {
        if (!navData.categories[currentEditCategoryIndex].links) {
            navData.categories[currentEditCategoryIndex].links = [];
        }
        navData.categories[currentEditCategoryIndex].links.push(linkData);
    }
    
    hideLinkModal();
    renderCategories();
    showStatus('已修改，点击保存生效', 'success');
}

function showCategoryModal() {
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryModal').style.display = 'flex';
    document.getElementById('categoryName').focus();
}

function hideCategoryModal() {
    document.getElementById('categoryModal').style.display = 'none';
}

function handleCategorySubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('categoryName').value.trim();
    if (!name) return;
    
    navData.categories.push({
        name: name,
        links: []
    });
    
    hideCategoryModal();
    renderCategories();
    showStatus('分类已添加，点击保存生效', 'success');
}

function deleteCategory(categoryIndex) {
    if (confirm('确定要删除这个分类吗？分类下的所有链接也会被删除。')) {
        navData.categories.splice(categoryIndex, 1);
        renderCategories();
        showStatus('已删除，点击保存生效', 'success');
    }
}

function showLinkModal() {
    document.getElementById('linkModal').style.display = 'flex';
    document.getElementById('linkName').focus();
}

function hideLinkModal() {
    document.getElementById('linkModal').style.display = 'none';
}

// ===== 卡片管理 =====
function initCardManager() {
    document.getElementById('cardForm').addEventListener('submit', handleCardSubmit);
    document.getElementById('cancelCardBtn').addEventListener('click', hideCardModal);
    
    document.getElementById('cardModal').addEventListener('click', function(e) {
        if (e.target === this) hideCardModal();
    });
    
    // 添加卡片按钮
    document.getElementById('addCardBtn').addEventListener('click', addCard);
}

function renderCards() {
    const container = document.getElementById('cardsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!navData.cards || navData.cards.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无卡片</div>';
        return;
    }
    
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
                <button class="btn-secondary btn-small" onclick="editCard(${index})">编辑</button>
                <button class="btn-danger btn-small" onclick="deleteCard(${index})">删除</button>
            </div>
        `;
        container.appendChild(cardEl);
    });
}

function editCard(index) {
    currentEditCardIndex = index;
    const card = navData.cards[index];
    
    document.getElementById('cardModalTitle').textContent = '编辑卡片';
    document.getElementById('cardTitle').value = card.title || '';
    document.getElementById('cardDesc').value = card.description || '';
    document.getElementById('cardIcon').value = card.icon || '';
    document.getElementById('cardUrl').value = card.url || '';
    
    showCardModal();
}

function addCard() {
    currentEditCardIndex = -1;
    
    document.getElementById('cardModalTitle').textContent = '添加卡片';
    document.getElementById('cardTitle').value = '';
    document.getElementById('cardDesc').value = '';
    document.getElementById('cardIcon').value = '📄';
    document.getElementById('cardUrl').value = '';
    
    showCardModal();
}

function deleteCard(index) {
    if (confirm('确定要删除这个卡片吗？')) {
        navData.cards.splice(index, 1);
        renderCards();
        showStatus('已删除，点击保存生效', 'success');
    }
}

function handleCardSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('cardTitle').value.trim();
    const description = document.getElementById('cardDesc').value.trim();
    const icon = document.getElementById('cardIcon').value.trim();
    const url = document.getElementById('cardUrl').value.trim();
    
    if (!title || !url) return;
    
    const cardData = { title, description, icon, url };
    
    if (currentEditCardIndex >= 0 && currentEditCardIndex < navData.cards.length) {
        navData.cards[currentEditCardIndex] = cardData;
    } else {
        navData.cards.push(cardData);
    }
    
    hideCardModal();
    renderCards();
    showStatus('已修改，点击保存生效', 'success');
}

function showCardModal() {
    document.getElementById('cardModal').style.display = 'flex';
    document.getElementById('cardTitle').focus();
}

function hideCardModal() {
    document.getElementById('cardModal').style.display = 'none';
}

// ===== 背景设置 =====
function initBackgroundManager() {
    // 背景类型切换
    document.querySelectorAll('input[name="bgType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const type = this.value;
            document.getElementById('bgColorSection').style.display = type === 'color' ? 'block' : 'none';
            document.getElementById('bgImageSection').style.display = type === 'image' ? 'block' : 'none';
            updateBgPreview();
        });
    });
    
    // 颜色选择器联动
    document.getElementById('bgColorPicker').addEventListener('input', function() {
        document.getElementById('bgColorText').value = this.value;
        updateBgPreview();
    });
    
    document.getElementById('bgColorText').addEventListener('input', function() {
        const color = this.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
            document.getElementById('bgColorPicker').value = color;
        }
        updateBgPreview();
    });
    
    // 图片URL输入
    document.getElementById('bgImageUrl').addEventListener('input', updateBgPreview);
    
    // 拖拽上传
    initDragAndDrop();
}

// 初始化拖拽上传
function initDragAndDrop() {
    const dropZone = document.getElementById('bgDropZone');
    const fileInput = document.getElementById('bgFileInput');
    
    if (!dropZone || !fileInput) return;
    
    // 点击选择文件
    dropZone.addEventListener('click', () => fileInput.click());
    
    // 文件选择
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleImageFile(file);
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
            handleImageFile(file);
        } else {
            showStatus('请拖入图片文件', 'error');
        }
    });
}

// 处理图片文件
function handleImageFile(file) {
    // 检查文件大小
    if (file.size > 500 * 1024) {
        if (!confirm('图片超过 500KB，可能会影响加载速度，确定继续吗？')) {
            return;
        }
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;
        document.getElementById('bgImageUrl').value = base64;
        updateBgPreview();
        showStatus('图片已加载，点击保存生效', 'success');
    };
    reader.onerror = function() {
        showStatus('图片读取失败', 'error');
    };
    reader.readAsDataURL(file);
}

function renderBackground() {
    if (!navData.background) return;
    
    const bg = navData.background;
    
    // 设置类型
    document.querySelector(`input[name="bgType"][value="${bg.type}"]`).checked = true;
    
    // 设置颜色
    if (bg.type === 'color') {
        document.getElementById('bgColorSection').style.display = 'block';
        document.getElementById('bgImageSection').style.display = 'none';
        if (bg.value) {
            document.getElementById('bgColorPicker').value = bg.value;
            document.getElementById('bgColorText').value = bg.value;
        }
    }
    
    // 设置图片
    if (bg.type === 'image') {
        document.getElementById('bgColorSection').style.display = 'none';
        document.getElementById('bgImageSection').style.display = 'block';
        document.getElementById('bgImageUrl').value = bg.value || '';
    }
    
    updateBgPreview();
}

function updateBgPreview() {
    const preview = document.getElementById('bgPreview');
    if (!preview) return;
    
    const type = document.querySelector('input[name="bgType"]:checked')?.value || 'color';
    
    if (type === 'color') {
        const color = document.getElementById('bgColorText')?.value || '';
        preview.style.background = color || 'var(--bg-color)';
    } else {
        const url = document.getElementById('bgImageUrl')?.value || '';
        if (url) {
            preview.style.background = `url('${url}') center/cover no-repeat`;
        } else {
            preview.style.background = 'var(--bg-color)';
        }
    }
}

// 从表单收集背景数据
function collectBackgroundData() {
    const type = document.querySelector('input[name="bgType"]:checked')?.value || 'color';
    let value = '';
    
    if (type === 'color') {
        value = document.getElementById('bgColorText')?.value || '';
    } else {
        value = document.getElementById('bgImageUrl')?.value || '';
    }
    
    return { type, value };
}

// ===== 保存导航数据 =====
async function saveNavData() {
    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.textContent = '保存中...';
    
    // 收集背景数据
    navData.background = collectBackgroundData();
    
    try {
        const response = await fetch('/api/nav', {
            method: 'POST',
            credentials: 'include',
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
        showStatus('网络错误或未登录', 'error');
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.textContent = '保存更改';
    }
}

// ===== 退出登录 =====
async function logout() {
    window.location.href = '/';
}

// ===== 工具函数 =====
function showStatus(message, type) {
    const statusEl = document.getElementById('statusMsg');
    statusEl.textContent = message;
    statusEl.className = 'status-msg ' + type;
    
    setTimeout(() => {
        statusEl.className = 'status-msg';
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
