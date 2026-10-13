import React, { useState } from 'react';
import { 
  ShieldCheck, UserCheck, UserX, Clock, AlertCircle, 
  FileText, CheckCircle2, ChevronRight, UserCog, History, 
  Copy, Check, Share2, Send, ExternalLink, Sparkles 
} from 'lucide-react';
import { MemberRequest, Profile, AuditLog, MemberRole, MemberStatus } from '../types/database';
import { store } from '../services/store';

interface AdminViewProps {
  currentUser: Profile | null;
  onNavigateToProfile: (userId: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  onNavigateToProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'members' | 'audit'>('requests');
  const [requests, setRequests] = useState<MemberRequest[]>(store.getRequests());
  const [members, setMembers] = useState<Profile[]>(store.getMembers());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(store.getAuditLogs());
  const [copiedInvite, setCopiedInvite] = useState(false);

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

    </div>
  );
};
