const fs = require('fs');
let content = fs.readFileSync('src/pages/Community/CommunityHome.tsx', 'utf8');

content = content.replace(
    'await deleteCommunityPost(post.id, currentUser?.uid);',
    'await deleteCommunityPost(post.id, post.userId);'
);

fs.writeFileSync('src/pages/Community/CommunityHome.tsx', content);

let postPage = fs.readFileSync('src/pages/Community/CommunityPostPage.tsx', 'utf8');
postPage = postPage.replace(
    'await deleteCommunityPost(post!.id, user!.uid);',
    'await deleteCommunityPost(post!.id, post!.userId);'
);
fs.writeFileSync('src/pages/Community/CommunityPostPage.tsx', postPage);
