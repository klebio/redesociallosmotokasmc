import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'los_motokas_supabase_url';
const STORAGE_KEY_KEY = 'los_motokas_supabase_anon_key';

export const DEFAULT_SUPABASE_URL = 'https://vqxocqqjzchpynrertcu.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeG9jcXFqemNocHlucmVydGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MTQyMTIsImV4cCI6MjEwNzM5MDIxMn0.lEkq5Ax5AOfEOBv-ZPHl-tGXK_7M8sAF3YNoKSBRRQc';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getStoredConfig(): SupabaseConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) || '' : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) || '' : '';

  const url = storedUrl || envUrl || DEFAULT_SUPABASE_URL;
  const anonKey = storedKey || envKey || DEFAULT_SUPABASE_ANON_KEY;

  return {
    url,
    anonKey,
  };
}

let activeClient: SupabaseClient | null = null;

export function initSupabase(): SupabaseClient | null {
  const { url, anonKey } = getStoredConfig();
  if (!url || !anonKey || url === 'MY_SUPABASE_URL' || anonKey === 'MY_SUPABASE_KEY') {
    activeClient = null;
    return null;
  }

  try {
    activeClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return activeClient;
  } catch (err) {
    console.error('Erro ao inicializar Supabase:', err);
    activeClient = null;
    return null;
  }
}

export function getSupabase(): SupabaseClient | null {
  if (!activeClient) {
    return initSupabase();
  }
  return activeClient;
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getStoredConfig();
  return Boolean(url && anonKey && url !== 'MY_SUPABASE_URL' && anonKey !== 'MY_SUPABASE_KEY');
}

export function saveSupabaseConfig(url: string, anonKey: string): boolean {
  try {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
    activeClient = null;
    initSupabase();
    window.dispatchEvent(new Event('supabase_config_changed'));
    return true;
  } catch {
    return false;
  }
}

export function clearSupabaseConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
    activeClient = null;
    window.dispatchEvent(new Event('supabase_config_changed'));
  } catch (err) {
    console.error('Falha ao limpar credenciais:', err);
  }
}
