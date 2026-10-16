import React, { useState } from 'react';
import { 
  ThumbsUp, Heart, Shield, Flame, MessageCircle, Bookmark, 
  Share2, MoreHorizontal, Trash2, Globe, Lock, Send 
} from 'lucide-react';
import { Post, ReactionType, Profile } from '../types/database';
import { store } from '../services/store';
import { MediaLightbox } from './MediaLightbox';

interface PostCardProps {
  post: Post;
  currentUser: Profile | null;
  onNavigateToProfile: (userId: string) => void;
  onPostUpdated?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  onNavigateToProfile,
  onPostUpdated,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const comments = store.getComments(post.id);
  const isAuthor = currentUser?.id === post.author_id;
  const isDiretoria = currentUser?.role === 'diretoria';
  const canDelete = isAuthor || isDiretoria;

  const handleToggleReaction = (type: ReactionType) => {
    store.toggleReaction(post.id, type);
    setShowReactionPicker(false);
    onPostUpdated?.();
  };

  const handleToggleSave = () => {
    store.toggleSavePost(post.id);
    onPostUpdated?.();
  };

  const handleDeletePost = () => {
    if (confirm('Tem certeza que deseja excluir esta publicação da história do motoclube?')) {
      store.deletePost(post.id);
      onPostUpdated?.();
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    store.addComment(post.id, commentText.trim());
    setCommentText('');
    setShowComments(true);
    onPostUpdated?.();
  };

  const formatTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const hours = Math.floor(diff / (1000 * 3600));
    if (hours < 1) return 'Agora mesmo';
    if (hours < 24) return `Há ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Há ${days}d`;
    return new Date(isoString).toLocaleDateString('pt-BR');
  };

  const getReactionIcon = (type?: ReactionType) => {
    switch (type) {
      case 'respect':
        return <Shield className="w-4 h-4 text-[#1877F2]" fill="#1877F2" />;
      case 'love':
        return <Heart className="w-4 h-4 text-red-500" fill="#EF4444" />;
      case 'road':
        return <Flame className="w-4 h-4 text-amber-500" fill="#F59E0B" />;
      case 'like':
      default:
        return <ThumbsUp className="w-4 h-4 text-[#1877F2]" fill="#1877F2" />;
    }
  };

  const getReactionLabel = (type?: ReactionType) => {
    switch (type) {
      case 'respect':
        return 'Respeito';
      case 'love':
        return 'Irmandade';
      case 'road':
        return 'Estrada';
      case 'like':
      default:
        return 'Curtir';
    }
  };

  const mediaList = (post.media || []).filter((m) => Boolean(m?.url));

  return (
    <>
      <article className="bg-white rounded-xl shadow-xs border border-neutral-200 mb-4 overflow-hidden">
        
        {/* CABEÇALHO DO POST */}
        <div className="p-4 flex items-start justify-between">
          <div className="flex gap-3">
            <button 
              onClick={() => onNavigateToProfile(post.author_id)}
              className="relative shrink-0 focus:outline-none group"
            >
              <img
                src={post.author?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                alt={post.author?.nickname || 'Membro'}
                className="w-10 h-10 rounded-full object-cover border border-neutral-200 group-hover:opacity-90 transition-opacity"
              />
              {post.author?.role === 'diretoria' && (
                <div 
                  title="Diretoria Los Motokas MC" 
                  className="absolute -bottom-1 -right-1 bg-[#1877F2] text-white p-0.5 rounded-full border border-white"
                >
                  <Shield className="w-2.5 h-2.5" />
                </div>
              )}
            </button>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => onNavigateToProfile(post.author_id)}
                  className="font-bold text-sm text-[#1C1E21] hover:underline text-left focus:outline-none"
                >
                  {post.author?.nickname || 'Irmão'}
                </button>
                <span className="text-xs text-[#65676B]">({post.author?.full_name})</span>
              </div>

              {/* METADADOS SEM PILL (CONSTITUIÇÃO DE DESIGN) */}
              <div className="flex items-center gap-1.5 text-xs text-[#65676B] mt-0.5 flex-wrap">
                <span className="font-medium capitalize text-neutral-700">
                  {post.author?.role === 'diretoria' ? 'Diretoria' : post.author?.role === 'membro' ? 'Membro Oficial' : 'Aspirante'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{formatTime(post.created_at)}</span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1" title={post.privacy === 'diretoria_only' ? 'Exclusivo da Diretoria' : 'Toda a Irmandade'}>
                  {post.privacy === 'diretoria_only' ? <Lock className="w-3 h-3 text-amber-600" /> : <Globe className="w-3 h-3 text-neutral-400" />}
                </span>
              </div>
            </div>
          </div>

          {/* MENU DE OPÇÕES DO AUTOR OU DIRETORIA */}
          {canDelete && (
            <div className="relative">
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 transition-colors focus:outline-none"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {showOptionsMenu && (
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-30 animate-in fade-in">
                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      handleDeletePost();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir Publicação
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CONTEÚDO DE TEXTO */}
        {post.content && (
          <div className="px-4 pb-3 text-sm text-[#1C1E21] leading-relaxed whitespace-pre-line">
            {post.content}
          </div>
        )}

        {/* GRADE DE FOTOS E VÍDEOS */}
        {mediaList.length > 0 && (
          <div className={`grid gap-1 bg-neutral-950 ${
            mediaList.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          }`}>
            {mediaList.map((media, idx) => (
              <div
                key={media.id || idx}
                onClick={() => setLightboxIndex(idx)}
                className="relative cursor-pointer group overflow-hidden max-h-[480px] flex items-center justify-center bg-black"
              >
                {media.media_type === 'video' ? (
                  media.url && media.url.trim() !== '' ? (
                    <video
                      src={media.url}
                      className="w-full h-full object-cover group-hover:scale-101 transition-transform"
                    />
                  ) : null
                ) : (
                  <img
                    src={media.url || '/escudo_oficial.jpg'}
                    alt={media.caption || 'Foto da publicação'}
                    className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/escudo_oficial.jpg';
                    }}
                  />
                )}
                {media.caption && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white text-xs">
                    {media.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CONTADORES SOCIAIS */}
        <div className="px-4 py-2 border-b border-neutral-100 flex items-center justify-between text-xs text-[#65676B]">
          <div className="flex items-center gap-1.5">
            {post.likes_count > 0 && (
              <span className="flex items-center gap-1">
                <span className="p-0.5 bg-[#1877F2] text-white rounded-full">
                  <ThumbsUp className="w-3 h-3" />
                </span>
                <span>{post.likes_count} curtidas da irmandade</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {comments.length > 0 && (
              <button 
                onClick={() => setShowComments(!showComments)}
                className="hover:underline"
              >
                {comments.length} {comments.length === 1 ? 'comentário' : 'comentários'}
              </button>
            )}
          </div>
        </div>

        {/* BARRA DE AÇÕES & REAÇÕES */}
        <div className="px-2 py-1 flex items-center justify-between text-xs font-semibold text-[#65676B] relative">
          
          {/* BOTÃO E POPUP DE REAÇÕES */}
          <div 
            className="relative flex-1"
            onMouseEnter={() => setShowReactionPicker(true)}
            onMouseLeave={() => setShowReactionPicker(false)}
          >
            <button
              onClick={() => handleToggleReaction(post.user_reaction || 'like')}
              className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-neutral-100 transition-colors ${
                post.user_has_liked ? 'text-[#1877F2] font-bold' : ''
              }`}
            >
              {post.user_has_liked ? (
                getReactionIcon(post.user_reaction)
              ) : (
                <ThumbsUp className="w-4 h-4" />
              )}
              <span>{post.user_has_liked ? getReactionLabel(post.user_reaction) : 'Curtir'}</span>
            </button>

            {/* SELETOR FLUTUANTE DE REAÇÕES DA IRMANDADE */}
            {showReactionPicker && (
              <div className="absolute -top-11 left-2 bg-white rounded-full shadow-xl border border-neutral-200 px-3 py-1.5 flex items-center gap-2.5 z-30 animate-in fade-in slide-in-from-bottom-2">
                <button
                  type="button"
                  onClick={() => handleToggleReaction('like')}
                  className="p-1 hover:scale-125 transition-transform"
                  title="Curtir"
                >
                  <ThumbsUp className="w-5 h-5 text-[#1877F2]" fill="#1877F2" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleReaction('respect')}
                  className="p-1 hover:scale-125 transition-transform"
                  title="Respeito"
                >
                  <Shield className="w-5 h-5 text-[#1877F2]" fill="#1877F2" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleReaction('love')}
                  className="p-1 hover:scale-125 transition-transform"
                  title="Irmandade"
                >
                  <Heart className="w-5 h-5 text-red-500" fill="#EF4444" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleReaction('road')}
                  className="p-1 hover:scale-125 transition-transform"
                  title="Estrada"
                >
                  <Flame className="w-5 h-5 text-amber-500" fill="#F59E0B" />
                </button>
              </div>
            )}
          </div>

          {/* BOTÃO COMENTÁRIOS */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-neutral-100 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Comentar</span>
          </button>

          {/* BOTÃO RECORDAR / SALVAR */}
          <button
            onClick={handleToggleSave}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-neutral-100 transition-colors ${
              post.user_has_saved ? 'text-[#1877F2] font-bold' : ''
            }`}
          >
            <Bookmark className={`w-4 h-4 ${post.user_has_saved ? 'fill-[#1877F2]' : ''}`} />
            <span>{post.user_has_saved ? 'Salvo' : 'Salvar'}</span>
          </button>
        </div>

        {/* SEÇÃO EXPANSÍVEL DE COMENTÁRIOS */}
        {showComments && (
          <div className="p-4 bg-neutral-50/70 border-t border-neutral-100 space-y-3">
            
            {/* FORMULÁRIO DE COMENTÁRIO */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <img
                src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                alt={currentUser?.nickname || 'Membro'}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Escreva um comentário para o irmão..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-full focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-3 py-1.5 bg-[#1877F2] text-white rounded-full hover:bg-[#0866FF] disabled:opacity-40 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* LISTA DE COMENTÁRIOS */}
            <div className="space-y-2 pt-2">
              {comments.map((comm) => (
                <div key={comm.id} className="flex gap-2.5 items-start">
                  <img
                    src={comm.author?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                    alt={comm.author?.nickname || 'Membro'}
                    className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                  />
                  <div className="bg-white px-3 py-2 rounded-2xl border border-neutral-200/80 text-xs flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-neutral-900">{comm.author?.nickname}</span>
                      <span className="text-[10px] text-neutral-400 capitalize">· {comm.author?.role}</span>
                    </div>
                    <p className="text-neutral-800 mt-0.5">{comm.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* LIGHTBOX DE IMAGENS / VÍDEOS */}
      {lightboxIndex !== null && mediaList[lightboxIndex] && (
        <MediaLightbox
          isOpen={true}
          onClose={() => setLightboxIndex(null)}
          mediaUrl={mediaList[lightboxIndex].url}
          mediaType={mediaList[lightboxIndex].media_type}
          caption={mediaList[lightboxIndex].caption}
          hasMultiple={mediaList.length > 1}
          onNext={() => setLightboxIndex((prev) => (prev! + 1) % mediaList.length)}
          onPrev={() => setLightboxIndex((prev) => (prev! - 1 + mediaList.length) % mediaList.length)}
        />
      )}
    </>
  );
};
