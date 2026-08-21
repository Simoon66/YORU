const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin/AutoImport.tsx', 'utf-8');

content = content.replace(/AniList Sub/g, 'HD-1 (Sub)');
content = content.replace(/AniList Dub/g, 'HD-1 (Dub)');
content = content.replace(/MAL Sub/g, 'HD-2 (Sub)');
content = content.replace(/MAL Dub/g, 'HD-2 (Dub)');

// Actually wait, for the server names that get added to DB, they should just be "HD-1" and "HD-2", and the type should be sub or dub.
// Let's see how they are added in AutoImport.tsx
