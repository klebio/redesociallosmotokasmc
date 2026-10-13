import React, { useState, useEffect } from 'react';
import { 
  User, Shield, Calendar, Phone, Edit3, Image, 
  MapPin, Check, X, Camera, Compass, Lock, KeyRound, Heart
} from 'lucide-react';
import { Profile, Post } from '../types/database';
import { store } from '../services/store';
import { PostCard } from '../components/PostCard';

interface ProfileViewProps {
  memberId?: string;
  currentUser: Profile | null;
  onNavigateToProfile: (userId: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  memberId,
  currentUser,
  onNavigateToProfile,
}) => {
  const targetId = memberId || currentUser?.id || '';
  const member = targetId ? store.getMemberById(targetId) || (currentUser?.id === targetId ? currentUser : null) : currentUser;
  const isSelf = !!currentUser && !!member && currentUser.id === member.id;
  const isDiretoria = store.isDiretoria(currentUser);

  const [activeTab, setActiveTab] = useState<'posts' | 'photos' | 'about'>('posts');
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit form state
  const [editNickname, setEditNickname] = useState(member?.nickname || '');
  const [editFullName, setEditFullName] = useState(member?.full_name || '');
  const [editBio, setEditBio] = useState(member?.bio || '');
  const [editMotorcycle, setEditMotorcycle] = useState(member?.motorcycle_model || '');
  const [editPhone, setEditPhone] = useState(member?.phone || '');
  const [editBirthDate, setEditBirthDate] = useState(member?.birth_date || '');
  const [editMotherName, setEditMotherName] = useState(member?.mother_name || '');
  const [editPassword, setEditPassword] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState(member?.avatar_url || '');
  const [editCoverUrl, setEditCoverUrl] = useState(member?.cover_url || '');
  const canEdit = isSelf || isDiretoria;

  useEffect(() => {
    if (member) {
      setEditNickname(member.nickname || '');
      setEditFullName(member.full_name || '');
      setEditBio(member.bio || '');
      setEditMotorcycle(member.motorcycle_model || '');
      setEditPhone(member.phone || '');
      setEditBirthDate(member.birth_date || '');
      setEditMotherName(member.mother_name || '');
      setEditPassword('');
      setEditAvatarUrl(member.avatar_url || '');
      setEditCoverUrl(member.cover_url || '');
    }
  }, [member?.id]);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEditAvatarUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEditCoverUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const memberPosts = store.getPosts().filter((p) => p.author_id === targetId);
  const memberMedia = memberPosts.flatMap((p) => p.media || []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    const updates: Partial<Profile> = {
      nickname: editNickname.trim(),
      full_name: editFullName.trim(),
      bio: editBio.trim(),
      motorcycle_model: editMotorcycle.trim(),
      phone: editPhone.trim(),
      birth_date: editBirthDate.trim(),
      mother_name: editMotherName.trim(),
      avatar_url: editAvatarUrl.trim(),
      cover_url: editCoverUrl.trim(),
    };

    if (editPassword.trim()) {
      updates.password = editPassword.trim();
    }

    store.updateProfile(member.id, updates);
    setShowEditModal(false);
  };

  if (!member) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center bg-white rounded-xl border border-neutral-200 mt-8 shadow-xs">
        <div className="w-16 h-16 bg-blue-50 text-[#1877F2] rounded-full mx-auto flex items-center justify-center mb-3">
          <User className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-neutral-900 text-base font-['Plus_Jakarta_Sans']">Nenhum membro selecionado</h3>
        <p className="text-xs text-neutral-500 mt-1">
          Selecione um irmão na lista da irmandade para visualizar seu histórico e moto.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2.5 sm:px-4 py-4 sm:py-6 w-full max-w-full overflow-x-hidden">
      
      {/* CAPA & CABEÇALHO DO PERFIL ESTILO FACEBOOK CLÁSSICO */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs mb-5 sm:mb-6">
        
        {/* FOTO DE CAPA RESPONSIVA */}
        <div className="h-44 sm:h-64 bg-neutral-900 relative">
          <img
            src={member.cover_url || '/src/assets/images/motokas_road_trip_1791830557313.jpg'}
            alt="Capa do perfil"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {canEdit && (
            <button
              onClick={() => setShowEditModal(true)}
              className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-white/95 hover:bg-white text-neutral-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 backdrop-blur-xs transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-[#1877F2]" />
              <span className="hidden sm:inline">Editar Capa</span>
              <span className="sm:hidden">Capa</span>
            </button>
          )}
        </div>

        {/* INFORMAÇÕES DO MEMBRO */}
        <div className="px-4 sm:px-6 pb-5 pt-3 flex flex-col md:flex-row items-center md:items-end justify-between gap-4 -mt-14 sm:-mt-20">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-3 sm:gap-5 text-center md:text-left w-full md:w-auto">
            
            {/* AVATAR */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white p-1.5 shadow-lg border-2 border-white overflow-hidden shrink-0 relative group">
              <img
                src={member.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300'}
                alt={member.nickname}
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
              {canEdit && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full text-[11px] font-bold cursor-pointer"
                >
                  <Camera className="w-5 h-5 mb-1" />
                  Trocar Foto
                </button>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 font-['Plus_Jakarta_Sans']">
                  {member.nickname}
                </h1>
                <span className="text-xs sm:text-sm text-neutral-500 font-medium">({member.full_name})</span>
              </div>

              {/* PATENTE / CARGO */}
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap text-xs">
                <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[11px] ${
                  member.role === 'diretoria' || store.isAdminEmail(member.email)
                    ? 'bg-blue-100 text-[#1877F2]'
                    : member.role === 'membro'
                    ? 'bg-neutral-100 text-neutral-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {store.isAdminEmail(member.email)
                    ? 'Administrador Geral · Diretoria'
                    : member.role === 'diretoria'
                    ? 'Diretoria'
                    : member.role === 'membro'
                    ? 'Membro Oficial'
                    : 'Aspirante'}
                </span>
                <span className="text-neutral-400">·</span>
                <span className="text-neutral-600 font-semibold">{member.motorcycle_model}</span>
                <span className="text-neutral-400">·</span>
                <span className="text-neutral-500">Desde {member.joined_at}</span>
              </div>
            </div>
          </div>

          {/* BOTÃO EDITAR PERFIL */}
          {canEdit && (
            <button
              onClick={() => setShowEditModal(true)}
              className="w-full md:w-auto justify-center px-4 py-2.5 sm:py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-[#1877F2]" />
              {isSelf ? 'Editar Meu Perfil' : 'Editar Perfil do Membro (Diretoria)'}
            </button>
          )}
        </div>

        {/* APRESENTAÇÃO PESSOAL / BIO */}
        {member.bio && (
          <div className="px-4 sm:px-6 pb-4 pt-1 border-t border-neutral-100 text-xs text-neutral-700 leading-relaxed max-w-3xl">
            <p className="italic font-medium">"{member.bio}"</p>
          </div>
        )}

        {/* NAVEGAÇÃO DE ABAS DO PERFIL COM SCROLL HORIZONTAL SUAVE NO CELULAR */}
        <div className="px-4 sm:px-6 border-t border-neutral-200 flex gap-4 sm:gap-6 text-xs font-bold overflow-x-auto scrollbar-none whitespace-nowrap max-w-full">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-3 sm:py-3.5 border-b-2 transition-colors shrink-0 ${
              activeTab === 'posts'
                ? 'border-[#1877F2] text-[#1877F2]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Publicações ({memberPosts.length})
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`py-3 sm:py-3.5 border-b-2 transition-colors shrink-0 ${
              activeTab === 'photos'
                ? 'border-[#1877F2] text-[#1877F2]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Fotografias ({memberMedia.length})
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`py-3 sm:py-3.5 border-b-2 transition-colors shrink-0 ${
              activeTab === 'about'
                ? 'border-[#1877F2] text-[#1877F2]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Sobre a Máquina & Irmandade
          </button>
        </div>
      </div>

      {/* CONTEÚDO DAS ABAS */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {memberPosts.length === 0 ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
              <Compass className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
              <h4 className="font-bold text-neutral-800 text-sm">Nenhuma publicação registrada</h4>
              <p className="text-xs text-neutral-500 mt-1">
                Este membro ainda não publicou no mural da irmandade.
              </p>
            </div>
          ) : (
            memberPosts.map((post) => (
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
      )}

      {activeTab === 'photos' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-neutral-800 mb-4">
            Fotografias Compartilhadas ({memberMedia.length})
          </h3>

          {memberMedia.length === 0 ? (
            <p className="text-xs text-neutral-500 text-center py-8">
              Nenhuma fotografia enviada ainda.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {memberMedia.map((m, idx) => (
                <div key={idx} className="aspect-square bg-neutral-900 rounded-lg overflow-hidden border border-neutral-200">
                  <img
                    src={m.url}
                    alt={m.caption || 'Foto'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'about' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-neutral-800 border-b border-neutral-100 pb-2">
            Registro Oficial no Los Motokas MC
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                Máquina de Estrada
              </span>
              <span className="font-bold text-neutral-800 text-sm mt-0.5 block">
                {member.motorcycle_model || 'Não cadastrada'}
              </span>
            </div>

            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                Patente na Irmandade
              </span>
              <span className="font-bold text-[#1877F2] text-sm mt-0.5 block capitalize">
                {member.role === 'diretoria' ? 'Diretoria Oficial' : member.role === 'membro' ? 'Membro Efetivo' : 'Aspirante em Avaliação'}
              </span>
            </div>

            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                Data de Ingresso
              </span>
              <span className="font-bold text-neutral-800 text-sm mt-0.5 block">
                {member.joined_at || '2023'}
              </span>
            </div>

            {(isSelf || isDiretoria) && (
              <>
                {member.phone && (
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                      Telefone de Emergência / Contato
                    </span>
                    <span className="font-bold text-neutral-800 text-sm mt-0.5 block">
                      {member.phone}
                    </span>
                  </div>
                )}
                {member.birth_date && (
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <span className="text-[10px] uppercase font-bold text-blue-600 block tracking-wider flex items-center gap-1">
                      <Lock className="w-3 h-3 text-[#1877F2]" />
                      Data de Nascimento (Segurança)
                    </span>
                    <span className="font-bold text-neutral-800 text-sm mt-0.5 block">
                      {member.birth_date}
                    </span>
                  </div>
                )}
                {member.mother_name && (
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <span className="text-[10px] uppercase font-bold text-blue-600 block tracking-wider flex items-center gap-1">
                      <Lock className="w-3 h-3 text-[#1877F2]" />
                      Nome da Mãe (Privativo / Segurança)
                    </span>
                    <span className="font-bold text-neutral-800 text-sm mt-0.5 block">
                      {member.mother_name}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL: EDITAR PERFIL (100% RESPONSIVO PARA CELULAR) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-neutral-200 overflow-hidden max-h-[92dvh] flex flex-col">
            <div className="bg-[#1877F2] text-white px-4 sm:px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-white" />
                <h3 className="font-bold text-sm sm:text-base">
                  {isSelf ? 'Editar Meu Perfil' : `Editar Perfil: ${member.nickname}`}
                </h3>
              </div>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto flex-1 overscroll-contain">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Apelido na Estrada (Rocker) *</label>
                  <input
                    type="text"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Modelo da Moto</label>
                <input
                  type="text"
                  placeholder="Ex: Harley-Davidson Road King 1800cc"
                  value={editMotorcycle}
                  onChange={(e) => setEditMotorcycle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Apresentação Pessoal / Lema</label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Seu lema ou história no motoclube..."
                  className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Telefone / WhatsApp para Comboios</label>
                <input
                  type="text"
                  placeholder="(84) 99999-9999"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                />
              </div>

              {/* DADOS DE SEGURANÇA E RECUPERAÇÃO DE SENHA */}
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-3">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                  <Shield className="w-4 h-4 text-[#1877F2]" />
                  <span>Dados de Segurança & Recuperação de Senha</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Data de Nascimento</label>
                    <input
                      type="date"
                      value={editBirthDate}
                      onChange={(e) => setEditBirthDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Nome Completo da Mãe</label>
                    <input
                      type="text"
                      placeholder="Nome completo da mãe"
                      value={editMotherName}
                      onChange={(e) => setEditMotherName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Nova Senha de Acesso (opcional)
                  </label>
                  <input
                    type="password"
                    placeholder="Deixe em branco para não alterar"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                  />
                </div>
              </div>

              {/* FOTO DE PERFIL RESPONSIVA NO MODAL */}
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2.5">
                <label className="block font-bold text-neutral-800">Foto de Perfil (Avatar)</label>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
                  <img
                    src={editAvatarUrl}
                    alt="Prévia Avatar"
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                  />
                  <div className="w-full flex-1 space-y-2">
                    <label className="w-full py-2.5 px-3 bg-white border border-neutral-300 hover:border-[#1877F2] rounded-lg font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer flex items-center justify-center gap-2 transition-colors text-xs active:scale-[0.99] shadow-2xs">
                      <Camera className="w-4 h-4 text-[#1877F2] shrink-0" />
                      <span>Carregar Foto do Celular</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFile}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      placeholder="Ou cole o link da foto..."
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      className="w-full px-3 py-1.5 text-base sm:text-xs border border-neutral-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* FOTO DE CAPA RESPONSIVA NO MODAL */}
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2.5">
                <label className="block font-bold text-neutral-800">Foto de Capa</label>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
                  <img
                    src={editCoverUrl}
                    alt="Prévia Capa"
                    className="w-full sm:w-28 h-20 sm:h-16 rounded-lg object-cover border border-neutral-300 shrink-0"
                  />
                  <div className="w-full flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row gap-1.5">
                      <label className="w-full py-2 px-3 bg-white border border-neutral-300 hover:border-[#1877F2] rounded-lg font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer flex items-center justify-center gap-1.5 transition-colors text-xs active:scale-[0.99] shadow-2xs">
                        <Camera className="w-4 h-4 text-[#1877F2] shrink-0" />
                        <span>Carregar do Celular</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverFile}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditCoverUrl('/src/assets/images/motokas_road_trip_1791830557313.jpg')}
                        className="py-1.5 px-2 text-[11px] bg-white border border-neutral-200 rounded-lg font-semibold hover:bg-neutral-100 transition-colors"
                      >
                        Foto Estrada
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditCoverUrl('/src/assets/images/motokas_clubhouse_gathering_1791830585214.jpg')}
                        className="py-1.5 px-2 text-[11px] bg-white border border-neutral-200 rounded-lg font-semibold hover:bg-neutral-100 transition-colors"
                      >
                        Foto Clubhouse
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Ou cole o link da capa..."
                      value={editCoverUrl}
                      onChange={(e) => setEditCoverUrl(e.target.value)}
                      className="w-full px-3 py-1.5 text-base sm:text-xs border border-neutral-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* RODAPÉ DO MODAL FIXO / STICKY */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-3 pb-1 border-t border-neutral-100 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 font-extrabold text-white bg-[#1877F2] hover:bg-[#0866FF] active:bg-[#0055d4] rounded-xl shadow-xs transition-all active:scale-[0.99] cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Salvar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
