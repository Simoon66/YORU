import fs from 'fs';

let content = fs.readFileSync('src/pages/Admin/AutoImport.tsx', 'utf-8');

// First replace the verification logs
content = content.replace(
  /if \(servers\.aniSub\) addLog\(\`✓ AniList Sub server verified\`, 'success'\);/,
  "if (servers.aniSub) addLog(`✓ HD-1 (Sub) server verified`, 'success');"
);
content = content.replace(
  /if \(servers\.aniDub\) addLog\(\`✓ AniList Dub server verified\`, 'success'\);/,
  "if (servers.aniDub) addLog(`✓ HD-1 (Dub) server verified`, 'success');"
);
content = content.replace(
  /if \(servers\.malSub\) addLog\(\`✓ MAL Sub server verified\`, 'success'\);/,
  "if (servers.malSub) addLog(`✓ HD-2 (Sub) server verified`, 'success');"
);
content = content.replace(
  /if \(servers\.malDub\) addLog\(\`✓ MAL Dub server verified\`, 'success'\);/,
  "if (servers.malDub) addLog(`✓ HD-2 (Dub) server verified`, 'success');"
);

const oldLogic = `          // Get existing episodes to prevent duplicates
          const epQuery = query(collection(db, 'episodes'), where('animeId', '==', animeId), where('seasonId', '==', currentSeasonId));
          const existingEpsSnap = await getDocs(epQuery);
          // existingEpMap: key is "epNum-serverName"
          const existingEpMap = new Set(existingEpsSnap.docs.map(d => \`\${d.data().episodeNumber}-\${d.data().serverName}\`));

          for (let epNum = 1; epNum <= totalEpisodes; epNum++) {
            const availableLinks = [];
            
            if (servers.aniSub) availableLinks.push({ link: \`https://megaplay.buzz/stream/ani/\${aniId}/\${epNum}/sub\`, server: 'AniList Sub' });
            if (servers.malSub) availableLinks.push({ link: \`https://megaplay.buzz/stream/mal/\${meta.idMal}/\${epNum}/sub\`, server: 'MAL Sub' });
            if (servers.aniDub) availableLinks.push({ link: \`https://megaplay.buzz/stream/ani/\${aniId}/\${epNum}/dub\`, server: 'AniList Dub' });
            if (servers.malDub) availableLinks.push({ link: \`https://megaplay.buzz/stream/mal/\${meta.idMal}/\${epNum}/dub\`, server: 'MAL Dub' });

            for (const serverItem of availableLinks) {
              const epKey = \`\${epNum}-\${serverItem.server}\`;
              if (existingEpMap.has(epKey)) continue; // Skip if this exact server for this ep already exists

              const epDocRef = doc(collection(db, 'episodes'));
              
              const isFiller = fillerSet.has(epNum);

              const newEp: Episode = {
                id: epDocRef.id,
                animeId: animeId,
                seasonId: currentSeasonId,
                episodeNumber: epNum,
                title: \`Episode \${epNum}\`,
                embedLink: serverItem.link,
                serverName: serverItem.server,
                thumbnailUrl: meta.coverImage?.large || '',
                isFiller: isFiller,
                createdAt: Date.now(),
                published: true
              };
              await setDoc(epDocRef, newEp);
              addedEps++;
            }
          }`;

const newLogic = `          // Get existing episodes to prevent duplicates
          const epQuery = query(collection(db, 'episodes'), where('animeId', '==', animeId), where('seasonId', '==', currentSeasonId));
          const existingEpsSnap = await getDocs(epQuery);
          
          const existingEpsMap = new Map();
          existingEpsSnap.docs.forEach(d => {
             existingEpsMap.set(d.data().episodeNumber, { ...d.data(), id: d.id });
          });

          for (let epNum = 1; epNum <= totalEpisodes; epNum++) {
            const availableServers = [];
            
            if (servers.aniSub) availableServers.push({ serverName: 'HD-1', serverType: 'sub', embedLink: \`https://megaplay.buzz/stream/ani/\${aniId}/\${epNum}/sub\` });
            if (servers.aniDub) availableServers.push({ serverName: 'HD-1', serverType: 'dub', embedLink: \`https://megaplay.buzz/stream/ani/\${aniId}/\${epNum}/dub\` });
            if (servers.malSub) availableServers.push({ serverName: 'HD-2', serverType: 'sub', embedLink: \`https://megaplay.buzz/stream/mal/\${meta.idMal}/\${epNum}/sub\` });
            if (servers.malDub) availableServers.push({ serverName: 'HD-2', serverType: 'dub', embedLink: \`https://megaplay.buzz/stream/mal/\${meta.idMal}/\${epNum}/dub\` });

            if (availableServers.length === 0) continue;

            const existingEp = existingEpsMap.get(epNum);
            const epDocId = existingEp ? existingEp.id : \`\${animeId}_\${currentSeasonId}_\${epNum}\`;
            const epDocRef = doc(db, 'episodes', epDocId);
            
            const isFiller = fillerSet.has(epNum);
            
            if (existingEp) {
               let updated = false;
               const currentServers = Array.isArray(existingEp.servers) ? [...existingEp.servers] : [];
               
               for (const newSrv of availableServers) {
                  const exists = currentServers.some(s => s.serverName === newSrv.serverName && s.serverType === newSrv.serverType);
                  if (!exists) {
                     currentServers.push(newSrv);
                     updated = true;
                  }
               }
               
               if (updated) {
                  // We can't easily import updateDoc here without making sure it's at the top. Let's use setDoc with merge: true
                  await setDoc(epDocRef, { servers: currentServers }, { merge: true });
                  addedEps++;
               }
            } else {
               const newEp = {
                  id: epDocId,
                  animeId: animeId,
                  seasonId: currentSeasonId,
                  episodeNumber: epNum,
                  title: \`Episode \${epNum}\`,
                  servers: availableServers,
                  thumbnailUrl: meta.coverImage?.large || '',
                  isFiller: isFiller,
                  createdAt: Date.now(),
                  published: true
               };
               await setDoc(epDocRef, newEp);
               addedEps++;
            }
          }`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync('src/pages/Admin/AutoImport.tsx', content);
