import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { FeedView } from './views/FeedView';
import { AlbumsView } from './views/AlbumsView';
import { MemoriesView } from './views/MemoriesView';
import { MembersView } from './views/MembersView';
import { ProfileView } from './views/ProfileView';
import { AnnouncementsView } from './views/AnnouncementsView';
import { AdminView } from './views/AdminView';
import { AuthView } from './views/AuthView';
import { store } from './services/store';
import { Profile } from './types/database';
import { 
  Home, Camera, Bookmark, Users, Megaphone, ShieldCheck, User 
} from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      if (search.includes('convite') || search.includes('invite') || search.includes('cadastro')) {
        return false;
      }
    }
    // Apenas autenticado se existir um perfil real ativo
    const user = store.getCurrentUser();
    return !!user;
  });
  const [currentUser, setCurrentUser] = useState<Profile | null>(store.getCurrentUser());
  const [currentTab, setCurrentTab] = useState<string>('feed');
  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>(undefined);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setCurrentUser(store.getCurrentUser());
    });
    return unsub;
  }, []);

  const handleOpenProfile = (memberId?: string) => {
    setSelectedProfileId(memberId || currentUser?.id);
    setCurrentTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (tab: string) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    store.setCurrentUser('');
    setIsAuthenticated(false);
  };

  const isDiretoria = currentUser?.role === 'diretoria';

  if (!isAuthenticated) {
    return (
      <>
        <AuthView
          onLoginSuccess={(initialTab = 'feed', memberId) => {
            setIsAuthenticated(true);
            const user = store.getCurrentUser();
            setCurrentUser(user);
            if (initialTab === 'profile') {
              setSelectedProfileId(memberId || user?.id);
              setCurrentTab('profile');
            } else {
              setCurrentTab(initialTab);
            }
          }}
          onOpenConfig={() => setIsConfigModalOpen(true)}
        />
        <SupabaseConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#1C1E21] flex flex-col selection:bg-[#1877F2] selection:text-white pb-16 lg:pb-0">
      
      {/* CABEÇALHO AZUL OFICIAL */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        onOpenProfile={handleOpenProfile}
        onLogout={handleLogout}
      />

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <main className="flex-1">
        {currentTab === 'feed' && (
          <FeedView
            currentUser={currentUser}
            onNavigateToProfile={handleOpenProfile}
            onNavigateToTab={handleNavigate}
          />
        )}

        {currentTab === 'albums' && (
          <AlbumsView
            currentUser={currentUser}
            onNavigateToProfile={handleOpenProfile}
          />
        )}

        {currentTab === 'recordacoes' && (
          <MemoriesView
            currentUser={currentUser}
            onNavigateToProfile={handleOpenProfile}
          />
        )}

        {currentTab === 'membros' && (
          <MembersView
            onNavigateToProfile={handleOpenProfile}
          />
        )}

        {currentTab === 'comunicados' && (
          <AnnouncementsView
            currentUser={currentUser}
          />
        )}

        {currentTab === 'admin' && (
          <AdminView
            currentUser={currentUser}
            onNavigateToProfile={handleOpenProfile}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            memberId={selectedProfileId}
            currentUser={currentUser}
            onNavigateToProfile={handleOpenProfile}
          />
        )}
      </main>

      {/* BARRA INFERIOR MOBILE FIXA PARA TELAS SENSÍVEIS AO TOQUE */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 z-30 flex items-center justify-around py-2 px-1 shadow-lg text-[10px] font-semibold text-neutral-600">
        <button
          onClick={() => handleNavigate('feed')}
          className={`flex flex-col items-center gap-0.5 p-1 ${currentTab === 'feed' ? 'text-[#1877F2] font-bold' : ''}`}
        >
          <Home className="w-5 h-5" />
          <span>Feed</span>
        </button>

        <button
          onClick={() => handleNavigate('albums')}
          className={`flex flex-col items-center gap-0.5 p-1 ${currentTab === 'albums' ? 'text-[#1877F2] font-bold' : ''}`}
        >
          <Camera className="w-5 h-5" />
          <span>Álbuns</span>
        </button>

        <button
          onClick={() => handleNavigate('recordacoes')}
          className={`flex flex-col items-center gap-0.5 p-1 ${currentTab === 'recordacoes' ? 'text-[#1877F2] font-bold' : ''}`}
        >
          <Bookmark className="w-5 h-5" />
          <span>Recordações</span>
        </button>

        <button
          onClick={() => handleNavigate('membros')}
          className={`flex flex-col items-center gap-0.5 p-1 ${currentTab === 'membros' ? 'text-[#1877F2] font-bold' : ''}`}
        >
          <Users className="w-5 h-5" />
          <span>Membros</span>
        </button>

        {isDiretoria && (
          <button
            onClick={() => handleNavigate('admin')}
            className={`flex flex-col items-center gap-0.5 p-1 ${currentTab === 'admin' ? 'text-[#1877F2] font-bold' : ''}`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Diretoria</span>
          </button>
        )}

        <button
          onClick={() => handleOpenProfile(currentUser?.id)}
          className={`flex flex-col items-center gap-0.5 p-1 ${currentTab === 'profile' ? 'text-[#1877F2] font-bold' : ''}`}
        >
          <User className="w-5 h-5" />
          <span>Perfil</span>
        </button>
      </nav>

      {/* MODAL GLOBAL DO SUPABASE CONFIG */}
      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />

    </div>
  );
}
