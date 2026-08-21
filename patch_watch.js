import fs from 'fs';

let content = fs.readFileSync('src/pages/Watch.tsx', 'utf-8');

const oldLogic = `          // Find current episode
          if (targetEpisodeNum) {
            const matchingEps = allEps.filter(e => 
              e.episodeNumber === targetEpisodeNum && 
              e.seasonId === targetSeasonId
            );
            
            if (matchingEps.length > 0) {
              const savedType = localStorage.getItem('preferredServerType') || 'sub';
              const savedName = localStorage.getItem('preferredServerName') || 'HD-1';
              
              let selectedEp = matchingEps.find(e => (e.serverType || 'sub') === savedType && e.serverName === savedName);
              if (!selectedEp) selectedEp = matchingEps.find(e => (e.serverType || 'sub') === savedType);
              if (!selectedEp) selectedEp = matchingEps[0];
              
              setCurrentEpisode(selectedEp);
            }
          }`;

const newLogic = `          // Find current episode
          if (targetEpisodeNum) {
            const matchingEps = allEps.filter(e => 
              e.episodeNumber === targetEpisodeNum && 
              e.seasonId === targetSeasonId
            );
            
            if (matchingEps.length > 0) {
              let selectedEp = matchingEps[0];
              setCurrentEpisode(selectedEp);
              
              const savedType = localStorage.getItem('preferredServerType') || 'sub';
              const savedName = localStorage.getItem('preferredServerName') || 'HD-1';
              
              if (selectedEp.servers && selectedEp.servers.length > 0) {
                  let sIdx = selectedEp.servers.findIndex(s => (s.serverType || 'sub') === savedType && s.serverName === savedName);
                  if (sIdx === -1) sIdx = selectedEp.servers.findIndex(s => (s.serverType || 'sub') === savedType);
                  if (sIdx === -1) sIdx = 0;
                  setActiveServerIdx(sIdx);
              } else {
                  setActiveServerIdx(0);
              }
            }
          }`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync('src/pages/Watch.tsx', content);
