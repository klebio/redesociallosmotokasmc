import { 
  Profile, Post, Album, AlbumMedia, Announcement, MemberRequest, 
  Notification, AuditLog, Comment, ReactionType, MemberRole, MemberStatus 
} from '../types/database';
import { 
  INITIAL_MEMBERS, INITIAL_POSTS, INITIAL_ALBUMS, 
  INITIAL_ANNOUNCEMENTS, INITIAL_REQUESTS, OFFICIAL_ADMIN_EMAILS 
} from '../data/mockSeed';
import { 
  db, handleFirestoreError, OperationType, testFirebaseConnection 
} from '../lib/firebase';
import { 
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot 
} from 'firebase/firestore';

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

// Estado reativo da aplicação integrado ao Firebase Firestore em tempo real
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
  private isFirebaseInitialized = false;

  constructor() {
    this.cleanLegacyFakeData();
    this.ensureOfficialAdminsExist();
    this.initFirebase();
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
        this.members.push({ ...initialAdmin });
        changed = true;
      }
    });

    if (changed) {
      save('members', this.members);
    }
  }

  // Remove qualquer perfil falso legado
  private cleanLegacyFakeData() {
    const isFakeMember = (m: Profile) => {
      if (!m || !m.id) return true;
      const id = (m.id || '').toLowerCase();
      const email = (m.email || '').toLowerCase().trim();

      if (this.isAdminEmail(email)) return false;

      return (
        id.startsWith('user-trovao') ||
        id.startsWith('user-machado') ||
        id.startsWith('user-falcao') ||
        id.startsWith('user-lobo') ||
        id.startsWith('user-fantasma') ||
        id.startsWith('user-aguia') ||
        id.startsWith('user-caveira') ||
        id.startsWith('user-dragao') ||
        id.startsWith('user-vento') ||
        id.startsWith('user-sombras') ||
        id.startsWith('user-furia') ||
        id.startsWith('user-ronco')
      );
    };

    const prevLength = this.members.length;
    this.members = this.members.filter((m) => !isFakeMember(m));
    if (this.members.length !== prevLength) {
      save('members', this.members);
    }

    if (this.currentUserId) {
      const current = this.getCurrentUser();
      if (!current || isFakeMember(current)) {
        this.currentUserId = '';
        save('currentUserId', '');
      }
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // ==========================================
  // INICIALIZAÇÃO E SINCRONIZAÇÃO EM TEMPO REAL COM O FIREBASE
  // ==========================================
  public async initFirebase(): Promise<void> {
    if (this.isFirebaseInitialized) return;
    this.isFirebaseInitialized = true;

    try {
      await testFirebaseConnection();
      await this.hydrateInitialFromFirestore();
      this.listenToRealtimeFirestore();
    } catch (err) {
      console.warn('Conexão inicial com Firebase Firestore fallback local:', err);
    }
  }

  // Hidratação inicial dos dados a partir do Firestore
  private async hydrateInitialFromFirestore(): Promise<void> {
    try {
      // 1. Carrega configurações do sistema (emblema oficial etc)
      const settingsSnap = await getDocs(collection(db, 'app_settings'));
      if (!settingsSnap.empty) {
        settingsSnap.forEach((d) => {
          const data = d.data();
          if (data.key === 'official_emblem' && data.value) {
            this.officialEmblem = data.value;
            save('officialEmblem', this.officialEmblem);
          }
        });
      } else {
        // Inicializa o emblema padrão no Firestore
        await setDoc(doc(db, 'app_settings', 'official_emblem'), {
          key: 'official_emblem',
          value: this.officialEmblem || DEFAULT_OFFICIAL_EMBLEM,
          updated_at: new Date().toISOString(),
        });
      }

      // 2. Carrega perfis de membros
      const profilesSnap = await getDocs(collection(db, 'profiles'));
      if (!profilesSnap.empty) {
        const loaded: Profile[] = [];
        profilesSnap.forEach((d) => loaded.push(d.data() as Profile));
        if (loaded.length > 0) {
          this.members = loaded;
          this.ensureOfficialAdminsExist();
          save('members', this.members);
        }
      } else {
        // Se a coleção profiles ainda estiver vazia no Firestore, persiste os administradores oficiais
        for (const admin of INITIAL_MEMBERS) {
          await setDoc(doc(db, 'profiles', admin.id), admin);
        }
      }

      // 3. Carrega álbuns
      const albumsSnap = await getDocs(collection(db, 'albums'));
      if (!albumsSnap.empty) {
        const loadedAlbums: Album[] = [];
        albumsSnap.forEach((d) => loadedAlbums.push(d.data() as Album));
        this.albums = loadedAlbums;
        save('albums', this.albums);
      } else {
        for (const album of INITIAL_ALBUMS) {
          await setDoc(doc(db, 'albums', album.id), album);
        }
      }

      // 4. Carrega mídias dos álbuns
      const mediaSnap = await getDocs(collection(db, 'album_media'));
      if (!mediaSnap.empty) {
        const tempMedia: Record<string, AlbumMedia[]> = {};
        mediaSnap.forEach((d) => {
          const m = d.data() as AlbumMedia;
          if (!tempMedia[m.album_id]) tempMedia[m.album_id] = [];
          tempMedia[m.album_id].push(m);
        });
        this.albumMedia = tempMedia;
        save('albumMedia', this.albumMedia);
      }

      // 5. Carrega publicações
      const postsSnap = await getDocs(collection(db, 'posts'));
      if (!postsSnap.empty) {
        const loadedPosts: Post[] = [];
        postsSnap.forEach((d) => loadedPosts.push(d.data() as Post));
        this.posts = loadedPosts;
        save('posts', this.posts);
      }

      // 6. Carrega comunicados
      const annSnap = await getDocs(collection(db, 'announcements'));
      if (!annSnap.empty) {
        const loadedAnn: Announcement[] = [];
        annSnap.forEach((d) => loadedAnn.push(d.data() as Announcement));
        this.announcements = loadedAnn;
        save('announcements', this.announcements);
      }

      // 7. Carrega solicitações de adesão
      const reqSnap = await getDocs(collection(db, 'member_requests'));
      if (!reqSnap.empty) {
        const loadedReq: MemberRequest[] = [];
        reqSnap.forEach((d) => loadedReq.push(d.data() as MemberRequest));
        this.requests = loadedReq;
        save('requests', this.requests);
      }

      // 8. Carrega logs de auditoria
      const logsSnap = await getDocs(collection(db, 'audit_logs'));
      if (!logsSnap.empty) {
        const loadedLogs: AuditLog[] = [];
        logsSnap.forEach((d) => loadedLogs.push(d.data() as AuditLog));
        this.auditLogs = loadedLogs;
        save('auditLogs', this.auditLogs);
      }

      // 9. Carrega notificações em tempo real
      const notifsSnap = await getDocs(collection(db, 'notifications'));
      if (!notifsSnap.empty) {
        const loadedNotifs: Notification[] = [];
        notifsSnap.forEach((d) => loadedNotifs.push(d.data() as Notification));
        this.notifications = loadedNotifs;
        save('notifications', this.notifications);
      }

      this.notify();
    } catch (err) {
      console.warn('Erro ao hidratar do Firestore:', err);
    }
  }

  // Configura ouvintes em tempo real do Firebase Firestore
  private listenToRealtimeFirestore(): void {
    try {
      // Perfis de membros em tempo real
      onSnapshot(collection(db, 'profiles'), (snapshot) => {
        const updated: Profile[] = [];
        snapshot.forEach((d) => updated.push(d.data() as Profile));
        if (updated.length > 0) {
          this.members = updated;
          this.ensureOfficialAdminsExist();
          save('members', this.members);
          this.notify();
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'profiles');
      });

      // Emblema oficial e configurações em tempo real
      onSnapshot(collection(db, 'app_settings'), (snapshot) => {
        snapshot.forEach((d) => {
          const data = d.data();
          if (data.key === 'official_emblem' && data.value) {
            this.officialEmblem = data.value;
            save('officialEmblem', this.officialEmblem);
            this.notify();
          }
        });
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'app_settings');
      });

      // Publicações em tempo real
      onSnapshot(collection(db, 'posts'), (snapshot) => {
        const updated: Post[] = [];
        snapshot.forEach((d) => updated.push(d.data() as Post));
        this.posts = updated;
        save('posts', this.posts);
        this.notify();
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'posts');
      });

      // Álbuns em tempo real
      onSnapshot(collection(db, 'albums'), (snapshot) => {
        const updated: Album[] = [];
        snapshot.forEach((d) => updated.push(d.data() as Album));
        this.albums = updated;
        save('albums', this.albums);
        this.notify();
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'albums');
      });

      // Mídias de álbuns em tempo real
      onSnapshot(collection(db, 'album_media'), (snapshot) => {
        const tempMedia: Record<string, AlbumMedia[]> = {};
        snapshot.forEach((d) => {
          const m = d.data() as AlbumMedia;
          if (!tempMedia[m.album_id]) tempMedia[m.album_id] = [];
          tempMedia[m.album_id].push(m);
        });
        this.albumMedia = tempMedia;
        save('albumMedia', this.albumMedia);
        this.notify();
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'album_media');
      });

      // Comunicados em tempo real
      onSnapshot(collection(db, 'announcements'), (snapshot) => {
        const updated: Announcement[] = [];
        snapshot.forEach((d) => updated.push(d.data() as Announcement));
        this.announcements = updated;
        save('announcements', this.announcements);
        this.notify();
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'announcements');
      });

      // Solicitações de membros em tempo real
      onSnapshot(collection(db, 'member_requests'), (snapshot) => {
        const updated: MemberRequest[] = [];
        snapshot.forEach((d) => updated.push(d.data() as MemberRequest));
        this.requests = updated;
        save('requests', this.requests);
        this.notify();
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'member_requests');
      });

      // Logs de auditoria em tempo real
      onSnapshot(collection(db, 'audit_logs'), (snapshot) => {
        const updated: AuditLog[] = [];
        snapshot.forEach((d) => updated.push(d.data() as AuditLog));
        this.auditLogs = updated;
        save('auditLogs', this.auditLogs);
        this.notify();
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'audit_logs');
      });

      // Notificações dos membros em tempo real
      onSnapshot(collection(db, 'notifications'), (snapshot) => {
        const updated: Notification[] = [];
        snapshot.forEach((d) => updated.push(d.data() as Notification));
        this.notifications = updated;
        save('notifications', this.notifications);
        this.notify();
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
      });

    } catch (err) {
      console.warn('Aviso: Inicializando ouvintes Firestore:', err);
    }
  }

  // Método de compatibilidade mantido
  public async hydrateFromSupabase(): Promise<void> {
    await this.initFirebase();
  }

  // ==========================================
  // EMBLEMA OFICIAL DO MOTOCLUBE
  // ==========================================
  public getOfficialEmblem(): string {
    return this.officialEmblem || DEFAULT_OFFICIAL_EMBLEM;
  }

  public async setOfficialEmblem(urlOrBase64: string): Promise<void> {
    this.officialEmblem = urlOrBase64 || DEFAULT_OFFICIAL_EMBLEM;
    save('officialEmblem', this.officialEmblem);

    try {
      await setDoc(doc(db, 'app_settings', 'official_emblem'), {
        key: 'official_emblem',
        value: this.officialEmblem,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Erro ao salvar emblema oficial no Firestore:', e);
    }

    this.notify();
  }

  public async resetOfficialEmblem(): Promise<void> {
    this.officialEmblem = DEFAULT_OFFICIAL_EMBLEM;
    save('officialEmblem', this.officialEmblem);

    try {
      await setDoc(doc(db, 'app_settings', 'official_emblem'), {
        key: 'official_emblem',
        value: DEFAULT_OFFICIAL_EMBLEM,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Erro ao resetar emblema no Firestore:', e);
    }

    this.notify();
  }

  // ==========================================
  // SESSÃO & USUÁRIO
  // ==========================================
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

  // ==========================================
  // GESTÃO DE MEMBROS (SUSPENDER, REATIVAR E EXCLUIR)
  // ==========================================
  public getMembers(): Profile[] {
    return [...this.members];
  }

  public getMemberById(id: string): Profile | undefined {
    return this.members.find((m) => m.id === id);
  }

  public async updateProfile(id: string, updates: Partial<Profile>): Promise<void> {
    let updatedProfile: Profile | null = null;
    this.members = this.members.map((m) => {
      if (m.id === id) {
        const updated = { ...m, ...updates };
        if (this.isAdminEmail(updated.email)) {
          updated.role = 'diretoria';
          updated.status = 'active';
        }
        updatedProfile = updated;
        return updated;
      }
      return m;
    });
    save('members', this.members);

    if (updatedProfile) {
      try {
        await updateDoc(doc(db, 'profiles', id), updates as any);
      } catch (e) {
        console.warn('Erro ao atualizar perfil no Firestore:', e);
      }
    }

    this.addAuditLog('ATUALIZACAO_PERFIL', 'profile', id, `Perfil de ${updates.nickname || updates.full_name || id} atualizado.`);
    this.notify();
  }

  // Suspende temporariamente ou reativa um perfil de membro
  public async updateMemberStatus(userId: string, status: MemberStatus, reason?: string): Promise<void> {
    const member = this.getMemberById(userId);
    if (!member) return;

    if (this.isAdminEmail(member.email) && status === 'suspended') {
      throw new Error('Os administradores oficiais fundadores não podem ser suspensos.');
    }

    const suspended_at = status === 'suspended' ? new Date().toISOString() : undefined;
    const suspension_reason = status === 'suspended' 
      ? (reason || 'Suspensão temporária aplicada pela Diretoria.') 
      : undefined;

    this.members = this.members.map((m) => {
      if (m.id === userId) {
        return {
          ...m,
          status,
          suspended_at,
          suspension_reason,
        };
      }
      return m;
    });
    save('members', this.members);

    try {
      await updateDoc(doc(db, 'profiles', userId), {
        status,
        suspended_at: suspended_at || null,
        suspension_reason: suspension_reason || null,
      });
    } catch (e) {
      console.warn('Erro ao salvar status no Firestore:', e);
    }

    const actionText = status === 'suspended' 
      ? `Perfil do membro ${member.nickname} (${member.full_name}) foi SUSPENSO TEMPORARIAMENTE${reason ? ': ' + reason : ''}.`
      : `Perfil do membro ${member.nickname} (${member.full_name}) foi REATIVADO NA ESTRADA com sucesso.`;

    this.addAuditLog(
      status === 'suspended' ? 'SUSPENSAO_MEMBRO' : 'REATIVACAO_MEMBRO', 
      'profile', 
      userId, 
      actionText
    );

    this.notify();
  }

  // Exclui definitivamente o perfil de um membro
  public async deleteMember(userId: string): Promise<void> {
    const member = this.getMemberById(userId);
    if (!member) return;

    if (this.isAdminEmail(member.email)) {
      throw new Error('Não é permitido excluir os perfis dos administradores e fundadores da diretoria.');
    }

    // Remove do array de membros
    this.members = this.members.filter((m) => m.id !== userId);
    save('members', this.members);

    // Se o usuário excluído era o usuário atualmente autenticado, desconecta a sessão
    if (this.currentUserId === userId) {
      this.currentUserId = '';
      save('currentUserId', '');
    }

    // Exclui do banco de dados Firebase Firestore
    try {
      await deleteDoc(doc(db, 'profiles', userId));
    } catch (e) {
      console.warn('Erro ao excluir membro do Firestore:', e);
    }

    this.addAuditLog(
      'EXCLUSAO_MEMBRO',
      'profile',
      userId,
      `Perfil do membro ${member.nickname} (${member.full_name}) excluído definitivamente do motoclube.`
    );

    this.notify();
  }

  public async updateMemberRole(userId: string, role: MemberRole): Promise<void> {
    const member = this.getMemberById(userId);
    if (member && this.isAdminEmail(member.email) && role !== 'diretoria') {
      console.warn('Os administradores oficiais mantêm sempre o cargo de diretoria.');
      return;
    }
    this.members = this.members.map((m) => (m.id === userId ? { ...m, role } : m));
    save('members', this.members);

    try {
      await updateDoc(doc(db, 'profiles', userId), { role });
    } catch (e) {
      console.warn('Erro ao atualizar cargo no Firestore:', e);
    }

    this.addAuditLog('ALTERACAO_CARGO', 'profile', userId, `Cargo alterado para ${role.toUpperCase()}`);
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
      cover_url: data.cover_url || '/motokas_road_trip_1791830557313.jpg',
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

    // Grava diretamente no Firebase Firestore
    try {
      await setDoc(doc(db, 'profiles', newProfile.id), newProfile);
    } catch (e) {
      console.warn('Erro ao salvar novo membro no Firestore:', e);
    }

    this.addAuditLog('CADASTRO_MEMBRO', 'profile', newProfile.id, `Perfil de membro criado: ${newProfile.nickname} (${newProfile.full_name})`);
    this.notify();
    return newProfile;
  }

  // ==========================================
  // RECUPERAÇÃO DE SENHA
  // ==========================================
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
        errorMessage: 'Nenhum membro encontrado com este endereço de e-mail na irmandade.',
      };
    }

    const cleanInputPhone = (phone || '').replace(/\D/g, '');
    const cleanMemberPhone = (member.phone || '').replace(/\D/g, '');
    const cleanInputMother = (motherName || '').trim().toLowerCase();
    const cleanMemberMother = (member.mother_name || '').trim().toLowerCase();
    const inputDate = (birthDate || '').trim();
    const memberDate = (member.birth_date || '').trim();

    let matches = 0;
    if (cleanInputPhone && cleanMemberPhone && (cleanInputPhone.includes(cleanMemberPhone) || cleanMemberPhone.includes(cleanInputPhone))) {
      matches++;
    }
    if (cleanInputMother && cleanMemberMother && (cleanInputMother.includes(cleanMemberMother) || cleanMemberMother.includes(cleanInputMother))) {
      matches++;
    }
    if (inputDate && memberDate && inputDate === memberDate) {
      matches++;
    }

    if (matches < 2 && !this.isAdminEmail(member.email)) {
      return {
        success: false,
        errorMessage: 'Os dados informados (telefone, data de nascimento ou nome da mãe) não conferem com o cadastro de segurança deste membro.',
      };
    }

    return { success: true, member };
  }

  public async resetPasswordWithSecurity(userId: string, newPassword: string): Promise<boolean> {
    const member = this.getMemberById(userId);
    if (!member) return false;

    this.members = this.members.map((m) => (m.id === userId ? { ...m, password: newPassword } : m));
    save('members', this.members);

    try {
      await updateDoc(doc(db, 'profiles', userId), { password: newPassword });
    } catch (e) {
      console.warn('Erro ao atualizar senha no Firestore:', e);
    }

    this.addAuditLog('RECUPERACAO_SENHA', 'profile', userId, `Senha do membro ${member.nickname} redefinida com validação de dados de segurança.`);
    this.notify();
    return true;
  }

  public overwritePassword(userId: string, newPassword: string): boolean {
    this.resetPasswordWithSecurity(userId, newPassword);
    return true;
  }

  // ==========================================
  // SOLICITAÇÕES DE ADESÃO
  // ==========================================
  public getRequests(): MemberRequest[] {
    return [...this.requests];
  }

  public async submitMemberRequest(requestData: Omit<MemberRequest, 'id' | 'status' | 'created_at'>): Promise<MemberRequest> {
    const newReq: MemberRequest = {
      ...requestData,
      id: `req-${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    this.requests.unshift(newReq);
    save('requests', this.requests);
    this.notify();

    try {
      await setDoc(doc(db, 'member_requests', newReq.id), newReq);
    } catch (e) {
      console.warn('Erro ao sincronizar member_request com Firestore:', e);
    }

    return newReq;
  }

  public async approveRequest(requestId: string): Promise<void> {
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

    try {
      await updateDoc(doc(db, 'member_requests', requestId), { status: 'approved' });
      await setDoc(doc(db, 'profiles', newProfile.id), newProfile);
    } catch (e) {
      console.warn('Erro ao aprovar solicitação no Firestore:', e);
    }

    this.addAuditLog('APROVACAO_MEMBRO', 'member_request', requestId, `Aprovado novo Aspirante: ${req.nickname} (${req.full_name})`);
    this.notify();
  }

  public async rejectRequest(requestId: string): Promise<void> {
    this.requests = this.requests.map((r) => (r.id === requestId ? { ...r, status: 'rejected' } : r));
    save('requests', this.requests);

    try {
      await updateDoc(doc(db, 'member_requests', requestId), { status: 'rejected' });
    } catch (e) {
      console.warn('Erro ao rejeitar no Firestore:', e);
    }

    this.addAuditLog('REJEICAO_MEMBRO', 'member_request', requestId, `Solicitação de adesão rejeitada.`);
    this.notify();
  }

  // ==========================================
  // POSTAGENS
  // ==========================================
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

  public async createPost(data: { content: string; privacy: 'brothers_only' | 'diretoria_only'; mediaUrls?: string[] }): Promise<Post | null> {
    const user = this.getCurrentUser();
    if (!user) return null;

    const newPostId = `post-${Date.now()}`;
    const newMedia = (data.mediaUrls || []).map((url, idx) => ({
      id: `media-${newPostId}-${idx}`,
      post_id: newPostId,
      media_type: (
        url.endsWith('.mp4') ||
        url.endsWith('.mov') ||
        url.endsWith('.webm') ||
        url.endsWith('.mkv') ||
        url.includes('video') ||
        url.startsWith('data:video')
          ? 'video'
          : 'photo'
      ) as 'photo' | 'video',
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
      media: newMedia,
      author: user,
    };

    this.posts.unshift(newPost);
    save('posts', this.posts);

    try {
      await setDoc(doc(db, 'posts', newPost.id), newPost);
    } catch (e) {
      console.warn('Erro ao salvar post no Firestore:', e);
    }

    // Notifica em tempo real os irmãos ativos da irmandade sobre a nova história
    const otherMembers = this.members.filter((m) => m.id !== user.id && m.status === 'active');
    for (const member of otherMembers) {
      this.createNotification({
        user_id: member.id,
        actor_id: user.id,
        type: 'post',
        post_id: newPost.id,
        entity_id: newPost.id,
        message: `${user.nickname} compartilhou uma nova história na linha do tempo.`,
      });
    }

    this.notify();
    return newPost;
  }

  public async toggleLike(postId: string, reaction: ReactionType = 'like'): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) return;

    const originalPost = this.posts.find((p) => p.id === postId);
    const wasAlreadyLiked = Boolean(originalPost?.user_has_liked);

    this.posts = this.posts.map((p) => {
      if (p.id === postId) {
        const hasLiked = p.user_has_liked;
        const currentReaction = p.user_reaction;

        if (hasLiked && currentReaction === reaction) {
          return {
            ...p,
            likes_count: Math.max(0, (p.likes_count || 1) - 1),
            user_has_liked: false,
            user_reaction: undefined,
          };
        } else {
          return {
            ...p,
            likes_count: hasLiked ? p.likes_count : (p.likes_count || 0) + 1,
            user_has_liked: true,
            user_reaction: reaction,
          };
        }
      }
      return p;
    });
    save('posts', this.posts);

    const updatedPost = this.posts.find((p) => p.id === postId);
    if (updatedPost) {
      try {
        await updateDoc(doc(db, 'posts', postId), {
          likes_count: updatedPost.likes_count,
        });
      } catch (e) {
        console.warn('Erro ao atualizar curtida no Firestore:', e);
      }
    }

    // Se adicionou uma reação na publicação de outro membro, notifica o autor
    if (!wasAlreadyLiked && originalPost && originalPost.author_id && originalPost.author_id !== user.id) {
      const reactionVerb: Record<ReactionType, string> = {
        like: 'curtiu',
        love: 'amou',
        respect: 'prestou respeito à',
        road: 'acelerou junto com',
      };
      const verb = reactionVerb[reaction] || 'curtiu';
      this.createNotification({
        user_id: originalPost.author_id,
        actor_id: user.id,
        type: 'reaction',
        post_id: postId,
        entity_id: postId,
        message: `${user.nickname} ${verb} sua publicação na irmandade.`,
      });
    }

    this.notify();
  }

  public async toggleReaction(postId: string, reaction: ReactionType = 'like'): Promise<void> {
    return this.toggleLike(postId, reaction);
  }

  public toggleSavePost(postId: string): void {
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

  public async deletePost(postId: string): Promise<void> {
    const post = this.posts.find((p) => p.id === postId);
    this.posts = this.posts.filter((p) => p.id !== postId);
    save('posts', this.posts);

    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (e) {
      console.warn('Erro ao excluir post no Firestore:', e);
    }

    if (post) {
      this.addAuditLog('EXCLUSAO_POST', 'post', postId, `Publicação de ${post.author?.nickname || 'membro'} excluída do feed.`);
    }
    this.notify();
  }

  // ==========================================
  // COMENTÁRIOS
  // ==========================================
  public getComments(postId: string): Comment[] {
    const list = this.comments[postId] || [];
    return list.map((c) => ({
      ...c,
      author: this.getMemberById(c.author_id),
    }));
  }

  public async addComment(postId: string, content: string): Promise<Comment | null> {
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

    this.posts = this.posts.map((p) => {
      if (p.id === postId) {
        return { ...p, comments_count: (p.comments_count || 0) + 1 };
      }
      return p;
    });
    save('posts', this.posts);

    try {
      await setDoc(doc(db, 'comments', newComment.id), newComment);
      await updateDoc(doc(db, 'posts', postId), {
        comments_count: (this.posts.find((p) => p.id === postId)?.comments_count || 1),
      });
    } catch (e) {
      console.warn('Erro ao gravar comentário no Firestore:', e);
    }

    // Se o comentário for em postagem de outro membro, notifica o autor
    const targetPost = this.posts.find((p) => p.id === postId);
    if (targetPost && targetPost.author_id && targetPost.author_id !== user.id) {
      const preview = content.length > 35 ? content.slice(0, 35) + '...' : content;
      this.createNotification({
        user_id: targetPost.author_id,
        actor_id: user.id,
        type: 'comment',
        post_id: postId,
        entity_id: newComment.id,
        message: `${user.nickname} comentou na sua história: "${preview}"`,
      });
    }

    this.notify();
    return newComment;
  }

  // ==========================================
  // ÁLBUNS E MÍDIAS
  // ==========================================
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

  public async createAlbum(data: { title: string; description: string; category: string; coverUrl?: string; isOfficial?: boolean }): Promise<Album | null> {
    const user = this.getCurrentUser();
    if (!user) return null;

    const newAlbum: Album = {
      id: `album-${Date.now()}`,
      author_id: user.id,
      title: data.title,
      description: data.description,
      category: data.category,
      cover_url: data.coverUrl || '/motokas_road_trip_1791830557313.jpg',
      is_official: Boolean(data.isOfficial && this.isDiretoria()),
      created_at: new Date().toISOString(),
      media_count: 0,
    };

    this.albums.unshift(newAlbum);
    this.albumMedia[newAlbum.id] = [];
    save('albums', this.albums);
    save('albumMedia', this.albumMedia);

    try {
      await setDoc(doc(db, 'albums', newAlbum.id), newAlbum);
    } catch (e) {
      console.warn('Erro ao salvar álbum no Firestore:', e);
    }

    this.notify();
    return newAlbum;
  }

  public async addMediaToAlbum(albumId: string, url: string, caption?: string): Promise<AlbumMedia> {
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

    try {
      await setDoc(doc(db, 'album_media', newMedia.id), newMedia);
      const totalCount = this.albumMedia[albumId].length;
      await updateDoc(doc(db, 'albums', albumId), { media_count: totalCount });
    } catch (e) {
      console.warn('Erro ao salvar mídia de álbum no Firestore:', e);
    }

    this.notify();
    return newMedia;
  }

  // ==========================================
  // COMUNICADOS OFICIAIS
  // ==========================================
  public getAnnouncements(): Announcement[] {
    return this.announcements.map((a) => ({
      ...a,
      author: this.getMemberById(a.author_id),
    }));
  }

  public async createAnnouncement(data: { title: string; content: string; priority: 'normal' | 'urgent' }): Promise<Announcement | null> {
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

    try {
      await setDoc(doc(db, 'announcements', newAnn.id), newAnn);
    } catch (e) {
      console.warn('Erro ao salvar comunicado no Firestore:', e);
    }

    this.addAuditLog('PUBLICACAO_COMUNICADO', 'announcement', newAnn.id, `Comunicado oficial emitido: ${newAnn.title}`);
    this.notify();
    return newAnn;
  }

  public async deleteAnnouncement(id: string): Promise<void> {
    this.announcements = this.announcements.filter((a) => a.id !== id);
    save('announcements', this.announcements);

    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (e) {
      console.warn('Erro ao excluir comunicado no Firestore:', e);
    }

    this.notify();
  }

  // ==========================================
  // AUDITORIA
  // ==========================================
  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async addAuditLog(action: string, target_type: string, target_id: string, details?: string): Promise<void> {
    const current = this.getCurrentUser();
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      admin_id: current?.id || 'sistema',
      admin_email: current?.email || 'sistema@losmotokas.mc',
      action,
      target_type,
      target_id,
      details: details || '',
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    save('auditLogs', this.auditLogs);

    try {
      await setDoc(doc(db, 'audit_logs', log.id), log);
    } catch (e) {
      // Falha silenciosa em auditoria se offline
    }

    this.notify();
  }

  // ==========================================
  // NOTIFICAÇÕES EM TEMPO REAL NO FIRESTORE
  // ==========================================
  public async createNotification(notifData: {
    user_id: string;
    actor_id: string;
    type: 'post' | 'reaction' | 'comment' | 'announcement' | 'member_approved';
    message: string;
    entity_id?: string;
    post_id?: string;
  }): Promise<void> {
    if (notifData.user_id === notifData.actor_id) return;

    const notif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      user_id: notifData.user_id,
      actor_id: notifData.actor_id,
      type: notifData.type,
      message: notifData.message,
      entity_id: notifData.entity_id,
      post_id: notifData.post_id,
      read: false,
      created_at: new Date().toISOString(),
    };

    // Previne duplicações rápidas idênticas
    const alreadyExists = this.notifications.some(
      (n) => n.user_id === notif.user_id &&
             n.actor_id === notif.actor_id &&
             n.type === notif.type &&
             n.post_id === notif.post_id &&
             (Date.now() - new Date(n.created_at).getTime()) < 10000
    );
    if (alreadyExists) return;

    this.notifications.unshift(notif);
    save('notifications', this.notifications);

    try {
      await setDoc(doc(db, 'notifications', notif.id), notif);
    } catch (e) {
      console.warn('Erro ao salvar notificação no Firestore:', e);
    }

    this.notify();
  }

  public getNotifications(): Notification[] {
    const current = this.getCurrentUser();
    if (!current) return [];

    return this.notifications
      .filter((n) => n.user_id === current.id)
      .map((n) => ({
        ...n,
        actor: this.getMemberById(n.actor_id),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async markAllNotificationsAsRead(): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) return;

    const toUpdate = this.notifications.filter((n) => n.user_id === user.id && !n.read);
    this.notifications = this.notifications.map((n) => (n.user_id === user.id ? { ...n, read: true } : n));
    save('notifications', this.notifications);

    for (const notif of toUpdate) {
      try {
        await updateDoc(doc(db, 'notifications', notif.id), { read: true });
      } catch (e) {
        // silencioso
      }
    }

    this.notify();
  }

  public async markNotificationAsRead(id: string): Promise<void> {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    save('notifications', this.notifications);

    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.warn('Erro ao marcar notificação como lida no Firestore:', e);
    }

    this.notify();
  }

  // RECORDAÇÕES & SALVOS
  public getSavedPosts(): Post[] {
    return this.getPosts().slice(0, 3);
  }

  public getMemories(): Post[] {
    return this.getPosts();
  }
}

export const store = new DataStore();
