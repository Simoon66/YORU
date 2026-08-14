const fs = require('fs');
let content = fs.readFileSync('src/pages/Watch.tsx', 'utf8');
content = content.replace(
  '{/* 5. Episode Grid */}\n        <div className="flex flex-col gap-4 mt-4">',
  '{/* 5. Episode Grid */}\n        <div className="flex flex-col gap-4 mt-4 px-4 md:px-0">'
);
fs.writeFileSync('src/pages/Watch.tsx', content);
