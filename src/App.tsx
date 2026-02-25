import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { MegaMenu } from './components/navigation/MegaMenu';
import { CalendarPage } from './pages/CalendarPage';
import { OrganizerPage } from './pages/OrganizerPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  const [currentView, setCurrentView] = useState<'calendar' | 'organizer' | 'admin' | 'settings'>('calendar');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const handleGenreSelect = (genreId: string) => {
    setSelectedGenre(genreId);
    setCurrentView('calendar');
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <MegaMenu
          onGenreSelect={handleGenreSelect}
          onViewChange={setCurrentView}
          currentView={currentView}
        />

        {currentView === 'calendar' && <CalendarPage selectedGenre={selectedGenre} onClearGenre={() => setSelectedGenre(null)} />}
        {currentView === 'organizer' && <OrganizerPage />}
        {currentView === 'admin' && <AdminPage />}
        {currentView === 'settings' && <SettingsPage />}
      </div>
    </AuthProvider>
  );
}

export default App;
