import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Shield, Award, Calendar, Compass, ChevronRight, UserPlus, Copy, Check, Share2 
} from 'lucide-react';
import { Profile } from '../types/database';
import { store } from '../services/store';
import { getInviteUrl, getWhatsAppInviteUrl } from '../lib/invite';

interface MembersViewProps {
  onNavigateToProfile: (userId: string) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  onNavigateToProfile,
}) => {
  const [members, setMembers] = useState<Profile[]>(store.getMembers());
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'diretoria' | 'membro' | 'aspirante'>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setMembers(store.getMembers());
    });
    return unsub;
  }, []);

  const inviteUrl = getInviteUrl();

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch = 
      m.nickname.toLowerCase().includes(search.toLowerCase()) ||
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.motorcycle_model && m.motorcycle_model.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 w-full max-w-full overflow-x-hidden">
      
      {/* CABEÇALHO */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-6 mb-6 shadow-xs max-w-full overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#1877F2] uppercase tracking-wider mb-1">
              <Users className="w-4 h-4" />
              <span>Quadro Oficial de Membros</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 font-['Plus_Jakarta_Sans']">
              Irmãos do Los Motokas MC
            </h2>
            <p className="text-xs text-neutral-500 mb-2 sm:mb-0">
              Integrantes autorizados com colete e escudo da irmandade.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleCopyInvite}
                className="px-2.5 py-1.5 bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copiar link de convite oficial"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Convite</span>
                  </>
                )}
              </button>
              <a
                href={getWhatsAppInviteUrl()}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                title="Convidar irmão pelo WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 bg-neutral-100 p-1 rounded-lg text-xs font-semibold overflow-x-auto scrollbar-none max-w-full w-full md:w-auto">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
                roleFilter === 'all' ? 'bg-white text-[#1877F2] shadow-xs' : 'text-neutral-600'
              }`}
            >
              Todos ({members.length})
            </button>
            <button
              onClick={() => setRoleFilter('diretoria')}
              className={`px-3 py-1.5 rounded-md transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
                roleFilter === 'diretoria' ? 'bg-white text-[#1877F2] shadow-xs' : 'text-neutral-600'
              }`}
            >
              Diretoria
            </button>
            <button
              onClick={() => setRoleFilter('membro')}
              className={`px-3 py-1.5 rounded-md transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
                roleFilter === 'membro' ? 'bg-white text-[#1877F2] shadow-xs' : 'text-neutral-600'
              }`}
            >
              Membros Oficiais
            </button>
            <button
              onClick={() => setRoleFilter('aspirante')}
              className={`px-3 py-1.5 rounded-md transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
                roleFilter === 'aspirante' ? 'bg-white text-[#1877F2] shadow-xs' : 'text-neutral-600'
              }`}
            >
              Aspirantes
            </button>
          </div>
        </div>

        {/* CAMPO DE BUSCA */}
        <div className="mt-4 pt-3 border-t border-neutral-100">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por apelido, nome ou modelo de moto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
            />
          </div>
        </div>
      </div>

      {/* GRADE DE MEMBROS */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center shadow-xs max-w-lg mx-auto">
          <div className="w-16 h-16 bg-blue-50 text-[#1877F2] rounded-full mx-auto flex items-center justify-center mb-3">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-neutral-900 text-base font-['Plus_Jakarta_Sans']">
            {search ? 'Nenhum irmão encontrado' : 'Nenhum membro registrado ainda'}
          </h3>
          <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
            {search 
              ? 'Tente buscar por outro apelido, nome ou modelo de moto.' 
              : 'Esta rede social exibe exclusivamente os membros reais do Los Motokas MC. Envie o link de convite oficial para os irmãos criarem seus perfis individuais.'}
          </p>

          <div className="mt-5 flex justify-center">
            <button
              onClick={handleCopyInvite}
              className="px-4 py-2 bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Link Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Link de Convite para Irmãos</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              onClick={() => onNavigateToProfile(member.id)}
              className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              {/* CAPA DE FUNDO */}
              <div className="h-20 bg-neutral-900 relative">
                <img
                  src={member.cover_url || '/motokas_road_trip_1791830557313.jpg'}
                  alt="Capa"
                  className="w-full h-full object-cover opacity-60"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/escudo_oficial.jpg';
                  }}
                />
                <div className="absolute top-2 right-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-xs ${
                    member.role === 'diretoria' || store.isAdminEmail(member.email)
                      ? 'bg-[#1877F2] text-white' 
                      : member.role === 'membro' 
                      ? 'bg-neutral-800 text-white' 
                      : 'bg-amber-600 text-white'
                  }`}>
                    {store.isAdminEmail(member.email)
                      ? 'Administrador'
                      : member.role === 'diretoria'
                      ? 'Diretoria'
                      : member.role === 'membro'
                      ? 'Membro Oficial'
                      : 'Aspirante'}
                  </span>
                </div>
              </div>

              {/* AVATAR & INFORMAÇÕES */}
              <div className="px-4 pb-4 -mt-8 flex-1 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-white p-1 shadow-sm border border-neutral-200 overflow-hidden mb-2">
                  <img
                    src={member.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'}
                    alt={member.nickname}
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200';
                    }}
                  />
                </div>

                <h3 className="font-bold text-sm text-neutral-900 group-hover:text-[#1877F2] transition-colors">
                  {member.nickname}
                </h3>
                <p className="text-xs text-neutral-500 font-medium">{member.full_name}</p>

                {/* MOTO */}
                <div className="mt-3 py-1.5 px-3 bg-neutral-50 rounded-lg w-full text-center border border-neutral-100">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                    Máquina de Estrada
                  </span>
                  <span className="text-xs font-semibold text-neutral-800 truncate block">
                    {member.motorcycle_model || 'Não especificada'}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between w-full text-[11px] text-neutral-400 pt-2 border-t border-neutral-100">
                  <span>Na estrada desde:</span>
                  <span className="font-semibold text-neutral-600">{member.joined_at || '2023'}</span>
                </div>
              </div>

              <div className="px-4 py-2.5 bg-neutral-50/80 border-t border-neutral-100 flex items-center justify-center text-xs font-bold text-[#1877F2] group-hover:bg-blue-50 transition-colors">
                <span>Ver Histórico & Perfil</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
