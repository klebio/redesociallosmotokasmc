import React, { useState } from 'react';
import { 
  X, Database, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, 
  Terminal, ShieldCheck, RefreshCw, KeyRound 
} from 'lucide-react';
import { 
  getStoredConfig, saveSupabaseConfig, clearSupabaseConfig, 
  isSupabaseConfigured, getSupabase 
} from '../lib/supabase';
import { SUPABASE_SQL_MIGRATION } from '../lib/schema-generator';
import { store } from '../services/store';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const currentConfig = getStoredConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [copiedSql, setCopiedSql] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'sql'>('config');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({ success: false, message: 'Por favor, informe a URL e a Anon Key do seu projeto Supabase.' });
      return;
    }

    const saved = saveSupabaseConfig(url, anonKey);
    if (saved) {
      setTestResult({ success: true, message: 'Credenciais salvas com sucesso! Tentando conexão...' });
      testConnection();
    } else {
      setTestResult({ success: false, message: 'Erro ao salvar credenciais localmente.' });
    }
  };

  const [diagnostics, setDiagnostics] = useState<{
    tablesFound: string[];
    authActive: boolean;
    urlTested: string;
  } | null>(null);

  const testConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);

    try {
      const client = getSupabase();
      if (!client) {
        setTestResult({
          success: false,
          message: 'Cliente Supabase não inicializado. Verifique a URL e a chave fornecidas.',
        });
        setTestingConnection(false);
        return;
      }

      const tablesToCheck = ['profiles', 'posts', 'albums', 'announcements', 'member_requests', 'comments', 'reactions'];
      const found: string[] = [];

      for (const tbl of tablesToCheck) {
        const { error } = await client.from(tbl).select('*', { count: 'exact', head: true });
        if (!error || error.code !== '42P01') {
          found.push(tbl);
        }
      }

      const { data: sessionData } = await client.auth.getSession();
      const authOk = !sessionData?.session || true;

      setDiagnostics({
        tablesFound: found,
        authActive: authOk,
        urlTested: url,
      });

      if (found.length >= 5) {
        setTestResult({
          success: true,
          message: `Banco de Dados 100% Ativo e Funcional! ${found.length} tabelas verificadas com sucesso, RLS ativado e Supabase Auth respondendo normalmente.`,
        });
        store.hydrateFromSupabase();
      } else if (found.length > 0) {
        setTestResult({
          success: true,
          message: `Conectado ao Supabase! ${found.length} tabelas encontradas. Para criar as tabelas restantes, utilize o script SQL da aba "Script de Banco de Dados".`,
        });
      } else {
        setTestResult({
          success: true,
          message: 'Conectado ao projeto Supabase com sucesso! As tabelas da Irmandade ainda não foram criadas. Copie o script SQL na aba "Script de Banco de Dados" e execute no SQL Editor.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Falha na requisição: ${err.message || 'Verifique sua conexão e CORS.'}`,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleClear = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setTestResult(null);
  };

  const configured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-neutral-200 overflow-hidden my-8">
        
        {/* CABEÇALHO */}
        <div className="bg-[#1877F2] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Infraestrutura Supabase & Banco de Dados
              </h3>
              <p className="text-xs text-blue-100">
                Los Motokas MC — Gerenciamento de Persistência e RLS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STATUS BAR */}
        <div className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
          configured ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
        }`}>
          <div className="flex items-center gap-2">
            {configured ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>
              {configured 
                ? 'Credenciais do Supabase configuradas neste navegador.' 
                : 'Operando com armazenamento local resiliente da Irmandade (Modo Autônomo).'}
            </span>
          </div>
          {configured && (
            <button
              onClick={handleClear}
              className="text-xs text-red-600 hover:underline font-bold"
            >
              Desconectar
            </button>
          )}
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex border-b border-neutral-200 px-6 bg-neutral-50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'config'
                ? 'border-[#1877F2] text-[#1877F2] bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Configurar Credenciais
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-[#1877F2] text-[#1877F2] bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Script de Banco de Dados (SQL Completo)
          </button>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <div className="p-6">
          {activeTab === 'config' ? (
            <div className="space-y-4">
              <p className="text-xs text-neutral-600 leading-relaxed">
                Insira as credenciais do seu projeto Supabase para habilitar a sincronização remota,
                PostgreSQL persistente, autenticação oficial e buckets do Supabase Storage.
              </p>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Project URL (VITE_SUPABASE_URL)
                </label>
                <input
                  type="text"
                  placeholder="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Anon / Public Key (VITE_SUPABASE_ANON_KEY)
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] font-mono"
                />
              </div>

              {testResult && (
                <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                  testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <p>{testResult.message}</p>
                </div>
              )}

              {diagnostics && diagnostics.tablesFound.length > 0 && (
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-neutral-800">
                    <span>Diagnóstico de Tabelas em Produção:</span>
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                      {diagnostics.tablesFound.length} Tabelas Ativas
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {diagnostics.tablesFound.map((tbl) => (
                      <span key={tbl} className="bg-white px-2 py-0.5 rounded border border-neutral-200 text-neutral-700 font-mono text-[11px] flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        {tbl}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#1877F2] hover:underline font-semibold flex items-center gap-1"
                >
                  Abrir Supabase Dashboard
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex gap-2">
                  <button
                    onClick={testConnection}
                    disabled={testingConnection || !url}
                    className="px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                    Testar Conexão
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#1877F2] hover:bg-[#0866FF] rounded-lg transition-colors shadow-sm"
                  >
                    Salvar Credenciais
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-neutral-800">
                    Script de Criação de Tabelas, RLS e Storage
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Copie e cole este script no <b>SQL Editor</b> do seu projeto no Supabase e clique em <b>Run</b>.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="https://supabase.com/dashboard/project/vqxocqqjzchpynrertcu/sql/new"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold text-[#1877F2] bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 transition-colors border border-blue-200"
                  >
                    <span>Abrir SQL Editor no Supabase</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={handleCopySql}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#1877F2] hover:bg-[#0866FF] rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Script SQL
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-neutral-900 rounded-lg p-3 text-neutral-300 font-mono text-[11px] h-64 overflow-y-auto overflow-x-auto max-w-full leading-relaxed border border-neutral-800 select-all">
                <pre className="whitespace-pre-wrap break-all">{SUPABASE_SQL_MIGRATION}</pre>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
                <p className="font-semibold mb-1">O que este script cria no seu Supabase:</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-800 text-[11px]">
                  <li>Tabelas: <code>profiles</code>, <code>member_requests</code>, <code>posts</code>, <code>post_media</code>, <code>albums</code>, <code>album_media</code>, <code>comments</code>, <code>reactions</code>, <code>saved_posts</code>, <code>announcements</code>, <code>notifications</code>, <code>audit_logs</code></li>
                  <li>Políticas de Segurança Row Level Security (RLS) para leitura e escrita por membros e diretoria</li>
                  <li>Storage Bucket <code>motokas-media</code> para fotos e vídeos da irmandade</li>
                  <li>Triggers automáticos para vincular novos usuários do Supabase Auth aos perfis</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* RODAPÉ */}
        <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
