import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, UserCheck, UserX, Clock, AlertCircle, 
  FileText, CheckCircle2, ChevronRight, UserCog, History, 
  Copy, Check, Share2, Send, ExternalLink, Sparkles, Database, Terminal, RefreshCw, Upload, Camera
} from 'lucide-react';
import { MemberRequest, Profile, AuditLog, MemberRole, MemberStatus } from '../types/database';
import { store } from '../services/store';
import { SUPABASE_SQL_MIGRATION } from '../lib/schema-generator';
import { isSupabaseConfigured, getStoredConfig } from '../lib/supabase';

interface AdminViewProps {
  currentUser: Profile | null;
  onNavigateToProfile: (userId: string) => void;
  onOpenConfig?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  onNavigateToProfile,
  onOpenConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'members' | 'audit' | 'database'>('requests');
  const [requests, setRequests] = useState<MemberRequest[]>(store.getRequests());
  const [members, setMembers] = useState<Profile[]>(store.getMembers());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(store.getAuditLogs());
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [officialEmblem, setOfficialEmblem] = useState<string>(store.getOfficialEmblem());
  const [emblemUploadMsg, setEmblemUploadMsg] = useState<string | null>(null);
  const adminEmblemRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setRequests(store.getRequests());
      setMembers(store.getMembers());
      setAuditLogs(store.getAuditLogs());
      setOfficialEmblem(store.getOfficialEmblem());
    });
    return unsub;
  }, []);

  const handleAdminEmblemUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) return;

      if (isGif) {
        store.setOfficialEmblem(src);
        setOfficialEmblem(src);
        setEmblemUploadMsg('Emblema Oficial em GIF Animado salvo e sincronizado no Supabase com sucesso!');
        setTimeout(() => setEmblemUploadMsg(null), 4000);
        return;
      }

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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          store.setOfficialEmblem(dataUrl);
          setOfficialEmblem(dataUrl);
        } else {
          store.setOfficialEmblem(src);
          setOfficialEmblem(src);
        }
        setEmblemUploadMsg('Emblema oficial atualizado e salvo no Supabase!');
        setTimeout(() => setEmblemUploadMsg(null), 4000);
      };
      img.onerror = () => {
        store.setOfficialEmblem(src);
        setOfficialEmblem(src);
        setEmblemUploadMsg('Emblema oficial atualizado!');
        setTimeout(() => setEmblemUploadMsg(null), 4000);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const config = getStoredConfig();
  const isConfigured = isSupabaseConfigured();

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const inviteUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?convite=losmotokas` 
    : '';

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const isDiretoria = store.isDiretoria(currentUser);

  const handleApproveRequest = (id: string) => {
    store.approveRequest(id);
    setRequests(store.getRequests());
    setMembers(store.getMembers());
    setAuditLogs(store.getAuditLogs());
  };

  const handleRejectRequest = (id: string) => {
    store.rejectRequest(id);
    setRequests(store.getRequests());
    setAuditLogs(store.getAuditLogs());
  };

  const handleRoleChange = (memberId: string, newRole: MemberRole) => {
    store.updateMemberRole(memberId, newRole);
    setMembers(store.getMembers());
    setAuditLogs(store.getAuditLogs());
  };

  const handleStatusChange = (memberId: string, newStatus: MemberStatus) => {
    store.updateMemberStatus(memberId, newStatus);
    setMembers(store.getMembers());
    setAuditLogs(store.getAuditLogs());
  };

  const pendingRequests = requests.filter((r: MemberRequest) => r.status === 'pending');

  if (!isDiretoria) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="p-3 bg-red-100 text-red-600 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-neutral-900">Acesso Restrito à Diretoria</h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
          Este painel é de uso exclusivo dos oficiais da diretoria do Los Motokas MC.
          Apenas membros com a patente de Diretoria têm autorização para aprovar novos membros e gerenciar a irmandade.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 w-full max-w-full">
      
      {/* CABEÇALHO DO PAINEL */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#1877F2] uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Gabinete da Diretoria</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 font-['Plus_Jakarta_Sans']">
              Painel de Gestão da Irmandade
            </h2>
            <p className="text-xs text-neutral-500">
              Controle de novos membros, aprovação de solicitações, patentes e auditoria administrativa.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="bg-blue-50 text-[#1877F2] px-3 py-1.5 rounded-lg border border-blue-200">
              {pendingRequests.length} solicitações pendentes
            </span>
          </div>
        </div>

        {/* CARD GERADOR DE LINK DE CONVITE */}
        <div className="mt-4 pt-4 border-t border-neutral-100 bg-gradient-to-r from-blue-50 to-indigo-50/50 p-4 rounded-xl border border-blue-200/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#1877F2]">
                <Sparkles className="w-3.5 h-3.5" />
                Link Oficial de Convite para Criar Perfil
              </span>
              <p className="text-[11px] text-neutral-600">
                Envie este link para um irmão. Ao clicar, a página abrirá diretamente no formulário para ele criar e personalizar seu perfil individual!
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyInvite}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedInvite ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Link Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar Link de Convite
                  </>
                )}
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Irmão, aqui está o seu convite oficial para criar seu perfil na rede social exclusiva do Los Motokas MC (Mossoró/RN): ${inviteUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                title="Compartilhar pelo WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          <div className="mt-2.5 bg-white px-3 py-1.5 rounded-lg border border-blue-200 text-xs font-mono text-neutral-600 truncate select-all">
            {inviteUrl}
          </div>

          {/* PRÉVIA VISUAL DO CONVITE COM O EMBLEMA OFICIAL */}
          <div className="mt-3 pt-3 border-t border-blue-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={adminEmblemRef}
                accept="image/*,image/gif,.gif"
                className="hidden"
                onChange={handleAdminEmblemUpload}
              />
              <div className="w-12 h-12 rounded-full bg-white p-0.5 border-2 border-[#1877F2]/40 overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
                <img
                  src={officialEmblem || '/escudo_oficial.jpg'}
                  alt="Emblema Oficial Ativo"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/escudo_oficial.jpg';
                  }}
                />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5 flex-wrap">
                  <span>Emblema Oficial Ativo</span>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">Sincronizado Supabase</span>
                  <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">Suporta GIF Animado</span>
                </span>
                <p className="text-[11px] text-neutral-500">
                  Este é o brasão oficial exibido para todos os membros e nos convites.
                </p>
                {emblemUploadMsg && (
                  <p className="text-xs font-bold text-emerald-600 mt-1 animate-in fade-in flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {emblemUploadMsg}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => adminEmblemRef.current?.click()}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 self-end sm:self-auto"
              title="Carregar arquivo GIF ou imagem do PC"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Enviar Emblema (GIF/Imagem)</span>
            </button>
          </div>
        </div>

        {/* CARD DOS ADMINISTRADORES OFICIAIS SALVOS */}
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#1877F2]" />
              Administradores Oficiais do Sistema (Diretoria Permanente)
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              2 Administradores Salvos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {['jequisilveira@gmail.com', 'klebiohonoratorocha@gmail.com'].map((adminEmail) => {
              const adminProfile = members.find((m) => m.email.toLowerCase().trim() === adminEmail.toLowerCase().trim());
              return (
                <div
                  key={adminEmail}
                  className="p-3 bg-neutral-50 hover:bg-blue-50/50 rounded-xl border border-neutral-200/90 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-white p-0.5 border border-[#1877F2]/30 overflow-hidden shrink-0 shadow-2xs">
                      <img
                        src={adminProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                        alt={adminProfile?.nickname || 'Administrador'}
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-neutral-900 truncate">
                          {adminProfile?.nickname || (adminEmail.startsWith('jequi') ? 'Jequi Silveira' : 'Klébio Honorato')}
                        </span>
                        <span className="text-[10px] font-bold bg-[#1877F2] text-white px-1.5 py-0.5 rounded leading-none">
                          Diretoria
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-500 block truncate" title={adminEmail}>
                        {adminEmail}
                      </span>
                    </div>
                  </div>

                  {adminProfile && (
                    <button
                      type="button"
                      onClick={() => onNavigateToProfile(adminProfile.id)}
                      className="shrink-0 px-2.5 py-1 text-[11px] font-bold text-[#1877F2] bg-white hover:bg-blue-100/60 rounded-md border border-blue-200 transition-colors shadow-2xs"
                    >
                      Ver Perfil
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ABAS COM ROLAGEM HORIZONTAL SUAVE SEM BARRA */}
        <div className="flex border-b border-neutral-200 mt-6 text-xs font-bold gap-3 sm:gap-6 overflow-x-auto scrollbar-none whitespace-nowrap max-w-full pb-0.5">
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'requests'
                ? 'border-[#1877F2] text-[#1877F2]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Fila de Adesão ({pendingRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'members'
                ? 'border-[#1877F2] text-[#1877F2]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <UserCog className="w-4 h-4" />
            <span>Gerenciar Patentes & Acessos ({members.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'audit'
                ? 'border-[#1877F2] text-[#1877F2]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Registros de Auditoria ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'database'
                ? 'border-[#1877F2] text-[#1877F2]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Banco de Dados & SQL</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">Ativo</span>
          </button>
        </div>
      </div>

      {/* ABA 1: FILA DE ADESÃO */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center shadow-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-bold text-neutral-800 text-sm">Fila de adesão zerada</h4>
              <p className="text-xs text-neutral-500 mt-1">
                Todas as solicitações de novos membros já foram analisadas pela Diretoria.
              </p>
            </div>
          ) : (
            pendingRequests.map((req: MemberRequest) => (
              <div key={req.id} className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-900">
                      {req.nickname} ({req.full_name})
                    </span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Aguardando Diretoria
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-600">
                    <div><b>Moto:</b> {req.motorcycle_model}</div>
                    <div><b>E-mail:</b> {req.email}</div>
                    <div><b>Telefone:</b> {req.phone}</div>
                    <div><b>Cidade:</b> {req.city || 'Não informada'}</div>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-lg text-xs text-neutral-700 italic border border-neutral-100">
                    "{req.reason}"
                  </div>

                  <span className="text-[10px] text-neutral-400 block">
                    Solicitado em: {new Date(req.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>

                <div className="flex sm:flex-col justify-end gap-2 shrink-0">
                  <button
                    onClick={() => handleApproveRequest(req.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Aprovar como Aspirante
                  </button>

                  <button
                    onClick={() => handleRejectRequest(req.id)}
                    className="px-4 py-2 bg-neutral-100 hover:bg-red-50 text-neutral-700 hover:text-red-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <UserX className="w-4 h-4" />
                    Rejeitar Pedido
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ABA 2: GERENCIAR PATENTES E ACESSOS */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          
          {/* VISUALIZAÇÃO EM CARDS PARA CELULAR E TELAS COMPACTAS (SEM ESCONDER INFORMAÇÕES) */}
          <div className="md:hidden space-y-3">
            {members.map((m: Profile) => (
              <div 
                key={m.id} 
                className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={m.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                      alt={m.nickname}
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-neutral-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100';
                      }}
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-neutral-900 block truncate">{m.nickname}</span>
                      <span className="text-[11px] text-neutral-500 block truncate">{m.full_name}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateToProfile(m.id)}
                    className="shrink-0 px-2.5 py-1 text-xs text-[#1877F2] font-bold bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                  >
                    Ver Perfil
                  </button>
                </div>

                {m.motorcycle_model && (
                  <div className="text-xs text-neutral-600 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100 flex items-center justify-between">
                    <span className="text-neutral-400 font-semibold">Máquina:</span>
                    <span className="font-bold text-neutral-800">{m.motorcycle_model}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-neutral-100">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">
                      Patente / Cargo
                    </label>
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value as MemberRole)}
                      className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-lg bg-white font-semibold capitalize focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
                    >
                      <option value="diretoria">Diretoria</option>
                      <option value="membro">Membro Oficial</option>
                      <option value="aspirante">Aspirante</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">
                      Status na Estrada
                    </label>
                    <select
                      value={m.status}
                      onChange={(e) => handleStatusChange(m.id, e.target.value as MemberStatus)}
                      className={`w-full px-2 py-1.5 text-xs border rounded-lg font-semibold capitalize focus:outline-none ${
                        m.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}
                    >
                      <option value="active">Ativo na Estrada</option>
                      <option value="suspended">Suspenso</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* VISUALIZAÇÃO EM TABELA PARA COMPUTADOR E TABLET COM SCROLLBAR VISÍVEL */}
          <div className="hidden md:block bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto pb-1">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-neutral-50 border-b border-neutral-200 font-bold text-neutral-600 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Membro</th>
                    <th className="px-4 py-3">Máquina</th>
                    <th className="px-4 py-3">Patente Atual</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {members.map((m: Profile) => (
                    <tr key={m.id} className="hover:bg-neutral-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={m.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                            alt={m.nickname}
                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-neutral-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100';
                            }}
                          />
                          <div>
                            <span className="font-bold text-neutral-900 block">{m.nickname}</span>
                            <span className="text-[11px] text-neutral-500 block">{m.full_name}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-neutral-600 font-medium">
                        {m.motorcycle_model || 'Não especificada'}
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, e.target.value as MemberRole)}
                          className="px-2 py-1 text-xs border border-neutral-200 rounded-md bg-white font-semibold capitalize focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
                        >
                          <option value="diretoria">Diretoria</option>
                          <option value="membro">Membro Oficial</option>
                          <option value="aspirante">Aspirante</option>
                        </select>
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={m.status}
                          onChange={(e) => handleStatusChange(m.id, e.target.value as MemberStatus)}
                          className={`px-2 py-1 text-xs border rounded-md font-semibold capitalize focus:outline-none ${
                            m.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-red-50 text-red-800 border-red-200'
                          }`}
                        >
                          <option value="active">Ativo na Estrada</option>
                          <option value="suspended">Suspenso</option>
                        </select>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onNavigateToProfile(m.id)}
                          className="text-xs text-[#1877F2] hover:underline font-bold"
                        >
                          Ver Perfil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ABA 3: AUDITORIA ADMINISTRATIVA */}
      {activeTab === 'audit' && (
        <div className="space-y-3">
          
          {/* CARDS DE AUDITORIA PARA CELULAR */}
          <div className="md:hidden space-y-2.5">
            {auditLogs.map((log: AuditLog) => (
              <div key={log.id} className="bg-white rounded-xl border border-neutral-200 p-3.5 shadow-xs space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-800">
                    {log.action}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="font-semibold text-neutral-900">
                  Responsável: <span className="text-[#1877F2]">{log.actor?.nickname || 'Sistema'}</span>
                </div>
                <p className="text-neutral-600 bg-neutral-50 p-2 rounded-lg border border-neutral-100 text-[11px]">
                  {log.details}
                </p>
              </div>
            ))}
          </div>

          {/* TABELA DE AUDITORIA PARA COMPUTADOR E TABLET */}
          <div className="hidden md:block bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto pb-1">
              <table className="w-full text-left text-xs font-mono min-w-[650px]">
                <thead className="bg-neutral-50 border-b border-neutral-200 font-sans font-bold text-neutral-600 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3 font-sans">Data / Hora</th>
                    <th className="px-4 py-3 font-sans">Ação</th>
                    <th className="px-4 py-3 font-sans">Oficial Responsável</th>
                    <th className="px-4 py-3 font-sans">Detalhes da Operação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {auditLogs.map((log: AuditLog) => (
                    <tr key={log.id} className="hover:bg-neutral-50/50">
                      <td className="px-4 py-2.5 text-neutral-500 tabular-nums whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-sans font-semibold text-neutral-900">
                        {log.actor?.nickname || 'Sistema'}
                      </td>
                      <td className="px-4 py-2.5 font-sans text-neutral-700">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ABA 4: BANCO DE DADOS & SQL MIGRATION */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          
          {/* CARD DE STATUS DA CONEXÃO */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-[#1877F2] rounded-xl border border-blue-200">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">
                    Supabase PostgreSQL & Storage Oficial
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Instância conectada e pronta para persistência dos dados do Los Motokas MC
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Instância Ativa (200 OK)
                </span>
                {onOpenConfig && (
                  <button
                    onClick={onOpenConfig}
                    className="px-3 py-1 text-xs font-semibold text-[#1877F2] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                  >
                    Credenciais
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Project URL (VITE_SUPABASE_URL)
                </span>
                <span className="font-mono text-neutral-800 break-all select-all font-semibold block">
                  {config.url}
                </span>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Anon Public Key
                </span>
                <span className="font-mono text-neutral-800 break-all select-all block truncate">
                  {config.anonKey.slice(0, 36)}...{config.anonKey.slice(-16)}
                </span>
              </div>
            </div>

            {/* AÇÕES RÁPIDAS */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-neutral-100">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="https://supabase.com/dashboard/project/vqxocqqjzchpynrertcu/sql/new"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Abrir SQL Editor no Supabase</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Script SQL Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Script SQL Completo</span>
                    </>
                  )}
                </button>
              </div>

              <span className="text-[11px] text-neutral-500">
                13 Tabelas + Bucket <code>motokas-media</code> + RLS
              </span>
            </div>
          </div>

          {/* PASSO A PASSO PARA EXECUTAR */}
          <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-xl border border-blue-200 p-5 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#1877F2] flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              <span>Instruções para Execução do Script no Supabase</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-blue-100 space-y-1">
                <span className="w-5 h-5 rounded-full bg-[#1877F2] text-white font-bold text-[10px] flex items-center justify-center">1</span>
                <span className="font-bold text-neutral-900 block">Abra o SQL Editor</span>
                <span className="text-[11px] text-neutral-500 block leading-tight">
                  Clique no botão azul acima para ir direto ao SQL Editor do seu projeto Supabase.
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-100 space-y-1">
                <span className="w-5 h-5 rounded-full bg-[#1877F2] text-white font-bold text-[10px] flex items-center justify-center">2</span>
                <span className="font-bold text-neutral-900 block">Cole o Script</span>
                <span className="text-[11px] text-neutral-500 block leading-tight">
                  Clique em "Copiar Script SQL Completo" e cole na janela de query do Supabase.
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-100 space-y-1">
                <span className="w-5 h-5 rounded-full bg-[#1877F2] text-white font-bold text-[10px] flex items-center justify-center">3</span>
                <span className="font-bold text-neutral-900 block">Clique em "Run"</span>
                <span className="text-[11px] text-neutral-500 block leading-tight">
                  Pressione o botão verde <b>RUN</b> (ou Ctrl+Enter) para criar as tabelas e permissões.
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-100 space-y-1">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">✓</span>
                <span className="font-bold text-neutral-900 block">Pronto!</span>
                <span className="text-[11px] text-neutral-500 block leading-tight">
                  Todas as fotos, postagens, membros e o emblema serão sincronizados em tempo real.
                </span>
              </div>
            </div>
          </div>

          {/* PREVIEW DO CÓDIGO SQL */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
            <div className="bg-neutral-800 text-neutral-300 px-4 py-2.5 flex items-center justify-between text-xs border-b border-neutral-700">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-mono font-bold text-neutral-200">losmotokas_supabase_migration.sql</span>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="text-xs text-neutral-200 hover:text-white bg-neutral-700 hover:bg-neutral-600 px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4 bg-neutral-900 text-neutral-200 font-mono text-[11px] h-96 overflow-y-auto leading-relaxed select-all">
              <pre className="whitespace-pre-wrap">{SUPABASE_SQL_MIGRATION}</pre>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
