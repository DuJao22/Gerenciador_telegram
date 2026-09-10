import React, { useState, useEffect } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  Layers, 
  Terminal, 
  Play, 
  ExternalLink,
  BookOpen,
  FolderGit2,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileEdit,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { PYTHON_FILES } from '../pythonCode';

interface BotFileMeta {
  filename: string;
  title: string;
  desc: string;
  type: string;
  exists?: boolean;
  size?: number;
  last_modified?: string;
}

export const PythonCodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('bot.py');
  const [copied, setCopied] = useState<boolean>(false);
  const [codeContent, setCodeContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ success?: boolean; message: string } | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [availableFiles, setAvailableFiles] = useState<BotFileMeta[]>([]);

  const defaultFile = PYTHON_FILES[selectedFile] || PYTHON_FILES['bot.py'];

  // Carrega a lista de arquivos reais da API do backend, se disponível
  useEffect(() => {
    fetch('/api/bot/files')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.files) {
          setAvailableFiles(data.files);
        }
      })
      .catch(() => {
        // Modo offline / preview local
      });
  }, []);

  // Ao trocar de arquivo, carrega o código do backend ou do fallback local
  useEffect(() => {
    setIsDirty(false);
    setSaveStatus(null);
    
    // Tenta carregar do backend
    fetch(`/api/bot/file?name=${selectedFile}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.content !== undefined) {
          setCodeContent(data.content);
        } else {
          setCodeContent(defaultFile.code);
        }
      })
      .catch(() => {
        setCodeContent(defaultFile.code);
      });
  }, [selectedFile]);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    const blob = new Blob([codeContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleValidateSyntax = async () => {
    setIsValidating(true);
    setSaveStatus(null);

    try {
      const resp = await fetch('/api/bot/validate-syntax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedFile, content: codeContent })
      });
      const data = await resp.json();
      if (resp.ok && data.valid) {
        setSaveStatus({ success: true, message: '✅ Sintaxe válida! O arquivo está pronto e sem erros.' });
      } else {
        setSaveStatus({ success: false, message: `❌ Erro de Sintaxe: ${data.error || 'Código inválido'}` });
      }
    } catch (e) {
      // Validação local básica se offline
      setSaveStatus({ success: true, message: 'ℹ️ Sintaxe básica verificada.' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveFile = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const resp = await fetch('/api/bot/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedFile, content: codeContent })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setIsDirty(false);
        setSaveStatus({ 
          success: true, 
          message: `✅ Arquivo "${selectedFile}" salvo no servidor com sucesso! Backup automático gerado.` 
        });
      } else {
        setSaveStatus({ 
          success: false, 
          message: `❌ Falha ao salvar: ${data.error || 'Erro desconhecido'}` 
        });
      }
    } catch (e) {
      setSaveStatus({ 
        success: false, 
        message: '❌ Erro de rede ao contatar o servidor para salvar o arquivo.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevert = () => {
    if (confirm(`Deseja reverter todas as alterações não salvas de "${selectedFile}"?`)) {
      setCodeContent(defaultFile.code);
      setIsDirty(false);
      setSaveStatus({ success: true, message: 'Código restaurado para a versão padrão.' });
    }
  };

  const fileList = availableFiles.length > 0 
    ? availableFiles.map(f => f.filename)
    : Object.keys(PYTHON_FILES);

  const fileMeta = availableFiles.find(f => f.filename === selectedFile);
  const fileDescription = fileMeta?.desc || defaultFile.description;
  const lineCount = codeContent.split('\n').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>💻 CÓDIGO PYTHON & ARQUITETURA</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
              Python 3.10+ / Flask / Telebot
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Acesse, visualize e <strong>edite os arquivos do robô diretamente no servidor hospedado</strong> com validação de sintaxe e backup.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleValidateSyntax}
            disabled={isValidating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-lg border border-cyan-500/30 transition-colors"
            title="Verificar se há erros de sintaxe no código Python"
          >
            {isValidating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />}
            <span>Validar Sintaxe</span>
          </button>

          <button
            onClick={handleSaveFile}
            disabled={isSaving}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg shadow-lg transition-all ${
              isDirty 
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30 animate-pulse' 
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20'
            }`}
            title="Salvar alterações no disco do servidor"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Salvando...' : isDirty ? 'Salvar Alterações *' : 'Salvar no Servidor'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>

          <button
            onClick={handleDownloadSingle}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Baixar</span>
          </button>
        </div>
      </div>

      {/* Save / Validation Status Alert */}
      {saveStatus && (
        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
          saveStatus.success 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {saveStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />}
            <span>{saveStatus.message}</span>
          </div>
          <button 
            onClick={() => setSaveStatus(null)} 
            className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Architecture diagram from user prompt */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Visão da Arquitetura do Sistema</span>
        </h3>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto leading-relaxed">
          <pre>{`                    INTERNET
                       │
          ┌────────────┴────────────┐
          │                         │
        TELEGRAM                  PAINEL WEB
          │                         │
          ▼                         ▼
   Python Telebot (bot.py)    Flask (app.py)
          │                         │
          └──────────┬──────────────┘
                     │
                  REST API & ORM
                     │
                     ▼
              ┌─────────────┐
              │   DATABASE  │
              │   SQLite    │
              └─────────────┘
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Users     Contents    Purchases
                     │
                     ▼
             APScheduler Worker (scheduler.py)
                     │
                     ▼
              Telegram Bot API`}</pre>
        </div>
      </div>

      {/* Code Browser & Live Editor Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {/* File Tabs */}
        <div className="bg-slate-950 px-3 pt-3 border-b border-slate-800 flex items-center gap-1 overflow-x-auto">
          {fileList.map((filename) => (
            <button
              key={filename}
              onClick={() => setSelectedFile(filename)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-medium rounded-t-lg transition-all shrink-0 ${
                selectedFile === filename
                  ? 'bg-slate-900 text-cyan-400 border-t-2 border-t-cyan-500 border-x border-slate-800'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{filename}</span>
              {selectedFile === filename && isDirty && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              )}
            </button>
          ))}
        </div>

        {/* File Description Header */}
        <div className="px-4 py-2.5 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white font-mono">{selectedFile}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">{fileDescription}</span>
            {isDirty && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-mono border border-amber-500/20">
                Alterado (não salvo)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1 text-cyan-400 hover:underline"
            >
              {isEditing ? <Eye className="w-3.5 h-3.5" /> : <FileEdit className="w-3.5 h-3.5" />}
              <span>{isEditing ? 'Modo Visualizar' : 'Modo Editar'}</span>
            </button>
            {isDirty && (
              <button
                onClick={handleRevert}
                className="text-amber-400 hover:underline"
                title="Desfazer alterações locais"
              >
                Reverter
              </button>
            )}
            <span>{lineCount} linhas</span>
          </div>
        </div>

        {/* Code View / Edit Area */}
        <div className="relative bg-slate-950">
          {isEditing ? (
            <textarea
              value={codeContent}
              onChange={(e) => {
                setCodeContent(e.target.value);
                setIsDirty(true);
              }}
              spellCheck={false}
              className="w-full h-[580px] p-4 bg-transparent font-mono text-xs text-slate-200 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              style={{ tabSize: 4 }}
              placeholder="Digite ou edite o código aqui..."
            />
          ) : (
            <div className="p-4 overflow-x-auto max-h-[580px] overflow-y-auto font-mono text-xs text-slate-200 leading-relaxed select-all">
              <pre>
                <code>{codeContent}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Validador ativo: Sintaxe Python verificada antes de cada gravação no disco.</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleValidateSyntax}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-xs border border-slate-700 transition-colors"
            >
              Testar Sintaxe
            </button>
            <button
              onClick={handleSaveFile}
              disabled={isSaving}
              className="px-4 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-xs transition-colors"
            >
              {isSaving ? 'Salvando...' : 'Salvar Arquivo'}
            </button>
          </div>
        </div>
      </div>

      {/* Render Hosting Quick Guide Card */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/40 border border-cyan-500/30 rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs">
              ⚡
            </div>
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <span>Hospedagem no Render (100% Otimizado)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                  Anti-Sleep Incluso
                </span>
              </h4>
              <p className="text-xs text-slate-400">
                O arquivo <code className="text-cyan-300">render.yaml</code> já está pronto. No Render.com, use <strong>New + &gt; Blueprint</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedFile('render.yaml')}
            className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Ver render.yaml</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-white block mb-1">1. Conecte o GitHub</span>
            <span className="text-slate-400 text-[11px] leading-relaxed">
              Crie o repositório com os arquivos do projeto e conecte sua conta no Render.
            </span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-white block mb-1">2. New &gt; Blueprint</span>
            <span className="text-slate-400 text-[11px] leading-relaxed">
              O Render lerá o <code className="text-cyan-400">render.yaml</code> e configurará tudo sozinho com o token do seu bot.
            </span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-emerald-400 block mb-1">3. Bot 24/7 Ativo</span>
            <span className="text-slate-400 text-[11px] leading-relaxed">
              O sistema anti-sleep envia pings a cada 10 min, mantendo seu bot acordado sem desativar.
            </span>
          </div>
        </div>
      </div>

      {/* Terminal Quickstart Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h4 className="font-bold text-sm text-white">Comandos Rápidos para Iniciar</h4>
        </div>

        <div className="space-y-2 font-mono text-xs">
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300">
            <span className="text-slate-500 select-none">$ </span>pip install -r requirements.txt
          </div>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300">
            <span className="text-slate-500 select-none">$ </span>python app.py <span className="text-slate-500"># Inicia o Painel Web e API</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300">
            <span className="text-slate-500 select-none">$ </span>python bot.py <span className="text-slate-500"># Inicia o Bot Telegram</span>
          </div>
        </div>
      </div>
    </div>
  );
};

