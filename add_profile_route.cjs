const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('Profile')) {
  content = content.replace(
    "import { Watchlist } from './pages/Watchlist';",
    "import { Watchlist } from './pages/Watchlist';\nimport { Profile } from './pages/Profile';"
  );
  
  content = content.replace(
    '<Route path="/watchlist" element={<Watchlist />} />',
    '<Route path="/watchlist" element={<Watchlist />} />\n          <Route path="/profile" element={<Profile />} />'
  );
  
  fs.writeFileSync('src/App.tsx', content);
}
