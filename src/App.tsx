import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  Bot, 
  DollarSign, 
  BarChart3, 
  Settings, 
  Code2, 
  Smartphone, 
  Plus, 
  Bell, 
  CheckCircle2, 
  Sparkles, 
  Menu, 
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Radio,
  Download
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { 
  ContentItem, 
  ScheduledPost, 
  TelegramUser, 
  Product, 
  Order, 
  BotSettings 
} from './types';

import { 
  INITIAL_CONTENTS, 
  INITIAL_SCHEDULED_POSTS, 
  INITIAL_USERS, 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS, 
  INITIAL_BOT_SETTINGS 
} from './initialData';

import { DashboardView } from './components/DashboardView';
import { ContentHubView } from './components/ContentHubView';
import { PublishingView } from './components/PublishingView';
import { AudienceView } from './components/AudienceView';
import { MonetizationView } from './components/MonetizationView';
import { TelegramConfigView } from './components/TelegramConfigView';
import { PythonCodeViewer } from './components/PythonCodeViewer';
import { TelegramSimulator } from './components/TelegramSimulator';
import { NewContentModal } from './components/NewContentModal';
import { BotTokenSettingsModal } from './components/BotTokenSettingsModal';

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'audience' | 'content' | 'publishing' | 'telegram' | 'monetization' | 'python'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTelegramSimOpen, setIsTelegramSimOpen] = useState(false);
  const [isNewContentModalOpen, setIsNewContentModalOpen] = useState(false);
  const [isBotTokenModalOpen, setIsBotTokenModalOpen] = useState(false);

  // Persistent State
  const [contents, setContents] = useState<ContentItem[]>(() => {
    const saved = localStorage.getItem('content_os_contents');
    return saved ? JSON.parse(saved) : INITIAL_CONTENTS;
  });

  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>(() => {
    const saved = localStorage.getItem('content_os_schedules');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULED_POSTS;
  });

  const [users, setUsers] = useState<TelegramUser[]>(() => {
    const saved = localStorage.getItem('content_os_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('content_os_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('content_os_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [botSettings, setBotSettings] = useState<BotSettings>(() => {
    const saved = localStorage.getItem('content_os_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.telegramToken || parsed.telegramToken.includes('6891245892')) {
          parsed.telegramToken = '8894323284:AAHyfUMZwE1m5eM1JXmdhkv_oZH1E9yEixY';
          parsed.botName = 'Curso Python Bot';
          parsed.botUsername = 'Curso_PythonBot';
        }
        return parsed;
      } catch {
        return INITIAL_BOT_SETTINGS;
      }
    }
    return INITIAL_BOT_SETTINGS;
  });

  // Current active user in the simulator
  const [currentSimUser, setCurrentSimUser] = useState<TelegramUser>(users[0] || INITIAL_USERS[0]);

  // Global toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('content_os_contents', JSON.stringify(contents));
  }, [contents]);

  useEffect(() => {
    localStorage.setItem('content_os_schedules', JSON.stringify(scheduledPosts));
  }, [scheduledPosts]);

  useEffect(() => {
    localStorage.setItem('content_os_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('content_os_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('content_os_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('content_os_settings', JSON.stringify(botSettings));
  }, [botSettings]);

  // Handlers
  const handleCreateContent = (
    newContentData: Partial<ContentItem>, 
    publishMode: 'now' | 'schedule' | 'draft', 
    scheduleDate?: string,
    target: 'channel' | 'all_users' | 'vip_users' = 'channel'
  ) => {
    const newId = 'cnt-' + (contents.length + 1);
    const fullContent: ContentItem = {
      id: newId,
      title: newContentData.title || 'Sem título',
      type: newContentData.type || 'video',
      mediaUrl: newContentData.mediaUrl || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
      description: newContentData.description || '',
      category: newContentData.category || 'Geral',
      isPremium: Boolean(newContentData.isPremium),
      duration: newContentData.duration,
      tags: newContentData.tags || ['Conteúdo'],
      createdAt: new Date().toISOString(),
      viewsCount: 0,
      clicksCount: 0
    };

    setContents(prev => [fullContent, ...prev]);

    if (publishMode === 'now') {
      const newPost: ScheduledPost = {
        id: 'sch-' + Date.now(),
        contentId: fullContent.id,
        contentTitle: fullContent.title,
        contentType: fullContent.type,
        mediaUrl: fullContent.mediaUrl,
        caption: `🔥 NOVO CONTEÚDO DISPONÍVEL!\n\n📌 ${fullContent.title}\n\n${fullContent.description}`,
        scheduledFor: new Date().toISOString(),
        status: 'publicada',
        target,
        sentAt: new Date().toISOString(),
        buttons: [
          { text: '▶️ VER CONTEÚDO', action: 'view' },
          { text: '⭐ CONTEÚDO PREMIUM', action: 'premium' },
          { text: '📲 INSTAGRAM', action: 'instagram' }
        ]
      };
      setScheduledPosts(prev => [newPost, ...prev]);
      showToast(`🚀 "${fullContent.title}" publicado imediatamente no Telegram!`);
      // Open simulator to let user see it
      setIsTelegramSimOpen(true);
    } else if (publishMode === 'schedule' && scheduleDate) {
      const newPost: ScheduledPost = {
        id: 'sch-' + Date.now(),
        contentId: fullContent.id,
        contentTitle: fullContent.title,
        contentType: fullContent.type,
        mediaUrl: fullContent.mediaUrl,
        caption: `📸 Nova publicação programada: ${fullContent.title}`,
        scheduledFor: scheduleDate,
        status: 'agendada',
        target,
        buttons: [
          { text: '▶️ VER CONTEÚDO', action: 'view' },
          { text: '⭐ CONTEÚDO PREMIUM', action: 'premium' }
        ]
      };
      setScheduledPosts(prev => [newPost, ...prev]);
      showToast(`📅 Publicação agendada com sucesso para ${new Date(scheduleDate).toLocaleString('pt-BR')}!`);
    } else {
      showToast(`✅ Conteúdo salvo na biblioteca com sucesso!`);
    }
  };

  const handleDispatchPostNow = (postId: string) => {
    setScheduledPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          status: 'publicada',
          sentAt: new Date().toISOString()
        };
      }
      return p;
    }));
    showToast('🚀 Publicação disparada com sucesso para o Telegram!');
  };

  const handleRetryPost = (postId: string) => {
    setScheduledPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          status: 'agendada'
        };
      }
      return p;
    }));
    showToast('🔄 Postagem reagendada na fila do APScheduler!');
  };

  const handleDeleteContent = (contentId: string) => {
    setContents(prev => prev.filter(c => c.id !== contentId));
    showToast('🗑️ Conteúdo removido da biblioteca.');
  };

  const handleTogglePremiumUser = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextState = !u.isPremium;
        if (currentSimUser.id === userId) {
          setCurrentSimUser({ ...currentSimUser, isPremium: nextState });
        }
        showToast(nextState ? `💎 Status VIP concedido a ${u.firstName}!` : `Acesso VIP revogado de ${u.firstName}.`);
        return { ...u, isPremium: nextState };
      }
      return u;
    }));
  };

  const handleUpdateSimUser = (updatedUser: TelegramUser) => {
    setCurrentSimUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleNewOrder = (product: Product, user: TelegramUser) => {
    const newOrder: Order = {
      id: 'ord-' + Math.floor(1000 + Math.random() * 9000),
      userId: user.id,
      userName: `${user.firstName} ${user.lastName || ''}`,
      userTelegramId: user.telegramId,
      productId: product.id,
      productName: product.name,
      amount: product.price,
      status: 'pendente',
      paymentMethod: 'PIX',
      createdAt: new Date().toISOString()
    };
    setOrders(prev => [newOrder, ...prev]);
  };

  const handleApproveOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        // Upgrade the associated user to premium
        setUsers(uList => uList.map(u => {
          if (u.id === o.userId) {
            const updated = {
              ...u,
              isPremium: true,
              purchasesCount: u.purchasesCount + 1,
              totalSpent: u.totalSpent + o.amount
            };
            if (currentSimUser.id === u.id) {
              setCurrentSimUser(updated);
            }
            return updated;
          }
          return u;
        }));
        return { ...o, status: 'pago' };
      }
      return o;
    }));
    showToast('🎉 Pagamento PIX aprovado e acesso VIP liberado no Telegram!');
  };

  const handleAddNewProduct = (newProd: Partial<Product>) => {
    const fullProd: Product = {
      id: 'prod-' + (products.length + 1),
      name: newProd.name || 'Produto Digital',
      price: newProd.price || 29.90,
      type: newProd.type || 'pack',
      billingInterval: newProd.type === 'subscription' ? 'mensal' : 'único',
      description: newProd.description || '',
      features: newProd.features || ['Acesso Imediato'],
      active: true,
      salesCount: 0
    };
    setProducts(prev => [...prev, fullProd]);
    showToast(`📦 Produto "${fullProd.name}" adicionado ao catálogo!`);
  };

  const handleSendDirectMessage = (user: TelegramUser, text: string) => {
    showToast(`💬 Mensagem direta enviada para ${user.firstName} (@${user.username})!`);
  };

  const handleTestBroadcast = (message: string) => {
    showToast(`📢 Transmissão em massa enviada para ${users.length} usuários!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white lg:hidden hover:bg-slate-900"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-cyan-500/30">
              ⚡
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white">CONTENT OS</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Hub Telegram
              </span>
            </div>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Gear / Engrenagem: Configurações da Chave de Acesso do Bot */}
          <button
            onClick={() => setIsBotTokenModalOpen(true)}
            title="Configurações da Chave de Acesso (Telegram Bot Token)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer group"
          >
            <Settings className="w-4 h-4 text-cyan-400 group-hover:rotate-90 transition-transform duration-300" />
            <span className="hidden sm:inline font-mono">Chave Token</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>
          </button>

          {/* Quick simulator toggle button */}
          <button
            onClick={() => setIsTelegramSimOpen(!isTelegramSimOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              isTelegramSimOpen 
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/30 font-bold' 
                : 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border-slate-700'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isTelegramSimOpen ? 'Ocultar Simulador Bot' : 'Simulador Telegram Bot'}
            </span>
            <span className="sm:hidden">Bot</span>
          </button>

          <button
            onClick={() => setIsNewContentModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">+ Novo Conteúdo</span>
          </button>

          {/* Python Code export shortcut */}
          <button
            onClick={() => setActiveTab('python')}
            title="Código Python & Deploy"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 border border-slate-800 transition-colors"
          >
            <Code2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800/80 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 flex flex-col justify-between ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-0 max-lg:-translate-x-full'
        }`}>
          <div className="p-4 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between lg:hidden pb-3 border-b border-slate-800">
              <span className="font-bold text-xs text-slate-400 uppercase tracking-wider">Menu Navegação</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav Group 1: General */}
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Visão Geral
              </div>
              <button
                onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'dashboard' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>📊 Dashboard Central</span>
              </button>
            </div>

            {/* Nav Group 2: Content & Publishing */}
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Conteúdo & Disparos
              </div>
              <button
                onClick={() => { setActiveTab('content'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'content' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4" />
                  <span>📚 Conteúdos & Biblioteca</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {contents.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('publishing'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'publishing' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4" />
                  <span>📅 Agendamentos & Fila</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                  {scheduledPosts.filter(p => p.status === 'agendada').length}
                </span>
              </button>
            </div>

            {/* Nav Group 3: Audience & Monetization */}
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Comercial & CRM
              </div>
              <button
                onClick={() => { setActiveTab('audience'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'audience' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4" />
                  <span>👥 Audiência & CRM</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {users.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('monetization'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'monetization' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4" />
                  <span>💰 Vendas & Produtos PIX</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                  R$ 8.420
                </span>
              </button>
            </div>

            {/* Nav Group 4: Telegram & Code */}
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Automação & Código
              </div>
              <button
                onClick={() => { setActiveTab('telegram'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'telegram' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>🤖 Bot Telegram & Menus</span>
              </button>

              <button
                onClick={() => { setActiveTab('python'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'python' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Code2 className="w-4 h-4" />
                <span>💻 Código Python & Deploy</span>
              </button>
            </div>
          </div>

          {/* Sidebar Footer with Gear Shortcut */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950">
            <button
              onClick={() => setIsBotTokenModalOpen(true)}
              className="w-full text-left p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-2 cursor-pointer group"
              title="Clique na engrenagem para configurar ou testar a chave de acesso do bot"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="font-semibold text-slate-300">Chave do Bot</span>
                </span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Conectado
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono flex items-center justify-between">
                <span className="text-cyan-300">@{botSettings.botUsername}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-sans font-medium">Configurar</span>
              </div>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                contents={contents}
                scheduledPosts={scheduledPosts}
                users={users}
                orders={orders}
                onOpenNewContentModal={() => setIsNewContentModalOpen(true)}
                onNavigateTab={(tab) => setActiveTab(tab as any)}
                onDispatchPostNow={handleDispatchPostNow}
                onApproveOrder={handleApproveOrder}
              />
            )}

            {activeTab === 'content' && (
              <ContentHubView
                contents={contents}
                onOpenNewContentModal={() => setIsNewContentModalOpen(true)}
                onDispatchImmediate={(item) => handleCreateContent(item, 'now', undefined, 'channel')}
                onDeleteContent={handleDeleteContent}
              />
            )}

            {activeTab === 'publishing' && (
              <PublishingView
                scheduledPosts={scheduledPosts}
                contents={contents}
                onOpenNewContentModal={() => setIsNewContentModalOpen(true)}
                onDispatchPostNow={handleDispatchPostNow}
                onRetryPost={handleRetryPost}
              />
            )}

            {activeTab === 'audience' && (
              <AudienceView
                users={users}
                onTogglePremium={handleTogglePremiumUser}
                onSendDirectMessage={handleSendDirectMessage}
              />
            )}

            {activeTab === 'monetization' && (
              <MonetizationView
                products={products}
                orders={orders}
                onApproveOrder={handleApproveOrder}
                onAddNewProduct={handleAddNewProduct}
              />
            )}

            {activeTab === 'telegram' && (
              <TelegramConfigView
                botSettings={botSettings}
                onSaveSettings={(s) => { setBotSettings(s); showToast('Configurações salvas!'); }}
                onTestBroadcast={handleTestBroadcast}
              />
            )}

            {activeTab === 'python' && (
              <PythonCodeViewer />
            )}
          </div>
        </main>

        {/* Docked Telegram Bot Simulator (Split Screen on large screens or overlay) */}
        {isTelegramSimOpen && (
          <aside className="w-96 xl:w-[420px] bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 shadow-2xl relative z-30">
            <TelegramSimulator
              contents={contents}
              products={products}
              users={users}
              botSettings={botSettings}
              currentUser={currentSimUser}
              onSelectUser={(u) => setCurrentSimUser(u)}
              onUpdateUser={handleUpdateSimUser}
              onNewOrder={handleNewOrder}
              onClose={() => setIsTelegramSimOpen(false)}
            />
          </aside>
        )}
      </div>

      {/* Floating simulator button if closed */}
      {!isTelegramSimOpen && (
        <button
          onClick={() => setIsTelegramSimOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-full shadow-2xl shadow-cyan-500/40 font-semibold text-xs flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-cyan-400/30"
        >
          <Smartphone className="w-4 h-4" />
          <span>Abrir Bot Telegram</span>
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
        </button>
      )}

      {/* New Content & Scheduling Modal */}
      <NewContentModal
        isOpen={isNewContentModalOpen}
        onClose={() => setIsNewContentModalOpen(false)}
        onSubmit={handleCreateContent}
      />

      {/* Bot Token / Chave Settings Modal (Engrenagem) */}
      <BotTokenSettingsModal
        isOpen={isBotTokenModalOpen}
        onClose={() => setIsBotTokenModalOpen(false)}
        botSettings={botSettings}
        onSaveSettings={(newSettings) => {
          setBotSettings(newSettings);
          showToast('Chave de acesso salva e identificada no sistema!');
        }}
        onOpenFullSettings={() => {
          setActiveTab('telegram');
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-cyan-500/50 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
