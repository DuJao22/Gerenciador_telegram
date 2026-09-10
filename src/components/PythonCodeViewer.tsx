import React, { useState } from 'react';
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
  FolderGit2
} from 'lucide-react';
import { PYTHON_FILES } from '../pythonCode';

export const PythonCodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('bot.py');
  const [copied, setCopied] = useState<boolean>(false);

  const currentFile = PYTHON_FILES[selectedFile] || PYTHON_FILES['bot.py'];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    const blob = new Blob([currentFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fileList = Object.keys(PYTHON_FILES);

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
            Arquivos prontos para rodar localmente ou publicar na VPS / Render / Railway.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Código Copiado!' : 'Copiar Arquivo'}</span>
          </button>

          <button
            onClick={handleDownloadSingle}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Baixar {currentFile.filename}</span>
          </button>
        </div>
      </div>

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

      {/* Code Browser Container */}
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
            </button>
          ))}
        </div>

        {/* File Description Header */}
        <div className="px-4 py-2 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            <span className="font-semibold text-white font-mono">{currentFile.filename}</span>
            <span className="mx-2">•</span>
            <span>{currentFile.description}</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            {currentFile.code.split('\n').length} linhas
          </div>
        </div>

        {/* Code View Area */}
        <div className="p-4 bg-slate-950 overflow-x-auto max-h-[600px] overflow-y-auto font-mono text-xs text-slate-200 leading-relaxed select-all">
          <pre>
            <code>{currentFile.code}</code>
          </pre>
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
