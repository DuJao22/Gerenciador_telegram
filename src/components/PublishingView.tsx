import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  RefreshCw, 
  Radio, 
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles
} from 'lucide-react';
import { ScheduledPost, ContentItem } from '../types';

interface PublishingViewProps {
  scheduledPosts: ScheduledPost[];
  contents: ContentItem[];
  onOpenNewContentModal: () => void;
  onDispatchPostNow: (postId: string) => void;
  onRetryPost: (postId: string) => void;
}

export const PublishingView: React.FC<PublishingViewProps> = ({
  scheduledPosts,
  contents,
  onOpenNewContentModal,
  onDispatchPostNow,
  onRetryPost
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'agendada' | 'publicada' | 'falha'>('all');

  const filteredPosts = scheduledPosts.filter(p => {
    if (activeTab === 'all') return true;
    return p.status === activeTab;
  });

  const pendingCount = scheduledPosts.filter(p => p.status === 'agendada').length;
  const publishedCount = scheduledPosts.filter(p => p.status === 'publicada').length;
  const failureCount = scheduledPosts.filter(p => p.status === 'falha').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>📅 AGENDAMENTO & PUBLISHING</span>
            <span className="text-xs font-normal text-slate-400">({scheduledPosts.length} programações)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Agendamentos automáticos acionados via APScheduler para disparos no Telegram.
          </p>
        </div>

        <button
          onClick={onOpenNewContentModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>+ AGENDAR NOVA PUBLICAÇÃO</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-xs font-medium">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'all' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Todas ({scheduledPosts.length})
        </button>
        <button
          onClick={() => setActiveTab('agendada')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'agendada' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Agendadas ({pendingCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('publicada')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'publicada' ? 'bg-emerald-600 text-white shadow' : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Publicadas com Sucesso ({publishedCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('falha')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'falha' ? 'bg-rose-600 text-white shadow' : 'text-rose-400 hover:text-rose-300 hover:bg-slate-800'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Falhas ({failureCount})</span>
        </button>
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
          >
            <div className="flex items-start gap-3.5">
              <img
                src={post.mediaUrl}
                alt={post.contentTitle}
                className="w-20 h-20 rounded-xl object-cover border border-slate-800 shrink-0"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm text-white">{post.contentTitle}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    post.status === 'agendada'
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      : post.status === 'publicada'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {post.status}
                  </span>
                  <span className="text-[11px] text-cyan-400 bg-slate-950 px-2 py-0.5 rounded font-mono border border-slate-800">
                    Destino: {post.target === 'channel' ? '📢 Canal Oficial' : '💎 Grupo VIP'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 italic font-mono bg-slate-950/60 p-2 rounded border border-slate-800/60">
                  "{post.caption}"
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      Data Programada: <b>{new Date(post.scheduledFor).toLocaleString('pt-BR')}</b>
                    </span>
                  </div>
                  {post.sentAt && (
                    <div className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Enviado às {new Date(post.sentAt).toLocaleTimeString('pt-BR')}</span>
                    </div>
                  )}
                </div>

                {/* Inline buttons attached */}
                {post.buttons.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500">Botões no post:</span>
                    {post.buttons.map((btn, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {btn.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              {post.status === 'agendada' && (
                <button
                  onClick={() => onDispatchPostNow(post.id)}
                  className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publicar no Telegram Agora</span>
                </button>
              )}

              {post.status === 'falha' && (
                <button
                  onClick={() => onRetryPost(post.id)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tentar Novamente</span>
                </button>
              )}

              {post.status === 'publicada' && (
                <div className="text-right">
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Disparo Concluído</span>
                  </span>
                  <span className="text-[10px] text-slate-500 block">Telegram Bot API v7</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredPosts.length === 0 && (
          <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-medium">Nenhuma publicação encontrada para este status.</p>
          </div>
        )}
      </div>
    </div>
  );
};
