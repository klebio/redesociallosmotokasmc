import React, { useState } from 'react';
import { 
  Image as ImageIcon, Video, Send, X, Shield, Lock, Globe, Loader2, Sparkles, 
  AlertCircle, CheckCircle2, Link2, Film 
} from 'lucide-react';
import { store } from '../services/store';
import { Profile } from '../types/database';

interface FeedComposerProps {
  currentUser: Profile | null;
  onPostCreated: () => void;
}

export const FeedComposer: React.FC<FeedComposerProps> = ({
  currentUser,
  onPostCreated,
}) => {
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<'brothers_only' | 'diretoria_only'>('brothers_only');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [customLink, setCustomLink] = useState('');

  const isDiretoria = currentUser?.role === 'diretoria';

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && mediaUrls.length === 0) return;

    setIsSubmitting(true);
    setUploadError(null);

    try {
      const newPost = await store.createPost({
        content: content.trim(),
        privacy,
        mediaUrls,
      });

      if (!newPost) {
        throw new Error('Não foi possível gravar a publicação.');
      }

      setContent('');
      setMediaUrls([]);
      setPostSuccess(true);
      setTimeout(() => setPostSuccess(false), 3500);
      onPostCreated();
    } catch (err: any) {
      console.error('Erro ao publicar:', err);
      setUploadError(err.message || 'Falha ao publicar na rede da irmandade. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload real de fotos e vídeos gravados no celular para o servidor
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingMedia(true);
    setUploadError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith('video/') ||
        file.name.toLowerCase().endsWith('.mp4') ||
        file.name.toLowerCase().endsWith('.mov') ||
        file.name.toLowerCase().endsWith('.webm');

      setUploadStatus(
        isVideo
          ? `Enviando vídeo do celular (${file.name})...`
          : `Enviando foto (${file.name})...`
      );

      try {
        const formData = new FormData();
        formData.append('media', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Erro ${response.status} ao carregar mídia`);
        }

        const data = await response.json();
        if (data && data.url) {
          setMediaUrls((prev) => [...prev, data.url]);
        }
      } catch (err: any) {
        console.error('Falha no upload:', err);
        setUploadError(
          err.message || 'Erro ao processar vídeo ou foto do celular. Verifique se o arquivo não excede 150MB.'
        );
      }
    }

    setIsUploadingMedia(false);
    setUploadStatus(null);
    e.target.value = '';
  };

  const handleAddCustomLink = () => {
    if (!customLink.trim()) return;
    setMediaUrls((prev) => [...prev, customLink.trim()]);
    setCustomLink('');
    setShowLinkInput(false);
  };

  const removeMedia = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-neutral-200 p-3 sm:p-4 mb-4">
      <div className="flex gap-3">
        <img
          src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
          alt={currentUser?.nickname || 'Membro'}
          className="w-10 h-10 rounded-full object-cover shrink-0 border border-neutral-200"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100';
          }}
        />
        <div className="flex-1 min-w-0">
          <form onSubmit={handleCreatePost}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`O que você quer compartilhar com a Irmandade, ${currentUser?.nickname || 'Irmão'}?`}
              rows={3}
              className="w-full resize-none border-none focus:outline-none text-sm text-[#1C1E21] placeholder-neutral-400 p-1"
            />

            {/* STATUS DE UPLOAD EM TEMPO REAL */}
            {isUploadingMedia && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 my-2 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-[#1877F2] shrink-0" />
                <span className="font-semibold">{uploadStatus || 'Enviando arquivo do celular...'}</span>
              </div>
            )}

            {/* MENSAGEM DE ERRO */}
            {uploadError && (
              <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 my-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* MENSAGEM DE SUCESSO */}
            {postSuccess && (
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 my-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Publicação registrada na rede com sucesso!</span>
              </div>
            )}

            {/* CAMPO DE LINK PERSONALIZADO */}
            {showLinkInput && (
              <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg border border-neutral-200 my-2">
                <input
                  type="url"
                  placeholder="Cole o link de um vídeo (MP4/Web) ou imagem..."
                  value={customLink}
                  onChange={(e) => setCustomLink(e.target.value)}
                  className="flex-1 text-xs px-2.5 py-1.5 border border-neutral-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomLink}
                  className="px-3 py-1.5 bg-[#1877F2] text-white text-xs font-bold rounded hover:bg-[#0866FF]"
                >
                  Anexar
                </button>
                <button
                  type="button"
                  onClick={() => setShowLinkInput(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* PRÉ-VISUALIZAÇÃO DE MÍDIAS ANEXADAS */}
            {mediaUrls.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2 p-2 bg-neutral-900 rounded-lg border border-neutral-800">
                {mediaUrls.filter((url) => Boolean(url && url.trim() !== '')).map((url, idx) => {
                  const isVideo = url.endsWith('.mp4') || 
                    url.endsWith('.mov') || 
                    url.endsWith('.webm') || 
                    url.endsWith('.mkv') || 
                    url.includes('video') || 
                    url.startsWith('data:video');

                  return (
                    <div key={idx} className="relative group aspect-video rounded-md overflow-hidden bg-black border border-neutral-800 flex items-center justify-center">
                      {isVideo ? (
                        <video
                          src={url}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-contain bg-black"
                        />
                      ) : (
                        <img
                          src={url || '/escudo_oficial.jpg'}
                          alt={`Anexo ${idx + 1}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/escudo_oficial.jpg';
                          }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeMedia(idx)}
                        className="absolute top-1.5 right-1.5 bg-black/80 hover:bg-red-600 text-white p-1 rounded-full transition-colors z-20 cursor-pointer shadow-md"
                        title="Remover anexo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-neutral-100 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                
                {/* BOTÃO ADICIONAR FOTO / VÍDEO DO CELULAR */}
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 cursor-pointer transition-colors active:scale-98">
                  <Film className="w-4 h-4 text-emerald-600" />
                  <span>Vídeo / Foto do Celular</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileUpload}
                    disabled={isUploadingMedia}
                    className="hidden"
                  />
                </label>

                {/* BOTÃO LINK DE VÍDEO */}
                <button
                  type="button"
                  onClick={() => setShowLinkInput(!showLinkInput)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                  title="Anexar link direto de vídeo ou foto"
                >
                  <Link2 className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Link de Mídia</span>
                </button>

                {/* ATALHO PARA ESCUDO OFICIAL */}
                <button
                  type="button"
                  onClick={() => setMediaUrls((prev) => [...prev, store.getOfficialEmblem()])}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                  title="Anexar foto do Escudo Oficial Los Motokas MC"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Escudo Oficial</span>
                </button>

                {/* CONTROLE DE PRIVACIDADE */}
                {isDiretoria && (
                  <select
                    value={privacy}
                    onChange={(e: any) => setPrivacy(e.target.value)}
                    className="text-xs bg-neutral-100 text-neutral-700 rounded-md px-2 py-1 border border-neutral-200 focus:outline-none"
                  >
                    <option value="brothers_only">Toda a Irmandade</option>
                    <option value="diretoria_only">Exclusivo Diretoria</option>
                  </select>
                )}
              </div>

              {/* BOTÃO PUBLICAR */}
              <button
                type="submit"
                disabled={isSubmitting || isUploadingMedia || (!content.trim() && mediaUrls.length === 0)}
                className="px-5 py-2 bg-[#1877F2] hover:bg-[#0866FF] disabled:opacity-50 disabled:hover:bg-[#1877F2] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Publicando na rede...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Compartilhar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
