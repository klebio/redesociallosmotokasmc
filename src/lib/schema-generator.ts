/**
 * Script SQL de Migração do Banco de Dados PostgreSQL & Supabase
 * Los Motokas MC — Nossa História
 * Inclui: Tabelas, Índices, Políticas RLS, Storage e Triggers
 */

export const SUPABASE_SQL_MIGRATION = `-- ====================================================================
-- LOS MOTOKAS MC — REDE SOCIAL OFICIAL DA IRMANDADE
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS POSTGRESQL & POLÍTICAS RLS
-- ====================================================================

-- 1. HABILITAR EXTENSÃO UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE PERFIS DOS MEMBROS (VINCULADA A AUTH.USERS)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  nickname TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'membro' CHECK (role IN ('diretoria', 'membro', 'aspirante')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  phone TEXT,
  motorcycle_model TEXT,
  joined_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABELA DE SOLICITAÇÕES DE ADESÃO (FILA DE APROVAÇÃO PELA DIRETORIA)
CREATE TABLE IF NOT EXISTS public.member_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 4. TABELA DE PUBLICAÇÕES (FEED DA IRMANDADE)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  privacy TEXT NOT NULL DEFAULT 'brothers_only' CHECK (privacy IN ('brothers_only', 'diretoria_only')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 5. TABELA DE MÍDIAS DAS PUBLICAÇÕES (FOTOGRAFIAS E VÍDEOS)
CREATE TABLE IF NOT EXISTS public.post_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABELA DE ÁLBUNS DA IRMANDADE
CREATE TABLE IF NOT EXISTS public.albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  category TEXT NOT NULL DEFAULT 'Geral',
  is_official BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABELA DE MÍDIAS DOS ÁLBUNS
CREATE TABLE IF NOT EXISTS public.album_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABELA DE COMENTÁRIOS
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TABELA DE REAÇÕES (CURTIDAS DA IRMANDADE)
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'respect', 'road')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_post_user_reaction UNIQUE (post_id, user_id)
);

-- 10. TABELA DE PUBLICAÇÕES SALVAS (MINHAS RECORDAÇÕES)
CREATE TABLE IF NOT EXISTS public.saved_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_post_saved UNIQUE (user_id, post_id)
);

-- 11. TABELA DE COMUNICADOS OFICIAIS DA DIRETORIA
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. TABELA DE NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('reaction', 'comment', 'announcement', 'member_approved')),
  entity_id UUID,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. REGISTROS DE AUDITORIA ADMINISTRATIVA
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
-- ROW LEVEL SECURITY (RLS) POLICIES
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

-- FUNÇÃO AUXILIAR: VERIFICAR SE O USUÁRIO É DA DIRETORIA
CREATE OR REPLACE FUNCTION public.is_diretoria(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'diretoria' AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLÍTICAS: PROFILES
DROP POLICY IF EXISTS "Perfis ativos visiveis por membros" ON public.profiles;
CREATE POLICY "Perfis ativos visiveis por membros" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Membro edita proprio perfil" ON public.profiles;
CREATE POLICY "Membro edita proprio perfil" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- POLÍTICAS: MEMBER_REQUESTS
DROP POLICY IF EXISTS "Qualquer um pode enviar solicitacao" ON public.member_requests;
CREATE POLICY "Qualquer um pode enviar solicitacao" ON public.member_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Apenas diretoria visualiza solicitacoes" ON public.member_requests;
CREATE POLICY "Apenas diretoria visualiza solicitacoes" ON public.member_requests
  FOR SELECT TO authenticated
  USING (public.is_diretoria(auth.uid()));

DROP POLICY IF EXISTS "Apenas diretoria altera solicitacoes" ON public.member_requests;
CREATE POLICY "Apenas diretoria altera solicitacoes" ON public.member_requests
  FOR UPDATE TO authenticated
  USING (public.is_diretoria(auth.uid()));

-- POLÍTICAS: POSTS
DROP POLICY IF EXISTS "Membros leem posts permitidos" ON public.posts;
CREATE POLICY "Membros leem posts permitidos" ON public.posts
  FOR SELECT TO authenticated
  USING (
    privacy = 'brothers_only' OR 
    (privacy = 'diretoria_only' AND public.is_diretoria(auth.uid()))
  );

DROP POLICY IF EXISTS "Membros ativos criam posts" ON public.posts;
CREATE POLICY "Membros ativos criam posts" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Autor ou diretoria atualiza post" ON public.posts;
CREATE POLICY "Autor ou diretoria atualiza post" ON public.posts
  FOR UPDATE TO authenticated
  USING (auth.uid() = author_id OR public.is_diretoria(auth.uid()));

DROP POLICY IF EXISTS "Autor ou diretoria remove post" ON public.posts;
CREATE POLICY "Autor ou diretoria remove post" ON public.posts
  FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR public.is_diretoria(auth.uid()));

-- POLÍTICAS: POST_MEDIA
DROP POLICY IF EXISTS "Leitura de midias de posts" ON public.post_media;
CREATE POLICY "Leitura de midias de posts" ON public.post_media
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Insercao de midias pelo autor" ON public.post_media;
CREATE POLICY "Insercao de midias pelo autor" ON public.post_media
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- POLÍTICAS: ALBUMS
DROP POLICY IF EXISTS "Membros visualizam albuns" ON public.albums;
CREATE POLICY "Membros visualizam albuns" ON public.albums
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Membros criam albuns" ON public.albums;
CREATE POLICY "Membros criam albuns" ON public.albums
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Autor ou diretoria gerencia albuns" ON public.albums;
CREATE POLICY "Autor ou diretoria gerencia albuns" ON public.albums
  FOR ALL TO authenticated
  USING (auth.uid() = author_id OR public.is_diretoria(auth.uid()));

-- POLÍTICAS: ALBUM_MEDIA
DROP POLICY IF EXISTS "Membros visualizam midias de albuns" ON public.album_media;
CREATE POLICY "Membros visualizam midias de albuns" ON public.album_media
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Membros adicionam fotos aos albuns" ON public.album_media;
CREATE POLICY "Membros adicionam fotos aos albuns" ON public.album_media
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- POLÍTICAS: COMMENTS
DROP POLICY IF EXISTS "Membros visualizam comentarios" ON public.comments;
CREATE POLICY "Membros visualizam comentarios" ON public.comments
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Membros criam comentarios" ON public.comments;
CREATE POLICY "Membros criam comentarios" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Autor ou diretoria remove comentarios" ON public.comments;
CREATE POLICY "Autor ou diretoria remove comentarios" ON public.comments
  FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR public.is_diretoria(auth.uid()));

-- POLÍTICAS: REACTIONS
DROP POLICY IF EXISTS "Membros visualizam reacoes" ON public.reactions;
CREATE POLICY "Membros visualizam reacoes" ON public.reactions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Membros gerenciam proprias reacoes" ON public.reactions;
CREATE POLICY "Membros gerenciam proprias reacoes" ON public.reactions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- POLÍTICAS: SAVED_POSTS
DROP POLICY IF EXISTS "Membro gerencia posts salvos" ON public.saved_posts;
CREATE POLICY "Membro gerencia posts salvos" ON public.saved_posts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- POLÍTICAS: ANNOUNCEMENTS
DROP POLICY IF EXISTS "Todos leem comunicados" ON public.announcements;
CREATE POLICY "Todos leem comunicados" ON public.announcements
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Diretoria gerencia comunicados" ON public.announcements;
CREATE POLICY "Diretoria gerencia comunicados" ON public.announcements
  FOR ALL TO authenticated
  USING (public.is_diretoria(auth.uid()));

-- POLÍTICAS: NOTIFICATIONS
DROP POLICY IF EXISTS "Membro acessa proprias notificacoes" ON public.notifications;
CREATE POLICY "Membro acessa proprias notificacoes" ON public.notifications
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- POLÍTICAS: AUDIT_LOGS
DROP POLICY IF EXISTS "Diretoria acessa logs de auditoria" ON public.audit_logs;
CREATE POLICY "Diretoria acessa logs de auditoria" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_diretoria(auth.uid()));

DROP POLICY IF EXISTS "Insercao de auditoria" ON public.audit_logs;
CREATE POLICY "Insercao de auditoria" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ====================================================================
-- SUPABASE STORAGE BUCKET PARA FOTOS E VÍDEOS
-- ====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('motokas-media', 'motokas-media', true)
ON CONFLICT (id) DO NOTHING;

-- POLÍTICAS DO STORAGE BUCKET
DROP POLICY IF EXISTS "Membros visualizam arquivos do motokas-media" ON storage.objects;
CREATE POLICY "Membros visualizam arquivos do motokas-media" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'motokas-media');

DROP POLICY IF EXISTS "Membros enviam arquivos para motokas-media" ON storage.objects;
CREATE POLICY "Membros enviam arquivos para motokas-media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'motokas-media');

DROP POLICY IF EXISTS "Proprietario ou diretoria remove arquivos" ON storage.objects;
CREATE POLICY "Proprietario ou diretoria remove arquivos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'motokas-media' AND (auth.uid() = owner OR public.is_diretoria(auth.uid())));

-- ====================================================================
-- TRIGGER PARA CRIAR PERFIL AUTOMÁTICO AO CADASTRAR USUÁRIO NO AUTH
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
    avatar_url,
    cover_url,
    motorcycle_model,
    joined_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Membro Los Motokas'),
    COALESCE(NEW.raw_user_meta_data->>'nickname', 'Irmão'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'membro'),
    'active',
    'Orgulho em rodar com o Los Motokas MC.',
    NULL,
    NULL,
    COALESCE(NEW.raw_user_meta_data->>'motorcycle_model', 'Harley Davidson'),
    CURRENT_DATE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
`;
