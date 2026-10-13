import React, { useState } from 'react';
import { 
  Image, Video, Send, X, Shield, Lock, Globe, Loader2, Sparkles 
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
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const isDiretoria = currentUser?.role === 'diretoria';

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && mediaUrls.length === 0) return;

    setIsSubmitting(true);
    setTimeout(() => {
      store.createPost({
        content: content.trim(),
        privacy,
        mediaUrls,
      });

      setContent('');
      setMediaUrls([]);
      setShowAttachMenu(false);
      setIsSubmitting(false);
      onPostCreated();
    }, 300);
  };

  // Simulação e seleção de upload de arquivos (aceita arquivos reais ou imagens da irmandade)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setMediaUrls((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSampleRoadPhoto = () => {
    setMediaUrls((prev) => [...prev, '/src/assets/images/motokas_road_trip_1791830557313.jpg']);
  };

  const handleAddSampleClubhousePhoto = () => {
    setMediaUrls((prev) => [...prev, '/src/assets/images/motokas_clubhouse_gathering_1791830585214.jpg']);
  };

  const removeMedia = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-neutral-200 p-4 mb-4">
      <div className="flex gap-3">
        <img
          src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
          alt={currentUser?.nickname || 'Membro'}
          className="w-10 h-10 rounded-full object-cover shrink-0 border border-neutral-200"
        />
        <div className="flex-1">
          <form onSubmit={handleCreatePost}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`O que você quer compartilhar com a Irmandade, ${currentUser?.nickname || 'Irmão'}?`}
              rows={3}
              className="w-full resize-none border-none focus:outline-none text-sm text-[#1C1E21] placeholder-neutral-400 p-1"
            />

            {/* PRÉ-VISUALIZAÇÃO DE MÍDIAS ANEXADAS */}
            {mediaUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-2 p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                {mediaUrls.map((url, idx) => (
                  <div key={idx} className="relative group aspect-video rounded-md overflow-hidden bg-neutral-900">
                    <img
                      src={url}
                      alt={`Anexo ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => removeMedia(idx)}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white p-1 rounded-full transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-neutral-100 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                
                {/* BOTÃO ADICIONAR FOTO / VÍDEO DO DISPOSITIVO */}
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-100 cursor-pointer transition-colors">
                  <Image className="w-4 h-4 text-emerald-600" />
                  <span>Foto / Vídeo</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* ATALHO RÁPIDO PARA FOTOS DA HISTÓRIA DO MC */}
                <button
                  type="button"
                  onClick={handleAddSampleRoadPhoto}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                  title="Anexar foto oficial de estrada do Los Motokas MC"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Foto Comboio</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddSampleClubhousePhoto}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                  title="Anexar foto de encontro no Clubhouse"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>Foto Clubhouse</span>
                </button>

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
                disabled={isSubmitting || (!content.trim() && mediaUrls.length === 0)}
                className="px-5 py-2 bg-[#1877F2] hover:bg-[#0866FF] disabled:opacity-50 disabled:hover:bg-[#1877F2] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Publicando...
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
