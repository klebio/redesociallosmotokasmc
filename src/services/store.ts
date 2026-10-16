import { 
  Profile, Post, Album, AlbumMedia, Announcement, MemberRequest, 
  Notification, AuditLog, Comment, ReactionType, MemberRole, MemberStatus 
} from '../types/database';
import { 
  INITIAL_MEMBERS, INITIAL_POSTS, INITIAL_ALBUMS, 
  INITIAL_ANNOUNCEMENTS, INITIAL_REQUESTS, OFFICIAL_ADMIN_EMAILS 
} from '../data/mockSeed';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

// Chaves de armazenamento local resiliente
const STORAGE_PREFIX = 'los_motokas_state_';

function loadOr<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key) || sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage atingiu o limite de quota, usando sessionStorage como fallback:', e);
    try {
      sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (errSession) {
      console.warn('Storage fallback warning:', errSession);
    }
  }
}

const DEFAULT_OFFICIAL_EMBLEM = '/escudo_oficial.jpg';

// Estado reativo da aplicação (Apenas dados e membros reais)
class DataStore {
  private currentUserId: string = loadOr('currentUserId', '');
  private officialEmblem: string = (() => {
    const saved = loadOr<string>('officialEmblem', DEFAULT_OFFICIAL_EMBLEM);
    if (!saved || (saved as string) === '/src/assets/images/escudo_oficial.jpg') {
      return DEFAULT_OFFICIAL_EMBLEM;
    }
    return saved;
  })();
  private members: Profile[] = loadOr('members', INITIAL_MEMBERS);
  private posts: Post[] = loadOr('posts', INITIAL_POSTS);
  private albums: Album[] = loadOr('albums', INITIAL_ALBUMS);
  private albumMedia: Record<string, AlbumMedia[]> = loadOr('albumMedia', {});
  private comments: Record<string, Comment[]> = loadOr('comments', {});
  private announcements: Announcement[] = loadOr('announcements', INITIAL_ANNOUNCEMENTS);
  private requests: MemberRequest[] = loadOr('requests', INITIAL_REQUESTS);
  private notifications: Notification[] = loadOr('notifications', []);
  private auditLogs: AuditLog[] = loadOr('auditLogs', []);

  private listeners: Set<() => void> = new Set();

  constructor() {
    this.cleanLegacyFakeData();
    this.ensureOfficialAdminsExist();
    this.hydrateFromSupabase();
  }

  // Verifica se o email informado pertence aos administradores oficiais permanentes
  public isAdminEmail(email?: string): boolean {
    if (!email) return false;
    const clean = email.toLowerCase().trim();
    return OFFICIAL_ADMIN_EMAILS.some((adm) => adm.toLowerCase().trim() === clean);
  }

  // Garante a existência e privilégio permanente dos dois administradores oficiais
  private ensureOfficialAdminsExist() {
    let changed = false;

    INITIAL_MEMBERS.forEach((initialAdmin) => {
      const existingIndex = this.members.findIndex(
        (m) => m.email.toLowerCase().trim() === initialAdmin.email.toLowerCase().trim()
      );

      if (existingIndex >= 0) {
        // Se o perfil do administrador já existe, garante o cargo de diretoria e status ativo
        const existing = this.members[existingIndex];
        if (existing.role !== 'diretoria' || existing.status !== 'active') {
          this.members[existingIndex] = {
            ...existing,
            role: 'diretoria',
            status: 'active',
          };
          changed = true;
        }
      } else {
        // Se ainda não estava no armazenamento local, adiciona o perfil do administrador
        this.members.push({ ...initialAdmin });
        changed = true;
      }
    });

    if (changed) {
      save('members', this.members);
    }
  }

  // Remove qualquer perfil e post falso salvo em sessões anteriores (mantendo apenas perfis reais)
  private cleanLegacyFakeData() {
    const isFakeMember = (m: Profile) => {
      if (!m || !m.id) return true;
      const id = (m.id || '').toLowerCase();
      const email = (m.email || '').toLowerCase().trim();
      const name = (m.full_name || '').toLowerCase();
      const nick = (m.nickname || '').toLowerCase();

      // NUNCA remover perfis de administradores oficiais
      if (this.isAdminEmail(email)) return false;

      return (
        id.startsWith('user-trovao') ||
        id.startsWith('user-machado') ||
        id.startsWith('user-falcao') ||
        id.startsWith('user-sombra') ||
        id.startsWith('mock-') ||
        id.startsWith('demo-') ||
        email.includes('trovao@') ||
        email.includes('machado@') ||
        email.includes('falcao@') ||
        email.includes('sombra@') ||
        email.includes('trovao@losmotokas') ||
        nick === 'trovão' ||
        nick === 'machado' ||
        nick === 'falcão' ||
        nick === 'sombra' ||
        name.includes('roberto mendonça') ||
        name.includes('carlos eduardo (machado)') ||
        name.includes('fernando albuquerque') ||
        name.includes('lucas pinheiro')
      );
    };

    const isFakePost = (p: Post) => {
      if (!p || !p.id) return true;
      const id = p.id;
      const authorId = (p.author_id || '').toLowerCase();
      return (
        id === 'post-01' ||
        id === 'post-02' ||
        id === 'post-03' ||
        authorId.startsWith('user-trovao') ||
        authorId.startsWith('user-machado') ||
        authorId.startsWith('user-falcao') ||
        authorId.startsWith('user-sombra') ||
        authorId.startsWith('mock-') ||
        authorId.startsWith('demo-')
      );
    };

    const prevCount = this.members.length;
    this.members = this.members.filter((m) => !isFakeMember(m));
    if (this.members.length !== prevCount) {
      save('members', this.members);
    }

    const prevPostCount = this.posts.length;
    this.posts = this.posts.filter((p) => !isFakePost(p));
    if (this.posts.length !== prevPostCount) {
      save('posts', this.posts);
    }

    // Se o currentUserId era de um perfil fake ou não existe na lista de membros reais
    if (!this.currentUserId || !this.members.some((m) => m.id === this.currentUserId)) {
      this.currentUserId = this.members[0]?.id || '';
      save('currentUserId', this.currentUserId);
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // Tenta sincronizar com o Supabase quando as credenciais estiverem ativas
  public async hydrateFromSupabase() {
    if (!isSupabaseConfigured()) return;
    const client = getSupabase();
    if (!client) return;

    try {
      // 1. Carrega configurações do sistema (ex: emblema oficial do clube)
      try {
        const { data: settingsData } = await client.from('app_settings').select('*');
        if (settingsData && settingsData.length > 0) {
          const emblemSetting = settingsData.find((s: any) => s.key === 'official_emblem');
          if (emblemSetting && emblemSetting.value) {
            this.officialEmblem = emblemSetting.value;
            save('officialEmblem', this.officialEmblem);
            this.notify();
          }
        } else if (this.officialEmblem && this.officialEmblem !== DEFAULT_OFFICIAL_EMBLEM) {
          // Se o Supabase ainda não tem registro, sobe o emblema configurado localmente
          await client.from('app_settings').upsert({
            key: 'official_emblem',
            value: this.officialEmblem,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Erro ao carregar app_settings do Supabase:', err);
      }

      // 2. Carrega perfis de membros
      const { data: profilesData } = await client.from('profiles').select('*');
      if (profilesData && profilesData.length > 0) {
        this.members = profilesData;
        save('members', this.members);
      } else {
        // Se a tabela ainda estiver vazia, sincroniza os admins iniciais
        for (const admin of INITIAL_MEMBERS) {
          await client.from('profiles').upsert({
            id: admin.id,
            email: admin.email,
            full_name: admin.full_name,
            nickname: admin.nickname,
            role: admin.role,
            status: admin.status,
            bio: admin.bio,
            motorcycle_model: admin.motorcycle_model,
            joined_at: admin.joined_at,
          });
        }
      }

      // 3. Carrega publicações com mídias
      const { data: postsData } = await client.from('posts').select('*, post_media(*)').order('created_at', { ascending: false });
      if (postsData && postsData.length > 0) {
        this.posts = postsData.map((p) => ({
          ...p,
          media: p.post_media || [],
          likes_count: p.likes_count || 0,
          comments_count: p.comments_count || 0,
        }));
        save('posts', this.posts);
      }

      // 4. Carrega álbuns da irmandade
      const { data: albumsData } = await client.from('albums').select('*, album_media(*)').order('created_at', { ascending: false });
      if (albumsData && albumsData.length > 0) {
        this.albums = albumsData.map((a: any) => ({
          ...a,
          media_count: (a.album_media || []).length,
        }));
        albumsData.forEach((a: any) => {
          if (a.album_media) {
            this.albumMedia[a.id] = a.album_media;
          }
        });
        save('albums', this.albums);
        save('albumMedia', this.albumMedia);
      }

      // 5. Carrega comunicados oficiais
      const { data: announcementsData } = await client.from('announcements').select('*').order('created_at', { ascending: false });
      if (announcementsData && announcementsData.length > 0) {
        this.announcements = announcementsData;
        save('announcements', this.announcements);
      }

      // 6. Carrega solicitações de adesão
      const { data: requestsData } = await client.from('member_requests').select('*').order('created_at', { ascending: false });
      if (requestsData && requestsData.length > 0) {
        this.requests = requestsData;
        save('requests', this.requests);
      }

      // Inicia sincronização em tempo real via canais Postgres Changes
      this.initRealtimeSubscription();

      this.notify();
    } catch (err) {
      console.warn('Aviso: Utilizando sincronização local enquanto Supabase é provisionado:', err);
    }
  }

  private isRealtimeInitialized = false;

  public initRealtimeSubscription() {
    if (this.isRealtimeInitialized || !isSupabaseConfigured()) return;
    const client = getSupabase();
    if (!client) return;
    this.isRealtimeInitialized = true;

    try {
      client
        .channel('motokas-realtime-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          this.hydrateFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
          this.hydrateFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'post_media' }, () => {
          this.hydrateFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
          this.hydrateFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => {
          this.hydrateFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'albums' }, () => {
          this.hydrateFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'album_media' }, () => {
          this.hydrateFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
          this.hydrateFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => {
          this.hydrateFromSupabase();
        })
        .subscribe();
    } catch (err) {
      console.warn('Realtime channel warning:', err);
    }

    // Polling contínuo de segurança a cada 6 segundos para garantir atualização em tempo real
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.hydrateFromSupabase();
      }, 6000);
    }
  }

  // EMBLEMA OFICIAL DO MOTOCLUBE
  public getOfficialEmblem(): string {
    return this.officialEmblem || DEFAULT_OFFICIAL_EMBLEM;
  }

  public setOfficialEmblem(urlOrBase64: string): void {
    this.officialEmblem = urlOrBase64 || DEFAULT_OFFICIAL_EMBLEM;
    save('officialEmblem', this.officialEmblem);

    // Sincroniza emblema no Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        client.from('app_settings').upsert({
          key: 'official_emblem',
          value: this.officialEmblem,
          updated_at: new Date().toISOString(),
        }).then(({ error }) => {
          if (error) console.warn('Aviso ao sincronizar emblema oficial no Supabase:', error);
        });
      }
    }

    this.notify();
  }

  public resetOfficialEmblem(): void {
    this.officialEmblem = DEFAULT_OFFICIAL_EMBLEM;
    save('officialEmblem', this.officialEmblem);

    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        client.from('app_settings').upsert({
          key: 'official_emblem',
          value: DEFAULT_OFFICIAL_EMBLEM,
          updated_at: new Date().toISOString(),
        }).then(({ error }) => {
          if (error) console.warn('Aviso ao resetar emblema no Supabase:', error);
        });
      }
    }

    this.notify();
  }

  // SESSÃO & USUÁRIO
  public getCurrentUser(): Profile | null {
    if (!this.currentUserId) return null;
    return this.members.find((m) => m.id === this.currentUserId) || null;
  }

  public setCurrentUser(userId: string) {
    this.currentUserId = userId;
    save('currentUserId', this.currentUserId);
    this.notify();
  }

  public isDiretoria(user?: Profile | null): boolean {
    const target = user || this.getCurrentUser();
    if (!target) return false;
    if (this.isAdminEmail(target.email)) return true;
    return target.role === 'diretoria' || (this.members.length > 0 && this.members[0]?.id === target.id);
  }

  // MEMBROS
  public getMembers(): Profile[] {
    return [...this.members];
  }

  public getMemberById(id: string): Profile | undefined {
    return this.members.find((m) => m.id === id);
  }

  public updateProfile(id: string, updates: Partial<Profile>) {
    this.members = this.members.map((m) => {
      if (m.id === id) {
        const updated = { ...m, ...updates };
        if (this.isAdminEmail(updated.email)) {
          updated.role = 'diretoria';
          updated.status = 'active';
        }
        return updated;
      }
      return m;
    });
    save('members', this.members);

    // Sincroniza com Supabase se ativo
    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        const payload: any = {
          nickname: updates.nickname,
          full_name: updates.full_name,
          bio: updates.bio,
          motorcycle_model: updates.motorcycle_model,
          phone: updates.phone,
          avatar_url: updates.avatar_url,
          cover_url: updates.cover_url,
        };
        if (updates.password) payload.password = updates.password;
        if (updates.birth_date) payload.birth_date = updates.birth_date;
        if (updates.mother_name) payload.mother_name = updates.mother_name;
        if (updates.role) payload.role = updates.role;
        if (updates.status) payload.status = updates.status;

        client.from('profiles').update(payload).eq('id', id).then(({ error }) => {
          if (error) console.warn('Erro ao sincronizar atualização de perfil no Supabase:', error);
        });
      }
    }

    // Registra log
    this.addAuditLog('ATUALIZACAO_PERFIL', 'profile', id, `Perfil de ${updates.nickname || updates.full_name || id} atualizado.`);
    this.notify();
  }

  public async registerMemberProfile(data: {
    id?: string;
    email: string;
    full_name: string;
    nickname: string;
    role?: MemberRole;
    motorcycle_model?: string;
    phone?: string;
    birth_date?: string;
    mother_name?: string;
    password?: string;
    bio?: string;
    avatar_url?: string;
    cover_url?: string;
  }): Promise<Profile> {
    const newId = data.id || `user-${Date.now()}`;
    const isFirstMember = this.members.length === 0;
    const isAdmin = this.isAdminEmail(data.email);
    const assignedRole: MemberRole = isAdmin ? 'diretoria' : (data.role || (isFirstMember ? 'diretoria' : 'membro'));

    const newProfile: Profile = {
      id: newId,
      email: data.email,
      full_name: data.full_name,
      nickname: data.nickname,
      role: assignedRole,
      status: 'active',
      motorcycle_model: data.motorcycle_model || 'Motocicleta Custom',
      phone: data.phone || '',
      birth_date: data.birth_date || '',
      mother_name: data.mother_name || '',
      password: data.password || '',
      bio: data.bio || 'Membro do Los Motokas MC — Mossoró/RN.',
      avatar_url: data.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      cover_url: data.cover_url || '/src/assets/images/motokas_road_trip_1791830557313.jpg',
      joined_at: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    const index = this.members.findIndex((m) => m.id === newProfile.id || m.email.toLowerCase() === newProfile.email.toLowerCase());
    if (index >= 0) {
      this.members[index] = { ...this.members[index], ...newProfile };
    } else {
      this.members.push(newProfile);
    }

    save('members', this.members);
    this.currentUserId = newProfile.id;
    save('currentUserId', this.currentUserId);

    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        try {
          const { error: profileErr } = await client.from('profiles').upsert({
            id: newProfile.id,
            email: newProfile.email,
            full_name: newProfile.full_name,
            nickname: newProfile.nickname,
            role: newProfile.role,
            status: 'active',
            motorcycle_model: newProfile.motorcycle_model,
            phone: newProfile.phone,
            birth_date: newProfile.birth_date,
            mother_name: newProfile.mother_name,
            password: newProfile.password,
            bio: newProfile.bio,
            avatar_url: newProfile.avatar_url,
            cover_url: newProfile.cover_url,
            joined_at: newProfile.joined_at,
            created_at: newProfile.created_at,
          });
          if (profileErr) {
            console.error('Erro ao gravar perfil no Supabase:', profileErr);
          }
        } catch (err) {
          console.warn('Erro ao inserir perfil no Supabase:', err);
        }
      }
    }

    this.addAuditLog('CADASTRO_MEMBRO', 'profile', newProfile.id, `Perfil de membro criado: ${newProfile.nickname} (${newProfile.full_name})`);
    this.notify();
    return newProfile;
  }

  // RECUPERAÇÃO DE SENHA COM VERIFICAÇÃO DE DADOS DE SEGURANÇA
  public verifySecurityData(
    email: string,
    phone: string,
    birthDate: string,
    motherName: string
  ): { success: boolean; member?: Profile; errorMessage?: string } {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, errorMessage: 'Informe o e-mail cadastrado do membro.' };
    }

    const member = this.members.find((m) => (m.email || '').trim().toLowerCase() === cleanEmail);
    if (!member) {
      return {
        success: false,
        errorMessage: 'Nenhum perfil de membro foi encontrado com este e-mail no Los Motokas MC.',
      };
    }

    // 1. Verificação do Telefone
    const storedPhone = (member.phone || '').replace(/\D/g, '');
    const inputPhone = (phone || '').replace(/\D/g, '');
    const phoneMatches = 
      Boolean(storedPhone && inputPhone) && (
        storedPhone === inputPhone ||
        (storedPhone.length >= 8 && inputPhone.length >= 8 && (storedPhone.endsWith(inputPhone) || inputPhone.endsWith(storedPhone)))
      );

    if (!phoneMatches) {
      return {
        success: false,
        errorMessage: 'O telefone informado não confere com as informações cadastradas deste membro.',
      };
    }

    // 2. Verificação da Data de Nascimento
    const normDate = (d: string) => {
      if (!d) return '';
      const c = d.trim();
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(c)) {
        const p = c.split('/');
        return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
      }
      if (/^\d{4}-\d{1,2}-\d{1,2}/.test(c)) {
        const p = c.slice(0, 10).split('-');
        return `${p[0]}-${p[1].padStart(2, '0')}-${p[2].padStart(2, '0')}`;
      }
      const dig = c.replace(/\D/g, '');
      if (dig.length === 8) {
        if (dig.startsWith('19') || dig.startsWith('20')) {
          return `${dig.slice(0, 4)}-${dig.slice(4, 6)}-${dig.slice(6, 8)}`;
        }
        return `${dig.slice(4, 8)}-${dig.slice(2, 4)}-${dig.slice(0, 2)}`;
      }
      return c.toLowerCase();
    };

    const storedDate = normDate(member.birth_date || '');
    const inputDate = normDate(birthDate || '');
    if (!storedDate || !inputDate || storedDate !== inputDate) {
      return {
        success: false,
        errorMessage: 'A data de nascimento informada não confere com as informações cadastradas deste membro.',
      };
    }

    // 3. Verificação do Nome da Mãe
    const normText = (t: string) => (t || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');

    const storedMother = normText(member.mother_name || '');
    const inputMother = normText(motherName || '');
    if (!storedMother || !inputMother || storedMother !== inputMother) {
      return {
        success: false,
        errorMessage: 'O nome da mãe informado não confere com as informações cadastradas deste membro.',
      };
    }

    return {
      success: true,
      member,
    };
  }

  // Sobrescrever a senha esquecida com a nova senha
  public overwritePassword(memberId: string, newPassword: string): boolean {
    const member = this.members.find((m) => m.id === memberId);
    if (!member) return false;

    member.password = newPassword;
    save('members', this.members);

    this.addAuditLog(
      'RECUPERACAO_SENHA',
      'profile',
      memberId,
      `Senha de acesso do membro ${member.nickname || member.full_name} foi sobrescrita com sucesso.`
    );
    this.notify();
    return true;
  }

  // SOLICITAÇÕES DE ADESÃO (FILA DA DIRETORIA)
  public getRequests(): MemberRequest[] {
    return [...this.requests];
  }

  public async submitMemberRequest(requestData: Omit<MemberRequest, 'id' | 'status' | 'created_at'>) {
    const newReq: MemberRequest = {
      ...requestData,
      id: `req-${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    this.requests.unshift(newReq);
    save('requests', this.requests);
    this.notify();

    // Sincroniza com o Supabase quando ativo
    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        try {
          await client.from('member_requests').insert({
            full_name: requestData.full_name,
            nickname: requestData.nickname,
            email: requestData.email,
            phone: requestData.phone,
            motorcycle_model: requestData.motorcycle_model,
            city: requestData.city || '',
            reason: requestData.reason,
            status: 'pending',
          });
        } catch (e) {
          console.warn('Erro ao sincronizar member_requests com Supabase:', e);
        }
      }
    }

    return newReq;
  }

  public approveRequest(requestId: string) {
    const req = this.requests.find((r) => r.id === requestId);
    if (!req) return;

    req.status = 'approved';
    const newProfile: Profile = {
      id: `user-${Date.now()}`,
      email: req.email,
      full_name: req.full_name,
      nickname: req.nickname,
      role: 'aspirante',
      status: 'active',
      bio: `Aspirante do Los Motokas MC. Moto: ${req.motorcycle_model}`,
      motorcycle_model: req.motorcycle_model,
      phone: req.phone,
      joined_at: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    this.members.push(newProfile);
    save('requests', this.requests);
    save('members', this.members);

    this.addAuditLog('APROVACAO_MEMBRO', 'member_request', requestId, `Aprovado novo Aspirante: ${req.nickname} (${req.full_name})`);
    this.notify();
  }

  public rejectRequest(requestId: string) {
    this.requests = this.requests.map((r) => (r.id === requestId ? { ...r, status: 'rejected' } : r));
    save('requests', this.requests);
    this.addAuditLog('REJEICAO_MEMBRO', 'member_request', requestId, `Solicitação de adesão rejeitada.`);
    this.notify();
  }

  public updateMemberRole(userId: string, role: MemberRole) {
    const member = this.getMemberById(userId);
    if (member && this.isAdminEmail(member.email) && role !== 'diretoria') {
      console.warn('Os administradores oficiais mantêm sempre o cargo de diretoria.');
      return;
    }
    this.members = this.members.map((m) => (m.id === userId ? { ...m, role } : m));
    save('members', this.members);
    this.addAuditLog('ALTERACAO_CARGO', 'profile', userId, `Cargo alterado para ${role.toUpperCase()}`);
    this.notify();
  }

  public updateMemberStatus(userId: string, status: MemberStatus) {
    this.members = this.members.map((m) => (m.id === userId ? { ...m, status } : m));
    save('members', this.members);
    this.addAuditLog('ALTERACAO_STATUS', 'profile', userId, `Status do membro alterado para ${status.toUpperCase()}`);
    this.notify();
  }

  // POSTAGENS
  public getPosts(): Post[] {
    const currentUser = this.getCurrentUser();
    return this.posts
      .filter((p) => {
        if (p.privacy === 'diretoria_only') {
          return currentUser?.role === 'diretoria';
        }
        return true;
      })
      .map((p) => ({
        ...p,
        author: this.getMemberById(p.author_id),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createPost(data: { content: string; privacy: 'brothers_only' | 'diretoria_only'; mediaUrls?: string[] }) {
    const user = this.getCurrentUser();
    if (!user) return null;

    const newPostId = `post-${Date.now()}`;
    const newMedia = (data.mediaUrls || []).map((url, idx) => ({
      id: `media-${newPostId}-${idx}`,
      post_id: newPostId,
      media_type: (url.endsWith('.mp4') || url.includes('video') ? 'video' : 'photo') as 'photo' | 'video',
      url,
      storage_path: `posts/${newPostId}_${idx}`,
      created_at: new Date().toISOString(),
    }));

    const newPost: Post = {
      id: newPostId,
      author_id: user.id,
      content: data.content,
      privacy: data.privacy,
      created_at: new Date().toISOString(),
      likes_count: 0,
      comments_count: 0,
      user_has_liked: false,
      user_has_saved: false,
      media: newMedia,
      author: user,
    };

    this.posts.unshift(newPost);
    save('posts', this.posts);

    // Sincroniza postagem no Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        client.from('posts').insert({
          id: newPost.id,
          author_id: user.id,
          content: data.content,
          privacy: data.privacy,
          created_at: newPost.created_at,
          likes_count: 0,
          comments_count: 0,
        }).then(async ({ error }) => {
          if (!error && newMedia.length > 0) {
            await client.from('post_media').insert(newMedia);
          }
        });
      }
    }

    this.notify();
    return newPost;
  }

  public deletePost(postId: string) {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return;
    this.posts = this.posts.filter((p) => p.id !== postId);
    save('posts', this.posts);

    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        client.from('posts').delete().eq('id', postId).then(() => {});
      }
    }

    this.addAuditLog('EXCLUSAO_POST', 'post', postId, `Publicação removida.`);
    this.notify();
  }

  public toggleReaction(postId: string, reactionType: ReactionType = 'like') {
    this.posts = this.posts.map((p) => {
      if (p.id === postId) {
        if (p.user_has_liked && p.user_reaction === reactionType) {
          return {
            ...p,
            user_has_liked: false,
            user_reaction: undefined,
            likes_count: Math.max(0, p.likes_count - 1),
          };
        } else {
          const countDiff = p.user_has_liked ? 0 : 1;
          return {
            ...p,
            user_has_liked: true,
            user_reaction: reactionType,
            likes_count: p.likes_count + countDiff,
          };
        }
      }
      return p;
    });
    save('posts', this.posts);
    this.notify();
  }

  public toggleSavePost(postId: string) {
    this.posts = this.posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          user_has_saved: !p.user_has_saved,
        };
      }
      return p;
    });
    save('posts', this.posts);
    this.notify();
  }

  public getSavedPosts(): Post[] {
    return this.getPosts().filter((p) => p.user_has_saved);
  }

  public getMemories(): Post[] {
    // Retorna postagens com mais de 24 horas simulando recordações
    return this.getPosts().filter((p) => {
      const postDate = new Date(p.created_at);
      const diffDays = (Date.now() - postDate.getTime()) / (1000 * 3600 * 24);
      return diffDays >= 1 || p.user_has_saved;
    });
  }

  // COMENTÁRIOS
  public getComments(postId: string): Comment[] {
    const list = this.comments[postId] || [];
    return list.map((c) => ({
      ...c,
      author: this.getMemberById(c.author_id),
    }));
  }

  public addComment(postId: string, content: string) {
    const user = this.getCurrentUser();
    if (!user) return null;

    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      post_id: postId,
      author_id: user.id,
      content,
      created_at: new Date().toISOString(),
      author: user,
    };

    if (!this.comments[postId]) {
      this.comments[postId] = [];
    }
    this.comments[postId].push(newComment);
    save('comments', this.comments);

    this.posts = this.posts.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
    save('posts', this.posts);

    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        client.from('comments').insert({
          id: newComment.id,
          post_id: postId,
          author_id: user.id,
          content,
          created_at: newComment.created_at,
        }).then(() => {});
      }
    }

    this.notify();
    return newComment;
  }

  // ÁLBUNS
  public getAlbums(): Album[] {
    return this.albums.map((a) => ({
      ...a,
      author: this.getMemberById(a.author_id),
      media_count: (this.albumMedia[a.id] || []).length || a.media_count || 0,
    }));
  }

  public getAlbumMedia(albumId: string): AlbumMedia[] {
    return this.albumMedia[albumId] || [];
  }

  public createAlbum(data: { title: string; description: string; category: string; coverUrl?: string; isOfficial?: boolean }) {
    const user = this.getCurrentUser();
    if (!user) return null;

    const newAlbum: Album = {
      id: `album-${Date.now()}`,
      author_id: user.id,
      title: data.title,
      description: data.description,
      category: data.category,
      cover_url: data.coverUrl || '/src/assets/images/motokas_road_trip_1791830557313.jpg',
      is_official: Boolean(data.isOfficial && this.isDiretoria()),
      created_at: new Date().toISOString(),
      media_count: 0,
    };

    this.albums.unshift(newAlbum);
    this.albumMedia[newAlbum.id] = [];
    save('albums', this.albums);
    save('albumMedia', this.albumMedia);

    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        client.from('albums').insert({
          id: newAlbum.id,
          author_id: user.id,
          title: data.title,
          description: data.description,
          category: data.category,
          cover_url: newAlbum.cover_url,
          is_official: newAlbum.is_official,
          created_at: newAlbum.created_at,
        }).then(() => {});
      }
    }

    this.notify();
    return newAlbum;
  }

  public addMediaToAlbum(albumId: string, url: string, caption?: string) {
    const newMedia: AlbumMedia = {
      id: `am-${Date.now()}`,
      album_id: albumId,
      media_type: url.endsWith('.mp4') || url.includes('video') ? 'video' : 'photo',
      url,
      storage_path: `albums/${albumId}_${Date.now()}`,
      caption: caption || '',
      created_at: new Date().toISOString(),
    };

    if (!this.albumMedia[albumId]) {
      this.albumMedia[albumId] = [];
    }
    this.albumMedia[albumId].push(newMedia);
    save('albumMedia', this.albumMedia);

    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        client.from('album_media').insert({
          id: newMedia.id,
          album_id: albumId,
          media_type: newMedia.media_type,
          url: newMedia.url,
          storage_path: newMedia.storage_path,
          caption: newMedia.caption,
          created_at: newMedia.created_at,
        }).then(() => {});
      }
    }

    this.notify();
    return newMedia;
  }

  // COMUNICADOS
  public getAnnouncements(): Announcement[] {
    return this.announcements.map((a) => ({
      ...a,
      author: this.getMemberById(a.author_id),
    }));
  }

  public createAnnouncement(data: { title: string; content: string; priority: 'normal' | 'urgent' }) {
    const user = this.getCurrentUser();
    if (!user || user.role !== 'diretoria') return null;

    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      author_id: user.id,
      title: data.title,
      content: data.content,
      priority: data.priority,
      created_at: new Date().toISOString(),
      author: user,
    };

    this.announcements.unshift(newAnn);
    save('announcements', this.announcements);

    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        client.from('announcements').insert({
          id: newAnn.id,
          author_id: user.id,
          title: data.title,
          content: data.content,
          priority: data.priority,
          created_at: newAnn.created_at,
        }).then(() => {});
      }
    }

    this.addAuditLog('NOVO_COMUNICADO', 'announcement', newAnn.id, `Comunicado emitido: ${data.title}`);
    this.notify();
    return newAnn;
  }

  public deleteAnnouncement(id: string) {
    this.announcements = this.announcements.filter((a) => a.id !== id);
    save('announcements', this.announcements);

    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (client) {
        client.from('announcements').delete().eq('id', id).then(() => {});
      }
    }

    this.addAuditLog('EXCLUSAO_COMUNICADO', 'announcement', id, `Comunicado oficial removido.`);
    this.notify();
  }

  // NOTIFICAÇÕES
  public getNotifications(): Notification[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    return this.notifications
      .filter((n) => n.user_id === user.id)
      .map((n) => ({
        ...n,
        actor: this.getMemberById(n.actor_id),
      }));
  }

  public markNotificationAsRead(id: string) {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    save('notifications', this.notifications);
    this.notify();
  }

  public markAllNotificationsAsRead() {
    const user = this.getCurrentUser();
    if (!user) return;
    this.notifications = this.notifications.map((n) => (n.user_id === user.id ? { ...n, read: true } : n));
    save('notifications', this.notifications);
    this.notify();
  }

  // AUDITORIA
  public getAuditLogs(): AuditLog[] {
    return this.auditLogs.map((l) => ({
      ...l,
      actor: this.getMemberById(l.actor_id),
    }));
  }

  private addAuditLog(action: string, targetType: string, targetId: string, details: string) {
    const user = this.getCurrentUser();
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      actor_id: user?.id || 'system',
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    save('auditLogs', this.auditLogs);
  }
}

export const store = new DataStore();
