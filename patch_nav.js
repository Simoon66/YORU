const fs = require('fs');

let content = fs.readFileSync('src/components/Navigation.tsx', 'utf8');

// replace the hidden search logic and popup
content = content.replace(
  `import { Search, User, LogIn, Home, Compass, Bookmark, Settings, X, Loader2 } from 'lucide-react';`,
  `import { Search, User, LogIn, Home, Compass, Bookmark, Settings, X, Loader2, Filter, Shuffle } from 'lucide-react';`
);

fs.writeFileSync('src/components/Navigation.tsx', content);
