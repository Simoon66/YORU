const fs = require('fs');
let content = fs.readFileSync('src/pages/Community/CommunityHome.tsx', 'utf8');

if (!content.includes('useNavigate')) {
  content = content.replace("import { Link } from 'react-router-dom';", "import { Link, useNavigate } from 'react-router-dom';");
}

// Add navigate to PostCard
if (!content.includes('const navigate = useNavigate();')) {
  content = content.replace(
    'const isAuthor = currentUser?.uid === post.userId;',
    'const isAuthor = currentUser?.uid === post.userId;\n  const navigate = useNavigate();'
  );
}

// Replace outer Link with div
content = content.replace(
    '<Link to={`/community/post/${post.id}`} className={clsx(',
    '<div onClick={() => navigate(`/community/post/${post.id}`)} className={clsx('
);
content = content.replace(
    '</Link>\n  );\n};\n',
    '</div>\n  );\n};\n'
);

// We should also add cursor-pointer to the clsx
content = content.replace(
    '"block bg-[#0A0B0E]',
    '"block bg-[#0A0B0E] cursor-pointer'
);

fs.writeFileSync('src/pages/Community/CommunityHome.tsx', content);
