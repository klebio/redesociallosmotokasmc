import React, { useState } from 'react';
import { 
  Shield, Calendar, MapPin, Users, Flame, Award, Filter, 
  Sparkles, Camera, Megaphone, ChevronRight, Compass 
} from 'lucide-react';
import { FeedComposer } from '../components/FeedComposer';
import { PostCard } from '../components/PostCard';
import { Post, Profile, Announcement } from '../types/database';
import { store } from '../services/store';

interface FeedViewProps {
  currentUser: Profile | null;
  onNavigateToProfile: (userId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  currentUser,
  onNavigateToProfile,
  onNavigateToTab,
}) => {
  const [posts, setPosts] = useState<Post[]>(store.getPosts());
  const [filter, setFilter] = useState<'all' | 'media' | 'diretoria'>('all');
  const [members, setMembers] = useState<Profile[]>(store.getMembers());
  const announcements = store.getAnnouncements().slice(0, 2);

  React.useEffect(() => {
    const unsub = store.subscribe(() => {
      setPosts(store.getPosts());
      setMembers(store.getMembers());
    });
    return unsub;
  }, []);

  const handleRefresh = () => {
    setPosts(store.getPosts());
    setMembers(store.getMembers());
  };

  const filteredPosts = posts.filter((p) => {
    if (filter === 'media') return p.media && p.media.length > 0;
    if (filter === 'diretoria') return p.author?.role === 'diretoria';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 w-full max-w-full overflow-x-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUNA ESQUERDA (DESKTOP): IDENTIDADE DA IRMANDADE & ATALHOS */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4 sticky top-20">
          
          {/* CARD DE IDENTIDADE DO MOTOCLUBE */}
          <div className="bg-white rounded-xl shadow-xs border border-neutral-200 overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-[#1877F2] to-[#0866FF] relative p-3">
              <span className="text-[11px] font-bold text-white/90 uppercase tracking-widest block">
                Capítulo Oficial · Mossoró / RN
              </span>
              <span className="text-white font-extrabold text-sm block">
                Los Motokas MC
              </span>
            </div>
            <div className="px-4 pb-4 -mt-9 text-center">
              <div className="w-18 h-18 mx-auto rounded-full bg-white p-1 shadow-md border border-neutral-100 overflow-hidden mb-2">
                <img
                  src="/src/assets/images/escudo_oficial.jpg"
                  alt="Escudo Oficial Los Motokas MC Mossoró RN"
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="font-extrabold text-neutral-900 text-base font-['Plus_Jakarta_Sans']">
                LOS MOTOKAS MC
              </h3>
              <p className="text-xs text-neutral-500 font-medium mt-0.5">
                "Tradição, Lealdade e Estrada"
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-neutral-100 text-center">
                <div className="p-2 bg-neutral-50 rounded-lg">
                  <span className="block font-bold text-sm text-[#1877F2] tabular-nums">
                    {members.length}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-medium">Irmãos Ativos</span>
                </div>
                <div className="p-2 bg-neutral-50 rounded-lg">
                  <span className="block font-bold text-sm text-neutral-800 tabular-nums">
                    {posts.length}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-medium">Histórias Salvas</span>
                </div>
              </div>
            </div>
          </div>

          {/* ATALHOS RÁPIDOS DA IRMANDADE */}
          <div className="bg-white rounded-xl shadow-xs border border-neutral-200 p-3 space-y-1 text-xs font-semibold text-neutral-700">
            <button
              onClick={() => onNavigateToTab('albums')}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Camera className="w-4 h-4 text-[#1877F2]" />
                <span>Galerias & Álbuns de Estrada</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            </button>
            <button
              onClick={() => onNavigateToTab('recordacoes')}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Minhas Recordações</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            </button>
            <button
              onClick={() => onNavigateToTab('membros')}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Lista de Membros da Irmandade</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            </button>
            <button
              onClick={() => onNavigateToTab('comunicados')}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-4 h-4 text-red-500" />
                <span>Comunicados da Diretoria</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          </div>
        </aside>

        {/* COLUNA CENTRAL: FEED PRINCIPAL */}
        <main className="lg:col-span-6 space-y-4">
          
          {/* TICKER DE COMUNICADO URGENTE (SE HOUVER) */}
          {announcements.length > 0 && announcements[0].priority === 'urgent' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-3 shadow-xs">
              <Megaphone className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-800 uppercase tracking-wider text-[10px]">
                    Comunicado Oficial da Diretoria
                  </span>
                  <button
                    onClick={() => onNavigateToTab('comunicados')}
                    className="text-red-700 font-bold hover:underline text-[11px]"
                  >
                    Ver todos
                  </button>
                </div>
                <h4 className="font-bold text-red-950 mt-0.5">{announcements[0].title}</h4>
                <p className="text-red-800 line-clamp-2 mt-0.5 leading-relaxed">
                  {announcements[0].content}
                </p>
              </div>
            </div>
          )}

          {/* CAIXA DE PUBLICAÇÃO DO FEED */}
          <FeedComposer currentUser={currentUser} onPostCreated={handleRefresh} />

          {/* BARRA DE FILTRO DO FEED */}
          <div className="bg-white rounded-xl shadow-xs border border-neutral-200 p-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 max-w-full overflow-hidden">
            <span className="text-xs font-bold text-neutral-600 px-2 flex items-center gap-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#1877F2]" />
              Mural da Irmandade
            </span>
            <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-lg overflow-x-auto scrollbar-none max-w-full w-full sm:w-auto">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors shrink-0 cursor-pointer ${
                  filter === 'all'
                    ? 'bg-white text-[#1877F2] shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter('media')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors shrink-0 cursor-pointer ${
                  filter === 'media'
                    ? 'bg-white text-[#1877F2] shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Com Fotos
              </button>
              <button
                onClick={() => setFilter('diretoria')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors shrink-0 cursor-pointer ${
                  filter === 'diretoria'
                    ? 'bg-white text-[#1877F2] shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Diretoria
              </button>
            </div>
          </div>

          {/* LISTA DE POSTAGENS */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
                <Compass className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                <h4 className="font-bold text-neutral-800 text-sm">Nenhuma publicação encontrada</h4>
                <p className="text-xs text-neutral-500 mt-1">
                  Seja o primeiro a compartilhar uma lembrança ou foto de estrada com os irmãos!
                </p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onNavigateToProfile={onNavigateToProfile}
                  onPostUpdated={handleRefresh}
                />
              ))
            )}
          </div>
        </main>

        {/* COLUNA DIREITA (DESKTOP): COMBOIOS, IRMÃOS EM DESTAQUE */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4 sticky top-20">
          
          {/* PRÓXIMO COMBOIO OFICIAL */}
          <div className="bg-white rounded-xl shadow-xs border border-neutral-200 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 mb-2">
              <Calendar className="w-4 h-4 text-[#1877F2]" />
              <span>Próximo Passeio Oficial</span>
            </div>
            <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3 text-xs">
              <span className="font-bold text-blue-900 block">Serra da Mantiqueira</span>
              <div className="flex items-center gap-1.5 text-blue-700 mt-1 text-[11px]">
                <MapPin className="w-3.5 h-3.5" />
                <span>Saída: Posto Shell KM 28</span>
              </div>
              <p className="text-[11px] text-blue-800 mt-1.5 font-medium">
                Sábado às 06h00 · Tanque cheio e colete fechado.
              </p>
            </div>
          </div>

          {/* IRMÃOS ATIVOS NA ESTRADA */}
          <div className="bg-white rounded-xl shadow-xs border border-neutral-200 p-4">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-900 mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Irmandade no Asfalto</span>
              </div>
              <button
                onClick={() => onNavigateToTab('membros')}
                className="text-xs text-[#1877F2] font-semibold hover:underline"
              >
                Ver todos
              </button>
            </div>
            <div className="space-y-2.5">
              {members.length === 0 ? (
                <div className="py-2 text-center text-neutral-400">
                  <p className="text-[11px] italic">Nenhum irmão cadastrado ainda.</p>
                </div>
              ) : (
                members.slice(0, 4).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onNavigateToProfile(m.id)}
                    className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-neutral-50 transition-colors text-left focus:outline-none"
                  >
                    <img
                      src={m.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                      alt={m.nickname}
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-neutral-200"
                    />
                    <div className="overflow-hidden">
                      <span className="text-xs font-bold text-neutral-800 block truncate">
                        {m.nickname}
                      </span>
                      <span className="text-[10px] text-neutral-500 block truncate">
                        {m.motorcycle_model || 'Motociclista'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};
