const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

if (!content.includes('useAuth')) {
  content = content.replace(
    "import { Link } from 'react-router-dom';",
    "import { Link } from 'react-router-dom';\nimport { useAuth } from '../contexts/AuthContext';"
  );
}

if (!content.includes('getWatchHistory')) {
  content = content.replace(
    "import { getTrendingAnime, getAllAnime } from '../lib/data';",
    "import { getTrendingAnime, getAllAnime, getWatchHistory } from '../lib/data';"
  );
}

const replacer = `export const Home = () => {
  const { user } = useAuth();
  const [trending, setTrending] = useState<Anime[]>([]);
  const [latest, setLatest] = useState<Anime[]>([]);
  const [watchHistory, setWatchHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [trendingData, allData] = await Promise.all([
        getTrendingAnime(),
        getAllAnime()
      ]);
      setTrending(trendingData);
      setLatest(allData); // In a real app, this would be a separate query sorting by createdAt
      
      try {
        if (user) {
          const h = await getWatchHistory(user.uid);
          setWatchHistory(h as any);
        } else {
          const history = localStorage.getItem('yoru_watch_history');
          if (history) setWatchHistory(JSON.parse(history).slice(0, 4));
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
      
      setIsLoading(false);
    }
    loadData();
  }, [user]);`;

content = content.replace(
  /export const Home = \(\) => \{[\s\S]*?loadData\(\);\n  \}, \[\]\);/,
  replacer
);

fs.writeFileSync('src/pages/Home.tsx', content);
