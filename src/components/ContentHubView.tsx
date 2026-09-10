import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Play, 
  Image as ImageIcon, 
  BookOpen, 
  Package, 
  Crown, 
  Lock, 
  Unlock, 
  Send, 
  Calendar, 
  Clock, 
  Trash2, 
  ExternalLink,
  Tag,
  Check
} from 'lucide-react';
import { ContentItem, ContentType } from '../types';

interface ContentHubViewProps {
  contents: ContentItem[];
  onOpenNewContentModal: () => void;
  onDispatchImmediate: (content: ContentItem) => void;
  onDeleteContent: (contentId: string) => void;
}

export const ContentHubView: React.FC<ContentHubViewProps> = ({
  contents,
  onOpenNewContentModal,
  onDispatchImmediate,
  onDeleteContent
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContents = contents.filter(item => {
    const matchesType = selectedType === 'all' 
      ? true 
      : selectedType === 'premium' 
        ? item.isPremium 
        : item.type === selectedType;

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesCategory && matchesSearch;
  });

  const categories = ['Python', 'IA', 'Automação', 'Marketing', 'SaaS'];

  const getTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'video': return <Play className="w-3.5 h-3.5 text-cyan-400" />;
      case 'foto': return <ImageIcon className="w-3.5 h-3.5 text-purple-400" />;
      case 'aula': return <BookOpen className="w-3.5 h-3.5 text-blue-400" />;
      case 'pack': return <Package className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>📚 CONTENT HUB & BIBLIOTECA</span>
            <span className="text-xs font-normal text-slate-400">({contents.length} itens cadastrados)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie fotos, vídeos, aulas completas e packs digitais distribuídos pelo Bot Telegram.
          </p>
        </div>

        <button
          onClick={onOpenNewContentModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>+ NOVO CONTEÚDO</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        {/* Type tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs font-medium">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
              selectedType === 'all' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Todos ({contents.length})
          </button>
          <button
            onClick={() => setSelectedType('foto')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
              selectedType === 'foto' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>📸 Fotos</span>
          </button>
          <button
            onClick={() => setSelectedType('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
              selectedType === 'video' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>🎥 Vídeos</span>
          </button>
          <button
            onClick={() => setSelectedType('aula')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
              selectedType === 'aula' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>📚 Aulas</span>
          </button>
          <button
            onClick={() => setSelectedType('pack')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
              selectedType === 'pack' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>📦 Packs</span>
          </button>
          <button
            onClick={() => setSelectedType('premium')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
              selectedType === 'premium' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>💎 Premium</span>
          </button>
        </div>

        {/* Search input and category filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar título..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-slate-500 outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-300 outline-none focus:border-cyan-500"
          >
            <option value="all">Todas Categorias</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContents.map((item) => (
          <div 
            key={item.id}
            className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden flex flex-col justify-between transition-all group"
          >
            <div>
              {/* Media Thumbnail */}
              <div className="relative aspect-video bg-slate-950 overflow-hidden">
                <img 
                  src={item.mediaUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Badges on top */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="bg-slate-950/80 backdrop-blur-md border border-slate-700/60 px-2 py-0.5 rounded text-[10px] font-semibold text-white uppercase flex items-center gap-1">
                    {getTypeIcon(item.type)}
                    <span>{item.type}</span>
                  </span>
                  <span className="bg-slate-950/80 backdrop-blur-md border border-slate-700/60 px-2 py-0.5 rounded text-[10px] font-medium text-cyan-400">
                    {item.category}
                  </span>
                </div>

                <div className="absolute top-2.5 right-2.5">
                  {item.isPremium ? (
                    <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                      <Crown className="w-3 h-3" />
                      <span>PREMIUM</span>
                    </span>
                  ) : (
                    <span className="bg-emerald-600/90 text-white font-medium text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Unlock className="w-3 h-3" />
                      <span>PÚBLICO</span>
                    </span>
                  )}
                </div>

                {item.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-white font-mono">
                    ⏱ {item.duration}
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-4">
                <h3 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Tags */}
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {item.tags.map(tag => (
                    <span key={tag} className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="px-4 py-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="text-[11px] text-slate-400">
                <span>{item.viewsCount} visualizações</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onDispatchImmediate(item)}
                  title="Disparar publicação no Telegram agora"
                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>Disparar</span>
                </button>

                <button
                  onClick={() => onDeleteContent(item.id)}
                  title="Excluir conteúdo"
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredContents.length === 0 && (
        <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
          <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-medium">Nenhum conteúdo encontrado para estes filtros.</p>
          <button
            onClick={onOpenNewContentModal}
            className="mt-3 px-3 py-1.5 bg-cyan-600 text-white text-xs rounded-lg font-medium"
          >
            Cadastrar Novo Conteúdo
          </button>
        </div>
      )}
    </div>
  );
};
