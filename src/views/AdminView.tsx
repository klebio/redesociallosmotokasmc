import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, UserCheck, UserX, Clock, AlertCircle, 
  FileText, CheckCircle2, ChevronRight, UserCog, History, 
  Copy, Check, Share2, Send, ExternalLink, Sparkles, Database, 
  Terminal, RefreshCw, Upload, Camera, Trash2, PauseCircle, 
  PlayCircle, AlertTriangle, X, Shield, Flame
} from 'lucide-react';
import { MemberRequest, Profile, AuditLog, MemberRole, MemberStatus } from '../types/database';
import { store } from '../services/store';

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
  const [activeTab, setActiveTab] = useState<'requests' | 'members' | 'audit' | 'database'>('members');
  const [requests, setRequests] = useState<MemberRequest[]>(store.getRequests());
  const [members, setMembers] = useState<Profile[]>(store.getMembers());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(store.getAuditLogs());
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [officialEmblem, setOfficialEmblem] = useState<string>(store.getOfficialEmblem());
  const [emblemUploadMsg, setEmblemUploadMsg] = useState<string | null>(null);
  const adminEmblemRef = React.useRef<HTMLInputElement | null>(null);

  // Estados para Suspensão de Membro
  const [suspendingMember, setSuspendingMember] = useState<Profile | null>(null);
  const [suspensionReason, setSuspensionReason] = useState<string>('Ausência não justificada nas assembleias do clube');
  const [isSubmittingSuspension, setIsSubmittingSuspension] = useState(false);

  // Estados para Exclusão de Membro
  const [deletingMember, setDeletingMember] = useState<Profile | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Feedback de ações
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4500);
  };

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
        setEmblemUploadMsg('Emblema Oficial em GIF Animado salvo e sincronizado no Firebase Firestore!');
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
        setEmblemUploadMsg('Emblema oficial atualizado e salvo no Firebase Firestore!');
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
    showFeedback('Solicitação de adesão aprovada! Novo membro adicionado.');
  };

  const handleRejectRequest = (id: string) => {
    store.rejectRequest(id);
    setRequests(store.getRequests());
    setAuditLogs(store.getAuditLogs());
    showFeedback('Solicitação de adesão rejeitada.');
  };

  const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
    await store.updateMemberRole(memberId, newRole);
    setMembers(store.getMembers());
    setAuditLogs(store.getAuditLogs());
    showFeedback(`Patente do membro atualizada para ${newRole.toUpperCase()}.`);
  };

  // Abrir modal de suspensão
  const handleOpenSuspendModal = (member: Profile) => {
    if (store.isAdminEmail(member.email)) {
      showFeedback('Os administradores oficiais fundadores não podem ser suspensos.', 'error');
      return;
    }
    setSuspendingMember(member);
    setSuspensionReason('Ausência não justificada nas assembleias do clube');
  };

  // Confirmar suspensão temporária
  const handleConfirmSuspend = async () => {
    if (!suspendingMember) return;
    setIsSubmittingSuspension(true);
    try {
      await store.updateMemberStatus(suspendingMember.id, 'suspended', suspensionReason);
      setMembers(store.getMembers());
      setAuditLogs(store.getAuditLogs());
      showFeedback(`Perfil de ${suspendingMember.nickname} foi SUSPENSO TEMPORARIAMENTE pela Diretoria.`, 'success');
      setSuspendingMember(null);
    } catch (err: any) {
      showFeedback(err?.message || 'Erro ao suspender perfil.', 'error');
    } finally {
      setIsSubmittingSuspension(false);
    }
  };

  // Reativar perfil suspenso
  const handleReactivate = async (member: Profile) => {
    try {
      await store.updateMemberStatus(member.id, 'active');
      setMembers(store.getMembers());
      setAuditLogs(store.getAuditLogs());
      showFeedback(`Perfil de ${member.nickname} reativado na estrada com sucesso!`, 'success');
    } catch (err: any) {
      showFeedback(err?.message || 'Erro ao reativar perfil.', 'error');
    }
  };

  // Confirmar exclusão definitiva do perfil
  const handleConfirmDelete = async () => {
    if (!deletingMember) return;
    setIsSubmittingDelete(true);
    try {
      await store.deleteMember(deletingMember.id);
      setMembers(store.getMembers());
      setAuditLogs(store.getAuditLogs());
      showFeedback(`Perfil de ${deletingMember.nickname} (${deletingMember.full_name}) foi EXCLUÍDO definitivamente do motoclube.`, 'success');
      setDeletingMember(null);
    } catch (err: any) {
      showFeedback(err?.message || 'Erro ao excluir perfil.', 'error');
    } finally {
      setIsSubmittingDelete(false);
    }
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
          Apenas membros com a patente de Diretoria têm autorização para gerenciar a irmandade, suspender e excluir perfis.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2.5 sm:px-4 py-4 sm:py-6 w-full max-w-full overflow-x-hidden">
      
      {/* TOAST / ALERTA DE FEEDBACK */}
      {feedbackMsg && (
        <div className={`mb-4 p-3.5 rounded-xl border flex items-center justify-between gap-3 shadow-md animate-in fade-in duration-200 ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
            : 'bg-red-50 text-red-900 border-red-300'
        }`}>
          <div className="flex items-center gap-2.5 text-xs font-bold">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button 
            onClick={() => setFeedbackMsg(null)}
            className="text-neutral-400 hover:text-neutral-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CABEÇALHO DO PAINEL DA DIRETORIA */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-6 mb-6 shadow-xs max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-[#1877F2]/10 text-[#1877F2] rounded-xl shrink-0">
              <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 font-['Plus_Jakarta_Sans'] tracking-tight">
                Gestão da Diretoria — Los Motokas MC
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Painel administrativo de controle de membros, suspensão temporária, exclusão e banco de dados Firebase.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Firebase Firestore Conectado
            </span>
          </div>
        </div>

        {/* BOX DE CONVITE OFICIAL */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-blue-50/90 rounded-xl border border-blue-200 text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#1877F2] shrink-0" />
              <span className="font-extrabold text-[#1877F2] uppercase tracking-wider text-[11px]">
                Link de Convite Oficial para Novos Irmãos
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyInvite}
                className="px-3 py-1 bg-white hover:bg-neutral-50 text-neutral-700 font-bold rounded-md border border-neutral-300 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                {copiedInvite ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `🏍️ *LOS MOTOKAS MC - Convite Oficial da Irmandade*\n\nIrmão, você foi convidado pela Diretoria para se juntar à nossa rede social oficial e privativa!\n\nAcesse o link abaixo para criar seu perfil de membro:\n${inviteUrl}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-md transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Mandar no WhatsApp</span>
              </a>
            </div>
          </div>
          
          <div className="mt-2.5 bg-white px-3 py-1.5 rounded-lg border border-blue-200 text-xs font-mono text-neutral-600 truncate select-all">
            {inviteUrl}
          </div>

          {/* PRÉVIA DO EMBLEMA ATIVO */}
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
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">Sincronizado Firebase</span>
                  <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">Suporta GIF Animado</span>
                </span>
                <p className="text-[11px] text-neutral-500">
                  Exibido em convites, linha do tempo e cabeçalho oficial do clube.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => adminEmblemRef.current?.click()}
              className="px-3 py-1.5 bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Trocar Emblema Oficial</span>
            </button>
          </div>

          {emblemUploadMsg && (
            <div className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{emblemUploadMsg}</span>
            </div>
          )}
        </div>

        {/* NAVEGAÇÃO DAS ABAS ADMINISTRATIVAS */}
        <div className="flex border-b border-neutral-200 mt-6 text-xs font-bold gap-3 sm:gap-6 overflow-x-auto scrollbar-none whitespace-nowrap max-w-full pb-0.5">
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'members'
                ? 'border-[#1877F2] text-[#1877F2]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <UserCog className="w-4 h-4" />
            <span>Gestão de Membros ({members.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'requests'
                ? 'border-[#1877F2] text-[#1877F2]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Solicitações de Adesão</span>
            {pendingRequests.length > 0 && (
              <span className="bg-[#1877F2] text-white px-1.5 py-0.2 rounded-full text-[10px]">
                {pendingRequests.length}
              </span>
            )}
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
            <span>Auditoria & Registros ({auditLogs.length})</span>
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
            <span>Banco de Dados Firebase</span>
          </button>
        </div>
      </div>

      {/* ABA 1: GESTÃO DE MEMBROS (SUSPENSÃO & EXCLUSÃO) */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-neutral-900">
                Quadro de Membros da Irmandade ({members.length})
              </h3>
              <p className="text-xs text-neutral-500">
                Você pode gerenciar patentes, suspender temporariamente membros ou excluir perfis se necessário.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                {members.filter(m => m.status === 'active').length} Ativos
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 font-bold">
                {members.filter(m => m.status === 'suspended').length} Suspensos
              </span>
            </div>
          </div>

          {/* VISUALIZAÇÃO EM CARDS PARA CELULAR */}
          <div className="md:hidden space-y-3">
            {members.map((m: Profile) => {
              const isFoundingAdmin = store.isAdminEmail(m.email);
              const isSuspended = m.status === 'suspended';

              return (
                <div 
                  key={m.id} 
                  className={`bg-white rounded-xl border p-4 shadow-xs space-y-3 transition-colors ${
                    isSuspended 
                      ? 'border-amber-300 bg-amber-50/20' 
                      : 'border-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={m.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                        alt={m.nickname}
                        className="w-11 h-11 rounded-full object-cover shrink-0 border border-neutral-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100';
                        }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-neutral-900 truncate">{m.nickname}</span>
                          {isFoundingAdmin && (
                            <span className="text-[9px] font-extrabold uppercase bg-[#1877F2] text-white px-1.5 py-0.2 rounded">
                              Fundador
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-500 block truncate">{m.full_name}</span>
                        <span className="text-[10px] text-neutral-400 block truncate font-mono">{m.email}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateToProfile(m.id)}
                      className="shrink-0 px-2.5 py-1 text-xs text-[#1877F2] font-bold bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                    >
                      Ver Perfil
                    </button>
                  </div>

                  {/* STATUS ATUAL COM BADGE DESTACADO */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-neutral-50 border border-neutral-200/80 text-xs">
                    <span className="font-semibold text-neutral-600">Status no Clube:</span>
                    {isSuspended ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                        <PauseCircle className="w-3.5 h-3.5 text-amber-700" />
                        Suspenso Temporariamente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Ativo na Estrada
                      </span>
                    )}
                  </div>

                  {isSuspended && m.suspension_reason && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      <strong>Motivo da Suspensão:</strong> {m.suspension_reason}
                    </div>
                  )}

                  {/* CONTROLES DE CARGO */}
                  <div className="pt-2 border-t border-neutral-100">
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">
                      Patente / Cargo Oficial
                    </label>
                    <select
                      value={m.role}
                      disabled={isFoundingAdmin}
                      onChange={(e) => handleRoleChange(m.id, e.target.value as MemberRole)}
                      className="w-full px-2.5 py-1.5 text-xs border border-neutral-200 rounded-lg bg-white font-semibold capitalize focus:outline-none focus:ring-1 focus:ring-[#1877F2] disabled:bg-neutral-100 disabled:opacity-70"
                    >
                      <option value="diretoria">Diretoria</option>
                      <option value="membro">Membro Oficial</option>
                      <option value="aspirante">Aspirante</option>
                    </select>
                  </div>

                  {/* BOTÕES DE AÇÃO: SUSPENDER / REATIVAR / EXCLUIR */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100">
                    {isSuspended ? (
                      <button
                        type="button"
                        onClick={() => handleReactivate(m)}
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>Reativar Perfil</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isFoundingAdmin}
                        onClick={() => handleOpenSuspendModal(m)}
                        className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                        title={isFoundingAdmin ? 'Fundador da diretoria não pode ser suspenso' : 'Suspender temporariamente o membro'}
                      >
                        <PauseCircle className="w-4 h-4" />
                        <span>Suspender</span>
                      </button>
                    )}

                    {isFoundingAdmin ? (
                      <div className="w-full py-2 px-2 text-center text-[11px] text-neutral-400 font-semibold bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-center">
                        Diretoria Fundadora
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingMember(m)}
                        className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                        <span>Excluir Perfil</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* VISUALIZAÇÃO EM TABELA PARA COMPUTADOR E TABLET */}
          <div className="hidden md:block bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto pb-1">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-neutral-50 border-b border-neutral-200 font-bold text-neutral-600 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Membro</th>
                    <th className="px-4 py-3">Máquina</th>
                    <th className="px-4 py-3">Patente Atual</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações da Diretoria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {members.map((m: Profile) => {
                    const isFoundingAdmin = store.isAdminEmail(m.email);
                    const isSuspended = m.status === 'suspended';

                    return (
                      <tr 
                        key={m.id} 
                        className={`hover:bg-neutral-50/50 transition-colors ${
                          isSuspended ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={m.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                              alt={m.nickname}
                              className="w-9 h-9 rounded-full object-cover shrink-0 border border-neutral-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100';
                              }}
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-neutral-900 block">{m.nickname}</span>
                                {isFoundingAdmin && (
                                  <span className="text-[9px] font-extrabold uppercase bg-[#1877F2] text-white px-1.5 py-0.2 rounded">
                                    Fundador
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-neutral-500 block">{m.full_name}</span>
                              <span className="text-[10px] text-neutral-400 block font-mono">{m.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-neutral-600 font-medium">
                          {m.motorcycle_model || 'Não especificada'}
                        </td>

                        <td className="px-4 py-3">
                          <select
                            value={m.role}
                            disabled={isFoundingAdmin}
                            onChange={(e) => handleRoleChange(m.id, e.target.value as MemberRole)}
                            className="px-2 py-1 text-xs border border-neutral-200 rounded-md bg-white font-semibold capitalize focus:outline-none focus:ring-1 focus:ring-[#1877F2] disabled:bg-neutral-100 disabled:opacity-70"
                          >
                            <option value="diretoria">Diretoria</option>
                            <option value="membro">Membro Oficial</option>
                            <option value="aspirante">Aspirante</option>
                          </select>
                        </td>

                        <td className="px-4 py-3">
                          {isSuspended ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                <PauseCircle className="w-3 h-3 text-amber-700" />
                                Suspenso
                              </span>
                              {m.suspension_reason && (
                                <span className="block text-[10px] text-neutral-500 truncate max-w-[150px]" title={m.suspension_reason}>
                                  {m.suspension_reason}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Ativo
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onNavigateToProfile(m.id)}
                              className="px-2.5 py-1 text-xs text-[#1877F2] hover:bg-blue-50 font-bold rounded-md transition-colors"
                            >
                              Ver Perfil
                            </button>

                            {isSuspended ? (
                              <button
                                type="button"
                                onClick={() => handleReactivate(m)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-md border border-emerald-300 transition-colors flex items-center gap-1 shadow-2xs"
                                title="Reativar perfil do membro na estrada"
                              >
                                <PlayCircle className="w-3.5 h-3.5" />
                                <span>Reativar</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isFoundingAdmin}
                                onClick={() => handleOpenSuspendModal(m)}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-md border border-amber-300 transition-colors flex items-center gap-1 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                                title={isFoundingAdmin ? 'Fundador da diretoria não pode ser suspenso' : 'Suspender temporariamente'}
                              >
                                <PauseCircle className="w-3.5 h-3.5" />
                                <span>Suspender</span>
                              </button>
                            )}

                            {!isFoundingAdmin && (
                              <button
                                type="button"
                                onClick={() => setDeletingMember(m)}
                                className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Excluir perfil definitivamente"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ABA 2: SOLICITAÇÕES DE ADESÃO */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center shadow-xs">
              <UserCheck className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <h4 className="font-bold text-neutral-800">Nenhuma solicitação pendente</h4>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                Quando novos motociclistas solicitarem entrada na irmandade, eles aparecerão aqui para julgamento da diretoria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((req: MemberRequest) => (
                <div key={req.id} className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-sm text-neutral-900 block">
                        {req.nickname} ({req.full_name})
                      </span>
                      <span className="text-xs text-neutral-500 font-mono block">{req.email}</span>
                      <span className="text-xs text-neutral-500 block">Tel: {req.phone}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Pendente
                    </span>
                  </div>

                  <div className="p-2.5 bg-neutral-50 rounded-lg text-xs space-y-1">
                    <div>
                      <span className="text-neutral-500">Moto: </span>
                      <strong className="text-neutral-800">{req.motorcycle_model}</strong>
                    </div>
                    {req.city && (
                      <div>
                        <span className="text-neutral-500">Cidade: </span>
                        <strong className="text-neutral-800">{req.city}</strong>
                      </div>
                    )}
                    <div>
                      <span className="text-neutral-500">Motivo: </span>
                      <p className="text-neutral-700 italic mt-0.5">"{req.reason}"</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-neutral-100">
                    <button
                      onClick={() => handleApproveRequest(req.id)}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Aprovar (Aspirante)</span>
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req.id)}
                      className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Recusar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 3: AUDITORIA */}
      {activeTab === 'audit' && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-neutral-900">Histórico de Auditoria & Segurança</h4>
                <p className="text-xs text-neutral-500">
                  Todas as ações administrativas, alterações de status, suspensões e exclusões são registradas.
                </p>
              </div>
              <span className="text-xs font-mono text-neutral-400">{auditLogs.length} eventos</span>
            </div>

            <div className="divide-y divide-neutral-100 max-h-[600px] overflow-y-auto">
              {auditLogs.map((log: AuditLog) => (
                <div key={log.id} className="p-3.5 hover:bg-neutral-50/60 transition-colors text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action.includes('EXCLUSAO') 
                          ? 'bg-red-100 text-red-800' 
                          : log.action.includes('SUSPENSAO')
                          ? 'bg-amber-100 text-amber-900'
                          : log.action.includes('REATIVACAO') || log.action.includes('APROVACAO')
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-neutral-100 text-neutral-800'
                      }`}>
                        {log.action}
                      </span>
                      <span className="font-semibold text-neutral-900">{log.details}</span>
                    </div>
                    <span className="text-[11px] text-neutral-400">
                      Responsável: {log.admin_email || log.actor?.email || 'Diretoria Oficial'}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-mono shrink-0">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: BANCO DE DADOS FIREBASE */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
                  <Flame className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">
                    Firebase Cloud Firestore Oficial
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Instância ativa, provisionada e sincronizando em tempo real para o Los Motokas MC
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Firestore Ativo & Sincronizado
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Firebase Project ID
                </span>
                <span className="font-mono text-neutral-800 font-semibold block truncate">
                  gen-lang-client-0106461785
                </span>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Database Instance ID
                </span>
                <span className="font-mono text-neutral-800 font-semibold block truncate">
                  ai-studio-losmotokasmcnoss-8f86054f-8d90-496e-8088-e8cbfe4253fa
                </span>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Região Cloud & Edição
                </span>
                <span className="font-mono text-neutral-800 font-semibold block">
                  us-east1 (Enterprise Edition)
                </span>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-blue-50/70 rounded-lg border border-blue-200 text-xs text-neutral-700 space-y-2">
              <div className="font-bold text-[#1877F2] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Regras de Segurança Deployed (`firestore.rules`)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                As regras de segurança estão ativas no projeto Firebase. Os dados de perfis, posts, comentários, álbuns, comunicados e solicitações contam com proteção contra violações e suporte nativo a tempo real via WebSockets.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUSPENDER TEMPORARIAMENTE PERFIL */}
      {suspendingMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-amber-500 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PauseCircle className="w-5 h-5" />
                <h3 className="font-black text-sm">Suspender Membro Temporariamente</h3>
              </div>
              <button 
                onClick={() => setSuspendingMember(null)}
                className="text-white/80 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <img
                  src={suspendingMember.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                  alt={suspendingMember.nickname}
                  className="w-12 h-12 rounded-full object-cover border border-neutral-300 shrink-0"
                />
                <div>
                  <h4 className="font-bold text-sm text-neutral-900 leading-tight">
                    {suspendingMember.nickname}
                  </h4>
                  <p className="text-neutral-500">{suspendingMember.full_name}</p>
                  <span className="text-[10px] text-neutral-400 capitalize">Patente: {suspendingMember.role}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-neutral-700">
                  Motivo da Suspensão:
                </label>
                <select
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Ausência não justificada nas assembleias do clube">Ausência não justificada nas assembleias do clube</option>
                  <option value="Conduta em desacordo com o estatuto da irmandade">Conduta em desacordo com o estatuto da irmandade</option>
                  <option value="Pendente de alinhamento com a Diretoria">Pendente de alinhamento com a Diretoria</option>
                  <option value="Afastamento temporário a pedido do próprio membro">Afastamento temporário a pedido do próprio membro</option>
                  <option value="Outro">Outro motivo especificado abaixo</option>
                </select>

                <textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  rows={2}
                  placeholder="Detalhes adicionais da decisão da diretoria..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs mt-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900">
                <strong>Efeito da Suspensão:</strong> Enquanto suspenso, o membro não poderá publicar novos posts ou comentários e verá o aviso de suspensão temporária. Você pode reativar o perfil a qualquer momento neste painel.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setSuspendingMember(null)}
                  className="px-4 py-2 font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSubmittingSuspension}
                  onClick={handleConfirmSuspend}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <PauseCircle className="w-4 h-4" />
                  <span>{isSubmittingSuspension ? 'Suspendendo...' : 'Confirmar Suspensão'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXCLUIR PERFIL DEFINITIVAMENTE */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-red-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-red-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-black text-sm">Excluir Perfil Definitivamente</h3>
              </div>
              <button 
                onClick={() => setDeletingMember(null)}
                className="text-white/80 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-red-50/50 rounded-xl border border-red-100">
                <img
                  src={deletingMember.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                  alt={deletingMember.nickname}
                  className="w-12 h-12 rounded-full object-cover border border-neutral-300 shrink-0"
                />
                <div>
                  <h4 className="font-bold text-sm text-neutral-900 leading-tight">
                    {deletingMember.nickname}
                  </h4>
                  <p className="text-neutral-500">{deletingMember.full_name}</p>
                  <span className="text-[10px] text-neutral-400 font-mono">{deletingMember.email}</span>
                </div>
              </div>

              <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-red-900 text-xs space-y-1">
                <span className="font-bold block">Atenção: Ação Irreversível!</span>
                <p className="text-[11px] leading-relaxed">
                  Tem certeza de que deseja excluir o perfil deste membro? Esta ação removerá definitivamente o cadastro da irmandade e do banco de dados Firebase Firestore.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setDeletingMember(null)}
                  className="px-4 py-2 font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSubmittingDelete}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isSubmittingDelete ? 'Excluindo...' : 'Sim, Excluir Perfil'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
