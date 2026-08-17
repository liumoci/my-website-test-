const fs = require('fs');
let c = fs.readFileSync('admin/assets/js/dashboard.js', 'utf8');

// 在 loadMsgSettings 中添加背景图 URL 加载
const oldLoad = '            // 背景图\n            if (settings.backgroundImage) {\n                showMsgBgPreview(settings.backgroundImage);\n            }';
const newLoad = '            // 背景图 URL\n            if (settings.backgroundImageUrl) {\n                document.getElementById("msgBgImageUrl").value = settings.backgroundImageUrl;\n            }\n            // 背景图（上传）\n            if (settings.backgroundImage) {\n                showMsgBgPreview(settings.backgroundImage);\n            }';

if (c.includes(oldLoad)) {
    c = c.replace(oldLoad, newLoad);
    console.log('load替换成功');
} else {
    console.log('load未找到匹配');
}

// 在 saveMsgSettings 中添加背景图 URL
const oldSave = '            backgroundImage: window._msgBgImage || \'\'';
const newSave = '            backgroundImage: window._msgBgImage || \'\',\n            backgroundImageUrl: document.getElementById(\'msgBgImageUrl\').value.trim() || \'\'';

if (c.includes(oldSave)) {
    c = c.replace(oldSave, newSave);
    console.log('save替换成功');
} else {
    console.log('save未找到匹配');
}

fs.writeFileSync('admin/assets/js/dashboard.js', c, 'utf8');
