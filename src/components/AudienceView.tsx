import React, { useState } from 'react';
import { 
  Users, 
  Crown, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Clock, 
  DollarSign, 
  MessageSquare, 
  ShieldCheck,
  Send,
  UserCheck,
  ExternalLink,
  Instagram
} from 'lucide-react';
import { TelegramUser } from '../types';

interface AudienceViewProps {
  users: TelegramUser[];
  onTogglePremium: (userId: string) => void;
  onSendDirectMessage: (user: TelegramUser, messageText: string) => void;
}

export const AudienceView: React.FC<AudienceViewProps> = ({
  users,
  onTogglePremium,
  onSendDirectMessage
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'premium' | 'free'>('all');
  const [search, setSearch] = useState('');
  const [selectedUserForMessage, setSelectedUserForMessage] = useState<TelegramUser | null>(null);
  const [directMsgText, setDirectMsgText] = useState('');

  const filteredUsers = users.filter(u => {
    if (filterMode === 'premium' && !u.isPremium) return false;
    if (filterMode === 'free' && u.isPremium) return false;

    const term = search.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term) ||
      u.telegramId.toString().includes(term)
    );
  });

  const totalUsers = users.length;
  const premiumCount = users.filter(u => u.isPremium).length;
  const freeCount = totalUsers - premiumCount;

  const handleSendDM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForMessage || !directMsgText.trim()) return;

    onSendDirectMessage(selectedUserForMessage, directMsgText);
    setSelectedUserForMessage(null);
    setDirectMsgText('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>👥 AUDIENCE & CRM DO TELEGRAM</span>
            <span className="text-xs font-normal text-slate-400">({totalUsers} membros cadastrados)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Membros registrados automaticamente pelo comando <code>/start</code> no Telegram Bot.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            Total: <b>{totalUsers}</b>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            💎 VIP: <b>{premiumCount}</b>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
            🆓 Free: <b>{freeCount}</b>
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1 text-xs font-medium">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterMode === 'all' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Todos ({totalUsers})
          </button>
          <button
            onClick={() => setFilterMode('premium')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              filterMode === 'premium' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Premium ({premiumCount})</span>
          </button>
          <button
            onClick={() => setFilterMode('free')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterMode === 'free' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Gratuitos ({freeCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por ID, @username ou nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-slate-500 outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* CRM Users Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-3">Telegram ID</th>
                <th className="py-3 px-3">Data de Entrada</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Compras</th>
                <th className="py-3 px-3">Total Gasto</th>
                <th className="py-3 px-3">Última Interação</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-850/50 transition-colors">
                  {/* User info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-xs border border-slate-700">
                        {user.firstName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{user.firstName} {user.lastName || ''}</span>
                          {user.followedInstagram && (
                            <span title="Confirmou seguir Instagram" className="text-pink-400">
                              <Instagram className="w-3 h-3 inline" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-cyan-400 font-mono">@{user.username}</div>
                      </div>
                    </div>
                  </td>

                  {/* Telegram ID */}
                  <td className="py-3.5 px-3 font-mono text-slate-400">
                    <code>{user.telegramId}</code>
                  </td>

                  {/* Joined Date */}
                  <td className="py-3.5 px-3 text-slate-400">
                    {new Date(user.joinedAt).toLocaleDateString('pt-BR')}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-3">
                    {user.isPremium ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        <Crown className="w-3 h-3" />
                        <span>PREMIUM</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                        <span>Gratuito</span>
                      </span>
                    )}
                  </td>

                  {/* Purchases Count */}
                  <td className="py-3.5 px-3">
                    <span className="font-medium text-white">{user.purchasesCount}</span>
                    <span className="text-[10px] text-slate-500 ml-1">itens</span>
                  </td>

                  {/* Total spent */}
                  <td className="py-3.5 px-3 font-mono text-emerald-400 font-semibold">
                    R$ {user.totalSpent.toFixed(2).replace('.', ',')}
                  </td>

                  {/* Last interaction */}
                  <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-500" />
                      {user.lastInteraction}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onTogglePremium(user.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                          user.isPremium
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20'
                            : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20'
                        }`}
                        title={user.isPremium ? 'Revogar Premium' : 'Tornar Membro VIP'}
                      >
                        {user.isPremium ? 'Revogar VIP' : '+ Conceder VIP'}
                      </button>

                      <button
                        onClick={() => setSelectedUserForMessage(user)}
                        className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                        title="Enviar mensagem direta via Bot"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Direct Message Modal */}
      {selectedUserForMessage && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-cyan-400" />
                  <span>Enviar Mensagem Direta (Telegram Push)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Para: <b>{selectedUserForMessage.firstName}</b> (@{selectedUserForMessage.username})
                </p>
              </div>
              <button 
                onClick={() => setSelectedUserForMessage(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendDM} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Texto da Mensagem:
                </label>
                <textarea
                  rows={4}
                  value={directMsgText}
                  onChange={(e) => setDirectMsgText(e.target.value)}
                  placeholder="Ex: Olá João! Notamos seu interesse na aula de Python. Preparamos um cupom especial de 20% para você: CUPOMVIP20..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForMessage(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar via Bot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
