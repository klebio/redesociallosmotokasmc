# Los Motokas MC — Nossa História

Rede social privada e exclusiva para os membros do motoclube Los Motokas MC, inspirada na experiência do Facebook clássico (#1877F2) com a linguagem e a tradição da irmandade das duas rodas.

> [!IMPORTANT]
> **Decisões Alinhadas na Fase de Planejamento:**
> - **Configuração Supabase**: Assistente visual integrado com gerador de script SQL completo, permitindo conectar as credenciais (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) e executar todas as migrações/RLS em um clique no console SQL do Supabase.
> - **Fluxo de Entrada de Membros**: Sistema de solicitação de adesão com fila de aprovação prévia pela Diretoria no Painel Administrativo. Membros não aprovados não acessam conteúdos internos.
> - **Hierarquia da Irmandade**: Estrutura simplificada oficial (`Diretoria`, `Membro Oficial`, `Aspirante`), com distintivos visuais nos perfis e publicações.

---

## 1. Overview & Core Concept

- **O que faz**: Oferece aos irmãos do Los Motokas MC um ambiente fechado e seguro para documentar viagens, passeios, encontros, reuniões e eventos oficiais. Reúne feed cronológico, perfis personalizados, álbuns de fotos e vídeos, recordações de anos anteriores, notificações de interações e comunicados oficiais da diretoria.
- **Público-alvo**: Integrantes do Los Motokas MC (Diretoria, Membros Oficiais e Aspirantes) em computadores e celulares.
- **Valor central**: Preservação da memória histórica do motoclube sem exposição em redes públicas abertas, mantendo a privacidade e o companheirismo da irmandade.

---

## 2. User Experience & Visual Design

### Fluxos Principais do Usuário
1. **Autenticação & Entrada**:
   - Tela de login limpa estilo Facebook clássico com o brasão/título oficial "Los Motokas MC".
   - Opção para solicitar adesão à Irmandade (nome, apelido de estrada, cargo aspirado e mensagem para a Diretoria).
   - Tela de recuperação de senha e assistente de conexão do banco de dados caso as chaves ainda não estejam configuradas.
2. **Navegação & Top Bar (Contrato de 3 Zonas)**:
   - **Zona 1 (Marca)**: Logotipo com tipografia robusta "LOS MOTOKAS MC" em barra azul `#1877F2`.
   - **Zona 2 (Navegação Central)**: Ícones e abas intuitivas (Feed da Irmandade, Galerias & Álbuns, Recordações, Membros, Comunicados).
   - **Zona 3 (Ações & Perfil)**: Sino de notificações ativas com contador, atalho para o Painel da Diretoria (se autorizado) e avatar do membro com menu de configurações/logout.
3. **Feed da Irmandade**:
   - Caixa de criação no topo: *"O que você quer compartilhar com a Irmandade, [Apelido]?"* com botões para foto, vídeo e seleção de álbum.
   - Cards de postagem com cabeçalho (foto do autor, apelido, patente e data formatada), texto, grid responsivo de fotos/vídeos com lightbox, contador de curtidas/reações, comentários em árvore e botão de salvar nas recordações.
4. **Galerias & Álbuns**:
   - Visualização por álbuns temáticos (*Viagens do Los Motokas*, *Reuniões da Irmandade*, *Passeios e Estradas*, *Nossa História*).
   - Upload com validação de formato/tamanho, pré-visualização e barra de progresso.
5. **Minhas Recordações**:
   - Seção pessoal para reencontrar postagens salvas e lembranças de datas passadas ("Neste mesmo dia em anos anteriores").
6. **Painel Administrativo da Diretoria**:
   - Gestão de membros: aprovação de pedidos de adesão, alteração de patentes (`Diretoria`, `Membro Oficial`, `Aspirante`), moderação de postagens e publicação de comunicados oficiais com registro de auditoria.

### Identidade Visual & Design System
- **Paleta de Cores**:
  - Azul Primário: `#1877F2` (Barra superior, botões de ação e destaques principais)
  - Azul Hover / Ativo: `#0866FF`
  - Fundo do Sistema: `#F0F2F5` (Cinza claro aconchegante)
  - Superfícies dos Cards: `#FFFFFF` com bordas sutis `border-neutral-200`
  - Tipografia Principal: `#1C1E21` (Alto contraste e legibilidade)
  - Textos Secundários: `#65676B`
- **Tipografia**: `Plus Jakarta Sans` para títulos e cabeçalhos combinada com `Public Sans` para corpo e leitura densa.
- **Disciplina Anti-Slop**:
  - Sem badges artificiais ou cápsulas flutuantes aleatórias; metadados em texto limpo com separadores tipográficos (`·`).
  - Sem contadores ou pontuações falsas de IA.
  - Microinterações rápidas ($\le 200\text{ms}$) e design responsivo com menu móvel inferior adaptado para toques.

---

## 3. Key Product Decisions & Trade-Offs

- **Decisão 1: Supabase como Provedor Único de Backend & Auth**:
  - *Abordagem*: Utilizar `@supabase/supabase-js` conectado ao PostgreSQL com Row Level Security (RLS) e Supabase Storage.
  - *Motivo*: Cumprimento rigoroso do requisito do projeto com persistência real, segurança de acesso por patente e controle estrito de leitura/escrita.
- **Decisão 2: Assistente de Conexão & Script de Migração Automatizado**:
  - *Abordagem*: Disponibilizar um modal/painel de configuração visual que exibe o status da conexão, permite salvar credenciais para o ambiente e fornece o script SQL pronto para copiar e colar no SQL Editor do Supabase (criando tabelas, índices, triggers e políticas RLS).
  - *Motivo*: Garante que o projeto execute imediatamente sem erros de inicialização, facilitando a implantação pelo usuário no seu projeto Supabase.
- **Decisão 3: Armazenamento e Exibição de Mídias (Storage)**:
  - *Abordagem*: Bucket privado/protegido para fotos e vídeos, salvando caminhos e metadados no PostgreSQL.
  - *Motivo*: Impede que mídias da irmandade fiquem soltas na internet e permite geração segura de links no frontend.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LOS MOTOKAS MC — FRONTEND                       │
│                                                                        │
│   ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐   │
│   │   Auth & Login   │  │  Top Bar (3-Zone)│  │ Sidebar / Mobile Nav│  │
│   └────────┬─────────┘  └────────┬─────────┘  └─────────┬──────────┘   │
│            │                     │                      │              │
│   ┌────────▼─────────────────────▼──────────────────────▼──────────┐   │
│   │                      ROUTER & PROTECTED VIEWS                   │   │
│   │  • Feed da Irmandade      • Álbuns & Galerias                  │   │
│   │  • Perfil & Membros       • Recordações Pessoais               │   │
│   │  • Comunicados Oficiais   • Painel da Diretoria (Admin)        │   │
│   └──────────────────────────────┬─────────────────────────────────┘   │
│                                  │                                     │
│   ┌──────────────────────────────▼─────────────────────────────────┐   │
│   │                 SUPABASE CLIENT SERVICES LAYER                 │   │
│   │  • authService.ts       • postsService.ts     • mediaService.ts │   │
│   │  • membersService.ts    • adminService.ts     • notification.ts │   │
│   └──────────────────────────────┬─────────────────────────────────┘   │
└──────────────────────────────────┼─────────────────────────────────────┘
                                   │ HTTPS / WSS
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE CLOUD INFRASTRUCTURE                   │
│                                                                        │
│   ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐   │
│   │  Supabase Auth   │  │ PostgreSQL DB    │  │  Supabase Storage  │   │
│   │  (JWT / Session) │  │ (Tabelas + RLS)  │  │  (Buckets Mídias)  │   │
│   └──────────────────┘  └──────────────────┘  └────────────────────┘   │
│                                                                        │
│   TABELAS:                                                             │
│   • profiles (nome, apelido, patente, bio, avatar_url, capa_url)      │
│   • member_requests (solicitações de entrada pendentes de aprovação)   │
│   • posts (conteúdo, autor_id, privacidade, criado_em)                 │
│   • post_media (post_id, tipo: foto/video, storage_path, url)          │
│   • albums & album_media (título, descrição, capa, mídias)             │
│   • comments & reactions (comentários em árvore, curtidas/reações)     │
│   • saved_posts (favoritos e recordações pessoais)                     │
│   • announcements (comunicados oficiais da diretoria)                  │
│   • notifications (notificações em tempo real)                         │
│   • audit_logs (registro de ações administrativas)                     │
└────────────────────────────────────────────────────────────────────────┘
```

### Mapeamento de Estados e Tratamento de Erros
- **Feedback Visual**: Skeletons de carregamento idênticos aos cards do feed durante requisições assíncronas.
- **Validação de Formulários**: Verificação de extensões aceitas (`image/png`, `image/jpeg`, `image/webp`, `video/mp4`) e limite de tamanho antes do envio.
- **Tratamento de Desconexão**: Alerta amigável no topo informando o status do Supabase e orientando a configuração de credenciais sem quebrar a interface.
