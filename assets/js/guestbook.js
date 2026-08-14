// 留言箱脚本

document.addEventListener('DOMContentLoaded', function() {
    // 加载设置
    loadGuestbookSettings();
    
    // 加载留言
    loadMessages();
    
    // 留言表单
    document.getElementById('messageForm').addEventListener('submit', handleMessageSubmit);
});

// 加载留言箱设置
async function loadGuestbookSettings() {
    try {
        const response = await fetch('/api/messages/settings');
        const data = await response.json();
        
        if (data.success && data.data) {
            const settings = data.data;
            
            // 应用背景图
            if (settings.backgroundImage) {
                document.body.style.backgroundImage = 'url(' + settings.backgroundImage + ')';
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
                document.body.style.backgroundAttachment = 'fixed';
            }
            
            // 应用背景颜色
            if (settings.backgroundColor) {
                document.body.style.backgroundColor = settings.backgroundColor;
            }
            
            // 应用主题颜色
            if (settings.primaryColor) {
                document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
            }
        }
    } catch (err) {
        console.error('加载设置失败:', err);
    }
}

// 清空表单
function clearForm() {
    document.getElementById('messageName').value = '';
    document.getElementById('messageContent').value = '';
    document.getElementById('messageFormMsg').textContent = '';
    document.getElementById('messageFormMsg').className = 'form-msg';
}

// 加载留言
async function loadMessages() {
    try {
        const response = await fetch('/api/messages');
        const data = await response.json();
        
        if (data.success && data.messages) {
            renderMessages(data.messages);
        }
    } catch (err) {
        console.error('加载留言失败:', err);
        document.getElementById('messagesList').innerHTML = 
            '<p style="text-align: center; color: rgba(255,255,255,0.7); padding: 2rem;">加载失败</p>';
    }
}

// 渲染留言列表
function renderMessages(messages) {
    const list = document.getElementById('messagesList');
    const countEl = document.getElementById('messageCount');
    
    countEl.textContent = messages.length;
    
    if (messages.length === 0) {
        list.innerHTML = 
            '<p style="text-align: center; color: rgba(255,255,255,0.7); padding: 2rem;">还没有留言，来抢沙发吧！</p>';
        return;
    }
    
    list.innerHTML = '';
    
    messages.forEach(msg => {
        const item = document.createElement('div');
        item.className = 'message-item';
        
        const date = new Date(msg.time);
        const timeStr = date.toLocaleString('zh-CN');
        
        let replyHtml = '';
        if (msg.reply && msg.reply.content) {
            const replyDate = new Date(msg.reply.time);
            const replyTimeStr = replyDate.toLocaleString('zh-CN');
            replyHtml = `
                <div class="message-reply">
                    <div class="reply-label">📢 站长回复</div>
                    <div class="reply-content">${escapeHtml(msg.reply.content)}</div>
                    <div class="reply-time">${replyTimeStr}</div>
                </div>
            `;
        }
        
        item.innerHTML = `
            <div class="message-header">
                <span class="message-name">${escapeHtml(msg.name)}</span>
                <span class="message-time">${timeStr}</span>
            </div>
            <div class="message-content">${escapeHtml(msg.content)}</div>
            ${replyHtml}
        `;
        
        list.appendChild(item);
    });
}

// 提交留言
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
            
            // 清空内容
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
        btn.textContent = '提交';
    }
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
