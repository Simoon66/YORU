const fs = require('fs');
let content = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

if (!content.includes('WatchlistButton')) {
  content = content.replace(
    "import { Button } from '../components/ui/Button';",
    "import { Button } from '../components/ui/Button';\nimport { WatchlistButton } from '../components/WatchlistButton';"
  );
  
  content = content.replace(
    '{/* Autoplay & Navigation */}\n              <div className="flex items-center gap-4 md:gap-6 shrink-0 flex-wrap sm:flex-nowrap">',
    '{/* Autoplay & Navigation */}\n              <div className="flex items-center gap-4 md:gap-6 shrink-0 flex-wrap sm:flex-nowrap">\n                 <WatchlistButton animeId={anime.id} size="icon" variant="secondary" className="w-10 h-10 rounded-full" showText={false} />'
  );
  
  fs.writeFileSync('src/pages/Watch.tsx', content);
}
