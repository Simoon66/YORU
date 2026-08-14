const fs = require('fs');
let content = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

const newEffect = `  useEffect(() => {
    if (currentEpisode && anime) {
      const markWatched = async () => {
        const newWatched = Array.from(new Set([...watchedEpisodes, currentEpisode.id]));
        setWatchedEpisodes(newWatched);
        
        // LocalStorage for Guests & Backup
        try {
          const history = JSON.parse(localStorage.getItem('yoru_watch_history') || '[]');
          const newHistoryItem = {
            animeId: anime.id,
            slug: anime.slug,
            title: anime.title,
            coverImage: anime.poster,
            backdrop: anime.backdrop,
            episodeNumber: currentEpisode.episodeNumber,
            updatedAt: Date.now()
          };
          const existingIdx = history.findIndex((h) => h.animeId === anime.id);
          if (existingIdx !== -1) history.splice(existingIdx, 1);
          history.unshift(newHistoryItem);
          localStorage.setItem('yoru_watch_history', JSON.stringify(history.slice(0, 10)));
        } catch (e) {
          console.error("Local storage save error", e);
        }

        // Firestore for Logged-In Users
        if (user) {
          const progressRef = doc(db, 'watchProgress', \`\${user.uid}_\${anime.id}\`);
          await setDoc(progressRef, {
            userId: user.uid,
            animeId: anime.id,
            watchedEpisodeIds: newWatched,
            lastWatchedEpisode: currentEpisode.id,
            updatedAt: Date.now()
          }, { merge: true });
        }
      };
      
      const timer = setTimeout(markWatched, 5000); // 5 seconds for faster testing (usually 30s)
      return () => clearTimeout(timer);
    }
  }, [currentEpisode, user, anime]);`;

content = content.replace(
  /  useEffect\(\(\) => \{\n    if \(currentEpisode && user && anime\) \{\n      const markWatched = async \(\) => \{[\s\S]*?return \(\) => clearTimeout\(timer\);\n    \}\n  \}, \[currentEpisode, user, anime\]\);/,
  newEffect
);

fs.writeFileSync('src/pages/Watch.tsx', content);
