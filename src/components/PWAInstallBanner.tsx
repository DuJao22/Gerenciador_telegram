import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle2, Sparkles, Share2, Laptop, Bot } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallBannerProps {
  onInstallSuccess?: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onInstallSuccess }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installedFeedback, setInstalledFeedback] = useState(false);

  useEffect(() => {
    // Check if dismissed previously in this session
    const dismissedSession = sessionStorage.getItem('lyonbots_pwa_dismissed');
    if (dismissedSession) {
      setIsDismissed(true);
      return;
    }

    // If not already installed, show modal/banner after 1.2s to warmly greet user
    if (!isInstalled) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isInstalled]);

  const handleDismiss = () => {
    setIsOpen(false);
    setIsDismissed(true);
    sessionStorage.setItem('lyonbots_pwa_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setInstalledFeedback(true);
        onInstallSuccess?.();
        setTimeout(() => {
          setIsOpen(false);
        }, 2500);
      }
    } else {
      // Fallback instructions for desktop or browsers without prompt event
      setShowIOSModal(true);
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Auto-Open Modal on First Launch */}
      {isOpen && !isDismissed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl shadow-cyan-950/60 text-slate-100 overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Close button */}
            <button
              onClick={handleDismiss}
              aria-label="Fechar"
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="flex flex-col items-center text-center space-y-4 relative z-10 pt-2">
              {/* Robot Logo with glowing aura */}
              <div className="relative group">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition duration-300" />
                <img
                  src="/lyonbots-logo.jpg"
                  alt="LyonBots Logo Robô"
                  className="relative w-20 h-20 rounded-2xl object-cover border-2 border-cyan-400 shadow-xl"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-2 -right-2 bg-slate-950 border border-cyan-500/60 rounded-full p-1 shadow-md">
                  <Bot className="w-4 h-4 text-cyan-400" />
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2">
                  <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                  <span>EXPERIÊNCIA WEB APP (PWA)</span>
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  Instalar <span className="text-cyan-400">LyonBots</span> no seu Dispositivo?
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed max-w-sm">
                  Adicione o LyonBots à sua tela inicial ou barra de tarefas. Tenha acesso instantâneo sem barra de navegador, inicialização ultra-rápida e monitoramento 24/7.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="w-full grid grid-cols-2 gap-2 text-left pt-1 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200 block text-[11px]">Tela Inicial</span>
                    <span className="text-[10px] text-slate-400">Como app nativo</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200 block text-[11px]">Desktop & Celular</span>
                    <span className="text-[10px] text-slate-400">Multiplataforma</span>
                  </div>
                </div>
              </div>

              {/* Install Action Buttons */}
              <div className="w-full space-y-2 pt-2">
                {installedFeedback ? (
                  <div className="w-full py-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl flex items-center justify-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>LyonBots Instalado com Sucesso!</span>
                  </div>
                ) : (
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-98"
                  >
                    <Download className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                    <span>Instalar LyonBots Web App</span>
                  </button>
                )}

                <button
                  onClick={handleDismiss}
                  className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Agora não, continuar no navegador
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual / iOS Safari Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-cyan-500/40 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <img src="/lyonbots-logo.jpg" alt="LyonBots" className="w-7 h-7 rounded-lg object-cover" />
                <h4 className="font-bold text-sm text-white">Como Instalar no seu Dispositivo</h4>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-300">
              <div className="flex items-start gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div>
                  <span className="font-bold text-white block">No iPhone / iPad (Safari):</span>
                  <p className="mt-1 text-slate-400 text-[11px] leading-relaxed">
                    Toque no botão <strong className="text-cyan-300">Compartilhar</strong> (<Share2 className="w-3 h-3 inline text-cyan-400" />) na barra inferior do Safari e escolha <strong className="text-white">"Adicionar à Tela de Início"</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div>
                  <span className="font-bold text-white block">No Chrome / Edge (Computador ou Android):</span>
                  <p className="mt-1 text-slate-400 text-[11px] leading-relaxed">
                    Clique no ícone de <strong className="text-cyan-300">Instalar</strong> no canto superior direito da barra de endereços (ou no menu de 3 pontinhos &gt; "Instalar aplicativo").
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/30 transition-colors"
            >
              Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const PWAInstallHeaderButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  if (isInstalled || installed) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="text-[11px]">App Instalado</span>
      </div>
    );
  }

  const handleClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) setInstalled(true);
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        title="Instalar LyonBots como Web App no Computador ou Celular"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 via-slate-900 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer group"
      >
        <Download className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-y-0.5 transition-transform" />
        <span className="hidden md:inline">Instalar App</span>
        <span className="md:hidden">App</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-cyan-500/40 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-sm text-white">Instalar LyonBots Web App</span>
              <button onClick={() => setShowGuide(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              {isIOS
                ? 'No Safari do iOS, toque no ícone de Compartilhar (quadrado com seta) e selecione "Adicionar à Tela de Início".'
                : 'Para instalar, clique no ícone de instalação na barra de endereços do seu navegador ou no menu de opções (três pontinhos) e clique em "Instalar LyonBots".'}
            </p>
            <button
              onClick={() => setShowGuide(false)}
              className="mt-4 w-full py-2 bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
