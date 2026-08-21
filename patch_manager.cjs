const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin/EpisodeManager.tsx', 'utf-8');

// Update useEffect to fetch MAL ID
content = content.replace(
  /setAutoAddConfig\(prev => \(\{ \.\.\.prev, anilistId: data\.aniListId \|\| '' \}\)\);/,
  `setAutoAddConfig(prev => ({ ...prev, anilistId: data.aniListId || '' }));
        if (data.aniListId) {
          fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: \`query ($id: Int) { Media(id: $id) { idMal } }\`,
              variables: { id: parseInt(data.aniListId) }
            })
          })
          .then(res => res.json())
          .then(resData => {
            if (resData?.data?.Media?.idMal) {
              setAutoAddConfig(prev => ({ ...prev, malId: resData.data.Media.idMal.toString() }));
            }
          })
          .catch(e => console.error('Error fetching MAL ID', e));
        }`
);

// Update HD-1 and HD-2 names
content = content.replace(
  /if \(!ep\.servers\.some\(s => s\.serverName === 'AniList Sub'\)\) \{[\s\S]*?serverType: 'sub' \}\);[\s\S]*?\}/,
  `if (!ep.servers.some(s => s.serverName === 'HD-1' && s.serverType === 'sub')) {
          ep.servers.push({ serverName: 'HD-1', embedLink: \`https://megaplay.buzz/stream/ani/\${anilistId}/\${i}/sub\`, serverType: 'sub' });
        }`
);
content = content.replace(
  /if \(!ep\.servers\.some\(s => s\.serverName === 'AniList Dub'\)\) \{[\s\S]*?serverType: 'dub' \}\);[\s\S]*?\}/,
  `if (!ep.servers.some(s => s.serverName === 'HD-1' && s.serverType === 'dub')) {
          ep.servers.push({ serverName: 'HD-1', embedLink: \`https://megaplay.buzz/stream/ani/\${anilistId}/\${i}/dub\`, serverType: 'dub' });
        }`
);

content = content.replace(
  /if \(!ep\.servers\.some\(s => s\.serverName === 'MAL Sub'\)\) \{[\s\S]*?serverType: 'sub' \}\);[\s\S]*?\}/,
  `if (!ep.servers.some(s => s.serverName === 'HD-2' && s.serverType === 'sub')) {
          ep.servers.push({ serverName: 'HD-2', embedLink: \`https://megaplay.buzz/stream/mal/\${malId}/\${i}/sub\`, serverType: 'sub' });
        }`
);
content = content.replace(
  /if \(!ep\.servers\.some\(s => s\.serverName === 'MAL Dub'\)\) \{[\s\S]*?serverType: 'dub' \}\);[\s\S]*?\}/,
  `if (!ep.servers.some(s => s.serverName === 'HD-2' && s.serverType === 'dub')) {
          ep.servers.push({ serverName: 'HD-2', embedLink: \`https://megaplay.buzz/stream/mal/\${malId}/\${i}/dub\`, serverType: 'dub' });
        }`
);

fs.writeFileSync('src/pages/Admin/EpisodeManager.tsx', content);
