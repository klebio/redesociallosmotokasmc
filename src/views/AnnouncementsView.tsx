import React, { useState } from 'react';
import { 
  Megaphone, Plus, Shield, AlertTriangle, Calendar, 
  Trash2, X, Check, Bell 
} from 'lucide-react';
import { Announcement, Profile } from '../types/database';
import { store } from '../services/store';

interface AnnouncementsViewProps {
  currentUser: Profile | null;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({
  currentUser,
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(store.getAnnouncements());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');

  const isDiretoria = currentUser?.role === 'diretoria';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    store.createAnnouncement({
      title: title.trim(),
      content: content.trim(),
      priority,
    });

    setAnnouncements(store.getAnnouncements());
    setShowCreateModal(false);
    setTitle('');
    setContent('');
    setPriority('normal');
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja excluir este comunicado oficial?')) {
      store.deleteAnnouncement(id);
      setAnnouncements(store.getAnnouncements());
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 w-full max-w-full overflow-x-hidden">
      
      {/* CABEÇALHO */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
            <Megaphone className="w-4 h-4" />
            <span>Mural Oficial de Editais</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 font-['Plus_Jakarta_Sans']">
            Comunicados Oficiais da Diretoria
          </h2>
          <p className="text-xs text-neutral-500">
            Orientações, regras de estrada, convocações de assembleia e comunicados urgentes.
          </p>
        </div>

        {isDiretoria && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            Emitir Comunicado
          </button>
        )}
      </div>

      {/* LISTAGEM DE COMUNICADOS */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <Bell className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
            <h4 className="font-bold text-neutral-800 text-sm">Nenhum comunicado ativo</h4>
            <p className="text-xs text-neutral-500 mt-1">
              Todos os editais anteriores foram arquivados.
            </p>
          </div>
        ) : (
          announcements.map((ann) => (
            <article
              key={ann.id}
              className={`bg-white rounded-xl border shadow-xs overflow-hidden transition-all ${
                ann.priority === 'urgent'
                  ? 'border-red-300 ring-1 ring-red-200/50'
                  : 'border-neutral-200'
              }`}
            >
              <div className={`px-5 py-3 border-b flex items-center justify-between ${
                ann.priority === 'urgent' ? 'bg-red-50/70 border-red-100 text-red-900' : 'bg-neutral-50 border-neutral-100 text-neutral-700'
              }`}>
                <div className="flex items-center gap-2">
                  {ann.priority === 'urgent' ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-600 text-white">
                      <AlertTriangle className="w-3 h-3" />
                      Urgente
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-[#1877F2]">
                      <Shield className="w-3 h-3" />
                      Informativo
                    </span>
                  )}
                  <span className="text-xs text-neutral-500">
                    {new Date(ann.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                {isDiretoria && (
                  <button
                    onClick={() => handleDelete(ann.id)}
                    className="text-neutral-400 hover:text-red-600 p-1 transition-colors"
                    title="Excluir comunicado"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="p-5">
                <h3 className="text-base font-bold text-neutral-900 mb-2 font-['Plus_Jakarta_Sans']">
                  {ann.title}
                </h3>
                <div className="text-xs text-neutral-700 leading-relaxed whitespace-pre-line">
                  {ann.content}
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                  <div className="flex items-center gap-2">
                    <img
                      src={ann.author?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                      alt={ann.author?.nickname || 'Diretoria'}
                      className="w-5 h-5 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100';
                      }}
                    />
                    <span>Emitido por: <b>{ann.author?.nickname || 'Diretoria'}</b></span>
                  </div>
                  <span className="font-semibold text-neutral-600">Los Motokas MC</span>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* MODAL: NOVO COMUNICADO */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-neutral-200 overflow-hidden">
            <div className="bg-red-600 text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm">Emitir Comunicado Oficial da Diretoria</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Título do Comunicado</label>
                <input
                  type="text"
                  placeholder="Ex: Convocação para Reunião de Pauta e Alinhamento"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Conteúdo Oficial</label>
                <textarea
                  rows={5}
                  placeholder="Escreva as diretrizes completas para os irmãos..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Prioridade</label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none"
                >
                  <option value="normal">Informativo Normal</option>
                  <option value="urgent">Urgente (Destaque Vermelho no Topo do Feed)</option>
                </select>
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
                  className="px-5 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs"
                >
                  Publicar Edital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
