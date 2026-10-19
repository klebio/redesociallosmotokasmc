/**
 * Utilitário seguro e padronizado para geração do link oficial de convite do Los Motokas MC
 */

export function getInviteUrl(): string {
  if (typeof window === 'undefined') return '';
  // Garante que a URL seja limpa, sem parâmetros antigos ou duplos slashes
  const cleanPath = window.location.pathname.replace(/\/+$/, '');
  const base = `${window.location.origin}${cleanPath}`;
  return `${base}?convite=losmotokas`;
}

export function getWhatsAppInviteUrl(): string {
  const url = getInviteUrl();
  const text = `🏍️ *LOS MOTOKAS MC — Convite Oficial da Irmandade*\n\nIrmão, aqui está o link oficial e seguro para acessar a rede social exclusiva do nosso motoclube:\n\n👉 ${url}\n\n_Ao abrir o link você poderá entrar na sua conta existente ou criar seu perfil de membro!_`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}
