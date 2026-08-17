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
            
            // 应用背景图（优先URL，其次上传的base64）
            const bgUrl = settings.backgroundImageUrl || settings.backgroundImage;
            if (bgUrl) {
                document.body.style.backgroundImage = 'url(' + bgUrl + ')';
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

// 把扁平留言列表组装成树
function buildMessageTree(messages) {
    const map = {};
    const roots = [];
    
    // 先把所有留言放入 map
    messages.forEach(msg => {
        msg.replies = [];
        map[msg.id] = msg;
    });
    
    // 处理旧格式的 reply 字段，转换成独立的回复项
    messages.forEach(msg => {
        if (msg.reply && msg.reply.content) {
            // 检查是否已经有对应的新格式回复
            const hasNewReply = messages.some(m => m.parentId === msg.id && m.isAdmin);
            if (!hasNewReply) {
                // 把旧 reply 转换成独立的回复项
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
    
    // 组装树
    messages.forEach(msg => {
        if (msg.parentId && map[msg.parentId]) {
            map[msg.parentId].replies.push(msg);
        } else if (!msg.parentId) {
            roots.push(msg);
        }
    });
    
    // 按时间排序（顶级倒序，回复正序）
    roots.sort((a, b) => b.time - a.time);
    function sortReplies(msg) {
        msg.replies.sort((a, b) => a.time - b.time);
        msg.replies.forEach(sortReplies);
    }
    roots.forEach(sortReplies);
    
    return roots;
}

// 渲染留言列表
function renderMessages(messages) {
    const list = document.getElementById('messagesList');
    const countEl = document.getElementById('messageCount');
    
    // 统计顶级留言数量
    const topLevel = messages.filter(m => !m.parentId);
    countEl.textContent = topLevel.length;
    
    if (messages.length === 0) {
        list.innerHTML = 
            '<p style="text-align: center; color: rgba(255,255,255,0.7); padding: 2rem;">还没有留言，来抢沙发吧！</p>';
        return;
    }
    
    const tree = buildMessageTree(messages);
    list.innerHTML = '';
    
    tree.forEach(msg => {
        list.appendChild(renderMessageItem(msg, 0));
    });
}

// 渲染单条留言（递归）
function renderMessageItem(msg, depth) {
    const item = document.createElement('div');
    item.className = 'message-item';
    item.dataset.id = msg.id;
    
    const date = new Date(msg.time);
    const timeStr = date.toLocaleString('zh-CN');
    
    // 站长回复特殊样式
    const isAdmin = msg.isAdmin === true;
    const nameLabel = isAdmin ? '📢 站长' : escapeHtml(msg.name);
    const nameClass = isAdmin ? 'message-name admin-name' : 'message-name';
    
    // 回复按钮（最多嵌套5层）
    let replyBtnHtml = '';
    if (depth < 5) {
        replyBtnHtml = `<button class="reply-btn" onclick="toggleReplyForm('${msg.id}')" 
            style="margin-top:0.5rem;padding:0.3rem 0.75rem;border:1px solid rgba(255,255,255,0.4);border-radius:0.5rem;background:rgba(255,255,255,0.15);color:white;font-size:0.8rem;cursor:pointer;transition:all 0.2s;">💬 回复</button>`;
    }
    
    // 回复表单容器
    const replyFormHtml = `
        <div id="replyForm-${msg.id}" class="reply-form-container" style="display:none; margin-top: 0.75rem;">
            <input type="text" id="replyName-${msg.id}" placeholder="你的昵称" maxlength="50" 
                style="width:100%;padding:0.5rem 0.75rem;margin-bottom:0.5rem;border:1px solid rgba(255,255,255,0.3);border-radius:0.5rem;background:rgba(255,255,255,0.2);color:white;font-size:0.85rem;box-sizing:border-box;outline:none;">
            <textarea id="replyContent-${msg.id}" placeholder="回复内容..." maxlength="500"
                style="width:100%;padding:0.5rem 0.75rem;margin-bottom:0.5rem;border:1px solid rgba(255,255,255,0.3);border-radius:0.5rem;background:rgba(255,255,255,0.2);color:white;font-size:0.85rem;box-sizing:border-box;outline:none;resize:none;min-height:60px;"></textarea>
            <div style="display:flex;gap:0.5rem;">
                <button onclick="submitReply('${msg.id}')" 
                    style="flex:1;padding:0.4rem 0.75rem;border:none;border-radius:0.5rem;background:linear-gradient(135deg,rgba(102,126,234,0.85),rgba(118,75,162,0.85));color:white;font-size:0.85rem;cursor:pointer;">提交回复</button>
                <button onclick="toggleReplyForm('${msg.id}')"
                    style="padding:0.4rem 0.75rem;border:1px solid rgba(255,255,255,0.3);border-radius:0.5rem;background:rgba(0,0,0,0.2);color:white;font-size:0.85rem;cursor:pointer;">取消</button>
            </div>
        </div>
    `;
    
    // 递归渲染子回复
    let repliesHtml = '';
    if (msg.replies && msg.replies.length > 0) {
        repliesHtml = '<div class="message-replies" style="margin-left: 1rem; margin-top: 0.75rem; padding-left: 0.75rem; border-left: 2px solid rgba(255,255,255,0.2);">';
        msg.replies.forEach(reply => {
            const replyEl = renderMessageItem(reply, depth + 1);
            repliesHtml += replyEl.outerHTML;
        });
        repliesHtml += '</div>';
    }
    
    item.innerHTML = `
        <div class="message-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
            <span class="${nameClass}" style="font-weight:600;color:${isAdmin ? '#c4b5fd' : 'white'};">${nameLabel}</span>
            <span class="message-time" style="color:rgba(255,255,255,0.5);font-size:0.8rem;">${timeStr}</span>
        </div>
        <div class="message-content" style="color:rgba(255,255,255,0.9);line-height:1.6;font-size:0.95rem;">${escapeHtml(msg.content)}</div>
        <div style="margin-top:0.5rem;">${replyBtnHtml}</div>
        ${replyFormHtml}
        ${repliesHtml}
    `;
    
    return item;
}

// 切换回复表单显示
function toggleReplyForm(msgId) {
    const form = document.getElementById('replyForm-' + msgId);
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
}

// 提交回复
async function submitReply(parentId) {
    const nameInput = document.getElementById('replyName-' + parentId);
    const contentInput = document.getElementById('replyContent-' + parentId);
    const name = nameInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!name || !content) {
        alert('请填写昵称和回复内容');
        return;
    }
    
    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, content, parentId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            toggleReplyForm(parentId);
            loadMessages();
        } else {
            alert(data.message || '回复失败');
        }
    } catch (err) {
        alert('网络错误');
        console.error(err);
    }
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
