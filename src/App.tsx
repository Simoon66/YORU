import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { AnimeDetail } from './pages/AnimeDetail';
import { Watch } from './pages/Watch';
import { Search } from './pages/Search';
import { Watchlist } from './pages/Watchlist';
import { DownloadsPage, SettingsPage } from './pages/Placeholders';
import { ProfilePage } from './pages/Profile';
import { AdminLayout } from './pages/Admin/AdminLayout';
import { Dashboard } from './pages/Admin/Dashboard';
import { AnimeList } from './pages/Admin/AnimeList';
import { AnimeEditor } from './pages/Admin/AnimeEditor';
import { EpisodeManager } from './pages/Admin/EpisodeManager';
import { AutoImport } from './pages/Admin/AutoImport';
import { SpotlightManager } from './pages/Admin/SpotlightManager';
import ScrollToTop from './components/ScrollToTop';

function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Search />} />
          <Route path="/genres" element={<Search />} />
          <Route path="/search" element={<Search />} />
          <Route path="/anime/:slug" element={<AnimeDetail />} />
          <Route path="/watch/:slug" element={<Watch />} />
          <Route path="/watch/:slug/:episodeNum" element={<Watch />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/downloads" element={<DownloadsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/user/:userId" element={<ProfilePage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public App */}
          <Route path="/*" element={<AppLayout />} />
          
          {/* Admin App */}
          <Route path="/admin" element={<AdminLayout />}>
             <Route index element={<Dashboard />} />
             <Route path="spotlights" element={<SpotlightManager />} />
             <Route path="anime" element={<AnimeList />} />
             <Route path="anime/new" element={<AnimeEditor />} />
             <Route path="auto-import" element={<AutoImport />} />
             <Route path="anime/:id/edit" element={<AnimeEditor />} />
             <Route path="anime/:id/episodes" element={<EpisodeManager />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
