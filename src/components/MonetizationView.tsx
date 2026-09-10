import React, { useState } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  Plus, 
  ArrowUpRight, 
  ShieldCheck, 
  Tag, 
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, Order } from '../types';

interface MonetizationViewProps {
  products: Product[];
  orders: Order[];
  onApproveOrder: (orderId: string) => void;
  onAddNewProduct: (product: Partial<Product>) => void;
}

export const MonetizationView: React.FC<MonetizationViewProps> = ({
  products,
  orders,
  onApproveOrder,
  onAddNewProduct
}) => {
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdType, setNewProdType] = useState<'pack' | 'course' | 'subscription' | 'vip'>('pack');
  const [newProdDesc, setNewProdDesc] = useState('');

  const totalRevenue = orders
    .filter(o => o.status === 'pago')
    .reduce((sum, o) => sum + o.amount, 0);

  const pendingRevenue = orders
    .filter(o => o.status === 'pendente')
    .reduce((sum, o) => sum + o.amount, 0);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) return;

    onAddNewProduct({
      name: newProdName,
      price: parseFloat(newProdPrice),
      type: newProdType,
      description: newProdDesc,
      features: ['Acesso Imediato via Bot', 'Atualizações Inclusas', 'Suporte'],
      active: true,
      salesCount: 0
    });

    setIsAddProductModalOpen(false);
    setNewProdName('');
    setNewProdPrice('');
    setNewProdDesc('');
  };

  const handleApproveWithCelebration = (orderId: string) => {
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 }
    });
    onApproveOrder(orderId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>💰 MONETIZAÇÃO & PRODUTOS DIGITAIS</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure preços, planos de assinatura, packs e aprove pagamentos PIX instantaneamente.
          </p>
        </div>

        <button
          onClick={() => setIsAddProductModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-500/20 transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>+ NOVO PRODUTO</span>
        </button>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Faturamento Total Aprovado</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            R$ {totalRevenue.toFixed(2).replace('.', ',')}
          </div>
          <div className="text-[11px] text-emerald-400/80 flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Liberado automaticamente no Telegram</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">PIX Pendente de Confirmação</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            R$ {pendingRevenue.toFixed(2).replace('.', ',')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {orders.filter(o => o.status === 'pendente').length} pedidos aguardando compensação
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Ticket Médio por Venda</span>
          <div className="text-2xl font-bold text-cyan-400 mt-1">
            R$ {(totalRevenue / Math.max(1, orders.filter(o => o.status === 'pago').length)).toFixed(2).replace('.', ',')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Assinaturas recorrentes & Packs avulsos
          </div>
        </div>
      </div>

      {/* Products Catalog Grid */}
      <div>
        <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-cyan-400" />
          <span>Produtos à Venda no Bot Telegram</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div 
              key={product.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    product.type === 'subscription' 
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' 
                      : product.type === 'vip'
                        ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                        : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                  }`}>
                    {product.type}
                  </span>
                  <span className="text-emerald-400 font-medium text-[11px]">
                    {product.salesCount} vendas
                  </span>
                </div>

                <h4 className="font-bold text-sm text-white">{product.name}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{product.description}</p>

                <div className="my-3 py-2 border-y border-slate-800/80">
                  <div className="text-xl font-extrabold text-white">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                    {product.billingInterval === 'mensal' && (
                      <span className="text-xs font-normal text-slate-400"> /mês</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-1 text-xs text-slate-300">
                  {product.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-1.5 text-[11px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500">ID: {product.id}</span>
                <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">
                  Ativo no Bot
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Orders / Sales Ledger */}
      <div>
        <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <span>Histórico de Pedidos & Pagamentos PIX</span>
        </h3>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Pedido ID</th>
                  <th className="py-3 px-3">Cliente / Telegram</th>
                  <th className="py-3 px-3">Produto</th>
                  <th className="py-3 px-3">Valor</th>
                  <th className="py-3 px-3">Método</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Data</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-cyan-400 font-semibold">
                      #{order.id}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-white">{order.userName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">ID: {order.userTelegramId}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-200">
                      {order.productName}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                      R$ {order.amount.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-400">
                      {order.paymentMethod}
                    </td>
                    <td className="py-3 px-3">
                      {order.status === 'pago' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>PAGO</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          <span>AGUARDANDO PIX</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(order.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {order.status === 'pendente' ? (
                        <button
                          onClick={() => handleApproveWithCelebration(order.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                        >
                          Aprovar Pagamento
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">Acesso Liberado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Add Product */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Cadastrar Novo Produto para Venda</span>
              </h3>
              <button 
                onClick={() => setIsAddProductModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Produto:
                </label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Ex: Pack Scripts Python v2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Preço (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="29.90"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tipo:
                  </label>
                  <select
                    value={newProdType}
                    onChange={(e) => setNewProdType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="pack">Pack de Códigos</option>
                    <option value="course">Curso em Vídeo</option>
                    <option value="subscription">Assinatura Mensal VIP</option>
                    <option value="vip">Pacote VIP Mastermind</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrição Comercial:
                </label>
                <textarea
                  rows={3}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="O que o cliente recebe após o pagamento..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
