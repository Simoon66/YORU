const fs = require('fs');

let content = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

content = content.replace(
  '          if (matchingEps.length > 0) {\n            setCurrentEpisode(matchingEps[0]);\n          }',
  `          if (matchingEps.length > 0) {
            const savedType = localStorage.getItem('preferredServerType') || 'sub';
            const savedName = localStorage.getItem('preferredServerName') || 'HD-1';
            
            let selectedEp = matchingEps.find(e => (e.serverType || 'sub') === savedType && e.serverName === savedName);
            
            if (!selectedEp) {
              selectedEp = matchingEps.find(e => (e.serverType || 'sub') === savedType);
            }
            
            if (!selectedEp) {
              selectedEp = matchingEps[0];
            }
            
            setCurrentEpisode(selectedEp);
          }`
);

content = content.replace(
  '  const handleServerChange = (epId: string) => {\n    const newEp = currentEpisodeServers.find(ep => ep.id === epId);\n    if (newEp) setCurrentEpisode(newEp);\n  };',
  `  const handleServerChange = (epId: string) => {
    const newEp = currentEpisodeServers.find(ep => ep.id === epId);
    if (newEp) {
      setCurrentEpisode(newEp);
      if (newEp.serverType) localStorage.setItem('preferredServerType', newEp.serverType);
      if (newEp.serverName) localStorage.setItem('preferredServerName', newEp.serverName);
    }
  };`
);

fs.writeFileSync('src/pages/Watch.tsx', content);
