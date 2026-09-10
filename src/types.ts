export type ContentType = 'foto' | 'video' | 'aula' | 'pack';

export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  mediaUrl: string;
  description: string;
  category: 'Python' | 'IA' | 'Automação' | 'Marketing' | 'SaaS' | 'Geral';
  isPremium: boolean;
  duration?: string;
  fileSize?: string;
  tags: string[];
  createdAt: string;
  viewsCount: number;
  clicksCount: number;
}

export interface ScheduledPost {
  id: string;
  contentId: string;
  contentTitle: string;
  contentType: ContentType;
  mediaUrl: string;
  caption: string;
  scheduledFor: string; // ISO or human string
  status: 'agendada' | 'publicada' | 'falha';
  target: 'channel' | 'all_users' | 'vip_users';
  buttons: Array<{ text: string; action: string }>;
  sentAt?: string;
}

export interface TelegramUser {
  id: string;
  telegramId: number;
  username: string;
  firstName: string;
  lastName?: string;
  isPremium: boolean;
  premiumExpiresAt?: string;
  joinedAt: string;
  lastInteraction: string;
  purchasesCount: number;
  totalSpent: number;
  followedInstagram?: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  type: 'pack' | 'course' | 'subscription' | 'vip';
  billingInterval?: 'mensal' | 'anual' | 'único';
  description: string;
  features: string[];
  active: boolean;
  salesCount: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userTelegramId: number;
  productId: string;
  productName: string;
  amount: number;
  status: 'pago' | 'pendente' | 'cancelado';
  paymentMethod: 'PIX' | 'Cartão' | 'Cripto';
  createdAt: string;
  pixCode?: string;
}

export interface BotSettings {
  botName: string;
  botUsername: string;
  welcomeText: string;
  instagramHandle: string;
  instagramUrl: string;
  supportUsername: string;
  telegramToken: string;
  telegramChannelId: string;
  autoRegister: boolean;
}

export interface ChatInlineButton {
  text: string;
  callbackData?: string;
  url?: string;
}

export interface TelegramChatMessage {
  id: string;
  sender: 'bot' | 'user' | 'system';
  text?: string;
  media?: {
    type: 'photo' | 'video' | 'document';
    url: string;
    caption?: string;
    duration?: string;
  };
  inlineKeyboard?: ChatInlineButton[][];
  timestamp: string;
  isPaywall?: boolean;
}
