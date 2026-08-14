const fs = require('fs');
let content = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

// Container around Servers and Seasons
content = content.replace(
  '{/* 3. Server Selector */}\n        <div className="flex flex-col gap-6 mt-2">',
  '{/* 3. Server Selector */}\n        <div className="flex flex-col gap-6 mt-2 px-4 md:px-0">'
);

content = content.replace(
  '{/* 4. Season Selector */}\n        {anime.seasons && anime.seasons.length > 1 && (\n            <div className="flex flex-col gap-4 mt-4">',
  '{/* 4. Season Selector */}\n        {anime.seasons && anime.seasons.length > 1 && (\n            <div className="flex flex-col gap-4 mt-4 px-4 md:px-0">'
);

content = content.replace(
  '{/* 5. Episode Grid */}\n        <div className="flex flex-col gap-4">',
  '{/* 5. Episode Grid */}\n        <div className="flex flex-col gap-4 px-4 md:px-0">'
);

content = content.replace(
  '<CommentSection animeId={anime.id} episodeId={currentEpisode.id} />',
  '<div className="px-4 md:px-0"><CommentSection animeId={anime.id} episodeId={currentEpisode.id} /></div>'
);

fs.writeFileSync('src/pages/Watch.tsx', content);
