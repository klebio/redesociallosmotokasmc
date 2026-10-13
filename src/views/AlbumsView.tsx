import React, { useState } from 'react';
import { 
  FolderPlus, Image, Plus, ChevronLeft, Calendar, User, 
  Trash2, Upload, Sparkles, X, Shield 
} from 'lucide-react';
import { Album, AlbumMedia, Profile } from '../types/database';
import { store } from '../services/store';
import { MediaLightbox } from '../components/MediaLightbox';

interface AlbumsViewProps {
  currentUser: Profile | null;
  onNavigateToProfile: (userId: string) => void;
}

export const AlbumsView: React.FC<AlbumsViewProps> = ({
  currentUser,
  onNavigateToProfile,
}) => {
  const [albums, setAlbums] = useState<Album[]>(store.getAlbums());
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumMediaList, setAlbumMediaList] = useState<AlbumMedia[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMediaModal, setShowAddMediaModal] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Form states para criação de álbum
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Viagens');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [isOfficial, setIsOfficial] = useState(false);

  // Form state para adicionar foto ao álbum
  const [addMediaUrl, setAddMediaUrl] = useState('');
  const [addCaption, setAddCaption] = useState('');

  const handleOpenAlbum = (album: Album) => {
    setSelectedAlbum(album);
    setAlbumMediaList(store.getAlbumMedia(album.id));
  };

  const handleCreateAlbum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = store.createAlbum({
      title: newTitle.trim(),
      description: newDescription.trim(),
      category: newCategory,
      coverUrl: newCoverUrl || '/src/assets/images/motokas_road_trip_1791830557313.jpg',
      isOfficial,
    });

    setAlbums(store.getAlbums());
    setShowCreateModal(false);
    setNewTitle('');
    setNewDescription('');
    setNewCoverUrl('');
  };

  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlbum || !addMediaUrl.trim()) return;

    store.addMediaToAlbum(selectedAlbum.id, addMediaUrl.trim(), addCaption.trim());
    setAlbumMediaList(store.getAlbumMedia(selectedAlbum.id));
    setAlbums(store.getAlbums());
    setShowAddMediaModal(false);
    setAddMediaUrl('');
    setAddCaption('');
  };

  const isDiretoria = currentUser?.role === 'diretoria';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 w-full max-w-full overflow-x-hidden">
      
      {/* VISTA 1: DETALHES DE UM ÁLBUM ESPECÍFICO */}
      {selectedAlbum ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <button
              onClick={() => setSelectedAlbum(null)}
              className="flex items-center gap-2 text-xs font-bold text-[#1877F2] hover:underline"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar para a Galeria da Irmandade
            </button>

            <button
              onClick={() => setShowAddMediaModal(true)}
              className="px-4 py-2 bg-[#1877F2] hover:bg-[#0866FF] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Adicionar Fotos / Vídeos
            </button>
          </div>

          {/* CABEÇALHO DO ÁLBUM SELECIONADO */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-full md:w-64 aspect-video rounded-lg overflow-hidden bg-neutral-900 shrink-0">
                <img
                  src={selectedAlbum.cover_url || '/src/assets/images/motokas_road_trip_1791830557313.jpg'}
                  alt={selectedAlbum.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#1877F2]">
                    {selectedAlbum.category}
                  </span>
                  {selectedAlbum.is_official && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Álbum Oficial do Motoclube
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold text-neutral-900 font-['Plus_Jakarta_Sans']">
                  {selectedAlbum.title}
                </h2>

                <p className="text-xs text-neutral-600 leading-relaxed">
                  {selectedAlbum.description || 'Registros históricos preservados pela Irmandade.'}
                </p>

                <div className="flex items-center gap-3 text-xs text-neutral-500 pt-2 border-t border-neutral-100">
                  <span>Criado por {selectedAlbum.author?.nickname || 'Irmão'}</span>
                  <span>·</span>
                  <span>{albumMediaList.length} registros</span>
                  <span>·</span>
                  <span>{new Date(selectedAlbum.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* GRADE DE FOTOS DO ÁLBUM */}
          <div>
            <h3 className="text-sm font-bold text-neutral-800 mb-3">
              Fotografias & Vídeos ({albumMediaList.length})
            </h3>

            {albumMediaList.length === 0 ? (
              <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                <Image className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                <h4 className="font-bold text-neutral-800 text-sm">Este álbum ainda não possui fotos</h4>
                <p className="text-xs text-neutral-500 mt-1 mb-4">
                  Compartilhe as lembranças deste evento com os irmãos!
                </p>
                <button
                  onClick={() => setShowAddMediaModal(true)}
                  className="px-4 py-2 bg-[#1877F2] text-white text-xs font-bold rounded-lg hover:bg-[#0866FF]"
                >
                  Adicionar Primeira Mídia
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {albumMediaList.map((media, idx) => (
                  <div
                    key={media.id || idx}
                    onClick={() => setLightboxIndex(idx)}
                    className="aspect-square bg-neutral-900 rounded-lg overflow-hidden relative group cursor-pointer border border-neutral-200"
                  >
                    <img
                      src={media.url}
                      alt={media.caption || 'Foto do álbum'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    {media.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2 text-white text-[11px] truncate">
                        {media.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* VISTA 2: LISTAGEM DE TODOS OS ÁLBUNS */
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 font-['Plus_Jakarta_Sans']">
                Galeria da Irmandade
              </h2>
              <p className="text-xs text-neutral-500">
                Memórias de viagens, reuniões, aniversários e a história viva do Los Motokas MC.
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#1877F2] hover:bg-[#0866FF] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <FolderPlus className="w-4 h-4" />
              Criar Novo Álbum
            </button>
          </div>

          {/* GRADE DE ÁLBUNS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {albums.map((album) => (
              <div
                key={album.id}
                onClick={() => handleOpenAlbum(album)}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow cursor-pointer group flex flex-col"
              >
                <div className="aspect-video bg-neutral-900 overflow-hidden relative">
                  <img
                    src={album.cover_url || '/src/assets/images/motokas_road_trip_1791830557313.jpg'}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {album.category}
                  </div>
                  {album.is_official && (
                    <div className="absolute top-2 right-2 bg-[#1877F2] text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-xs">
                      <Shield className="w-3 h-3" />
                      Oficial
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 group-hover:text-[#1877F2] transition-colors line-clamp-1">
                      {album.title}
                    </h3>
                    <p className="text-xs text-neutral-500 line-clamp-2 mt-1">
                      {album.description || 'Galeria de fotos do motoclube.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-4 pt-2 border-t border-neutral-100">
                    <span>{album.media_count || 0} mídias</span>
                    <span>{new Date(album.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CRIAR NOVO ÁLBUM */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-neutral-200 overflow-hidden">
            <div className="bg-[#1877F2] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm">Criar Álbum da Irmandade</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlbum} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Título do Álbum</label>
                <input
                  type="text"
                  placeholder="Ex: Viagem Serra da Canastra 2026"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Conte um pouco sobre este momento histórico..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Categoria</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none"
                  >
                    <option value="Viagens">Viagens & Estradas</option>
                    <option value="Eventos">Reuniões & Encontros</option>
                    <option value="História">História do MC</option>
                    <option value="Geral">Momentos com os Irmãos</option>
                  </select>
                </div>

                {isDiretoria && (
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Status Oficial</label>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOfficial}
                        onChange={(e) => setIsOfficial(e.target.checked)}
                        className="rounded text-[#1877F2]"
                      />
                      <span className="text-neutral-700 font-semibold">Álbum Oficial do MC</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#1877F2] hover:bg-[#0866FF] rounded-lg shadow-xs"
                >
                  Criar Álbum
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR MÍDIA AO ÁLBUM */}
      {showAddMediaModal && selectedAlbum && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-neutral-200 overflow-hidden">
            <div className="bg-[#1877F2] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm">Adicionar Foto ou Vídeo ao Álbum</h3>
              <button onClick={() => setShowAddMediaModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMedia} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">URL da Imagem / Vídeo</label>
                <input
                  type="text"
                  placeholder="Cole o link ou selecione dos atalhos abaixo..."
                  value={addMediaUrl}
                  onChange={(e) => setAddMediaUrl(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
                />
              </div>

              {/* ATALHOS RÁPIDOS DE FOTOS DA HISTÓRIA */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAddMediaUrl('/src/assets/images/motokas_road_trip_1791830557313.jpg')}
                  className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 rounded text-[11px] font-semibold text-neutral-700"
                >
                  Foto Comboio
                </button>
                <button
                  type="button"
                  onClick={() => setAddMediaUrl('/src/assets/images/motokas_clubhouse_gathering_1791830585214.jpg')}
                  className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 rounded text-[11px] font-semibold text-neutral-700"
                >
                  Foto Clubhouse
                </button>
                <button
                  type="button"
                  onClick={() => setAddMediaUrl(store.getOfficialEmblem())}
                  className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 rounded text-[11px] font-semibold text-neutral-700"
                >
                  Foto Escudo Oficial
                </button>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Legenda da Foto (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Parada para abastecer em Pouso Alegre"
                  value={addCaption}
                  onChange={(e) => setAddCaption(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddMediaModal(false)}
                  className="px-4 py-2 font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#1877F2] hover:bg-[#0866FF] rounded-lg shadow-xs"
                >
                  Adicionar ao Álbum
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightboxIndex !== null && albumMediaList[lightboxIndex] && (
        <MediaLightbox
          isOpen={true}
          onClose={() => setLightboxIndex(null)}
          mediaUrl={albumMediaList[lightboxIndex].url}
          mediaType={albumMediaList[lightboxIndex].media_type}
          caption={albumMediaList[lightboxIndex].caption}
          hasMultiple={albumMediaList.length > 1}
          onNext={() => setLightboxIndex((prev) => (prev! + 1) % albumMediaList.length)}
          onPrev={() => setLightboxIndex((prev) => (prev! - 1 + albumMediaList.length) % albumMediaList.length)}
        />
      )}
    </div>
  );
};
