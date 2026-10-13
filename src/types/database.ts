export type MemberRole = 'diretoria' | 'membro' | 'aspirante';
export type MemberStatus = 'active' | 'pending' | 'suspended';
export type MediaType = 'photo' | 'video';
export type ReactionType = 'like' | 'love' | 'respect' | 'road';
export type PriorityLevel = 'normal' | 'urgent';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  nickname: string;
  role: MemberRole;
  status: MemberStatus;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  phone?: string;
  birth_date?: string;
  mother_name?: string;
  password?: string;
  motorcycle_model?: string;
  joined_at: string;
  created_at: string;
}

export interface MemberRequest {
  id: string;
  full_name: string;
  nickname: string;
  email: string;
  phone: string;
  motorcycle_model: string;
  city?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface PostMedia {
  id: string;
  post_id: string;
  media_type: MediaType;
  url: string;
  storage_path: string;
  caption?: string;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  privacy: 'brothers_only' | 'diretoria_only';
  created_at: string;
  updated_at?: string;
  author?: Profile;
  media?: PostMedia[];
  likes_count: number;
  comments_count: number;
  user_has_liked?: boolean;
  user_reaction?: ReactionType;
  user_has_saved?: boolean;
}

export interface Album {
  id: string;
  title: string;
  description: string;
  cover_url?: string;
  author_id: string;
  category: string;
  is_official: boolean;
  created_at: string;
  media_count?: number;
  author?: Profile;
  media?: AlbumMedia[];
}

export interface AlbumMedia {
  id: string;
  album_id: string;
  media_type: MediaType;
  url: string;
  storage_path: string;
  caption?: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface SavedPost {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
  post?: Post;
}

export interface Announcement {
  id: string;
  author_id: string;
  title: string;
  content: string;
  priority: PriorityLevel;
  created_at: string;
  author?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'reaction' | 'comment' | 'announcement' | 'member_approved';
  entity_id?: string;
  message: string;
  read: boolean;
  created_at: string;
  actor?: Profile;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: string;
  created_at: string;
  actor?: Profile;
}
