import React, { useState } from 'react';
import { 
  Bookmark, Calendar, Clock, Search, Filter, Image, 
  Sparkles, History, Compass 
} from 'lucide-react';
import { Post, Profile } from '../types/database';
import { store } from '../services/store';
import { PostCard } from '../components/PostCard';

interface MemoriesViewProps {
  currentUser: Profile | null;
  onNavigateToProfile: (userId: string) => void;
}

export const MemoriesView: React.FC<MemoriesViewProps> = ({
  currentUser,
  onNavigateToProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'saved' | 'history'>('saved');
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaOnly, setMediaOnly] = useState(false);

  const savedPosts = store.getSavedPosts();
  const historyPosts = store.getMemories();

  const currentList = activeTab === 'saved' ? savedPosts : historyPosts;

  const filteredPosts = currentList.filter((p) => {
    const matchesSearch = p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author?.nickname.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMedia = mediaOnly ? (p.media && p.media.length > 0) : true;
    return matchesSearch && matchesMedia;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      
      {/* CABEÇALHO */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-blue-50 text-[#1877F2] rounded-xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900 font-['Plus_Jakarta_Sans']">
              Minhas Recordações da Irmandade
            </h2>
            <p className="text-xs text-neutral-500">
              Reviva os melhores passeios, momentos marcantes e publicações salvas da história do Los Motokas MC.
            </p>
          </div>
        </div>

        {/* ABAS */}
        <div className="flex border-b border-neutral-200 mt-4 text-xs font-bold gap-6">
          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'saved'
                ? 'border-[#1877F2] text-[#1877F2]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Publicações Salvas ({savedPosts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'history'
                ? 'border-[#1877F2] text-[#1877F2]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Histórico da Estrada ({historyPosts.length})</span>
          </button>
        </div>

        {/* BARRA DE PESQUISA E FILTROS */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mt-4 pt-2">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por irmão ou palavra-chave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer self-start sm:self-auto">
            <input
              type="checkbox"
              checked={mediaOnly}
              onChange={(e) => setMediaOnly(e.target.checked)}
              className="rounded text-[#1877F2]"
            />
            <span>Apenas com fotos e vídeos</span>
          </label>
        </div>
      </div>

      {/* LISTAGEM DE POSTAGENS */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center shadow-xs">
            <Compass className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
            <h4 className="font-bold text-neutral-800 text-sm">
              {activeTab === 'saved' ? 'Nenhuma publicação salva ainda' : 'Nenhuma recordação encontrada'}
            </h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              {activeTab === 'saved'
                ? 'Clique no botão "Salvar" em qualquer publicação do feed para guardá-la no seu arquivo pessoal.'
                : 'Compartilhe viagens e momentos na estrada para construir o arquivo histórico da Irmandade.'}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onNavigateToProfile={onNavigateToProfile}
              onPostUpdated={() => {}}
            />
          ))
        )}
      </div>

    </div>
  );
};
