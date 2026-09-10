import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Smartphone, 
  CheckCheck, 
  Sparkles, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Instagram, 
  Play, 
  Bookmark, 
  ExternalLink,
  ShieldCheck,
  UserCheck,
  CreditCard,
  X,
  Maximize2,
  Minimize2,
  Radio
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ContentItem, Product, TelegramUser, TelegramChatMessage, BotSettings } from '../types';

interface TelegramSimulatorProps {
  contents: ContentItem[];
  products: Product[];
  users: TelegramUser[];
  botSettings: BotSettings;
  currentUser: TelegramUser;
  onSelectUser: (user: TelegramUser) => void;
  onUpdateUser: (user: TelegramUser) => void;
  onNewOrder: (product: Product, user: TelegramUser) => void;
  onClose?: () => void;
  isFloating?: boolean;
}

export const TelegramSimulator: React.FC<TelegramSimulatorProps> = ({
  contents,
  products,
  users,
  botSettings,
  currentUser,
  onSelectUser,
  onUpdateUser,
  onNewOrder,
  onClose,
  isFloating = false
}) => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<TelegramChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeMediaModal, setActiveMediaModal] = useState<ContentItem | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize bot welcome on mount or when user resets
  useEffect(() => {
    if (messages.length === 0) {
      initWelcomeConversation();
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addBotMessage = (
    text?: string, 
    inlineKeyboard?: Array<Array<{ text: string; callbackData?: string; url?: string }>>,
    media?: { type: 'photo' | 'video' | 'document'; url: string; caption?: string; duration?: string },
    isPaywall = false
  ) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const newMsg: TelegramChatMessage = {
        id: 'msg-' + Date.now() + Math.random().toString(36).substring(2, 5),
        sender: 'bot',
        text,
        inlineKeyboard,
        media,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        isPaywall
      };
      setMessages(prev => [...prev, newMsg]);
    }, 450);
  };

  const addUserMessage = (text: string) => {
    const newMsg: TelegramChatMessage = {
      id: 'msg-' + Date.now() + Math.random().toString(36).substring(2, 5),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const initWelcomeConversation = () => {
    setMessages([
      {
        id: 'init-1',
        sender: 'bot',
        text: `👋 <b>Bem-vindo(a), ${currentUser.firstName}!</b>\n\n${botSettings.welcomeText}\n\n📸 <i>Siga nosso Instagram oficial para acompanhar aulas, bastidores e novidades em primeira mão:</i>`,
        inlineKeyboard: [
          [
            { text: '📸 SEGUIR NO INSTAGRAM', url: botSettings.instagramUrl }
          ],
          [
            { text: '✅ JÁ SIGO / CONTINUAR 🚀', callbackData: 'menu_principal' }
          ]
        ],
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const sendMainMenu = () => {
    const badge = currentUser.isPremium ? '💎 MEMBRO PREMIUM' : '🆓 ACESSO GRATUITO';
    const text = `🤖 <b>${botSettings.botName.toUpperCase()}</b>\nStatus: <b>${badge}</b>\n\nOlá, ${currentUser.firstName}! 👋\nO que você deseja fazer hoje?`;
    
    const inlineKeyboard = [
      [
        { text: '📚 Conteúdos', callbackData: 'btn_conteudos' },
        { text: '🔥 Novidades', callbackData: 'btn_novidades' }
      ],
      [
        { text: '💎 Área Premium', callbackData: 'btn_premium' },
        { text: '🛒 Comprar Conteúdo', callbackData: 'btn_comprar' }
      ],
      [
        { text: '👤 Meu Perfil', callbackData: 'btn_perfil' },
        { text: '❓ Suporte', callbackData: 'btn_suporte' }
      ]
    ];

    addBotMessage(text, inlineKeyboard);
  };

  const handleAction = (callbackData: string) => {
    if (callbackData === 'menu_principal') {
      sendMainMenu();
      return;
    }

    if (callbackData === 'btn_conteudos') {
      const categories = ['Python', 'IA', 'Automação', 'Marketing', 'SaaS'];
      const inlineKeyboard = [
        [
          { text: '📁 Python', callbackData: 'cat_Python' },
          { text: '📁 IA', callbackData: 'cat_IA' }
        ],
        [
          { text: '📁 Automação', callbackData: 'cat_Automação' },
          { text: '📁 Marketing', callbackData: 'cat_Marketing' }
        ],
        [
          { text: '📁 SaaS', callbackData: 'cat_SaaS' }
        ],
        [
          { text: '⬅️ Voltar ao Menu Principal', callbackData: 'menu_principal' }
        ]
      ];
      addBotMessage('📚 <b>EXPLORADOR DE CONTEÚDOS</b>\n\nEscolha uma categoria abaixo para listar aulas, fotos e packs disponíveis:', inlineKeyboard);
      return;
    }

    if (callbackData.startsWith('cat_')) {
      const cat = callbackData.replace('cat_', '');
      const filtered = contents.filter(c => c.category === cat);
      
      if (filtered.length === 0) {
        addBotMessage(`Nenhum conteúdo encontrado na categoria <b>${cat}</b> no momento.`, [
          [{ text: '⬅️ Outras Categorias', callbackData: 'btn_conteudos' }]
        ]);
        return;
      }

      const rows = filtered.map(item => [
        {
          text: `${item.isPremium ? '💎' : '🔓'} ${item.title.substring(0, 32)}...`,
          callbackData: `view_content_${item.id}`
        }
      ]);
      rows.push([{ text: '⬅️ Voltar às Categorias', callbackData: 'btn_conteudos' }]);

      addBotMessage(`📁 Categoria: <b>${cat}</b>\nSelecione um conteúdo para abrir:`, rows);
      return;
    }

    if (callbackData.startsWith('view_content_')) {
      const id = callbackData.replace('view_content_', '');
      const item = contents.find(c => c.id === id);
      if (!item) return;

      // Check premium access
      if (item.isPremium && !currentUser.isPremium) {
        // PAYWALL!
        const paywallText = `🔒 <b>CONTEÚDO EXCLUSIVO PARA MEMBROS PREMIUM</b>\n\n📌 <b>${item.title}</b>\n${item.description}\n\n⚡ <i>Para assistir a esta aula e ter acesso ilimitado a todos os códigos, assine nosso plano VIP ou compre avulso:</i>`;
        const inlineKeyboard = [
          [{ text: '🔓 ASSINAR PREMIUM (R$ 29,90/mês)', callbackData: 'checkout_premium' }],
          [{ text: '🛒 COMPRAR UM CONTEÚDO AVULSO', callbackData: 'btn_comprar' }],
          [{ text: '⬅️ Voltar aos Conteúdos', callbackData: 'btn_conteudos' }]
        ];
        addBotMessage(paywallText, inlineKeyboard, undefined, true);
        return;
      }

      // Content is unlocked!
      const unlockedText = `🎓 <b>${item.title}</b>\n\n${item.description}\n\n📁 Categoria: ${item.category} | Formato: ${item.type.toUpperCase()}\n⏱ Duração: ${item.duration || 'Acesso Imediato'}`;
      const inlineKeyboard = [
        [
          { text: '▶️ ABRIR / ASSISTIR', callbackData: `open_modal_${item.id}` },
          { text: '⭐ FAVORITAR', callbackData: 'action_favorited' }
        ],
        [
          { text: '📚 MAIS AULAS', callbackData: 'btn_conteudos' }
        ]
      ];
      addBotMessage(unlockedText, inlineKeyboard, {
        type: item.type === 'foto' ? 'photo' : 'video',
        url: item.mediaUrl,
        caption: item.title,
        duration: item.duration
      });
      return;
    }

    if (callbackData.startsWith('open_modal_')) {
      const id = callbackData.replace('open_modal_', '');
      const item = contents.find(c => c.id === id);
      if (item) {
        setActiveMediaModal(item);
      }
      return;
    }

    if (callbackData === 'action_favorited') {
      addBotMessage('⭐ Conteúdo adicionado aos seus favoritos com sucesso!');
      return;
    }

    if (callbackData === 'btn_novidades') {
      const latest = contents.slice(0, 2);
      const rows = latest.map(item => [
        { text: `🔥 ${item.title.substring(0, 30)}...`, callbackData: `view_content_${item.id}` }
      ]);
      rows.push([{ text: '⬅️ Menu Principal', callbackData: 'menu_principal' }]);
      addBotMessage('🔥 <b>NOVIDADES DA SEMANA</b>\nConfira as publicações mais recentes do hub:', rows);
      return;
    }

    if (callbackData === 'btn_premium') {
      if (currentUser.isPremium) {
        const text = `💎 <b>SUA ÁREA VIP PREMIUM ESTÁ ATIVA!</b>\n\nParabéns, ${currentUser.firstName}! Você tem acesso irrestrito:\n\n✅ Todas as aulas e vídeos liberados\n✅ Packs de códigos Python e scripts\n✅ Canal VIP exclusivo no Telegram\n✅ Suporte prioritário`;
        const inlineKeyboard = [
          [{ text: '📦 Explorar Todos os Conteúdos VIP', callbackData: 'btn_conteudos' }],
          [{ text: '⬅️ Voltar ao Menu', callbackData: 'menu_principal' }]
        ];
        addBotMessage(text, inlineKeyboard);
      } else {
        const text = `💎 <b>ÁREA PREMIUM EXCLUSIVA</b>\n\nConteúdos avançados para acelerar sua carreira e seus projetos:\n\n📸 Fotos e diagramas em alta resolução\n🎥 Vídeos e aulas completas passo a passo\n📚 Códigos-fonte e templates Python prontos\n📦 Packs atualizados toda semana\n\n<b>Escolha sua opção de acesso:</b>`;
        const inlineKeyboard = [
          [{ text: '🔓 ASSINAR PREMIUM (R$ 29,90/mês)', callbackData: 'checkout_premium' }],
          [{ text: '🛒 COMPRAR CONTEÚDO AVULSO', callbackData: 'btn_comprar' }],
          [{ text: '⬅️ Voltar ao Menu', callbackData: 'menu_principal' }]
        ];
        addBotMessage(text, inlineKeyboard);
      }
      return;
    }

    if (callbackData === 'btn_comprar' || callbackData === 'checkout_premium') {
      const rows = products.filter(p => p.active).map(p => [
        { text: `💳 ${p.name} - R$ ${p.price.toFixed(2).replace('.', ',')}`, callbackData: `buy_prod_${p.id}` }
      ]);
      rows.push([{ text: '⬅️ Cancelar e Voltar', callbackData: 'menu_principal' }]);
      addBotMessage('🛒 <b>CATÁLOGO DE PRODUTOS & ASSINATURAS</b>\n\nSelecione o produto desejado para gerar o código de pagamento PIX:', rows);
      return;
    }

    if (callbackData.startsWith('buy_prod_')) {
      const prodId = callbackData.replace('buy_prod_', '');
      const prod = products.find(p => p.id === prodId);
      if (!prod) return;

      onNewOrder(prod, currentUser);

      const pixMock = `00020126580014br.gov.bcb.pix0136contentos_${prod.id}_pay5204000053039865405${prod.price.toFixed(2)}5802BR5920ContentOS6009Sao_Paulo`;
      const text = `💳 <b>PEDIDO GERADO COM SUCESSO!</b>\n\nProduto: <b>${prod.name}</b>\nValor: <b>R$ ${prod.price.toFixed(2).replace('.', ',')}</b>\n\n⚡ <b>Código PIX Copia e Cola:</b>\n<code>${pixMock}</code>\n\n<i>Copie o código acima no seu app de banco. Assim que o pagamento for confirmado, seu acesso é liberado instantaneamente!</i>`;
      
      const inlineKeyboard = [
        [{ text: '✅ SIMULAR PAGAMENTO APROVADO (PIX)', callbackData: `simulate_pay_${prod.id}` }],
        [{ text: '⬅️ Voltar ao Catálogo', callbackData: 'btn_comprar' }]
      ];
      addBotMessage(text, inlineKeyboard);
      return;
    }

    if (callbackData.startsWith('simulate_pay_')) {
      const prodId = callbackData.replace('simulate_pay_', '');
      const prod = products.find(p => p.id === prodId);
      
      // Upgrade user
      const updatedUser: TelegramUser = {
        ...currentUser,
        isPremium: true,
        purchasesCount: currentUser.purchasesCount + 1,
        totalSpent: currentUser.totalSpent + (prod?.price || 29.90)
      };
      onUpdateUser(updatedUser);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      const text = `🎉 <b>PAGAMENTO APROVADO COM SUCESSO!</b>\n\nParabéns, ${currentUser.firstName}! Seu acesso ao <b>${prod?.name || 'Plano Premium'}</b> foi ativado.\n\nTodos os conteúdos exclusivos e códigos estão liberados no seu menu:`;
      const inlineKeyboard = [
        [{ text: '💎 Acessar Área Premium VIP', callbackData: 'btn_premium' }],
        [{ text: '📚 Explorar Todos os Conteúdos', callbackData: 'btn_conteudos' }],
        [{ text: '👤 Ver Meu Perfil Atualizado', callbackData: 'btn_perfil' }]
      ];
      addBotMessage(text, inlineKeyboard);
      return;
    }

    if (callbackData === 'btn_perfil') {
      const statusText = currentUser.isPremium ? 'SIM 💎 (Ativo)' : 'NÃO (Conta Gratuita)';
      const text = `👤 <b>MEU PERFIL TELEGRAM</b>\n────────────────────\n<b>ID:</b> <code>${currentUser.telegramId}</code>\n<b>Username:</b> @${currentUser.username}\n<b>Nome:</b> ${currentUser.firstName}\n<b>Entrada:</b> ${new Date(currentUser.joinedAt).toLocaleDateString('pt-BR')}\n<b>Status Premium:</b> ${statusText}\n<b>Compras Realizadas:</b> ${currentUser.purchasesCount} pedido(s)\n<b>Total Investido:</b> R$ ${currentUser.totalSpent.toFixed(2).replace('.', ',')}\n<b>Última Interação:</b> Agora mesmo`;
      
      const inlineKeyboard = currentUser.isPremium ? [
        [{ text: '💎 Área VIP', callbackData: 'btn_premium' }],
        [{ text: '⬅️ Menu Principal', callbackData: 'menu_principal' }]
      ] : [
        [{ text: '💎 Assinar Plano VIP', callbackData: 'checkout_premium' }],
        [{ text: '⬅️ Menu Principal', callbackData: 'menu_principal' }]
      ];
      addBotMessage(text, inlineKeyboard);
      return;
    }

    if (callbackData === 'btn_suporte') {
      const text = `❓ <b>CENTRAL DE SUPORTE</b>\n\nPrecisa de ajuda com pagamentos, download de packs ou acesso aos conteúdos?\n\nFale diretamente com nossa equipe:\n👉 <b>@${botSettings.supportUsername}</b>`;
      const inlineKeyboard = [
        [{ text: '💬 Falar no Telegram', url: `https://t.me/${botSettings.supportUsername}` }],
        [{ text: '⬅️ Menu Principal', callbackData: 'menu_principal' }]
      ];
      addBotMessage(text, inlineKeyboard);
      return;
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');
    addUserMessage(text);

    if (text === '/start') {
      setTimeout(() => initWelcomeConversation(), 400);
      return;
    }

    if (text.toLowerCase() === 'menu' || text === '/menu') {
      setTimeout(() => sendMainMenu(), 400);
      return;
    }

    if (text === '/perfil') {
      handleAction('btn_perfil');
      return;
    }

    if (text === '/premium') {
      handleAction('btn_premium');
      return;
    }

    // Default conversational reply
    setTimeout(() => {
      addBotMessage(`Olá! Você digitou: <i>"${text}"</i>.\nPara navegar, use os comandos do menu interativo:`, [
        [{ text: '🤖 Abrir Menu Principal', callbackData: 'menu_principal' }],
        [{ text: '📚 Ver Conteúdos', callbackData: 'btn_conteudos' }]
      ]);
    }, 450);
  };

  return (
    <div className={`flex flex-col bg-slate-900 border border-slate-800 text-slate-100 overflow-hidden shadow-2xl ${
      isFloating ? 'fixed bottom-5 right-5 w-96 sm:w-[420px] h-[650px] rounded-2xl z-50' : 'w-full h-full rounded-xl'
    }`}>
      {/* Telegram Phone Header */}
      <div className="bg-slate-950/90 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              🤖
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm leading-tight text-white">{botSettings.botName}</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono">bot</span>
            </div>
            <p className="text-[11px] text-slate-400">@{botSettings.botUsername} • online</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Switch test user dropdown */}
          <select 
            value={currentUser.id}
            onChange={(e) => {
              const selected = users.find(u => u.id === e.target.value);
              if (selected) onSelectUser(selected);
            }}
            className="bg-slate-800 text-[11px] text-slate-300 border border-slate-700 rounded px-2 py-1 outline-none focus:border-cyan-500"
            title="Trocar usuário simulado"
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.isPremium ? '💎' : '🆓'}
              </option>
            ))}
          </select>

          <button 
            onClick={initWelcomeConversation}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title="Reiniciar conversa (/start)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* User simulator badge banner */}
      <div className="bg-slate-950/60 px-3 py-1.5 border-b border-slate-800/80 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Interagindo como:</span>
          <span className="font-semibold text-white">@{currentUser.username}</span>
          <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
            currentUser.isPremium ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-700 text-slate-300'
          }`}>
            {currentUser.isPremium ? '💎 VIP' : '🆓 Free'}
          </span>
        </div>
        <button 
          onClick={() => {
            onUpdateUser({
              ...currentUser,
              isPremium: !currentUser.isPremium
            });
          }}
          className="text-cyan-400 hover:text-cyan-300 underline font-medium text-[10px]"
        >
          {currentUser.isPremium ? 'Mudar p/ Gratuito' : 'Tornar Premium'}
        </button>
      </div>

      {/* Chat Messages Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div 
              className={`max-w-[88%] rounded-2xl p-3 text-xs shadow-md transition-all ${
                msg.sender === 'user' 
                  ? 'bg-cyan-600 text-white rounded-tr-xs' 
                  : msg.isPaywall
                    ? 'bg-slate-900 border border-amber-500/40 text-slate-100 rounded-tl-xs'
                    : 'bg-slate-800/95 border border-slate-700/60 text-slate-100 rounded-tl-xs'
              }`}
            >
              {/* Media preview if attached */}
              {msg.media && (
                <div className="mb-2.5 rounded-xl overflow-hidden border border-slate-700/60 relative group">
                  <img 
                    src={msg.media.url} 
                    alt={msg.media.caption || 'Mídia do Bot'} 
                    className="w-full h-36 object-cover"
                  />
                  {msg.media.type === 'video' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/90 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 ml-0.5 fill-current" />
                      </div>
                    </div>
                  )}
                  {msg.media.duration && (
                    <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-[10px] px-1.5 py-0.5 rounded text-white font-mono">
                      {msg.media.duration}
                    </div>
                  )}
                </div>
              )}

              {/* Message text with HTML-like formatting support */}
              {msg.text && (
                <div 
                  className="space-y-1.5 leading-relaxed break-words"
                  dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }}
                />
              )}

              {/* Timestamp & read receipts */}
              <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] text-slate-400">
                <span>{msg.timestamp}</span>
                {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-cyan-200" />}
              </div>
            </div>

            {/* Telegram Inline Keyboard Buttons */}
            {msg.inlineKeyboard && msg.inlineKeyboard.length > 0 && (
              <div className="w-[88%] mt-1.5 space-y-1">
                {msg.inlineKeyboard.map((row, rIdx) => (
                  <div key={rIdx} className="flex gap-1">
                    {row.map((btn, bIdx) => (
                      <button
                        key={bIdx}
                        onClick={() => {
                          if (btn.url) {
                            window.open(btn.url, '_blank');
                          } else if (btn.callbackData) {
                            handleAction(btn.callbackData);
                          }
                        }}
                        className={`flex-1 py-2 px-2.5 rounded-lg text-center font-medium text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                          btn.callbackData?.startsWith('sim_') || btn.callbackData?.startsWith('simulate_')
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold'
                            : btn.callbackData?.includes('premium') || btn.callbackData?.includes('checkout')
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-sm'
                              : 'bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-cyan-300 hover:text-cyan-200'
                        }`}
                      >
                        {btn.text}
                        {btn.url && <ExternalLink className="w-3 h-3 opacity-60" />}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 italic bg-slate-800/60 w-fit px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></span>
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            <span className="ml-1 text-[11px] text-slate-400">bot está digitando...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Command Chips */}
      <div className="bg-slate-950/80 px-3 py-1.5 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <button 
          onClick={() => { addUserMessage('/start'); initWelcomeConversation(); }}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono shrink-0"
        >
          /start
        </button>
        <button 
          onClick={() => { addUserMessage('/menu'); sendMainMenu(); }}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono shrink-0"
        >
          /menu
        </button>
        <button 
          onClick={() => { addUserMessage('📚 Conteúdos'); handleAction('btn_conteudos'); }}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
        >
          📚 Conteúdos
        </button>
        <button 
          onClick={() => { addUserMessage('💎 Premium'); handleAction('btn_premium'); }}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 shrink-0"
        >
          💎 Premium
        </button>
        <button 
          onClick={() => { addUserMessage('👤 Perfil'); handleAction('btn_perfil'); }}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
        >
          👤 Perfil
        </button>
      </div>

      {/* Message Input Box */}
      <form 
        onSubmit={handleSendMessage}
        className="bg-slate-950 p-2.5 border-t border-slate-800 flex items-center gap-2"
      >
        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escreva uma mensagem ou comando..."
          className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all"
        />
        <button 
          type="submit"
          className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
          disabled={!inputText.trim()}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Modal for viewing media/lesson directly */}
      {activeMediaModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md p-4 flex flex-col justify-center items-center z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm overflow-hidden p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                {activeMediaModal.type} • {activeMediaModal.category}
              </span>
              <button 
                onClick={() => setActiveMediaModal(null)}
                className="p-1 text-slate-400 hover:text-white rounded-full bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden mb-3 aspect-video bg-black flex items-center justify-center relative">
              <img 
                src={activeMediaModal.mediaUrl} 
                alt={activeMediaModal.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform">
                  <Play className="w-6 h-6 ml-0.5 fill-current" />
                </div>
              </div>
            </div>

            <h4 className="font-bold text-sm text-white mb-1">{activeMediaModal.title}</h4>
            <p className="text-xs text-slate-400 mb-4">{activeMediaModal.description}</p>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
              <span>⏱ {activeMediaModal.duration || 'Acesso Imediato'}</span>
              <span className="text-emerald-400 font-medium">✅ Acesso Autorizado</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
