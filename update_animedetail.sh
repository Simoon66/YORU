#!/bin/bash
sed -i 's/import { Button } from '\''..\/components\/ui\/Button'\'';/import { Button } from '\''..\/components\/ui\/Button'\'';\nimport { WatchlistButton } from '\''..\/components\/WatchlistButton'\'';/' src/pages/AnimeDetail.tsx
sed -i 's/<Button variant="secondary" size="lg" className="px-8 py-3.5 gap-2 backdrop-blur-md">/<!--/g' src/pages/AnimeDetail.tsx
sed -i 's/<Plus className="w-5 h-5" \/> Watchlist/<WatchlistButton animeId={anime.id} className="px-8 py-3.5 gap-2 backdrop-blur-md" \/>/g' src/pages/AnimeDetail.tsx
sed -i 's/<\/Button>\s*<\/div>\s*<\/motion.div>/-->\n              <\/div>\n            <\/motion.div>/g' src/pages/AnimeDetail.tsx
