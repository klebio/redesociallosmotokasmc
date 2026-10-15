/**
 * Script SQL Definitivo de Migração do Banco de Dados PostgreSQL & Supabase
 * Los Motokas MC — Nossa História
 * Inclui: Tabelas, Índices, Políticas RLS, Storage Bucket e Triggers
 */

export const SUPABASE_SQL_MIGRATION = `-- ====================================================================
-- LOS MOTOKAS MC — NOSSA HISTÓRIA
-- BANCO DE DADOS POSTGRESQL & POLÍTICAS RLS NO SUPABASE
-- Execute este script no SQL Editor do painel do seu projeto Supabase:
-- https://supabase.com/dashboard/project/vqxocqqjzchpynrertcu/sql/new
-- ====================================================================

-- 1. HABILITAR EXTENSÃO CRIPTOGRÁFICA / UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. RECRIAÇÃO LIMPA DE TABELAS (REMOVE RESTRIÇÕES ANTIGAS COM CONFLITO)
DROP TABLE IF EXISTS public.post_media CASCADE;
DROP TABLE IF EXISTS public.album_media CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.reactions CASCADE;
DROP TABLE IF EXISTS public.saved_posts CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.albums CASCADE;
DROP TABLE IF EXISTS public.member_requests CASCADE;
DROP TABLE IF EXISTS public.app_settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. TABELA DE PERFIS DOS MEMBROS (SUPORTA UUID DO AUTH E IDS TEXTUAIS)
CREATE TABLE public.profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  nickname TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'membro' CHECK (role IN ('diretoria', 'membro', 'aspirante')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  phone TEXT,
  birth_date TEXT,
  mother_name TEXT,
  password TEXT,
  motorcycle_model TEXT,
  joined_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABELA DE SOLICITAÇÕES DE ADESÃO (FILA DA DIRETORIA)
CREATE TABLE public.member_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  full_name TEXT NOT NULL,
  nickname TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  motorcycle_model TEXT NOT NULL,
  city TEXT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABELA DE PUBLICAÇÕES (FEED DA IRMANDADE)
CREATE TABLE public.posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  author_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  privacy TEXT NOT NULL DEFAULT 'brothers_only' CHECK (privacy IN ('brothers_only', 'diretoria_only')),
  likes_count INT NOT NULL DEFAULT 0,
  comments_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 6. TABELA DE MÍDIAS DAS PUBLICAÇÕES
CREATE TABLE public.post_media (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL DEFAULT 'photo' CHECK (media_type IN ('photo', 'video')),
  url TEXT NOT NULL,
  storage_path TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABELA DE ÁLBUNS DA IRMANDADE (GALERIA)
CREATE TABLE public.albums (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  author_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  category TEXT NOT NULL DEFAULT 'Geral',
  is_official BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABELA DE MÍDIAS DOS ÁLBUNS
CREATE TABLE public.album_media (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  album_id TEXT NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL DEFAULT 'photo' CHECK (media_type IN ('photo', 'video')),
  url TEXT NOT NULL,
  storage_path TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TABELA DE COMENTÁRIOS
CREATE TABLE public.comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABELA DE REAÇÕES (CURTIDAS DA IRMANDADE)
CREATE TABLE public.reactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'respect', 'road')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_post_user_reaction UNIQUE (post_id, user_id)
);

-- 11. TABELA DE PUBLICAÇÕES SALVAS (RECORDAÇÕES)
CREATE TABLE public.saved_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_post_saved UNIQUE (user_id, post_id)
);

-- 12. TABELA DE COMUNICADOS OFICIAIS DA DIRETORIA
CREATE TABLE public.announcements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  author_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. TABELA DE NOTIFICAÇÕES
CREATE TABLE public.notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id TEXT,
  type TEXT NOT NULL,
  entity_id TEXT,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. TABELA DE AUDITORIA ADMINISTRATIVA
CREATE TABLE public.audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  actor_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. TABELA DE CONFIGURAÇÕES DO SISTEMA (EMBLEMA OFICIAL, DADOS DO CLUBE)
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- ÍNDICES PARA ALTA PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_post_media_post ON public.post_media(post_id);
CREATE INDEX IF NOT EXISTS idx_albums_created_at ON public.albums(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_album_media_album ON public.album_media(album_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_reactions_post ON public.reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON public.saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);

-- ====================================================================
-- HABILITAÇÃO DO ROW LEVEL SECURITY (RLS) COM POLÍTICAS DIRETAS
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS COMPLETAS DE ACESSO PARA ANON E AUTHENTICATED
CREATE POLICY "profiles_access" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "requests_access" ON public.member_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "posts_access" ON public.posts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "post_media_access" ON public.post_media FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "albums_access" ON public.albums FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "album_media_access" ON public.album_media FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "comments_access" ON public.comments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "reactions_access" ON public.reactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "saved_posts_access" ON public.saved_posts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "announcements_access" ON public.announcements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "notifications_access" ON public.notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "audit_logs_access" ON public.audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "app_settings_access" ON public.app_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ====================================================================
-- SEED DOS DOIS ADMINISTRADORES OFICIAIS PERMANENTES
-- ====================================================================
INSERT INTO public.profiles (
  id, email, full_name, nickname, role, status, bio, motorcycle_model, joined_at
) VALUES 
(
  'admin-jequisilveira',
  'jequisilveira@gmail.com',
  'Jequi Silveira',
  'Jequi',
  'diretoria',
  'active',
  'Administrador e Oficial da Diretoria — Los Motokas MC Mossoró/RN.',
  'Harley-Davidson / Custom',
  '2024-01-01'
),
(
  'admin-klebiohonorato',
  'klebiohonoratorocha@gmail.com',
  'Klébio Honorato Rocha',
  'Klébio',
  'diretoria',
  'active',
  'Administrador e Oficial da Diretoria — Los Motokas MC Mossoró/RN.',
  'Harley-Davidson / Custom',
  '2024-01-01'
)
ON CONFLICT (id) DO UPDATE SET 
  role = 'diretoria', 
  status = 'active';

-- ====================================================================
-- SEED DOS ÁLBUNS OFICIAIS DA IRMANDADE (GALERIA)
-- ====================================================================
INSERT INTO public.albums (id, title, description, category, is_official, author_id)
VALUES 
(
  'album-01',
  'Viagens & Estradas — Los Motokas MC',
  'Registros das grandes viagens, travessias e expedições da irmandade.',
  'Viagens',
  true,
  'admin-klebiohonorato'
),
(
  'album-02',
  'Encontros, Festas & Aniversários',
  'Comemorações e confraternizações no motoclube.',
  'Eventos',
  true,
  'admin-jequisilveira'
),
(
  'album-03',
  'Motos, Máquinas & Customizações',
  'As motocicletas oficiais dos irmãos do Los Motokas MC.',
  'Motos',
  true,
  'admin-klebiohonorato'
)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- CONFIGURAÇÃO DO BUCKET DO SUPABASE STORAGE (FOTOS & VÍDEOS)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('motokas-media', 'motokas-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public View motokas-media" ON storage.objects;
CREATE POLICY "Public View motokas-media" ON storage.objects 
  FOR SELECT TO anon, authenticated 
  USING (bucket_id = 'motokas-media');

DROP POLICY IF EXISTS "Public Upload motokas-media" ON storage.objects;
CREATE POLICY "Public Upload motokas-media" ON storage.objects 
  FOR INSERT TO anon, authenticated 
  WITH CHECK (bucket_id = 'motokas-media');

DROP POLICY IF EXISTS "Public Update motokas-media" ON storage.objects;
CREATE POLICY "Public Update motokas-media" ON storage.objects 
  FOR UPDATE TO anon, authenticated 
  USING (bucket_id = 'motokas-media');

DROP POLICY IF EXISTS "Public Delete motokas-media" ON storage.objects;
CREATE POLICY "Public Delete motokas-media" ON storage.objects 
  FOR DELETE TO anon, authenticated 
  USING (bucket_id = 'motokas-media');

-- ====================================================================
-- TRIGGER PARA SINCRONIZAR USUÁRIOS CRIADOS PELO SUPABASE AUTH
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    nickname,
    role,
    status,
    bio,
    motorcycle_model,
    phone,
    birth_date,
    mother_name,
    joined_at
  ) VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Membro Los Motokas'),
    COALESCE(NEW.raw_user_meta_data->>'nickname', 'Irmão'),
    CASE 
      WHEN LOWER(NEW.email) IN ('jequisilveira@gmail.com', 'klebiohonoratorocha@gmail.com') THEN 'diretoria'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'membro')
    END,
    'active',
    'Orgulho em rodar com o Los Motokas MC.',
    COALESCE(NEW.raw_user_meta_data->>'motorcycle_model', 'Harley-Davidson / Custom'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'birth_date', ''),
    COALESCE(NEW.raw_user_meta_data->>'mother_name', ''),
    CURRENT_DATE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    nickname = EXCLUDED.nickname;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
`;
