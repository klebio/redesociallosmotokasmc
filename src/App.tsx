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
  Home, Camera, Bookmark, Users, Megaphone, ShieldCheck, User, Settings, X 
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
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);

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

  const isDiretoria = store.isDiretoria(currentUser);

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
    <div className="min-h-screen bg-[#F0F2F5] text-[#1C1E21] flex flex-col selection:bg-[#1877F2] selection:text-white pb-16 lg:pb-0 w-full">
      
      {/* CABEÇALHO AZUL OFICIAL */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        onOpenProfile={handleOpenProfile}
        onLogout={handleLogout}
      />

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <main className="flex-1 w-full">
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
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 z-30 flex items-center justify-around py-2 px-1 shadow-lg text-[10px] font-semibold text-neutral-600 w-full max-w-full overflow-hidden">
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
          <span>Galeria</span>
        </button>

        <button
          onClick={() => handleNavigate('recordacoes')}
          className={`flex flex-col items-center gap-0.5 p-1 ${currentTab === 'recordacoes' ? 'text-[#1877F2] font-bold' : ''}`}
        >
          <Bookmark className="w-5 h-5" />
          <span>Recordações</span>
        </button>

        {/* BOTÃO COM ÍCONE DE ENGRENAGEM: GESTÃO (MEMBROS, COMUNICADOS, DIRETORIA) */}
        <button
          onClick={() => setIsMobileSettingsOpen(true)}
          className={`flex flex-col items-center gap-0.5 p-1 ${['membros', 'comunicados', 'admin'].includes(currentTab) ? 'text-[#1877F2] font-bold' : ''}`}
        >
          <Settings className="w-5 h-5" />
          <span>Gestão</span>
        </button>

        <button
          onClick={() => handleOpenProfile(currentUser?.id)}
          className={`flex flex-col items-center gap-0.5 p-1 ${currentTab === 'profile' ? 'text-[#1877F2] font-bold' : ''}`}
        >
          <User className="w-5 h-5" />
          <span>Perfil</span>
        </button>
      </nav>

      {/* MODAL BOTTOM-SHEET DA ENGRENAGEM (MEMBROS, COMUNICADOS, DIRETORIA) */}
      {isMobileSettingsOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl shadow-2xl border-t border-neutral-200 p-5 space-y-3 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-[#1877F2]">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-neutral-900 font-['Plus_Jakarta_Sans']">
                    Gestão da Irmandade
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Membros, comunicados e diretoria
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileSettingsOpen(false)}
                className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 pt-1">
              {/* 1. MEMBROS */}
              <button
                onClick={() => {
                  handleNavigate('membros');
                  setIsMobileSettingsOpen(false);
                }}
                className={`w-full p-3 rounded-xl flex items-center justify-between transition-colors border text-left cursor-pointer ${
                  currentTab === 'membros' ? 'bg-blue-50 border-blue-200 text-[#1877F2]' : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200/80 text-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block text-neutral-900">Membros da Irmandade</span>
                    <span className="text-[11px] text-neutral-500">Quadro oficial, coletes e motos</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#1877F2]">Acessar →</span>
              </button>

              {/* 2. COMUNICADOS */}
              <button
                onClick={() => {
                  handleNavigate('comunicados');
                  setIsMobileSettingsOpen(false);
                }}
                className={`w-full p-3 rounded-xl flex items-center justify-between transition-colors border text-left cursor-pointer ${
                  currentTab === 'comunicados' ? 'bg-blue-50 border-blue-200 text-[#1877F2]' : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200/80 text-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 text-red-700 shrink-0">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block text-neutral-900">Comunicados Oficiais</span>
                    <span className="text-[11px] text-neutral-500">Editais e informativos da diretoria</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#1877F2]">Acessar →</span>
              </button>

              {/* 3. DIRETORIA */}
              {isDiretoria && (
                <button
                  onClick={() => {
                    handleNavigate('admin');
                    setIsMobileSettingsOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl flex items-center justify-between transition-colors border text-left cursor-pointer ${
                    currentTab === 'admin' ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-amber-50 hover:bg-amber-100/70 border-amber-200 text-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-200 text-amber-900 shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs block text-neutral-900">Gabinete da Diretoria</span>
                        <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded font-bold">ADMIN</span>
                      </div>
                      <span className="text-[11px] text-neutral-600">Gestão de membros e patentes</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-900">Painel →</span>
                </button>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsMobileSettingsOpen(false)}
                className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GLOBAL DO SUPABASE CONFIG */}
      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />

    </div>
  );
}
