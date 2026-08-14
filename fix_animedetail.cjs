const fs = require('fs');
let content = fs.readFileSync('src/pages/AnimeDetail.tsx', 'utf8');
content = content.replace(/<!--\s*<WatchlistButton animeId=\{anime.id\} className="px-8 py-3.5 gap-2 backdrop-blur-md" \/>\s*<\/Button>/, '<WatchlistButton animeId={anime.id!} className="px-8 py-3.5 backdrop-blur-md" />');
fs.writeFileSync('src/pages/AnimeDetail.tsx', content);
