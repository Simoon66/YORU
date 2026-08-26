const fs = require('fs');
let content = fs.readFileSync('src/pages/Community/CommunityHome.tsx', 'utf8');

content = content.replace(
    'e.preventDefault();\n    if (window.confirm',
    'e.preventDefault();\n    e.stopPropagation();\n    if (window.confirm'
);

content = content.replace(
    'e.preventDefault();\n    if (!currentUser)',
    'e.preventDefault();\n    e.stopPropagation();\n    if (!currentUser)'
);

fs.writeFileSync('src/pages/Community/CommunityHome.tsx', content);
