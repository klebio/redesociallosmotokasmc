import React, { useState, useEffect } from 'react';
import { 
  Bell, Shield, User, LogOut, Settings, 
  Database, Flame, ChevronDown, Check, Menu, X, UserPlus,
  Home, Camera, Bookmark, Users, Megaphone, ShieldCheck 
} from 'lucide-react';
import { store } from '../services/store';
import { isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../types/database';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenConfig: () => void;
  onOpenProfile: (memberId?: string) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  onOpenConfig,
  onOpenProfile,
  onLogout,
}) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(store.getCurrentUser());
  const [allMembers, setAllMembers] = useState<Profile[]>(store.getMembers());
  const [notifications, setNotifications] = useState(store.getNotifications());
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isConfigured, setIsConfigured] = useState(isSupabaseConfigured());
  const [copiedInvite, setCopiedInvite] = useState(false);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setCurrentUser(store.getCurrentUser());
      setAllMembers(store.getMembers());
      setNotifications(store.getNotifications());
      setIsConfigured(isSupabaseConfigured());
    });
    return unsub;
  }, []);

  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const isDiretoria = store.isDiretoria(currentUser);

  const navLinks = [
    { id: 'feed', label: 'Feed da Irmandade' },
    { id: 'albums', label: 'Álbuns & Galerias' },
    { id: 'recordacoes', label: 'Minhas Recordações' },
    { id: 'membros', label: 'Membros' },
    { id: 'comunicados', label: 'Comunicados' },
    ...(isDiretoria ? [{ id: 'admin', label: 'Diretoria' }] : []),
  ];

  const handleSwitchUser = (memberId: string) => {
    store.setCurrentUser(memberId);
    setShowUserDropdown(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1877F2] text-white shadow-sm border-b border-[#1466d1] w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2 sm:gap-4 md:gap-8 w-full max-w-full">
        
        {/* ZONA 1: MARCA & ESCUDO */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => onNavigate('feed')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-full bg-white/10 p-0.5 border border-white/20 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:scale-105 transition-transform">
              <img 
                src="/src/assets/images/escudo_oficial.jpg" 
                alt="Escudo Oficial Los Motokas MC Mossoró RN" 
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-lg leading-tight uppercase block font-['Plus_Jakarta_Sans']">
                Los Motokas MC
              </span>
              <span className="text-[10px] tracking-widest uppercase text-blue-100 font-semibold block leading-none">
                Mossoró · RN · Nossa História
              </span>
            </div>
          </button>
        </div>

        {/* ZONA 2: LINKS DE NAVEGAÇÃO */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => {
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`px-3 py-1.5 text-xs xl:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  isActive 
                    ? 'bg-white text-[#1877F2] shadow-sm' 
                    : 'text-white/90 hover:bg-white/15 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* ZONA 3: AÇÕES, STATUS DO SUPABASE, NOTIFICAÇÕES & CONTA */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* BOTÃO ASSISTENTE SUPABASE */}
          <button
            onClick={onOpenConfig}
            title={isConfigured ? 'Supabase Conectado' : 'Configurar Conexão Supabase'}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors border ${
              isConfigured
                ? 'bg-emerald-500/20 border-emerald-300/40 text-emerald-100 hover:bg-emerald-500/30'
                : 'bg-amber-500/20 border-amber-300/40 text-amber-100 hover:bg-amber-500/30'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isConfigured ? 'Supabase Ativo' : 'Conectar Supabase'}
            </span>
          </button>

          {/* SINO DE NOTIFICAÇÕES */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                setShowUserDropdown(false);
              }}
              className="p-2 rounded-full hover:bg-white/15 transition-colors relative text-white focus:outline-none"
              title="Notificações da Irmandade"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#1877F2]">
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* DROPDOWN DE NOTIFICAÇÕES */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-24px)] bg-white rounded-lg shadow-xl border border-neutral-200 text-[#1C1E21] py-2 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-neutral-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Notificações
                  </span>
                  <button 
                    onClick={() => store.markAllNotificationsAsRead()}
                    className="text-xs text-[#1877F2] font-semibold hover:underline"
                  >
                    Marcar todas lidas
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-neutral-500">
                      Nenhuma notificação por enquanto.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        onClick={() => store.markNotificationAsRead(notif.id)}
                        className={`p-3 text-xs hover:bg-neutral-50 cursor-pointer flex gap-2.5 items-start ${!notif.read ? 'bg-blue-50/50' : ''}`}
                      >
                        <div className="w-2 h-2 rounded-full bg-[#1877F2] mt-1 shrink-0" style={{ opacity: notif.read ? 0 : 1 }} />
                        <div>
                          <p className="font-medium text-neutral-800">{notif.message}</p>
                          <span className="text-[10px] text-neutral-400">
                            {new Date(notif.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* MENU DO USUÁRIO & TROCA DE MEMBRO (PARA TESTES RÁPIDOS) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserDropdown(!showUserDropdown);
                setShowNotifDropdown(false);
              }}
              className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-white/15 transition-colors focus:outline-none"
            >
              <img
                src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                alt={currentUser?.nickname || 'Membro'}
                className="w-8 h-8 rounded-full object-cover border border-white/40"
              />
              <span className="hidden md:inline text-xs font-bold">
                {currentUser?.nickname || 'Irmão'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {/* DROPDOWN DE CONTA & PERFIL */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-24px)] bg-white rounded-lg shadow-xl border border-neutral-200 text-[#1C1E21] py-2 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-3 py-2 border-b border-neutral-100 flex items-center gap-3">
                  <img
                    src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                    alt={currentUser?.nickname}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-neutral-900 leading-tight">
                      {currentUser?.nickname} ({currentUser?.full_name})
                    </h4>
                    <p className="text-xs text-neutral-500 capitalize">
                      Patente: <span className="font-semibold text-[#1877F2]">{currentUser?.role}</span>
                    </p>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      onOpenProfile(currentUser?.id);
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 flex items-center gap-2.5"
                  >
                    <User className="w-4 h-4 text-neutral-500" />
                    Ver Meu Perfil Completo
                  </button>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}${window.location.pathname}?convite=losmotokas`;
                      navigator.clipboard.writeText(url);
                      setCopiedInvite(true);
                      setTimeout(() => setCopiedInvite(false), 2500);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-[#1877F2] hover:bg-blue-50 flex items-center justify-between gap-2.5"
                  >
                    <span className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-[#1877F2]" />
                      <span>Copiar Link de Convite (Novo Membro)</span>
                    </span>
                    {copiedInvite && <span className="text-[10px] bg-blue-100 text-[#1877F2] px-1.5 py-0.5 rounded font-bold">Copiado!</span>}
                  </button>
                  <button
                    onClick={() => {
                      onOpenConfig();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 flex items-center gap-2.5"
                  >
                    <Database className="w-4 h-4 text-neutral-500" />
                    Conexão Supabase & SQL
                  </button>
                </div>

                {allMembers.length > 1 && (
                  <div className="border-t border-neutral-100 pt-2 pb-1">
                    <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                      Membros Reais Registrados ({allMembers.length}):
                    </span>
                    <div className="max-h-36 overflow-y-auto">
                      {allMembers.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => handleSwitchUser(m.id)}
                          className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-neutral-50 ${
                            m.id === currentUser?.id ? 'bg-blue-50/70 font-bold text-[#1877F2]' : 'text-neutral-600'
                          }`}
                        >
                          <span className="truncate">
                            {m.nickname} <span className="text-[10px] text-neutral-400 capitalize">({m.role})</span>
                          </span>
                          {m.id === currentUser?.id && <Check className="w-3.5 h-3.5 text-[#1877F2]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-neutral-100 pt-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    Sair da Irmandade
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* BOTÃO DOS TRÊS TRAÇOS (☰) VISÍVEL EM CELULAR, TABLETE E COMPUTADOR */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-white/15 text-white focus:outline-none flex items-center gap-1.5 cursor-pointer transition-colors"
            aria-label="Menu Principal da Irmandade (☰)"
            title="Menu Principal da Irmandade (☰)"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            <span className="hidden sm:inline text-xs font-bold">Menu</span>
          </button>
        </div>
      </div>

      {/* MENU DOS TRÊS TRAÇOS EXPANSÍVEL (PARA CELULAR, TABLETE E COMPUTADOR) */}
      {mobileMenuOpen && (
        <div className="bg-[#1565C0] border-t border-blue-400/30 px-4 py-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="max-w-7xl mx-auto space-y-3">
            
            {/* INFORMAÇÃO DO USUÁRIO LOGADO */}
            <div className="flex items-center justify-between pb-2 border-b border-blue-400/30">
              <div className="flex items-center gap-2.5">
                <img
                  src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                  alt={currentUser?.nickname || 'Membro'}
                  className="w-9 h-9 rounded-full object-cover border border-white/50"
                />
                <div>
                  <span className="font-bold text-sm text-white block leading-tight">
                    {currentUser?.nickname || 'Irmão'} ({currentUser?.full_name})
                  </span>
                  <span className="text-[11px] text-blue-200 capitalize">
                    Patente: <strong className="text-white">{currentUser?.role || 'Membro'}</strong>
                  </span>
                </div>
              </div>

              <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded font-mono font-bold">
                Los Motokas MC
              </span>
            </div>

            {/* ITENS DE NAVEGAÇÃO PRINCIPAL COM ÍCONES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 text-sm">
              <button
                onClick={() => {
                  onNavigate('feed');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-semibold transition-colors text-left ${
                  currentTab === 'feed' ? 'bg-white text-[#1877F2]' : 'text-white hover:bg-white/10'
                }`}
              >
                <Home className="w-4 h-4 shrink-0" />
                <span>Feed da Irmandade</span>
              </button>

              <button
                onClick={() => {
                  onNavigate('albums');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-semibold transition-colors text-left ${
                  currentTab === 'albums' ? 'bg-white text-[#1877F2]' : 'text-white hover:bg-white/10'
                }`}
              >
                <Camera className="w-4 h-4 shrink-0" />
                <span>Álbuns & Galerias</span>
              </button>

              <button
                onClick={() => {
                  onNavigate('recordacoes');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-semibold transition-colors text-left ${
                  currentTab === 'recordacoes' ? 'bg-white text-[#1877F2]' : 'text-white hover:bg-white/10'
                }`}
              >
                <Bookmark className="w-4 h-4 shrink-0" />
                <span>Minhas Recordações</span>
              </button>

              <button
                onClick={() => {
                  onNavigate('membros');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-semibold transition-colors text-left ${
                  currentTab === 'membros' ? 'bg-white text-[#1877F2]' : 'text-white hover:bg-white/10'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Quadro de Membros</span>
              </button>

              <button
                onClick={() => {
                  onNavigate('comunicados');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-semibold transition-colors text-left ${
                  currentTab === 'comunicados' ? 'bg-white text-[#1877F2]' : 'text-white hover:bg-white/10'
                }`}
              >
                <Megaphone className="w-4 h-4 shrink-0" />
                <span>Comunicados Oficiais</span>
              </button>

              {isDiretoria && (
                <button
                  onClick={() => {
                    onNavigate('admin');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-bold transition-colors text-left ${
                    currentTab === 'admin' ? 'bg-amber-400 text-neutral-900 shadow-sm' : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0 text-amber-300" />
                  <span>Gabinete da Diretoria</span>
                  <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded font-mono ml-auto">ADMIN</span>
                </button>
              )}
            </div>

            {/* AÇÕES DE PERFIL E SISTEMA */}
            <div className="pt-2 border-t border-blue-400/30 flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => {
                  onOpenProfile(currentUser?.id);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 flex-1 min-w-[120px] py-2 px-3 bg-white/15 hover:bg-white/25 text-white rounded-lg font-semibold transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Meu Perfil</span>
              </button>

              <button
                onClick={() => {
                  const url = `${window.location.origin}${window.location.pathname}?convite=losmotokas`;
                  navigator.clipboard.writeText(url);
                  setCopiedInvite(true);
                  setTimeout(() => setCopiedInvite(false), 2500);
                }}
                className="flex items-center justify-center gap-1.5 flex-1 min-w-[140px] py-2 px-3 bg-white/15 hover:bg-white/25 text-white rounded-lg font-semibold transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{copiedInvite ? 'Link Copiado!' : 'Link de Convite'}</span>
              </button>

              <button
                onClick={() => {
                  onOpenConfig();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 flex-1 min-w-[130px] py-2 px-3 bg-white/15 hover:bg-white/25 text-white rounded-lg font-semibold transition-colors cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Banco Supabase</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="flex items-center justify-center gap-1.5 flex-1 min-w-[90px] py-2 px-3 bg-red-600/80 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </header>
  );
};
