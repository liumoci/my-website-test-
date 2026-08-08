// 网站通用脚本

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('网站加载完成');
    
    // 加载导航链接
    loadNavLinks();
});

// 加载导航链接
async function loadNavLinks() {
    const container = document.getElementById('navSections');
    if (!container) return;
    
    try {
        const response = await fetch('/api/nav');
        const data = await response.json();
        
        if (data.success && data.data && data.data.categories) {
            renderNavSections(data.data.categories, container);
        } else {
            // 加载失败，显示默认
            showDefaultNav(container);
        }
    } catch (err) {
        // 本地预览或 API 不可用时，显示默认
        showDefaultNav(container);
    }
}

// 渲染导航分类
function renderNavSections(categories, container) {
    if (!categories || categories.length === 0) {
        showDefaultNav(container);
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
            category.links.forEach(link => {
                const a = document.createElement('a');
                a.href = link.url;
                a.target = link.url.startsWith('http') ? '_blank' : '_self';
                a.rel = 'noopener noreferrer';
                
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
function showDefaultNav(container) {
    container.innerHTML = `
        <section class="links">
            <h2>常用链接</h2>
            <div class="link-grid">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">🐙 GitHub</a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">🐦 Twitter</a>
                <a href="mailto:your@email.com">📧 Email</a>
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
