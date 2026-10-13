import { Profile, Post, Album, Announcement, MemberRequest } from '../types/database';

// Nenhum perfil fake — apenas perfis reais cadastrados no Supabase
export const INITIAL_MEMBERS: Profile[] = [];

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
