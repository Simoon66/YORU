const fs = require('fs');
let content = fs.readFileSync('src/pages/Watch.tsx', 'utf-8');

// Replace uniqueEpisodes logic
content = content.replace(
  /const seasonEpisodes = episodes\.filter\(e => e\.seasonId === seasonParam\);\n(.*?)sort\(\(a, b\) => a\.episodeNumber - b\.episodeNumber\);/s,
  `const seasonEpisodes = episodes.filter(e => e.seasonId === seasonParam);
  const uniqueEpisodes = seasonEpisodes.sort((a, b) => a.episodeNumber - b.episodeNumber);`
);

// We need an activeServer state. Let's add it right after currentEpisode
content = content.replace(
  /const \[currentEpisode, setCurrentEpisode\] = useState<Episode \| null>\(null\);/,
  `const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [activeServerIdx, setActiveServerIdx] = useState(0);`
);

// currentEpisodeServers replacement
content = content.replace(
  /const currentEpisodeServers = episodes\.filter[\s\S]*?\);\n/s,
  `const currentEpisodeServers = currentEpisode.servers || [];\n`
);

// handleServerChange
content = content.replace(
  /const handleServerChange = \(epId: string\) => {[\s\S]*?};\n/,
  `const handleServerChange = (sIdx: number) => {
    setActiveServerIdx(sIdx);
    const newServer = currentEpisodeServers[sIdx];
    if (newServer) {
      if (newServer.serverType) localStorage.setItem('preferredServerType', newServer.serverType);
      if (newServer.serverName) localStorage.setItem('preferredServerName', newServer.serverName);
    }
  };\n`
);

// Also need to reset activeServerIdx when currentEpisode changes. Where is currentEpisode updated?
content = content.replace(
  /setCurrentEpisode\(firstEps\[0\]\);\n\s*}/,
  `setCurrentEpisode(firstEps[0]);
              setActiveServerIdx(0);
            }`
);
content = content.replace(
  /setCurrentEpisode\(targetEp\);\n\s*}/,
  `setCurrentEpisode(targetEp);
              setActiveServerIdx(0);
            }`
);

// In the iframe, we use embedLink
content = content.replace(
  /currentEpisode\.embedLink/g,
  `(currentEpisode.servers?.[activeServerIdx]?.embedLink || '')`
);

// Also update the serversOfType filter to pass index
content = content.replace(
  /\{serversOfType\.map\(serverEp => \([\s\S]*?\}\)/g,
  `{serversOfType.map((serverEp, i) => {
     // Find the actual index in currentEpisodeServers
     const actualIdx = currentEpisodeServers.findIndex(s => s === serverEp);
     return (
       <button
         key={actualIdx}
         onClick={() => handleServerChange(actualIdx)}
         className={clsx(
           "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all duration-200 border",
           activeServerIdx === actualIdx
             ? "bg-yoru-accent/10 text-yoru-accent border-yoru-accent shadow-[0_0_10px_rgba(244,117,33,0.1)]"
             : "bg-white/5 text-yoru-text-muted border-transparent hover:bg-white/10 hover:text-white"
         )}
       >
         {serverEp.serverName || 'HD-1'}
       </button>
     );
  })}`
);


fs.writeFileSync('src/pages/Watch.tsx', content);
