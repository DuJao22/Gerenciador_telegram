import React from 'react';
import { 
  Users, 
  Crown, 
  Package, 
  DollarSign, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  ArrowUpRight, 
  Calendar, 
  Sparkles, 
  Radio, 
  Layers, 
  Bot,
  Flame,
  ChevronRight,
  Settings,
  Smartphone,
  BookOpen
} from 'lucide-react';
import { ContentItem, ScheduledPost, TelegramUser, Order } from '../types';

interface DashboardViewProps {
  contents: ContentItem[];
  scheduledPosts: ScheduledPost[];
  users: TelegramUser[];
  orders: Order[];
  onOpenNewContentModal: () => void;
  onNavigateTab: (tabId: string) => void;
  onDispatchPostNow: (postId: string) => void;
  onApproveOrder: (orderId: string) => void;
  onOpenSettings?: () => void;
  onOpenSimulator?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  contents,
  scheduledPosts,
  users,
  orders,
  onOpenNewContentModal,
  onNavigateTab,
  onDispatchPostNow,
  onApproveOrder,
  onOpenSettings,
  onOpenSimulator
}) => {
  const totalRevenue = orders
    .filter(o => o.status === 'pago')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const premiumUsersCount = users.filter(u => u.isPremium).length;
  const publishedToday = scheduledPosts.filter(p => p.status === 'publicada').length;
  const scheduledCount = scheduledPosts.filter(p => p.status === 'agendada').length;
  const failureCount = scheduledPosts.filter(p => p.status === 'falha').length;

  return (
    <div className="space-y-6">
      {/* Top Header with Status Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>LYONBOTS</span>
              <span className="text-cyan-400 font-normal">CONTROL</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              LyonBots OS v3.0
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Painel operacional LyonBots: automação inteligente, agendamento de posts e vendas 24/7 no Telegram.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">Worker APScheduler: Ativo</span>
          </div>

          <button
            onClick={onOpenNewContentModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ NOVO CONTEÚDO</span>
          </button>
        </div>
      </div>

      {/* Quick Navigation & Direct Control Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onOpenSettings}
          className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group cursor-pointer shadow-sm hover:shadow-cyan-500/10"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
              <Settings className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">Configurar</span>
          </div>
          <div className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors">
            Chave & Token do Bot
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
            Definir token @BotFather e credenciais
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('telegram')}
          className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 hover:border-purple-500/50 text-left transition-all group cursor-pointer shadow-sm hover:shadow-purple-500/10"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Bot className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">Mensagens</span>
          </div>
          <div className="font-bold text-xs text-white group-hover:text-purple-300 transition-colors">
            Conteúdos do Bot & Menus
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
            Boas-vindas /start, comandos e botões
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('monetization')}
          className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group cursor-pointer shadow-sm hover:shadow-emerald-500/10"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Catálogo</span>
          </div>
          <div className="font-bold text-xs text-white group-hover:text-emerald-300 transition-colors">
            Produtos & Vendas PIX
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
            Gerenciar preços, VIPs e links
          </p>
        </button>

        <button
          onClick={onOpenSimulator}
          className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 hover:border-blue-500/50 text-left transition-all group cursor-pointer shadow-sm hover:shadow-blue-500/10"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <Smartphone className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">Ao Vivo</span>
          </div>
          <div className="font-bold text-xs text-white group-hover:text-blue-300 transition-colors">
            Simulador Telegram
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
            Testar respostas e botões no chat
          </p>
        </button>
      </div>

      {/* 5 Core Metric Cards exactly as depicted in user structure */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Users */}
        <div 
          onClick={() => onNavigateTab('audience')}
          className="bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 p-4 rounded-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Usuários</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">2.481</div>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+14.2% novos no bot este mês</span>
          </div>
        </div>

        {/* Premium */}
        <div 
          onClick={() => onNavigateTab('audience')}
          className="bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 p-4 rounded-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Premium</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-300 tracking-tight">387</div>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-400/80">
            <span>15.6% de conversão VIP</span>
          </div>
        </div>

        {/* Conteúdos */}
        <div 
          onClick={() => onNavigateTab('content')}
          className="bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 p-4 rounded-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Conteúdos</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">142</div>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
            <span>Fotos, Vídeos, Aulas e Packs</span>
          </div>
        </div>

        {/* Vendas */}
        <div 
          onClick={() => onNavigateTab('monetization')}
          className="bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 p-4 rounded-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Vendas</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">R$ 8.420</div>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+R$ 1.840 esta semana</span>
          </div>
        </div>

        {/* Publicações Hoje */}
        <div 
          onClick={() => onNavigateTab('publishing')}
          className="bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 p-4 rounded-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Publicações Hoje</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">12</div>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-purple-300">
            <span>100% entregues no Telegram</span>
          </div>
        </div>
      </div>

      {/* Operational Hub: Architecture Quick Tree & Publishing Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Publishing Timeline & Fast Dispatcher */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <h3 className="font-semibold text-sm text-white">Fila de Publicações & Agendamento</h3>
              </div>
              <button 
                onClick={() => onNavigateTab('publishing')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>Ver Calendário Completo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {scheduledPosts.map((post) => (
                <div 
                  key={post.id}
                  className="bg-slate-950/60 border border-slate-800/90 hover:border-slate-700 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <img 
                      src={post.mediaUrl} 
                      alt={post.contentTitle} 
                      className="w-14 h-14 rounded-lg object-cover border border-slate-800 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-white">{post.contentTitle}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                          post.status === 'agendada' 
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : post.status === 'publicada'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {post.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Alvo: {post.target === 'channel' ? 'Canal Público' : 'Grupo VIP'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{post.caption}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          {new Date(post.scheduledFor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                        {post.buttons.length > 0 && (
                          <span className="text-slate-400">
                            {post.buttons.length} botões inline inclusos
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {post.status === 'agendada' && (
                      <button
                        onClick={() => onDispatchPostNow(post.id)}
                        className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Publicar Agora</span>
                      </button>
                    )}
                    {post.status === 'publicada' && (
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Enviado via Bot</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Flow: How Scheduler operates with Telegram API */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Fluxo Automatizado de Publicação
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Passo 1</div>
                <div className="font-semibold text-white mt-0.5">Upload Painel</div>
                <div className="text-[10px] text-cyan-400 mt-0.5">Flask / REST</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Passo 2</div>
                <div className="font-semibold text-white mt-0.5">Agendamento</div>
                <div className="text-[10px] text-cyan-400 mt-0.5">SQLite Database</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Passo 3</div>
                <div className="font-semibold text-white mt-0.5">Scheduler</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">APScheduler 30s</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Passo 4</div>
                <div className="font-semibold text-white mt-0.5">Telebot API</div>
                <div className="text-[10px] text-purple-400 mt-0.5">Bot Dispatcher</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Passo 5</div>
                <div className="font-semibold text-white mt-0.5">Membros Telegram</div>
                <div className="text-[10px] text-amber-400 mt-0.5">Recebem com CTA</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Content OS Navigation Architecture Tree & Recent Orders */}
        <div className="space-y-4">
          {/* Architecture Tree from Prompt */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h3 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Estrutura do Content OS</span>
            </h3>
            
            <div className="font-mono text-xs text-slate-300 space-y-3 bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
              <div>
                <span className="text-cyan-400 font-bold">Conteúdos</span>
                <div className="pl-3 text-slate-400 border-l border-slate-800 mt-0.5 space-y-0.5">
                  <div>├── 📸 Fotos ({contents.filter(c => c.type === 'foto').length})</div>
                  <div>├── 🎥 Vídeos ({contents.filter(c => c.type === 'video').length})</div>
                  <div>├── 📚 Aulas ({contents.filter(c => c.type === 'aula').length})</div>
                  <div>├── 📦 Packs ({contents.filter(c => c.type === 'pack').length})</div>
                  <div>└── 💎 Premium ({contents.filter(c => c.isPremium).length})</div>
                </div>
              </div>

              <div>
                <span className="text-purple-400 font-bold">Publicações</span>
                <div className="pl-3 text-slate-400 border-l border-slate-800 mt-0.5 space-y-0.5">
                  <div>├── Agendadas ({scheduledCount})</div>
                  <div>├── Publicadas ({publishedToday})</div>
                  <div>└── Falhas ({failureCount})</div>
                </div>
              </div>

              <div>
                <span className="text-amber-400 font-bold">Vendas & Pedidos</span>
                <div className="pl-3 text-slate-400 border-l border-slate-800 mt-0.5 space-y-0.5">
                  <div>├── Pedidos Totais ({orders.length})</div>
                  <div>├── Pagos ({orders.filter(o => o.status === 'pago').length})</div>
                  <div>└── Pendentes PIX ({orders.filter(o => o.status === 'pendente').length})</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders Feed */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Últimos Pedidos / Vendas</span>
              </h3>
              <button 
                onClick={() => onNavigateTab('monetization')}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-2">
              {orders.slice(0, 4).map((order) => (
                <div 
                  key={order.id}
                  className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-medium text-white">{order.productName}</div>
                    <div className="text-[11px] text-slate-400">
                      {order.userName} • {order.paymentMethod}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-400">
                      R$ {order.amount.toFixed(2).replace('.', ',')}
                    </div>
                    {order.status === 'pago' ? (
                      <span className="text-[10px] text-emerald-400 font-medium">Aprovado ✅</span>
                    ) : (
                      <button
                        onClick={() => onApproveOrder(order.id)}
                        className="text-[10px] text-amber-400 hover:text-amber-300 underline font-medium"
                      >
                        Aprovar PIX
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
