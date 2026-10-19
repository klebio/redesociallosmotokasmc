import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, Shield, User, LogOut, Settings, 
  Database, Flame, ChevronDown, Check, Menu, X, UserPlus,
  Home, Camera, Bookmark, Users, Megaphone, ShieldCheck, Upload, Share2
} from 'lucide-react';
import { store } from '../services/store';
import { Profile, Notification } from '../types/database';
import { getInviteUrl, getWhatsAppInviteUrl } from '../lib/invite';

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
  const [notifications, setNotifications] = useState<Notification[]>(store.getNotifications());
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // ESTADO DO EMBLEMA OFICIAL (UPLOAD DO PC)
  const [officialEmblem, setOfficialEmblem] = useState<string>(store.getOfficialEmblem());
  const [showEmblemModal, setShowEmblemModal] = useState(false);
  const [newEmblemPreview, setNewEmblemPreview] = useState<string | null>(null);
  const [isGifFile, setIsGifFile] = useState(false);
  const [emblemToast, setEmblemToast] = useState<string | null>(null);
  const emblemInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setCurrentUser(store.getCurrentUser());
      setAllMembers(store.getMembers());
      setNotifications(store.getNotifications());
      setOfficialEmblem(store.getOfficialEmblem());
    });
    return unsub;
  }, []);

  const handleEmblemFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Detecta se o arquivo é um GIF animado
    const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
    setIsGifFile(isGif);

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) return;

      // CRUCIAL: Se for um GIF ANIMADO, NUNCA passar pelo canvas!
      // O canvas dos navegadores congela GIFs em 1 frame estático.
      // Lendo diretamente pelo FileReader, todos os frames, transparências e a animação do GIF são mantidos 100%!
      if (isGif) {
        setNewEmblemPreview(src);
        setShowEmblemModal(true);
        return;
      }

      // Se for JPG/PNG/WEBP estático, redimensiona via canvas para otimização
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 600;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setNewEmblemPreview(optimizedDataUrl);
        } else {
          setNewEmblemPreview(src);
        }
        setShowEmblemModal(true);
      };
      img.onerror = () => {
        setNewEmblemPreview(src);
        setShowEmblemModal(true);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveEmblem = () => {
    if (newEmblemPreview) {
      store.setOfficialEmblem(newEmblemPreview);
      setOfficialEmblem(newEmblemPreview);
      setShowEmblemModal(false);
      setNewEmblemPreview(null);
      setEmblemToast(
        isGifFile 
          ? 'Emblema Oficial em GIF Animado salvo e sincronizado no Firebase Firestore!' 
          : 'Emblema oficial atualizado e salvo no Firebase Firestore com sucesso!'
      );
      setTimeout(() => setEmblemToast(null), 4000);
    }
  };

  const handleResetEmblem = () => {
    store.resetOfficialEmblem();
    setOfficialEmblem(store.getOfficialEmblem());
    setShowEmblemModal(false);
    setNewEmblemPreview(null);
    setEmblemToast('Emblema oficial restaurado para o padrão.');
    setTimeout(() => setEmblemToast(null), 4000);
  };

  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const isDiretoria = store.isDiretoria(currentUser);

  // Links primários diretos na barra (nomenclaturas enxutas e organizadas)
  const primaryNavLinks = [
    { id: 'feed', label: 'Feed' },
    { id: 'albums', label: 'Galeria' },
    { id: 'recordacoes', label: 'Recordações' },
  ];

  const handleSwitchUser = (memberId: string) => {
    store.setCurrentUser(memberId);
    setShowUserDropdown(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1877F2] text-white shadow-sm border-b border-[#1466d1] w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2 sm:gap-4 md:gap-8 w-full max-w-full">
        
        {/* ZONA 1: MARCA & ESCUDO OFICIAL COM UPLOAD DO COMPUTADOR */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <input 
            type="file" 
            ref={emblemInputRef} 
            accept="image/*,image/gif,.gif" 
            className="hidden" 
            onChange={handleEmblemFileChange} 
          />

          {/* BOTÃO/ESCUDO COM UPLOAD DIRETO IGUAL FOTO DE PERFIL */}
          <div className="relative group shrink-0">
            <button 
              type="button"
              onClick={() => emblemInputRef.current?.click()}
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 p-0.5 border-2 border-white/40 hover:border-white flex items-center justify-center overflow-hidden shrink-0 shadow-md group cursor-pointer focus:outline-none transition-all"
              title="Clique para enviar ou trocar o emblema oficial do seu PC"
            >
              <img 
                src={officialEmblem || '/escudo_oficial.jpg'} 
                alt="Emblema Oficial Los Motokas MC" 
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/escudo_oficial.jpg';
                }}
              />
              {/* Overlay hover com ícone de câmera */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </button>
            {/* Badge de câmera sobre o emblema para evidenciar que pode alterar */}
            <button
              type="button"
              onClick={() => emblemInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 bg-neutral-900 hover:bg-neutral-800 text-white p-1 rounded-full border border-white shadow-md cursor-pointer transition-transform hover:scale-110"
              title="Upload do emblema oficial"
            >
              <Camera className="w-2.5 h-2.5" />
            </button>
          </div>

          <button 
            onClick={() => onNavigate('feed')}
            className="flex flex-col leading-tight text-left group focus:outline-none cursor-pointer"
          >
            <span className="font-extrabold tracking-tight text-base sm:text-lg uppercase block font-['Plus_Jakarta_Sans'] leading-none">
              LOSMOTOKAS MC
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-blue-100 block leading-tight mt-0.5">
              Nossa História
            </span>
          </button>
        </div>

        {/* ZONA 2: LINKS DE NAVEGAÇÃO PRINCIPAIS COM ENGRENAGEM DE GESTÃO (DESKTOP) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {primaryNavLinks.map((link) => {
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  onNavigate(link.id);
                  setShowSettingsDropdown(false);
                }}
                className={`px-3 py-1.5 text-xs xl:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive 
                    ? 'bg-white text-[#1877F2] shadow-sm font-bold' 
                    : 'text-white/90 hover:bg-white/15 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            );
          })}

          {/* BOTÃO COM ÍCONE DE ENGRENAGEM (GESTAO: MEMBROS, COMUNICADOS, DIRETORIA) NO COMPUTADOR */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSettingsDropdown(!showSettingsDropdown);
                setShowNotifDropdown(false);
                setShowUserDropdown(false);
              }}
              className={`px-3 py-1.5 text-xs xl:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                ['membros', 'comunicados', 'admin'].includes(currentTab)
                  ? 'bg-white text-[#1877F2] shadow-sm font-bold'
                  : 'text-white/90 hover:bg-white/15 hover:text-white'
              }`}
              title="Gestão da Irmandade (Membros, Comunicados, Diretoria)"
            >
              <Settings className="w-4 h-4" />
              <span>Gestão</span>
              <ChevronDown className={`w-3.5 h-3.5 opacity-80 transition-transform ${showSettingsDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* DROPDOWN ANCORADO NO BOTÃO GESTÃO DO DESKTOP */}
            {showSettingsDropdown && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-neutral-200 text-[#1C1E21] py-2 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-3.5 py-2 border-b border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-neutral-800 uppercase tracking-wider">
                    <Settings className="w-4 h-4 text-[#1877F2]" />
                    <span>Gestão da Irmandade</span>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-[#1877F2] font-bold px-1.5 py-0.5 rounded">
                    3 Seções
                  </span>
                </div>

                <div className="py-1 space-y-1">
                  {/* 1. MEMBROS */}
                  <button
                    onClick={() => {
                      onNavigate('membros');
                      setShowSettingsDropdown(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-neutral-100 flex items-center gap-3 transition-colors cursor-pointer ${
                      currentTab === 'membros' ? 'bg-blue-50 text-[#1877F2] font-bold' : 'text-neutral-700'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-neutral-900 block text-xs">Membros</span>
                      <span className="text-[11px] text-neutral-500 font-normal block leading-tight">
                        Quadro oficial, coletes e motos ({allMembers.length})
                      </span>
                    </div>
                  </button>

                  {/* 2. COMUNICADOS */}
                  <button
                    onClick={() => {
                      onNavigate('comunicados');
                      setShowSettingsDropdown(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-neutral-100 flex items-center gap-3 transition-colors cursor-pointer ${
                      currentTab === 'comunicados' ? 'bg-blue-50 text-[#1877F2] font-bold' : 'text-neutral-700'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-red-50 text-red-600 shrink-0">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-neutral-900 block text-xs">Comunicados</span>
                      <span className="text-[11px] text-neutral-500 font-normal block leading-tight">
                        Editais e informativos da diretoria
                      </span>
                    </div>
                  </button>

                  {/* 3. DIRETORIA & SUPABASE */}
                  {isDiretoria ? (
                    <>
                      <button
                        onClick={() => {
                          onNavigate('admin');
                          setShowSettingsDropdown(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-neutral-100 flex items-center gap-3 transition-colors cursor-pointer ${
                          currentTab === 'admin' ? 'bg-amber-50 text-amber-900 font-bold' : 'text-neutral-700'
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-neutral-900 block text-xs">Diretoria</span>
                            <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded font-bold">ADMIN</span>
                          </div>
                          <span className="text-[11px] text-neutral-500 font-normal block leading-tight">
                            Gabinete e gestão de patentes
                          </span>
                        </div>
                      </button>

                      {/* BANCO DE DADOS FIREBASE (DIRETORIA) */}
                      <button
                        onClick={() => {
                          onOpenConfig();
                          setShowSettingsDropdown(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-amber-50/70 flex items-center gap-3 transition-colors cursor-pointer text-neutral-700 border-t border-neutral-100 mt-0.5"
                      >
                        <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                          <Flame className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-neutral-900 block text-xs">Firebase Firestore</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">Conectado</span>
                          </div>
                          <span className="text-[11px] text-neutral-500 font-normal block leading-tight truncate">
                            Status da nuvem e tempo real
                          </span>
                        </div>
                      </button>
                    </>
                  ) : (
                    <div className="px-3.5 py-2 text-[11px] text-neutral-400 italic flex items-center gap-2 border-t border-neutral-100 mt-1">
                      <Shield className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>Diretoria restrita a administradores</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* ZONA 3: ENGRENAGEM (CELULAR/TABLET), NOTIFICAÇÕES, PERFIL & MENU DOS TRÊS TRAÇOS (TODOS) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">

          {/* ÍCONE DE ENGRENAGEM VISÍVEL EM CELULAR E TABLETE */}
          <div className="relative lg:hidden">
            <button
              onClick={() => {
                setShowSettingsDropdown(!showSettingsDropdown);
                setShowNotifDropdown(false);
                setShowUserDropdown(false);
              }}
              className={`p-2 rounded-full hover:bg-white/15 transition-colors relative text-white focus:outline-none cursor-pointer ${
                ['membros', 'comunicados', 'admin'].includes(currentTab) ? 'bg-white/20 ring-2 ring-white/30' : ''
              }`}
              title="Gestão da Irmandade (Membros, Comunicados, Diretoria)"
              aria-label="Gestão da Irmandade (Membros, Comunicados, Diretoria)"
            >
              <Settings className="w-5 h-5" />
              {['membros', 'comunicados', 'admin'].includes(currentTab) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full border-2 border-[#1877F2]" />
              )}
            </button>

            {/* DROPDOWN DO ÍCONE DE ENGRENAGEM EM DISPOSITIVOS MÓVEIS / TABLET */}
            {showSettingsDropdown && (
              <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-24px)] bg-white rounded-xl shadow-2xl border border-neutral-200 text-[#1C1E21] py-2 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-3.5 py-2 border-b border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-neutral-800 uppercase tracking-wider">
                    <Settings className="w-4 h-4 text-[#1877F2]" />
                    <span>Gestão da Irmandade</span>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-[#1877F2] font-bold px-1.5 py-0.5 rounded">
                    3 Seções
                  </span>
                </div>

                <div className="py-1 space-y-1">
                  {/* 1. MEMBROS */}
                  <button
                    onClick={() => {
                      onNavigate('membros');
                      setShowSettingsDropdown(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-neutral-100 flex items-center gap-3 transition-colors cursor-pointer ${
                      currentTab === 'membros' ? 'bg-blue-50 text-[#1877F2] font-bold' : 'text-neutral-700'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-neutral-900 block text-xs">Membros</span>
                      <span className="text-[11px] text-neutral-500 font-normal block leading-tight">
                        Quadro oficial, coletes e motos ({allMembers.length})
                      </span>
                    </div>
                  </button>

                  {/* 2. COMUNICADOS */}
                  <button
                    onClick={() => {
                      onNavigate('comunicados');
                      setShowSettingsDropdown(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-neutral-100 flex items-center gap-3 transition-colors cursor-pointer ${
                      currentTab === 'comunicados' ? 'bg-blue-50 text-[#1877F2] font-bold' : 'text-neutral-700'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-red-50 text-red-600 shrink-0">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-neutral-900 block text-xs">Comunicados</span>
                      <span className="text-[11px] text-neutral-500 font-normal block leading-tight">
                        Editais e informativos da diretoria
                      </span>
                    </div>
                  </button>

                  {/* 3. DIRETORIA */}
                  {isDiretoria ? (
                    <button
                      onClick={() => {
                        onNavigate('admin');
                        setShowSettingsDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-neutral-100 flex items-center gap-3 transition-colors cursor-pointer ${
                        currentTab === 'admin' ? 'bg-amber-50 text-amber-900 font-bold' : 'text-neutral-700'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-neutral-900 block text-xs">Diretoria</span>
                          <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded font-bold">ADMIN</span>
                        </div>
                        <span className="text-[11px] text-neutral-500 font-normal block leading-tight">
                          Gabinete e gestão de patentes
                        </span>
                      </div>
                    </button>
                  ) : (
                    <div className="px-3.5 py-2 text-[11px] text-neutral-400 italic flex items-center gap-2 border-t border-neutral-100 mt-1">
                      <Shield className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>Diretoria restrita a administradores</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SINO DE NOTIFICAÇÕES */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                setShowSettingsDropdown(false);
                setShowUserDropdown(false);
              }}
              className="p-2 rounded-full hover:bg-white/15 transition-colors relative text-white focus:outline-none cursor-pointer"
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
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100';
                }}
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
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100';
                    }}
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
                      const url = getInviteUrl();
                      navigator.clipboard.writeText(url);
                      setCopiedInvite(true);
                      setTimeout(() => setCopiedInvite(false), 2500);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-[#1877F2] hover:bg-blue-50 flex items-center justify-between gap-2.5 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                       <UserPlus className="w-4 h-4 text-[#1877F2]" />
                       <span>Copiar Link de Convite Oficial</span>
                     </span>
                     {copiedInvite && <span className="text-[10px] bg-blue-100 text-[#1877F2] px-1.5 py-0.5 rounded font-bold">Copiado!</span>}
                   </button>
                   <a
                     href={getWhatsAppInviteUrl()}
                     target="_blank"
                     rel="noreferrer"
                     className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                   >
                     <Share2 className="w-4 h-4 text-emerald-600" />
                     <span>Convidar Irmão pelo WhatsApp</span>
                   </a>
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
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100';
                  }}
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

              <div className="text-right">
                <span className="text-xs font-extrabold text-white block uppercase leading-none font-['Plus_Jakarta_Sans']">
                  LOSMOTOKAS MC
                </span>
                <span className="text-[10px] text-blue-200 font-semibold block leading-tight mt-0.5">
                  Nossa História
                </span>
              </div>
            </div>

            {/* ITENS DE NAVEGAÇÃO PRINCIPAL COM ÍCONES */}
            <div className="space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider block mb-1.5">
                  Navegação Principal
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-sm">
                  <button
                    onClick={() => {
                      onNavigate('feed');
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition-colors text-left ${
                      currentTab === 'feed' ? 'bg-white text-[#1877F2]' : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <Home className="w-4 h-4 shrink-0" />
                    <span>Feed</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('albums');
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition-colors text-left ${
                      currentTab === 'albums' ? 'bg-white text-[#1877F2]' : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <Camera className="w-4 h-4 shrink-0" />
                    <span>Galeria</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('recordacoes');
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition-colors text-left ${
                      currentTab === 'recordacoes' ? 'bg-white text-[#1877F2]' : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <Bookmark className="w-4 h-4 shrink-0" />
                    <span>Recordações</span>
                  </button>
                </div>
              </div>

              {/* SEÇÃO DA ENGRENAGEM: GESTÃO DA IRMANDADE */}
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/15">
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-300 uppercase tracking-wider mb-2">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Gestão & Organização</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-sm">
                  <button
                    onClick={() => {
                      onNavigate('membros');
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition-colors text-left ${
                      currentTab === 'membros' ? 'bg-white text-[#1877F2] font-bold' : 'text-white hover:bg-white/15'
                    }`}
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    <span>Membros ({allMembers.length})</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('comunicados');
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition-colors text-left ${
                      currentTab === 'comunicados' ? 'bg-white text-[#1877F2] font-bold' : 'text-white hover:bg-white/15'
                    }`}
                  >
                    <Megaphone className="w-4 h-4 shrink-0" />
                    <span>Comunicados</span>
                  </button>

                  {isDiretoria ? (
                    <>
                      <button
                        onClick={() => {
                          onNavigate('admin');
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold transition-colors text-left ${
                          currentTab === 'admin' ? 'bg-amber-400 text-neutral-900 shadow-sm' : 'bg-amber-400/20 text-amber-200 hover:bg-amber-400/30'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4 shrink-0 text-amber-300" />
                        <span>Diretoria</span>
                        <span className="text-[9px] bg-red-600 text-white px-1.5 rounded font-mono ml-auto">ADMIN</span>
                      </button>

                      <button
                        onClick={() => {
                          onOpenConfig();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg font-bold transition-colors text-left bg-amber-600/80 text-white hover:bg-amber-600"
                      >
                        <Flame className="w-4 h-4 shrink-0 text-amber-200" />
                        <span>Firebase Firestore</span>
                        <span className="text-[9px] bg-emerald-500 text-white px-1.5 rounded font-mono ml-auto">OK</span>
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
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
                  setMobileMenuOpen(false);
                  emblemInputRef.current?.click();
                }}
                className="flex items-center justify-center gap-1.5 flex-1 min-w-[130px] py-2 px-3 bg-white/15 hover:bg-white/25 text-white rounded-lg font-semibold transition-colors cursor-pointer"
                title="Fazer upload do emblema oficial"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Trocar Emblema</span>
              </button>

              <button
                onClick={() => {
                  const url = getInviteUrl();
                  navigator.clipboard.writeText(url);
                  setCopiedInvite(true);
                  setTimeout(() => setCopiedInvite(false), 2500);
                }}
                className="flex items-center justify-center gap-1.5 flex-1 min-w-[140px] py-2 px-3 bg-white/15 hover:bg-white/25 text-white rounded-lg font-semibold transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{copiedInvite ? 'Link Copiado!' : 'Copiar Convite'}</span>
              </button>

              <a
                href={getWhatsAppInviteUrl()}
                target="_blank"
                rel="noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 flex-1 min-w-[140px] py-2 px-3 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp Convite</span>
              </a>

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

      {/* TOAST DE NOTIFICAÇÃO DO EMBLEMA */}
      {emblemToast && (
        <div className="fixed top-16 left-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 border border-emerald-400/50">
          <Check className="w-4 h-4 shrink-0 text-white" />
          <span>{emblemToast}</span>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE NOVO EMBLEMA OFICIAL */}
      {showEmblemModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 text-[#1C1E21] animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1877F2] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-neutral-900">
                  Definir Emblema Oficial
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowEmblemModal(false);
                  setNewEmblemPreview(null);
                }}
                className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-6 flex flex-col items-center text-center">
              {/* Badge indicando GIF animado ativo */}
              {isGifFile && (
                <div className="mb-3 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>GIF Animado Detectado — Animação Preservada 100%!</span>
                </div>
              )}

              {/* Preview circular com destaque */}
              <div className="relative group mb-4">
                <div className="w-32 h-32 rounded-full border-4 border-[#1877F2] shadow-xl overflow-hidden p-1 bg-neutral-50 flex items-center justify-center">
                  <img 
                    src={newEmblemPreview || officialEmblem || '/escudo_oficial.jpg'} 
                    alt="Prévia do Emblema Oficial" 
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/escudo_oficial.jpg';
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => emblemInputRef.current?.click()}
                  className="absolute bottom-1 right-1 bg-neutral-900 hover:bg-neutral-800 text-white p-2 rounded-full border-2 border-white shadow-lg cursor-pointer"
                  title="Trocar arquivo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <h4 className="font-bold text-neutral-800 text-sm">
                {isGifFile ? 'Seu GIF Animado será o Emblema Oficial' : 'Esta imagem do seu PC será o Emblema Oficial'}
              </h4>
              <p className="text-xs text-neutral-500 mt-1.5 max-w-xs leading-relaxed">
                {isGifFile 
                  ? 'A animação do GIF rodará com perfeição no topo esquerdo do app, na tela de convite e para todos os membros da irmandade!' 
                  : 'Ela ficará salva permanentemente no topo esquerdo do app, na tela de login, nos comunicados e em toda a irmandade LOSMOTOKAS MC.'}
              </p>

              <button
                type="button"
                onClick={() => emblemInputRef.current?.click()}
                className="mt-3 text-xs font-semibold text-[#1877F2] hover:underline flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Escolher outro arquivo do meu PC</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={handleSaveEmblem}
                className="flex-1 bg-[#1877F2] hover:bg-[#166fe5] text-white py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar e Salvar Emblema</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEmblemModal(false);
                  setNewEmblemPreview(null);
                }}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-2.5 px-4 rounded-xl font-semibold text-sm cursor-pointer transition-colors"
              >
                Cancelar
              </button>
            </div>

            {/* Opção para restaurar padrão se desejar */}
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={handleResetEmblem}
                className="text-[11px] text-neutral-400 hover:text-neutral-600 underline"
              >
                Restaurar emblema padrão original
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
