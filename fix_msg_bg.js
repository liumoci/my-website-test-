const fs = require('fs');
let c = fs.readFileSync('admin/index.html', 'utf8');

// 1. 删除博客设置中错误添加的 msgBgImageUrl 部分
const wrongBlock = `                        <div class="form-group">
                            <label>背景图片 URL</label>
                                <input type="url" id="msgBgImageUrl" placeholder="https://example.com/bg.jpg" class="form-input">
                                <p class="hint">优先使用URL链接</p>
                            </div>
                            <div class="form-group">
                                <label>或上传背景图片</label>`;

if (c.includes(wrongBlock)) {
    c = c.replace(wrongBlock, '');
    console.log('删除博客设置中错误的URL输入框成功');
} else {
    console.log('未找到错误块，尝试其他方式');
    // 用更短的匹配
    const shortWrong = '<input type="url" id="msgBgImageUrl"';
    if (c.includes(shortWrong)) {
        // 找到这个 input 所在的 form-group，删除整个 group
        const idx = c.indexOf(shortWrong);
        const groupStart = c.lastIndexOf('<div class="form-group">', idx);
        const groupEnd = c.indexOf('</div>', idx) + 6;
        c = c.substring(0, groupStart) + c.substring(groupEnd);
        console.log('删除成功');
    }
}

// 2. 在留言设置的 msgBgDropZone 前面添加 URL 输入框
const msgDropZone = '<div id="msgBgDropZone"';
if (c.includes(msgDropZone)) {
    const idx = c.indexOf(msgDropZone);
    // 找到这个 form-group 的开头
    const groupStart = c.lastIndexOf('<div class="form-group">', idx);
    const labelStart = c.indexOf('<label>', groupStart);
    const labelEnd = c.indexOf('</label>', labelStart) + 8;
    
    // 在 label 后面插入 URL 输入框
    const urlInput = `
                                <input type="url" id="msgBgImageUrl" placeholder="https://example.com/bg.jpg（留空用上传的图片）" class="form-input">
                                <p class="hint">优先使用URL链接，不存储在本站</p>`;
    
    c = c.substring(0, labelEnd) + urlInput + c.substring(labelEnd);
    console.log('留言设置添加URL输入框成功');
} else {
    console.log('未找到留言设置的拖拽区域');
}

fs.writeFileSync('admin/index.html', c, 'utf8');
