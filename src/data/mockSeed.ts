import { Profile, Post, Album, Announcement, MemberRequest } from '../types/database';

// Emails oficiais designados com permissão e patente administrativa permanente
export const OFFICIAL_ADMIN_EMAILS: string[] = [
  'jequisilveira@gmail.com',
  'klebiohonoratorocha@gmail.com',
];

// Perfis reais dos administradores e oficiais da diretoria
export const INITIAL_MEMBERS: Profile[] = [
  {
    id: 'admin-jequisilveira',
    email: 'jequisilveira@gmail.com',
    full_name: 'Jequi Silveira',
    nickname: 'Jequi',
    role: 'diretoria',
    status: 'active',
    motorcycle_model: 'Harley-Davidson / Custom',
    phone: '',
    bio: 'Administrador e Oficial da Diretoria — Los Motokas MC Mossoró/RN.',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    cover_url: '/src/assets/images/motokas_road_trip_1791830557313.jpg',
    joined_at: '2024-01-01',
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'admin-klebiohonorato',
    email: 'klebiohonoratorocha@gmail.com',
    full_name: 'Klébio Honorato Rocha',
    nickname: 'Klébio',
    role: 'diretoria',
    status: 'active',
    motorcycle_model: 'Harley-Davidson / Custom',
    phone: '',
    bio: 'Administrador e Oficial da Diretoria — Los Motokas MC Mossoró/RN.',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80',
    cover_url: '/src/assets/images/motokas_clubhouse_gathering_1791830585214.jpg',
    joined_at: '2024-01-01',
    created_at: '2024-01-01T00:00:00.000Z',
  },
];

// Nenhuma postagem fake
export const INITIAL_POSTS: Post[] = [];

// Categorias oficiais de álbuns para os membros reais adicionarem fotos e vídeos
export const INITIAL_ALBUMS: Album[] = [
  {
    id: 'album-01',
    title: 'Viagens & Estradas — Los Motokas MC',
    description: 'Registros das grandes viagens, travessias e expedições da irmandade.',
    cover_url: '/src/assets/images/motokas_road_trip_1791830557313.jpg',
    author_id: 'oficial',
    category: 'Viagens',
    is_official: true,
    created_at: new Date().toISOString(),
    media_count: 0,
  },
  {
    id: 'album-02',
    title: 'Reuniões & Clubhouse Mossoró / RN',
    description: 'Encontros da Irmandade, confraternizações, assembleias e momentos no Clubhouse.',
    cover_url: '/src/assets/images/motokas_clubhouse_gathering_1791830585214.jpg',
    author_id: 'oficial',
    category: 'Eventos',
    is_official: true,
    created_at: new Date().toISOString(),
    media_count: 0,
  },
  {
    id: 'album-03',
    title: 'Nossa História & Tradição',
    description: 'Bandeiras, brasões, aniversários e a evolução do Los Motokas MC.',
    cover_url: '/src/assets/images/escudo_oficial.jpg',
    author_id: 'oficial',
    category: 'História',
    is_official: true,
    created_at: new Date().toISOString(),
    media_count: 0,
  },
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];
export const INITIAL_REQUESTS: MemberRequest[] = [];
