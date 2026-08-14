const fs = require('fs');
let content = fs.readFileSync('src/components/AnimeCard.tsx', 'utf8');

if (!content.includes('WatchlistButton')) {
  content = content.replace(
    "import { Button } from './ui/Button';",
    "import { Button } from './ui/Button';\nimport { WatchlistButton } from './WatchlistButton';"
  );
  
  content = content.replace(
    /<Button variant="secondary" size="icon" className="shrink-0 rounded-full">\s*<Plus className="w-5 h-5" \/>\s*<\/Button>/,
    "<WatchlistButton animeId={anime.id!} variant=\"secondary\" size=\"icon\" showText={false} className=\"shrink-0 rounded-full w-10 h-10\" />"
  );
  
  fs.writeFileSync('src/components/AnimeCard.tsx', content);
}
