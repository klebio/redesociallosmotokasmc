import React, { useState, useEffect } from 'react';
import { 
  Shield, KeyRound, UserPlus, CheckCircle2, AlertCircle, 
  Loader2, Lock, Mail, User, Compass, HelpCircle, Camera, 
  Sparkles, ArrowRight, ArrowLeft, LogIn, Share2, Phone, Bike, MapPin,
  Calendar, Heart, Check, RefreshCw
} from 'lucide-react';
import { store } from '../services/store';
import { Profile } from '../types/database';

interface AuthViewProps {
  onLoginSuccess: (initialTab?: string, memberId?: string) => void;
  onOpenConfig: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onLoginSuccess,
  onOpenConfig,
}) => {
  // Modo de visualização: por padrão 'welcome' (mostrando apenas os 2 botões na frente: Já sou membro e Criar perfil)
  const [mode, setMode] = useState<'welcome' | 'login' | 'register'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('login') || params.get('entrar')) {
        return 'login';
      }
      if (params.get('cadastro') || params.get('register')) {
        return 'register';
      }
    }
    return 'welcome';
  });
  const [isInviteDetected, setIsInviteDetected] = useState(false);

  // Estados do formulário de login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Estados do formulário de criação de perfil (Novo Membro Convidado)
  const [regFullName, setRegFullName] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regMotorcycle, setRegMotorcycle] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regMotherName, setRegMotherName] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regBio, setRegBio] = useState('');
  const [regAvatarUrl, setRegAvatarUrl] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80');
  const [regCoverUrl, setRegCoverUrl] = useState('/src/assets/images/motokas_road_trip_1791830557313.jpg');

  // Form de solicitação de adesão
  const [reqFullName, setReqFullName] = useState('');
  const [reqNickname, setReqNickname] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqPhone, setReqPhone] = useState('');
  const [reqMotorcycle, setReqMotorcycle] = useState('');
  const [reqCity, setReqCity] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Estados de recuperação de senha com validação de dados de segurança
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'verify' | 'reset' | 'success'>('verify');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotBirthDate, setForgotBirthDate] = useState('');
  const [forgotMotherName, setForgotMotherName] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotVerifiedMember, setForgotVerifiedMember] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [officialEmblem, setOfficialEmblem] = useState<string>(store.getOfficialEmblem());

  // Detecta se a página foi aberta com link de convite / cadastro e sincroniza emblema
  useEffect(() => {
    // Sincroniza configurações e dados do Firebase Firestore para garantir que o emblema oficial venha da nuvem
    store.initFirebase();

    const unsub = store.subscribe(() => {
      setOfficialEmblem(store.getOfficialEmblem());
    });

    const params = new URLSearchParams(window.location.search);
    const hasInvite = 
      params.get('convite') || 
      params.get('invite') || 
      params.get('cadastro') || 
      window.location.hash.includes('convite') || 
      window.location.hash.includes('cadastro');

    if (hasInvite) {
      setIsInviteDetected(true);
      // Ao abrir o link de convite do WhatsApp, abre diretamente o formulário para o irmão criar seu perfil
      setMode('register');
    }

    return unsub;
  }, []);

  // Upload local de imagem para avatar do membro com otimização
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) return;

      if (isGif) {
        setRegAvatarUrl(src);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 500;
        let { width, height } = img;
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
          setRegAvatarUrl(canvas.toDataURL('image/jpeg', 0.88));
        } else {
          setRegAvatarUrl(src);
        }
      };
      img.onerror = () => setRegAvatarUrl(src);
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Upload local de imagem para capa do perfil com otimização
  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) return;

      if (isGif) {
        setRegCoverUrl(src);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1200;
        let { width, height } = img;
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
          setRegCoverUrl(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          setRegCoverUrl(src);
        }
      };
      img.onerror = () => setRegCoverUrl(src);
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // FLUXO DE LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Por favor, informe seu e-mail e senha.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const members = store.getMembers();
      const matched = members.find((m) => m.email.toLowerCase() === email.toLowerCase().trim());

      if (matched) {
        // Bloqueia login se o perfil estiver suspenso pela diretoria (exceto fundadores)
        if (matched.status === 'suspended' && !store.isAdminEmail(matched.email)) {
          const reasonText = matched.suspension_reason ? ` Motivo: ${matched.suspension_reason}.` : '';
          setErrorMessage(`Seu perfil está temporariamente suspenso pela Diretoria do Los Motokas MC.${reasonText} Por favor, entre em contato com um dos diretores.`);
          setIsLoading(false);
          return;
        }

        // Se o membro cadastrou senha, valida se está correta
        if (matched.password && matched.password !== password) {
          setErrorMessage('Senha incorreta para este e-mail. Caso tenha esquecido, clique em "Esqueci a senha" abaixo.');
          setIsLoading(false);
          return;
        }

        // Se o perfil ainda não possuía senha salva e digitou uma agora, salva como senha
        if (!matched.password && password) {
          store.updateProfile(matched.id, { password });
        }

        const isAdmin = store.isAdminEmail(matched.email) || matched.role === 'diretoria';
        if (isAdmin && matched.role !== 'diretoria') {
          store.updateMemberRole(matched.id, 'diretoria');
        }

        store.setCurrentUser(matched.id);
        setIsLoading(false);

        // Sempre que os administradores logarem com seus emails, entram na parte administrativa ('admin')!
        onLoginSuccess(isAdmin ? 'admin' : 'feed', matched.id);
      } else {
        setErrorMessage('E-mail não encontrado. Se ainda não possui perfil, clique em "Criar perfil".');
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao realizar login.');
      setIsLoading(false);
    }
  };

  // FLUXO DE CRIAÇÃO DIRETA DE PERFIL DO MEMBRO (VIA LINK DE CONVITE OU CADASTRO)
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regFullName.trim() || !regNickname.trim()) {
      setErrorMessage('Preencha os campos obrigatórios do seu perfil.');
      return;
    }

    if (!regPassword || regPassword.length < 4) {
      setErrorMessage('Defina uma senha de acesso com no mínimo 4 dígitos.');
      return;
    }

    if (!regPhone.trim() || !regBirthDate.trim() || !regMotherName.trim()) {
      setErrorMessage('Preencha o telefone, data de nascimento e o nome da sua mãe (obrigatórios para segurança e recuperação de senha).');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const isAdmin = store.isAdminEmail(regEmail.trim());

      // Registra perfil individual no banco de dados e no store
      const newMember = await store.registerMemberProfile({
        email: regEmail.trim(),
        full_name: regFullName.trim(),
        nickname: regNickname.trim(),
        role: isAdmin ? 'diretoria' : 'membro',
        motorcycle_model: regMotorcycle.trim() || 'Harley-Davidson Custom',
        phone: regPhone.trim(),
        birth_date: regBirthDate.trim(),
        mother_name: regMotherName.trim(),
        password: regPassword,
        bio: regBio.trim() || `Irmão do Los Motokas MC Mossoró/RN na máquina ${regMotorcycle || 'de estrada'}.`,
        avatar_url: regAvatarUrl,
        cover_url: regCoverUrl,
      });

      setIsLoading(false);
      // Se for administrador oficial, entra diretamente na área administrativa ('admin'); senão no perfil recém-criado
      onLoginSuccess(isAdmin ? 'admin' : 'profile', newMember.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao criar perfil.');
      setIsLoading(false);
    }
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqFullName.trim() || !reqNickname.trim() || !reqEmail.trim() || !reqReason.trim()) {
      return;
    }

    store.submitMemberRequest({
      full_name: reqFullName.trim(),
      nickname: reqNickname.trim(),
      email: reqEmail.trim(),
      phone: reqPhone.trim() || '(84) 99999-9999',
      motorcycle_model: reqMotorcycle.trim() || 'Custom',
      city: reqCity.trim(),
      reason: reqReason.trim(),
    });

    setRequestSuccess(true);
  };

  // FLUXO DE RECUPERAÇÃO DE SENHA ESQUECIDA
  const openForgotPassword = () => {
    setForgotStep('verify');
    setForgotError('');
    setForgotEmail(email.trim());
    setForgotPhone('');
    setForgotBirthDate('');
    setForgotMotherName('');
    setForgotVerifiedMember(null);
    setNewPassword('');
    setConfirmNewPassword('');
    setShowForgotModal(true);
  };

  // Etapa 1: Validar e-mail, telefone, data de nascimento e nome da mãe
  const handleVerifySecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (!forgotEmail.trim() || !forgotPhone.trim() || !forgotBirthDate.trim() || !forgotMotherName.trim()) {
      setForgotError('Preencha os 4 campos para validação de segurança.');
      return;
    }

    const result = store.verifySecurityData(
      forgotEmail.trim(),
      forgotPhone.trim(),
      forgotBirthDate.trim(),
      forgotMotherName.trim()
    );

    if (!result.success || !result.member) {
      setForgotError(
        result.errorMessage || 
        'As informações fornecidas não conferem com o cadastro deste membro. Verifique o telefone, data de nascimento e nome da mãe.'
      );
      return;
    }

    // Sucesso: membro validado!
    setForgotVerifiedMember(result.member);
    setForgotStep('reset');
  };

  // Etapa 2: Sobrescrever a senha esquecida
  const handleOverwritePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (!newPassword || newPassword.length < 4) {
      setForgotError('A nova senha deve ter no mínimo 4 dígitos.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setForgotError('As senhas não coincidem. Digite a mesma senha nos dois campos.');
      return;
    }

    if (!forgotVerifiedMember) {
      setForgotError('Verificação de identidade expirada. Inicie o processo novamente.');
      setForgotStep('verify');
      return;
    }

    const success = store.overwritePassword(forgotVerifiedMember.id, newPassword);
    if (!success) {
      setForgotError('Não foi possível sobrescrever a senha no momento.');
      return;
    }

    setForgotStep('success');
  };

  const handleFinishResetAndLogin = () => {
    setShowForgotModal(false);
    if (forgotVerifiedMember) {
      store.setCurrentUser(forgotVerifiedMember.id);
      const isAdmin = store.isAdminEmail(forgotVerifiedMember.email) || forgotVerifiedMember.role === 'diretoria';
      onLoginSuccess(isAdmin ? 'admin' : 'feed', forgotVerifiedMember.id);
    } else {
      setEmail(forgotEmail);
      setPassword(newPassword);
      setMode('login');
      setErrorMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col justify-between w-full max-w-full overflow-x-hidden">
      
      {/* CORPO CENTRAL */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-6 py-6 sm:py-10 w-full max-w-full overflow-x-hidden">
        
        {/* CASO 1: TELA FRONTAL COM APENAS OS DOIS BOTÕES */}
        {mode === 'welcome' ? (
          <div className="max-w-md w-full mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-neutral-200/80 p-6 sm:p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
              
              {/* ESCUDO OFICIAL */}
              <div className="w-24 h-24 rounded-full bg-white p-1.5 shadow-lg border-2 border-[#1877F2]/25 overflow-hidden mx-auto hover:scale-105 transition-transform">
                <img
                  src={officialEmblem || '/escudo_oficial.jpg'}
                  alt="Escudo Oficial Los Motokas MC"
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/escudo_oficial.jpg';
                  }}
                />
              </div>

              {/* IDENTIFICAÇÃO DO MOTOCLUBE */}
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1877F2] font-['Plus_Jakarta_Sans'] tracking-tight leading-none">
                  LOSMOTOKAS MC
                </h1>
                <span className="text-xs uppercase font-extrabold tracking-widest text-neutral-500 block pt-0.5">
                  Nossa História
                </span>
                <p className="text-xs sm:text-sm text-neutral-600 font-medium pt-1 max-w-xs mx-auto leading-relaxed">
                  A rede social oficial da nossa irmandade nas duas rodas.
                </p>
              </div>

              {/* AVISO DE CONVITE SE HOUVER */}
              {isInviteDetected && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-center justify-center gap-2 shadow-2xs">
                  <Sparkles className="w-4 h-4 text-[#1877F2] shrink-0" />
                  <span className="font-semibold text-xs">
                    Link de convite oficial da Diretoria ativo!
                  </span>
                </div>
              )}

              {/* OS DOIS BOTÕES NA FRENTE */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setMode('login');
                  }}
                  className="w-full py-4 px-5 bg-[#1877F2] hover:bg-[#0866FF] active:bg-[#0055d4] text-white font-extrabold text-base rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <LogIn className="w-5 h-5 shrink-0" />
                  <span>Já sou membro</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setMode('register');
                  }}
                  className="w-full py-4 px-5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-base rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <UserPlus className="w-5 h-5 shrink-0" />
                  <span>Criar perfil</span>
                </button>
              </div>

              {/* RODAPÉ DO CARD FRONTAL */}
              <div className="pt-4 border-t border-neutral-100 space-y-2 text-xs text-neutral-500">
                <div className="flex items-center justify-center gap-1.5 text-neutral-700 font-bold">
                  <Shield className="w-4 h-4 text-[#1877F2]" />
                  <span>Apenas Membros Reais da Irmandade</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Perfis individuais e privativos dos irmãos do motoclube.
                </p>
                <div className="pt-2 flex flex-col gap-1.5 items-center">
                  <button
                    type="button"
                    onClick={openForgotPassword}
                    className="text-xs text-[#1877F2] hover:text-[#0866FF] hover:underline font-semibold cursor-pointer"
                  >
                    Esqueceu sua senha? Recuperar acesso
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRequestSuccess(false);
                      setShowRequestModal(true);
                    }}
                    className="text-[11px] text-neutral-500 hover:text-neutral-800 underline cursor-pointer"
                  >
                    Não possui convite? Solicitar adesão à Diretoria
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* CASO 2: TELA DE ENTRAR OU CRIAR PERFIL (COM BOTÃO VOLTAR) */
          <div className="max-w-xl w-full mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-neutral-200/80 overflow-hidden animate-in fade-in duration-200">
              
              {/* CABEÇALHO COM BOTÃO VOLTAR */}
              <div className="bg-neutral-50 px-4 sm:px-6 py-3.5 border-b border-neutral-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setMode('welcome');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-[#1877F2] py-1.5 px-3 rounded-lg hover:bg-white border border-neutral-200 hover:border-neutral-300 transition-all cursor-pointer shadow-2xs"
                >
                  <ArrowLeft className="w-4 h-4 text-[#1877F2]" />
                  <span>Voltar</span>
                </button>

                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-neutral-200">
                    <img
                      src={officialEmblem || '/escudo_oficial.jpg'}
                      alt="Escudo"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/escudo_oficial.jpg';
                      }}
                    />
                  </div>
                  <span className="font-extrabold text-xs sm:text-sm text-neutral-800 font-['Plus_Jakarta_Sans']">
                    {mode === 'login' ? 'Já sou Membro (Entrar)' : 'Criar Perfil de Membro'}
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {errorMessage && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* FORMULÁRIO: ENTRAR */}
                {mode === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">E-mail do Membro</label>
                      <input
                        type="email"
                        required
                        placeholder="seu-email@losmotokas.com.br"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] text-[#1C1E21] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">Senha de Acesso</label>
                      <input
                        type="password"
                        required
                        placeholder="Sua senha secreta"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] text-[#1C1E21] bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-[#1877F2] hover:bg-[#0866FF] active:bg-[#0055d4] text-white font-extrabold text-sm sm:text-base rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 mt-2 cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Entrando na Irmandade...
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          Entrar na Irmandade
                        </>
                      )}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={openForgotPassword}
                        className="text-xs text-[#1877F2] hover:underline font-semibold cursor-pointer"
                      >
                        Esqueceu a senha? Recuperar acesso
                      </button>
                    </div>

                    <div className="border-t border-neutral-200 pt-4 text-center space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage('');
                          setMode('register');
                        }}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Ainda não tem perfil? Criar perfil</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* FORMULÁRIO: CRIAR PERFIL INDIVIDUAL DO MEMBRO */
                  <form onSubmit={handleCreateProfile} className="space-y-4">
                    <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
                      <p className="font-bold mb-0.5">Criar Perfil Individual do Membro</p>
                      <p className="text-[11px] text-blue-800 leading-relaxed">
                        Preencha seus dados para receber seu colete digital na rede social.
                        Você poderá alterar todas as fotos e informações a qualquer momento no seu perfil.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-neutral-700 mb-1">
                          Apelido de Estrada (Rocker) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Caveira, Coruja, Águia"
                          value={regNickname}
                          onChange={(e) => setRegNickname(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-neutral-700 mb-1">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Marcos Vinícius"
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-neutral-700 mb-1">
                          E-mail de Acesso *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="seu@email.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-neutral-700 mb-1">
                          Senha Secreta *
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Mínimo 6 dígitos"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-neutral-700 mb-1">
                          Máquina / Modelo da Moto *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Harley Fat Boy, Shadow 750"
                          value={regMotorcycle}
                          onChange={(e) => setRegMotorcycle(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-neutral-700 mb-1">
                          Telefone / WhatsApp de Estrada *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="Ex: (84) 99999-9999"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                        />
                      </div>
                    </div>

                    {/* DADOS DE IDENTIFICAÇÃO E SEGURANÇA PARA RECUPERAÇÃO DE SENHA */}
                    <div className="p-3 sm:p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-3">
                      <div className="flex items-start gap-2">
                        <Shield className="w-4 h-4 text-[#1877F2] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-xs text-neutral-900">
                            Dados de Segurança & Recuperação de Senha
                          </h4>
                          <p className="text-[11px] text-neutral-600 leading-tight">
                            A data de nascimento e o nome da sua mãe serão utilizados para validar sua identidade caso você esqueça sua senha e precise recuperá-la.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-bold text-neutral-800 mb-1">
                            Data de Nascimento *
                          </label>
                          <input
                            type="date"
                            required
                            value={regBirthDate}
                            onChange={(e) => setRegBirthDate(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-neutral-800 mb-1">
                            Nome Completo da Mãe *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Nome completo da sua mãe"
                            value={regMotherName}
                            onChange={(e) => setRegMotherName(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-xs">
                      <label className="block font-bold text-neutral-700 mb-1">
                        Apresentação Pessoal / Lema de Estrada
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ex: Rodando com o Los Motokas MC com honra e respeito desde..."
                        value={regBio}
                        onChange={(e) => setRegBio(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                      />
                    </div>

                    {/* SELEÇÃO E UPLOAD DA FOTO DE PERFIL RESPONSIVA */}
                    <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-xs text-neutral-800">
                          Foto de Perfil (Colete / Rosto)
                        </label>
                        <span className="text-[11px] text-[#1877F2] font-semibold">Opcional</span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
                        <img
                          src={regAvatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80'}
                          alt="Prévia Avatar"
                          className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className="w-full flex-1 space-y-2">
                          <label className="w-full py-2.5 px-3 bg-white border border-neutral-300 hover:border-[#1877F2] rounded-lg font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer flex items-center justify-center gap-2 transition-colors text-xs active:scale-[0.99] shadow-2xs">
                            <Camera className="w-4 h-4 text-[#1877F2] shrink-0" />
                            <span>Tirar ou Carregar Foto do Celular</span>
                            <input
                              type="file"
                              accept="image/*,image/gif,.gif"
                              onChange={handleAvatarFile}
                              className="hidden"
                            />
                          </label>
                          <input
                            type="text"
                            value={regAvatarUrl}
                            onChange={(e) => setRegAvatarUrl(e.target.value)}
                            placeholder="Ou cole o link da sua foto..."
                            className="w-full px-3 py-2 text-base sm:text-xs border border-neutral-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-[#1877F2] hover:bg-[#0866FF] active:bg-[#0055d4] text-white font-extrabold text-sm sm:text-base rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 mt-4 cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Criando Perfil na Irmandade...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Criar Meu Perfil e Entrar na Irmandade
                        </>
                      )}
                    </button>

                    <div className="border-t border-neutral-200 pt-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage('');
                          setMode('login');
                        }}
                        className="text-xs text-[#1877F2] hover:underline font-bold cursor-pointer"
                      >
                        Já tem seu perfil cadastrado? Clique aqui para Entrar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* RODAPÉ INSTITUCIONAL */}
      <footer className="bg-white border-t border-neutral-200 py-4 px-6 text-center text-xs text-neutral-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Los Motokas MC &copy; {new Date().getFullYear()} — Mossoró · RN.</span>
          <span className="text-[11px] text-neutral-400">Rede Social Oficial · Tradição das Duas Rodas</span>
        </div>
      </footer>

      {/* MODAL: SOLICITAR ADESÃO */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-neutral-200 overflow-hidden">
            <div className="bg-[#1877F2] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Solicitação de Adesão à Irmandade</h3>
                <p className="text-xs text-blue-100">Los Motokas MC — Fila de Avaliação da Diretoria</p>
              </div>
              <button onClick={() => setShowRequestModal(false)} className="text-white/80 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6">
              {requestSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h4 className="font-bold text-base text-neutral-900">
                    Solicitação Enviada com Sucesso!
                  </h4>
                  <p className="text-xs text-neutral-600 max-w-sm mx-auto leading-relaxed">
                    Sua ficha de entrada foi enviada diretamente para a Diretoria do Los Motokas MC.
                    Após a averiguação dos dados e aprovação em assembleia, seu acesso será liberado.
                  </p>
                  <button
                    onClick={() => setShowRequestModal(false)}
                    className="mt-4 px-5 py-2 bg-[#1877F2] text-white text-xs font-bold rounded-lg hover:bg-[#0866FF]"
                  >
                    Entendido
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Nome Completo</label>
                      <input
                        type="text"
                        required
                        value={reqFullName}
                        onChange={(e) => setReqFullName(e.target.value)}
                        placeholder="Ex: João da Silva"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Apelido de Estrada</label>
                      <input
                        type="text"
                        required
                        value={reqNickname}
                        onChange={(e) => setReqNickname(e.target.value)}
                        placeholder="Ex: Águia"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">E-mail</label>
                      <input
                        type="email"
                        required
                        value={reqEmail}
                        onChange={(e) => setReqEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Telefone / WhatsApp</label>
                      <input
                        type="text"
                        value={reqPhone}
                        onChange={(e) => setReqPhone(e.target.value)}
                        placeholder="(84) 99999-9999"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Modelo da Moto</label>
                      <input
                        type="text"
                        required
                        value={reqMotorcycle}
                        onChange={(e) => setReqMotorcycle(e.target.value)}
                        placeholder="Ex: Harley Fat Boy"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Cidade / Estado</label>
                      <input
                        type="text"
                        value={reqCity}
                        onChange={(e) => setReqCity(e.target.value)}
                        placeholder="Ex: Mossoró - RN"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      Por que você quer fazer parte do Los Motokas MC?
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={reqReason}
                      onChange={(e) => setReqReason(e.target.value)}
                      placeholder="Conte um pouco sobre sua trajetória em duas rodas..."
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => setShowRequestModal(false)}
                      className="px-4 py-2 font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                    >
                      Enviar para a Diretoria
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECUPERAÇÃO E SOBRESCRITA DE SENHA COM VERIFICAÇÃO DE DADOS */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-neutral-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* CABEÇALHO DO MODAL */}
            <div className="bg-[#1877F2] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-white" />
                <h3 className="font-extrabold text-sm sm:text-base font-['Plus_Jakarta_Sans']">
                  Recuperar Senha da Irmandade
                </h3>
              </div>
              <button 
                onClick={() => setShowForgotModal(false)} 
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* BARRA DE PROGRESSO / ETAPAS */}
            <div className="bg-neutral-100 px-5 py-2.5 border-b border-neutral-200 flex items-center justify-between text-[11px] font-bold text-neutral-600">
              <div className={`flex items-center gap-1.5 ${forgotStep === 'verify' ? 'text-[#1877F2] font-extrabold' : ''}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${forgotStep === 'verify' ? 'bg-[#1877F2] text-white' : 'bg-neutral-300 text-neutral-700'}`}>1</span>
                <span>Validar Dados</span>
              </div>
              <div className="text-neutral-300">──</div>
              <div className={`flex items-center gap-1.5 ${forgotStep === 'reset' ? 'text-[#1877F2] font-extrabold' : ''}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${forgotStep === 'reset' ? 'bg-[#1877F2] text-white' : 'bg-neutral-300 text-neutral-700'}`}>2</span>
                <span>Nova Senha</span>
              </div>
              <div className="text-neutral-300">──</div>
              <div className={`flex items-center gap-1.5 ${forgotStep === 'success' ? 'text-emerald-600 font-extrabold' : ''}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${forgotStep === 'success' ? 'bg-emerald-600 text-white' : 'bg-neutral-300 text-neutral-700'}`}>3</span>
                <span>Concluído</span>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {/* ETAPA 1: VERIFICAÇÃO DOS 4 DADOS DE SEGURANÇA */}
              {forgotStep === 'verify' && (
                <form onSubmit={handleVerifySecurity} className="space-y-3.5 text-xs">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-900 leading-relaxed">
                    <p className="font-bold mb-0.5">Confirmação de Identidade</p>
                    <p className="text-[11px] text-blue-800">
                      Para autorizar a sobrescrita da sua senha, informe o <strong>e-mail</strong>, <strong>telefone</strong>, <strong>data de nascimento</strong> e <strong>nome da sua mãe</strong> cadastrados no seu perfil.
                    </p>
                  </div>

                  {forgotError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="font-medium text-[11px]">{forgotError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      1. Seu E-mail Cadastrado *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="seu@email.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      2. Telefone / WhatsApp de Estrada *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: (84) 99999-9999"
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">
                        3. Data de Nascimento *
                      </label>
                      <input
                        type="date"
                        required
                        value={forgotBirthDate}
                        onChange={(e) => setForgotBirthDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">
                        4. Nome da Mãe *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nome completo da mãe"
                        value={forgotMotherName}
                        onChange={(e) => setForgotMotherName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="px-4 py-2 font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 font-extrabold text-white bg-[#1877F2] hover:bg-[#0866FF] rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Verificar Informações</span>
                    </button>
                  </div>
                </form>
              )}

              {/* ETAPA 2: SOBRESCREVER A SENHA ESQUECIDA */}
              {forgotStep === 'reset' && (
                <form onSubmit={handleOverwritePassword} className="space-y-3.5 text-xs">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Identidade Confirmada com Sucesso!</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 mt-1">
                      Membro: <strong>{forgotVerifiedMember?.nickname}</strong> ({forgotVerifiedMember?.full_name}). Suas informações combinaram perfeitamente. Digite sua nova senha abaixo:
                    </p>
                  </div>

                  {forgotError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="font-medium text-[11px]">{forgotError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      Nova Senha Secreta *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 4 dígitos"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      Confirmar Nova Senha *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Repita a mesma nova senha"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] bg-white text-neutral-900"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep('verify');
                        setForgotError('');
                      }}
                      className="px-4 py-2 font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Sobrescrever Senha</span>
                    </button>
                  </div>
                </form>
              )}

              {/* ETAPA 3: CONCLUÍDO COM SUCESSO */}
              {forgotStep === 'success' && (
                <div className="text-center py-4 space-y-3">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="font-extrabold text-base text-neutral-900 font-['Plus_Jakarta_Sans']">
                    Senha Sobrescrita com Sucesso!
                  </h4>
                  <p className="text-xs text-neutral-600 max-w-xs mx-auto leading-relaxed">
                    Sua senha anterior foi substituída pela nova com total segurança. Você já pode acessar a Irmandade com a nova credencial.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleFinishResetAndLogin}
                      className="w-full py-3 bg-[#1877F2] hover:bg-[#0866FF] text-white font-extrabold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Fazer Login Agora com a Nova Senha</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
