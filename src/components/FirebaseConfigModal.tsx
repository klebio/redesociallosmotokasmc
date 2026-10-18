import React, { useState } from 'react';
import { 
  X, Flame, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, 
  ShieldCheck, RefreshCw, Database, Server, Radio
} from 'lucide-react';
import { testFirebaseConnection, db } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { store } from '../services/store';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedConsole, setCopiedConsole] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const ok = await testFirebaseConnection();
      if (ok) {
        setTestResult({
          success: true,
          message: 'Conexão ativa! Firebase Firestore respondendo perfeitamente com leitura e escrita.',
        });
        await store.initFirebase();
      } else {
        setTestResult({
          success: false,
          message: 'Não foi possível validar o Firestore neste momento. Verifique a conexão com a internet.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Falha na verificação do Firebase.',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const firebaseConsoleUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data`;

  const handleCopyProjectId = () => {
    navigator.clipboard.writeText(firebaseConfig.projectId);
    setCopiedConsole(true);
    setTimeout(() => setCopiedConsole(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-xs">
              <Flame className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight font-['Plus_Jakarta_Sans']">
                Firebase Firestore — Los Motokas MC
              </h2>
              <p className="text-xs text-amber-100 font-medium">
                Banco de dados em nuvem oficial e sincronização em tempo real
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CORPO */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-neutral-700">
          
          {/* STATUS ATIVO */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-emerald-900 text-sm">
                  Firebase Conectado e Ativo
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                O aplicativo está operando com persistência em nuvem oficial através do Google Cloud Firebase Firestore, substituindo com segurança o antigo banco Supabase.
              </p>
            </div>
          </div>

          {/* PARÂMETROS DA INSTÂNCIA */}
          <div className="space-y-2.5">
            <span className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] block">
              Parâmetros da Instância Cloud
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Project ID
                </span>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="font-mono text-neutral-900 font-bold text-xs truncate">
                    {firebaseConfig.projectId}
                  </span>
                  <button
                    onClick={handleCopyProjectId}
                    className="p-1 hover:bg-neutral-200 rounded text-neutral-500"
                    title="Copiar Project ID"
                  >
                    {copiedConsole ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Região Cloud
                </span>
                <span className="font-mono text-neutral-900 font-bold text-xs block mt-1">
                  us-east1 (Enterprise)
                </span>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Database Instance ID
                </span>
                <span className="font-mono text-neutral-900 font-semibold text-xs block truncate mt-1">
                  {firebaseConfig.firestoreDatabaseId}
                </span>
              </div>
            </div>
          </div>

          {/* COLEÇÕES MONITORADAS */}
          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 space-y-2">
            <div className="flex items-center gap-2 text-[#1877F2] font-bold text-xs">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Coleções Sincronizadas em Tempo Real:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] text-neutral-600 font-mono">
              <span className="p-1 bg-white rounded border border-blue-100 text-center">/profiles</span>
              <span className="p-1 bg-white rounded border border-blue-100 text-center">/posts</span>
              <span className="p-1 bg-white rounded border border-blue-100 text-center">/comments</span>
              <span className="p-1 bg-white rounded border border-blue-100 text-center">/albums</span>
              <span className="p-1 bg-white rounded border border-blue-100 text-center">/album_media</span>
              <span className="p-1 bg-white rounded border border-blue-100 text-center">/announcements</span>
              <span className="p-1 bg-white rounded border border-blue-100 text-center">/member_requests</span>
              <span className="p-1 bg-white rounded border border-blue-100 text-center">/app_settings</span>
              <span className="p-1 bg-white rounded border border-blue-100 text-center">/audit_logs</span>
            </div>
          </div>

          {/* REGRAS DE SEGURANÇA */}
          <div className="flex items-start gap-2.5 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-neutral-600 leading-relaxed">
              <strong className="text-neutral-800">Regras de Segurança Ativas:</strong> Implantação realizada via Firebase Rules com proteção para membros, controle da Diretoria e integridade dos registros oficiais.
            </div>
          </div>

          {/* FEEDBACK DO TESTE */}
          {testResult && (
            <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-red-50 text-red-900 border-red-200'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span className="text-xs font-medium">{testResult.message}</span>
            </div>
          )}

          {/* BOTÕES DE AÇÃO */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-neutral-100">
            <a
              href={firebaseConsoleUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Abrir Firebase Console</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
            </a>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
              <span>{testingConnection ? 'Testando Conexão...' : 'Testar Conexão Firebase'}</span>
            </button>
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-3 sm:p-4 bg-neutral-50 border-t border-neutral-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold rounded-xl transition-colors text-xs cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
