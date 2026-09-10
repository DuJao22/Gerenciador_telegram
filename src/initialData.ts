import { ContentItem, ScheduledPost, TelegramUser, Product, Order, BotSettings } from './types';

export const INITIAL_BOT_SETTINGS: BotSettings = {
  botName: 'Curso Python Bot',
  botUsername: 'Curso_PythonBot',
  welcomeText: 'Antes de continuar e desbloquear nossos conteúdos exclusivos, siga nosso Instagram para acompanhar novidades diárias!',
  instagramHandle: '@layon.dev',
  instagramUrl: 'https://instagram.com/layon.dev',
  supportUsername: 'layon_suporte',
  telegramToken: '8894323284:AAHyfUMZwE1m5eM1JXmdhkv_oZH1E9yEixY',
  telegramChannelId: '@layon_vip_channel',
  autoRegister: true
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Pack Python Pro',
    price: 19.90,
    type: 'pack',
    billingInterval: 'único',
    description: 'Mais de 50 scripts prontos para automação web, raspagem de dados e bots Telegram.',
    features: ['50+ Scripts Python', 'Exemplos Telebot & Flask', 'Suporte a dúvidas', 'Acesso vitalício'],
    active: true,
    salesCount: 164
  },
  {
    id: 'prod-2',
    name: 'Curso Automação com Bots',
    price: 47.90,
    type: 'course',
    billingInterval: 'único',
    description: 'Aprenda a construir bots comerciais no Telegram com agendamento, pagamento via PIX e painel web.',
    features: ['18 Aulas em Vídeo', 'Código Fonte Completo', 'Deploy no Render & VPS', 'Certificado'],
    active: true,
    salesCount: 89
  },
  {
    id: 'prod-3',
    name: 'Área Premium VIP',
    price: 29.90,
    type: 'subscription',
    billingInterval: 'mensal',
    description: 'Acesso irrestrito a todos os conteúdos, códigos fontes, canal VIP com transmissões e novos lançamentos.',
    features: ['Canal VIP Telegram', 'Todos os Packs Liberados', 'Novos Conteúdos Semanais', 'Suporte Prioritário'],
    active: true,
    salesCount: 387
  },
  {
    id: 'prod-4',
    name: 'Pack VIP Mastermind',
    price: 97.00,
    type: 'vip',
    billingInterval: 'único',
    description: 'Pacote completo incluindo todos os cursos, templates de SaaS e acesso direto a consultorias em grupo.',
    features: ['Todos os Cursos & Packs', 'Grupo Fechado de Networking', 'Review de Projetos', 'Templates SaaS'],
    active: true,
    salesCount: 42
  }
];

export const INITIAL_CONTENTS: ContentItem[] = [
  {
    id: 'cnt-1',
    title: 'Como criar um SaaS com Python e Telegram',
    type: 'video',
    mediaUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
    description: 'Aprenda a estruturar o backend em Flask, integrar banco SQLite e gerenciar assinantes no Telegram.',
    category: 'SaaS',
    isPremium: true,
    duration: '24 min',
    tags: ['Python', 'SaaS', 'Telegram'],
    createdAt: '2026-09-09T14:30:00Z',
    viewsCount: 842,
    clicksCount: 310
  },
  {
    id: 'cnt-2',
    title: 'Automação de Agendamento com APScheduler',
    type: 'aula',
    mediaUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
    description: 'Guia definitivo de background workers em Python para disparos programados sem travar a aplicação.',
    category: 'Automação',
    isPremium: false,
    duration: '18 min',
    tags: ['Python', 'APScheduler', 'Workers'],
    createdAt: '2026-09-09T10:00:00Z',
    viewsCount: 1240,
    clicksCount: 450
  },
  {
    id: 'cnt-3',
    title: 'Infográfico: Arquitetura de Microserviços para Bots',
    type: 'foto',
    mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
    description: 'Diagrama visual de fluxo entre Telegram API, Webhook, Flask API e banco relacional.',
    category: 'Python',
    isPremium: false,
    tags: ['Diagrama', 'Arquitetura', 'Python'],
    createdAt: '2026-09-08T18:20:00Z',
    viewsCount: 950,
    clicksCount: 280
  },
  {
    id: 'cnt-4',
    title: 'Pack de 20 Prompts e Scripts de Inteligência Artificial',
    type: 'pack',
    mediaUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    description: 'Coleção pronta com scripts Python para integração de modelos LLM em bots de atendimento.',
    category: 'IA',
    isPremium: true,
    fileSize: '14.2 MB',
    tags: ['IA', 'LLM', 'Scripts'],
    createdAt: '2026-09-07T16:00:00Z',
    viewsCount: 680,
    clicksCount: 220
  },
  {
    id: 'cnt-5',
    title: 'Funil de Vendas de Alta Conversão no Telegram',
    type: 'aula',
    mediaUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    description: 'Estratégias para converter membros gratuitos em assinantes VIP usando notificações programadas.',
    category: 'Marketing',
    isPremium: true,
    duration: '32 min',
    tags: ['Vendas', 'Marketing', 'Conversão'],
    createdAt: '2026-09-06T12:00:00Z',
    viewsCount: 1105,
    clicksCount: 512
  }
];

export const INITIAL_SCHEDULED_POSTS: ScheduledPost[] = [
  {
    id: 'sch-1',
    contentId: 'cnt-1',
    contentTitle: 'Como criar um SaaS com Python e Telegram',
    contentType: 'video',
    mediaUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
    caption: '🔥 NOVO CONTEÚDO: Aprenda a criar um SaaS lucrativo com bot de pagamento!',
    scheduledFor: '2026-09-10T19:30:00Z',
    status: 'agendada',
    target: 'channel',
    buttons: [
      { text: '▶️ VER CONTEÚDO', action: 'view' },
      { text: '⭐ CONTEÚDO PREMIUM', action: 'premium' },
      { text: '📲 INSTAGRAM', action: 'instagram' }
    ]
  },
  {
    id: 'sch-2',
    contentId: 'cnt-2',
    contentTitle: 'Automação de Agendamento com APScheduler',
    contentType: 'aula',
    mediaUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
    caption: '📸 Nova aula gratuita disponível! Descubra como agendar disparos automáticos.',
    scheduledFor: '2026-09-09T09:00:00Z',
    status: 'publicada',
    target: 'channel',
    sentAt: '2026-09-09T09:00:15Z',
    buttons: [
      { text: '▶️ ASSISTIR AGORA', action: 'view' },
      { text: '📚 MAIS AULAS', action: 'catalog' }
    ]
  },
  {
    id: 'sch-3',
    contentId: 'cnt-4',
    contentTitle: 'Pack de 20 Prompts e Scripts de Inteligência Artificial',
    contentType: 'pack',
    mediaUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    caption: '💎 ATENÇÃO MEMBROS VIP: O novo Pack de IA de Setembro já está disponível!',
    scheduledFor: '2026-09-08T15:00:00Z',
    status: 'publicada',
    target: 'vip_users',
    sentAt: '2026-09-08T15:00:02Z',
    buttons: [
      { text: '📦 BAIXAR PACK', action: 'download' }
    ]
  }
];

export const INITIAL_USERS: TelegramUser[] = [
  {
    id: 'usr-1',
    telegramId: 82917382,
    username: 'joao123',
    firstName: 'João',
    lastName: 'Silva',
    isPremium: true,
    premiumExpiresAt: '2026-10-09T00:00:00Z',
    joinedAt: '2026-08-14T11:20:00Z',
    lastInteraction: 'Agora mesmo',
    purchasesCount: 4,
    totalSpent: 194.70,
    followedInstagram: true
  },
  {
    id: 'usr-2',
    telegramId: 77481923,
    username: 'mariacode',
    firstName: 'Maria',
    lastName: 'Fernanda',
    isPremium: true,
    premiumExpiresAt: '2026-09-30T00:00:00Z',
    joinedAt: '2026-08-20T15:45:00Z',
    lastInteraction: 'Há 12 min',
    purchasesCount: 2,
    totalSpent: 67.80,
    followedInstagram: true
  },
  {
    id: 'usr-3',
    telegramId: 91823746,
    username: 'lucas_tech',
    firstName: 'Lucas',
    lastName: 'Melo',
    isPremium: false,
    joinedAt: '2026-09-02T18:10:00Z',
    lastInteraction: 'Há 1 hora',
    purchasesCount: 0,
    totalSpent: 0,
    followedInstagram: false
  },
  {
    id: 'usr-4',
    telegramId: 65498123,
    username: 'ana_dev',
    firstName: 'Ana',
    lastName: 'Costa',
    isPremium: true,
    premiumExpiresAt: '2026-11-01T00:00:00Z',
    joinedAt: '2026-07-15T09:30:00Z',
    lastInteraction: 'Há 3 horas',
    purchasesCount: 3,
    totalSpent: 144.90,
    followedInstagram: true
  },
  {
    id: 'usr-5',
    telegramId: 54129874,
    username: 'rodrigo_py',
    firstName: 'Rodrigo',
    lastName: 'Alves',
    isPremium: false,
    joinedAt: '2026-09-08T22:15:00Z',
    lastInteraction: 'Ontem',
    purchasesCount: 0,
    totalSpent: 0,
    followedInstagram: true
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1084',
    userId: 'usr-1',
    userName: 'João Silva',
    userTelegramId: 82917382,
    productId: 'prod-3',
    productName: 'Área Premium VIP',
    amount: 29.90,
    status: 'pago',
    paymentMethod: 'PIX',
    createdAt: '2026-09-09T16:20:00Z'
  },
  {
    id: 'ord-1083',
    userId: 'usr-2',
    userName: 'Maria Fernanda',
    userTelegramId: 77481923,
    productId: 'prod-2',
    productName: 'Curso Automação com Bots',
    amount: 47.90,
    status: 'pago',
    paymentMethod: 'PIX',
    createdAt: '2026-09-09T13:10:00Z'
  },
  {
    id: 'ord-1082',
    userId: 'usr-4',
    userName: 'Ana Costa',
    userTelegramId: 65498123,
    productId: 'prod-4',
    productName: 'Pack VIP Mastermind',
    amount: 97.00,
    status: 'pago',
    paymentMethod: 'Cartão',
    createdAt: '2026-09-08T19:40:00Z'
  },
  {
    id: 'ord-1081',
    userId: 'usr-3',
    userName: 'Lucas Melo',
    userTelegramId: 91823746,
    productId: 'prod-1',
    productName: 'Pack Python Pro',
    amount: 19.90,
    status: 'pendente',
    paymentMethod: 'PIX',
    createdAt: '2026-09-08T14:05:00Z',
    pixCode: '00020126580014br.gov.bcb.pix0136contentos_1081_pay520400005303986540519.905802BR5920ContentOS_Hub6009Sao_Paulo'
  }
];
