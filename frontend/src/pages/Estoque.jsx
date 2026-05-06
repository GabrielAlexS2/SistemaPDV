// Tela de Estoque - listagem, edição e cadastro de produtos
import { useState, useEffect } from 'react';
import api from '../services/api';
import db from '../db/database';
import toast from 'react-hot-toast';
import {
  Package, Plus, Search, Edit2, Trash2, X, Save,
  AlertTriangle, Barcode, Camera
} from 'lucide-react';
import BarcodeScanner from '../components/BarcodeScanner';

// Modal de cadastro/edição de produto
const ModalProduto = ({ produto, onSalvar, onFechar }) => {
  const [form, setForm] = useState({
    nome: produto?.nome || '',
    codigoBarras: produto?.codigoBarras || '',
    preco: produto?.preco?.toString() || '',
    precoCusto: produto?.precoCusto?.toString() || '',
    quantidade: produto?.quantidade?.toString() || '0',
    estoqueMinimo: produto?.estoqueMinimo?.toString() || '5'
  });
  const [salvando, setSalvando] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.preco) return;

    setSalvando(true);
    try {
      const dados = {
        nome: form.nome,
        codigoBarras: form.codigoBarras || null,
        preco: parseFloat(form.preco),
        precoCusto: form.precoCusto ? parseFloat(form.precoCusto) : null,
        quantidade: parseInt(form.quantidade) || 0,
        estoqueMinimo: form.estoqueMinimo ? parseInt(form.estoqueMinimo) : 5
      };

      if (produto?.id) {
        const { data } = await api.put(`/produtos/${produto.id}`, dados);
        onSalvar(data, 'editar');
      } else {
        const { data } = await api.post('/produtos', dados);
        onSalvar(data, 'criar');
      }
    } catch (erro) {
      toast.error(erro.response?.data?.erro || 'Erro ao salvar produto');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-xl">
            {produto?.id ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button onClick={onFechar} className="text-slate-400 hover:text-white transition-colors">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome *</label>
            <input
              type="text"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Arroz 5kg"
              required
              autoFocus
              className="w-full bg-slate-900 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              <Barcode size={14} className="inline mr-1" />
              Código de Barras
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.codigoBarras}
                onChange={e => setForm(f => ({ ...f, codigoBarras: e.target.value }))}
                placeholder="Opcional - escanear ou digitar"
                className="flex-1 w-full bg-slate-900 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
              />
              <button 
                type="button" 
                onClick={() => setShowScanner(true)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 rounded-xl flex items-center justify-center transition-colors"
                title="Escanear com a câmera"
              >
                <Camera size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Preço (R$) *</label>
              <input
                type="number"
                inputMode="decimal"
                value={form.preco}
                onChange={e => setForm(f => ({ ...f, preco: e.target.value }))}
                placeholder="0,00"
                step="0.01"
                min="0"
                required
                className="w-full bg-slate-900 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Preço Custo (R$)</label>
              <input
                type="number"
                inputMode="decimal"
                value={form.precoCusto}
                onChange={e => setForm(f => ({ ...f, precoCusto: e.target.value }))}
                placeholder="0,00"
                step="0.01"
                min="0"
                className="w-full bg-slate-900 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Estoque (un)</label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.quantidade}
                onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))}
                placeholder="0"
                min="0"
                className="w-full bg-slate-900 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Estoque Min.</label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.estoqueMinimo}
                onChange={e => setForm(f => ({ ...f, estoqueMinimo: e.target.value }))}
                placeholder="5"
                min="0"
                className="w-full bg-slate-900 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onFechar}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2">
              <Save size={16} />
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>

      {showScanner && (
        <BarcodeScanner 
          onScan={(code) => {
            setForm(f => ({ ...f, codigoBarras: code }));
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

// Tela principal de Estoque
const Estoque = () => {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);

  const carregarProdutos = async () => {
    try {
      const { data } = await api.get('/produtos', { params: { busca } });
      setProdutos(data);
      // Sincronizar com IndexedDB para modo offline
      await db.produtos.clear();
      await db.produtos.bulkPut(data);
    } catch {
      // Offline - carregar do IndexedDB
      const local = await db.produtos.toArray();
      setProdutos(local);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  // Busca com debounce
  useEffect(() => {
    const timer = setTimeout(() => carregarProdutos(), 400);
    return () => clearTimeout(timer);
  }, [busca]);

  const handleSalvar = (produto, acao) => {
    if (acao === 'criar') {
      setProdutos(prev => [produto, ...prev]);
      toast.success('✅ Produto cadastrado!');
    } else {
      setProdutos(prev => prev.map(p => p.id === produto.id ? produto : p));
      toast.success('✅ Produto atualizado!');
    }
    setModalAberto(false);
    setProdutoEditando(null);
  };

  const handleExcluir = async (id) => {
    if (!confirm('Excluir este produto?')) return;
    try {
      await api.delete(`/produtos/${id}`);
      setProdutos(prev => prev.filter(p => p.id !== id));
      toast.success('Produto excluído');
    } catch {
      toast.error('Erro ao excluir produto');
    }
  };

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (p.codigoBarras && p.codigoBarras.includes(busca))
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Package className="text-blue-400" size={26} />
              Estoque
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">{produtos.length} produto{produtos.length !== 1 ? 's' : ''} cadastrado{produtos.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => { setProdutoEditando(null); setModalAberto(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-4 py-2.5 rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/20"
          >
            <Plus size={18} />
            Novo Produto
          </button>
        </div>

        {/* Busca */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome ou código de barras..."
            className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {carregando ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <Package size={48} className="mb-3 opacity-20" />
            <p>Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {produtosFiltrados.map((produto) => (
              <div
                key={produto.id}
                className="bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl p-4 flex items-center gap-4 transition-all group animate-fade-in"
              >
                {/* Indicador de estoque baixo */}
                <div className={`w-2 h-10 rounded-full shrink-0 ${
                  produto.quantidade <= 0 ? 'bg-red-500' :
                  produto.quantidade <= (produto.estoqueMinimo || 5) ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />

                {/* Info do produto */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{produto.nome}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {produto.codigoBarras && (
                      <span className="text-xs text-slate-500 font-mono">{produto.codigoBarras}</span>
                    )}
                    {produto.quantidade <= (produto.estoqueMinimo || 5) && produto.quantidade > 0 && (
                      <span className="flex items-center gap-1 text-xs text-amber-400">
                        <AlertTriangle size={11} /> Estoque baixo
                      </span>
                    )}
                    {produto.quantidade === 0 && (
                      <span className="text-xs text-red-400">⚠️ Sem estoque</span>
                    )}
                  </div>
                </div>

                {/* Preço e quantidade */}
                <div className="text-right shrink-0">
                  <p className="text-emerald-400 font-bold text-lg">
                    R$ {produto.preco.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-slate-400 text-sm">{produto.quantidade} un.</p>
                </div>

                {/* Ações */}
                <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setProdutoEditando(produto); setModalAberto(true); }}
                    className="w-8 h-8 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 flex items-center justify-center transition-all"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleExcluir(produto.id)}
                    className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <ModalProduto
          produto={produtoEditando}
          onSalvar={handleSalvar}
          onFechar={() => { setModalAberto(false); setProdutoEditando(null); }}
        />
      )}
    </div>
  );
};

export default Estoque;
