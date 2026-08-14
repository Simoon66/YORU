const fs = require('fs');
let content = fs.readFileSync('src/lib/data.ts', 'utf8');

const historyFunc = `
export interface HistoryItem {
  animeId: string;
  slug: string;
  title: string;
  coverImage: string;
  backdrop: string;
  episodeNumber: number;
  updatedAt: number;
}

export async function getWatchHistory(userId: string): Promise<HistoryItem[]> {
  try {
    const q = query(
      collection(db, 'watchProgress'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const progressList = snap.docs.map(d => d.data());
    progressList.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    
    // Take top 4
    const top4 = progressList.slice(0, 4);
    
    const historyItems: HistoryItem[] = [];
    for (const prog of top4) {
      const animeSnap = await getDoc(doc(db, 'anime', prog.animeId));
      if (!animeSnap.exists()) continue;
      const animeData = animeSnap.data();
      
      let epNumber = 1;
      if (prog.lastWatchedEpisode) {
        const epSnap = await getDoc(doc(db, 'episodes', prog.lastWatchedEpisode));
        if (epSnap.exists()) {
          epNumber = epSnap.data().episodeNumber;
        }
      }
      
      historyItems.push({
        animeId: prog.animeId,
        slug: animeData.slug,
        title: animeData.title,
        coverImage: animeData.poster,
        backdrop: animeData.backdrop,
        episodeNumber: epNumber,
        updatedAt: prog.updatedAt || 0
      });
    }
    return historyItems;
  } catch(e) {
    console.error("Failed to fetch watch history:", e);
    return [];
  }
}
`;

content += '\n' + historyFunc;
fs.writeFileSync('src/lib/data.ts', content);
