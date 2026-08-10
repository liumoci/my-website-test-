// 网站通用脚本

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('网站加载完成');
    
    // 隐藏加载动画
    hideLoader();
    
    // 加载导航数据（背景、卡片、链接）
    loadNavData();
    
    // 添加悬浮留言按钮（管理页不加）
    if (!isAdminPage()) {
        addFloatingGuestbookBtn();
    }
});

// 隐藏加载动画
function hideLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
            // 动画结束后移除
            setTimeout(() => {
                loader.remove();
            }, 500);
        }, 300);
    }
}

// 加载导航数据
async function loadNavData() {
    try {
        const response = await fetch('/api/nav');
        const data = await response.json();
        
        if (data.success && data.data) {
            const navData = data.data;
            
            // 应用背景
            applyBackground(navData.background);
            
            // 渲染卡片
            renderCards(navData.cards);
            
            // 渲染链接分类
            renderNavSections(navData.categories);
        } else {
            showDefaultNav();
        }
    } catch (err) {
        // 本地预览或 API 不可用时，显示默认
        showDefaultNav();
    }
}

// 应用背景
function applyBackground(background) {
    if (!background) return;
    
    const body = document.getElementById('pageBody');
    if (!body) return;
    
    if (background.type === 'image' && background.value) {
        body.style.background = `url('${background.value}') center/cover fixed no-repeat`;
        // 背景图时增加遮罩，保证文字可读
        body.style.position = 'relative';
        addBackgroundOverlay();
    } else if (background.type === 'color' && background.value) {
        body.style.backgroundColor = background.value;
    }
}

// 添加背景遮罩（图片背景时用）
function addBackgroundOverlay() {
    // 检查是否已有遮罩
    if (document.getElementById('bgOverlay')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'bgOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: -1;
        pointer-events: none;
    `;
    
    document.body.appendChild(overlay);
}

// 渲染卡片
function renderCards(cards) {
    const container = document.getElementById('navCardsContainer');
    if (!container) return;
    
    if (!cards || cards.length === 0) {
        showDefaultCards(container);
        return;
    }
    
    container.innerHTML = '';
    
    cards.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.style.animationDelay = `${0.1 + index * 0.1}s`;
        
        const link = document.createElement('a');
        link.href = card.url || '#';
        if (card.url && card.url.startsWith('http')) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        }
        
        const iconHtml = card.icon ? `<div class="card-icon">${card.icon}</div>` : '';
        
        link.innerHTML = `
            ${iconHtml}
            <h2>${escapeHtml(card.title || '未命名')}</h2>
            <p>${escapeHtml(card.description || '')}</p>
        `;
        
        cardEl.appendChild(link);
        container.appendChild(cardEl);
    });
}

// 显示默认卡片
function showDefaultCards(container) {
    const defaultCards = [
        { title: '个人主页', description: '关于我的介绍', icon: '👤', url: '/about/' },
        { title: '博客', description: '我的文章与思考', icon: '📝', url: '/blog/' },
        { title: '云盘', description: '文件分享与下载', icon: '☁️', url: '/drive/' },
        { title: '管理面板', description: '网站后台管理', icon: '⚙️', url: '/admin/' }
    ];
    
    container.innerHTML = '';
    
    defaultCards.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.style.animationDelay = `${0.1 + index * 0.1}s`;
        
        cardEl.innerHTML = `
            <a href="${card.url}">
                <div class="card-icon">${card.icon}</div>
                <h2>${card.title}</h2>
                <p>${card.description}</p>
            </a>
        `;
        
        container.appendChild(cardEl);
    });
}

// 渲染导航分类
function renderNavSections(categories, container) {
    container = container || document.getElementById('navSections');
    if (!container) return;
    
    if (!categories || categories.length === 0) {
        showDefaultLinks(container);
        return;
    }
    
    container.innerHTML = '';
    
    categories.forEach(category => {
        const section = document.createElement('section');
        section.className = 'links';
        
        const title = document.createElement('h2');
        title.textContent = category.name;
        section.appendChild(title);
        
        const grid = document.createElement('div');
        grid.className = 'link-grid';
        
        if (category.links && category.links.length > 0) {
            category.links.forEach((link, index) => {
                const a = document.createElement('a');
                a.href = link.url;
                a.target = link.url.startsWith('http') ? '_blank' : '_self';
                a.rel = 'noopener noreferrer';
                a.style.animationDelay = `${0.1 + index * 0.05}s`;
                
                if (link.icon) {
                    a.innerHTML = `${link.icon} ${escapeHtml(link.name)}`;
                } else {
                    a.textContent = link.name;
                }
                
                grid.appendChild(a);
            });
        } else {
            grid.innerHTML = '<span style="color: var(--text-secondary);">暂无链接</span>';
        }
        
        section.appendChild(grid);
        container.appendChild(section);
    });
}

// 显示默认导航（API 不可用时）
function showDefaultNav() {
    showDefaultCards(document.getElementById('navCardsContainer'));
    showDefaultLinks(document.getElementById('navSections'));
}

function showDefaultLinks(container) {
    container.innerHTML = `
        <section class="links">
            <h2>常用链接</h2>
            <div class="link-grid">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" style="animation-delay: 0.1s">🐙 GitHub</a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" style="animation-delay: 0.15s">🐦 Twitter</a>
                <a href="mailto:your@email.com" style="animation-delay: 0.2s">📧 Email</a>
            </div>
        </section>
    `;
}

// 平滑滚动到锚点
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== 悬浮留言按钮 =====
function isAdminPage() {
    const path = window.location.pathname;
    // 管理页面、导航管理、留言箱页面都不显示悬浮按钮
    return path.startsWith('/admin/') || path.startsWith('/nav-admin/') || path.startsWith('/guestbook/');
}

function addFloatingGuestbookBtn() {
    // 检查是否已存在
    if (document.getElementById('floatingGuestbookBtn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'floatingGuestbookBtn';
    btn.className = 'floating-guestbook-btn';
    btn.innerHTML = '💬';
    btn.title = '留言板（可拖动）';
    
    // 点击跳转
    btn.addEventListener('click', function(e) {
        // 如果是拖动后的点击，不跳转
        if (btn.dataset.dragged === 'true') {
            btn.dataset.dragged = 'false';
            return;
        }
        window.location.href = '/guestbook/';
    });
    
    // 拖拽功能
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    btn.addEventListener('mousedown', function(e) {
        isDragging = true;
        btn.dataset.dragged = 'false';
        
        // 计算初始位置
        const rect = btn.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startLeft = rect.left;
        startTop = rect.top;
        
        // 切换到 fixed 定位
        btn.style.position = 'fixed';
        btn.style.left = startLeft + 'px';
        btn.style.top = startTop + 'px';
        btn.style.right = 'auto';
        btn.style.bottom = 'auto';
        btn.style.zIndex = '10000';
        btn.style.cursor = 'grabbing';
        
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        // 移动距离超过 5px 才算拖动
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            btn.dataset.dragged = 'true';
        }
        
        let newLeft = startLeft + dx;
        let newTop = startTop + dy;
        
        // 限制在视口范围内
        const btnWidth = btn.offsetWidth;
        const btnHeight = btn.offsetHeight;
        const maxLeft = window.innerWidth - btnWidth;
        const maxTop = window.innerHeight - btnHeight;
        
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));
        
        btn.style.left = newLeft + 'px';
        btn.style.top = newTop + 'px';
    });
    
    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            btn.style.cursor = 'grab';
        }
    });
    
    // 移动端触摸支持
    btn.addEventListener('touchstart', function(e) {
        isDragging = true;
        btn.dataset.dragged = 'false';
        
        const touch = e.touches[0];
        const rect = btn.getBoundingClientRect();
        startX = touch.clientX;
        startY = touch.clientY;
        startLeft = rect.left;
        startTop = rect.top;
        
        btn.style.position = 'fixed';
        btn.style.left = startLeft + 'px';
        btn.style.top = startTop + 'px';
        btn.style.right = 'auto';
        btn.style.bottom = 'auto';
        btn.style.zIndex = '10000';
        
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        
        const touch = e.touches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            btn.dataset.dragged = 'true';
        }
        
        let newLeft = startLeft + dx;
        let newTop = startTop + dy;
        
        const btnWidth = btn.offsetWidth;
        const btnHeight = btn.offsetHeight;
        const maxLeft = window.innerWidth - btnWidth;
        const maxTop = window.innerHeight - btnHeight;
        
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));
        
        btn.style.left = newLeft + 'px';
        btn.style.top = newTop + 'px';
        
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('touchend', function() {
        if (isDragging) {
            isDragging = false;
        }
    });
    
    btn.style.cursor = 'grab';
    document.body.appendChild(btn);
}
