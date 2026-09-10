import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Play, 
  Image as ImageIcon, 
  BookOpen, 
  Package, 
  Crown, 
  Unlock, 
  Calendar, 
  Clock, 
  Send,
  Sparkles,
  Link,
  Film
} from 'lucide-react';
import { ContentItem, ContentType, ScheduledPost } from '../types';

interface NewContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: Partial<ContentItem>, publishMode: 'now' | 'schedule' | 'draft', scheduleDate?: string, target?: 'channel' | 'all_users' | 'vip_users') => void;
}

export const NewContentModal: React.FC<NewContentModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('Como criar um SaaS com Python');
  const [type, setType] = useState<ContentType>('video');
  const [mediaUrl, setMediaUrl] = useState('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80');
  const [description, setDescription] = useState('Aprenda a estruturar o backend em Flask, integrar banco SQLite e gerenciar assinantes no Telegram.');
  const [category, setCategory] = useState<'Python' | 'IA' | 'Automação' | 'Marketing' | 'SaaS' | 'Geral'>('SaaS');
  const [isPremium, setIsPremium] = useState(true);
  const [publishMode, setPublishMode] = useState<'now' | 'schedule'>('schedule');
  const [scheduleDate, setScheduleDate] = useState('2026-09-10');
  const [scheduleTime, setScheduleTime] = useState('19:30');
  const [duration, setDuration] = useState('25 min');
  const [target, setTarget] = useState<'channel' | 'all_users' | 'vip_users'>('channel');
  const [tagsInput, setTagsInput] = useState('Python, SaaS, Telegram');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const fullScheduleDate = publishMode === 'schedule' 
      ? new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString()
      : undefined;

    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    onSubmit(
      {
        title,
        type,
        mediaUrl: mediaUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
        description,
        category,
        isPremium,
        duration: type === 'video' || type === 'aula' ? duration : undefined,
        tags: tags.length > 0 ? tags : ['Conteúdo']
      },
      publishMode,
      fullScheduleDate,
      target
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex items-center justify-between z-10">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <span>+ Novo Conteúdo & Agendamento</span>
            </h3>
            <p className="text-xs text-slate-400">
              Cadastre no Content OS e programe a publicação automática no Telegram.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Título do Conteúdo:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Como criar um SaaS com Python"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500 transition-colors"
              required
            />
          </div>

          {/* Type & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Tipo de Conteúdo:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setType('video')}
                  className={`p-2 rounded-lg border text-center font-medium flex items-center justify-center gap-1.5 transition-all ${
                    type === 'video' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>🎥 Vídeo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('foto')}
                  className={`p-2 rounded-lg border text-center font-medium flex items-center justify-center gap-1.5 transition-all ${
                    type === 'foto' ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>📸 Foto</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('aula')}
                  className={`p-2 rounded-lg border text-center font-medium flex items-center justify-center gap-1.5 transition-all ${
                    type === 'aula' ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>📚 Aula</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('pack')}
                  className={`p-2 rounded-lg border text-center font-medium flex items-center justify-center gap-1.5 transition-all ${
                    type === 'pack' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>📦 Pack</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Categoria:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              >
                <option value="Python">Python</option>
                <option value="IA">IA</option>
                <option value="Automação">Automação</option>
                <option value="Marketing">Marketing</option>
                <option value="SaaS">SaaS</option>
                <option value="Geral">Geral</option>
              </select>

              {(type === 'video' || type === 'aula') && (
                <div className="mt-2.5">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Duração Estimada:
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Ex: 18 minutos"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Media URL / Upload input */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Arquivo / Imagem / Vídeo:</span>
              <span className="text-[11px] text-slate-500">Link direto ou upload</span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Descrição / Legenda para o Telegram:
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Aprenda a criar..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white outline-none focus:border-cyan-500 leading-relaxed"
              required
            />
          </div>

          {/* Visibility: Público vs Premium */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Visibilidade do Conteúdo:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label 
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  !isPremium ? 'bg-emerald-500/10 border-emerald-500/40 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  checked={!isPremium}
                  onChange={() => setIsPremium(false)}
                  className="text-emerald-500 focus:ring-emerald-500"
                />
                <Unlock className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-semibold text-xs">🔓 Público</div>
                  <div className="text-[10px] text-slate-400">Gratuito p/ todos os membros</div>
                </div>
              </label>

              <label 
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  isPremium ? 'bg-amber-500/10 border-amber-500/40 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  checked={isPremium}
                  onChange={() => setIsPremium(true)}
                  className="text-amber-500 focus:ring-amber-500"
                />
                <Crown className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-semibold text-xs">💎 Premium VIP</div>
                  <div className="text-[10px] text-slate-400">Apenas assinantes / Compradores</div>
                </div>
              </label>
            </div>
          </div>

          {/* Publishing Mode: Agora vs Agendar */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block font-semibold text-slate-300 mb-1.5">
              Momento da Publicação:
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <label 
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  publishMode === 'now' ? 'bg-cyan-500/10 border-cyan-500/40 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="publishMode"
                  checked={publishMode === 'now'}
                  onChange={() => setPublishMode('now')}
                  className="text-cyan-500 focus:ring-cyan-500"
                />
                <Send className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="font-semibold text-xs">○ Publicar Agora</div>
                  <div className="text-[10px] text-slate-400">Disparo imediato no Telegram</div>
                </div>
              </label>

              <label 
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  publishMode === 'schedule' ? 'bg-purple-500/10 border-purple-500/40 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="publishMode"
                  checked={publishMode === 'schedule'}
                  onChange={() => setPublishMode('schedule')}
                  className="text-purple-500 focus:ring-purple-500"
                />
                <Calendar className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="font-semibold text-xs">● Agendar com Worker</div>
                  <div className="text-[10px] text-slate-400">Disparar no dia e horário escolhidos</div>
                </div>
              </label>
            </div>

            {publishMode === 'schedule' && (
              <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Data:
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Horário:
                  </label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {publishMode === 'now' ? (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>PUBLICAR AGORA NO TELEGRAM</span>
                </>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>AGENDAR PUBLICAÇÃO</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
