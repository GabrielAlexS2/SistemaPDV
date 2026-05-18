// Store do PDV (Caixa) - gerencia o carrinho de compras e sincronização
import { create } from 'zustand';
import api from '../services/api';
import db from '../db/database';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

let socket = null;

const usePdvStore = create((set, get) => ({
  carrinho: [],            // Itens no carrinho
  total: 0,               // Total calculado
  processando: false,     // Aguardando finalização
  vendaPendentes: 0,      // Quantidade de vendas offline pendentes
  isSocketConnected: false, // Status do espelhamento

  // Inicializar conexão WebSocket
  initSocket: () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (socket) socket.disconnect();

    // Em produção, usa a origem atual (ex: http://192.168.1.5:3001). Em dev usa a porta 3001
    const socketUrl = import.meta.env.PROD 
      ? window.location.origin 
      : `http://${window.location.hostname}:3001`;

    socket = io(socketUrl, {
      auth: { token }
    });

    socket.on('connect', () => {
      set({ isSocketConnected: true });
      socket.emit('request_sync');
    });

    socket.on('disconnect', () => {
      set({ isSocketConnected: false });
    });

    socket.on('sync_cart', (dadosCarrinho) => {
      set({
        carrinho: dadosCarrinho.carrinho,
        total: dadosCarrinho.total
      });
    });

    socket.on('send_current_cart', () => {
      const { carrinho, total } = get();
      if (carrinho.length > 0) {
        socket.emit('cart_update', { carrinho, total });
      }
    });
  },

  // Helper interno para avisar outros aparelhos
  _broadcast: (carrinho, total) => {
    if (socket && socket.connected) {
      socket.emit('cart_update', { carrinho, total });
    }
  },

  // Calcular total do carrinho
  calcularTotal: () => {
    const carrinho = get().carrinho;
    const total = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
    set({ total });
  },

  // Buscar produto por código de barras (online/offline)
  buscarProduto: async (codigo) => {
    try {
      const { data } = await api.get(`/produtos/barcode/${codigo}`);
      return data;
    } catch {
      const produtoLocal = await db.produtos.where('codigoBarras').equals(codigo).first();
      return produtoLocal || null;
    }
  },

  // Adicionar produto ao carrinho
  adicionarItem: (produto) => {
    set((state) => {
      const existente = state.carrinho.find(i => i.id === produto.id);
      let novoCarrinho;

      if (existente) {
        novoCarrinho = state.carrinho.map(i =>
          i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
        );
      } else {
        novoCarrinho = [...state.carrinho, { ...produto, quantidade: 1 }];
      }

      const total = novoCarrinho.reduce((acc, i) => acc + (i.preco * i.quantidade), 0);
      get()._broadcast(novoCarrinho, total);
      return { carrinho: novoCarrinho, total };
    });
  },

  // Remover item do carrinho
  removerItem: (produtoId) => {
    set((state) => {
      const novoCarrinho = state.carrinho.filter(i => i.id !== produtoId);
      const total = novoCarrinho.reduce((acc, i) => acc + (i.preco * i.quantidade), 0);
      get()._broadcast(novoCarrinho, total);
      return { carrinho: novoCarrinho, total };
    });
  },

  // Alterar quantidade de um item
  alterarQuantidade: (produtoId, quantidade) => {
    if (quantidade <= 0) {
      get().removerItem(produtoId);
      return;
    }
    set((state) => {
      const novoCarrinho = state.carrinho.map(i =>
        i.id === produtoId ? { ...i, quantidade } : i
      );
      const total = novoCarrinho.reduce((acc, i) => acc + (i.preco * i.quantidade), 0);
      get()._broadcast(novoCarrinho, total);
      return { carrinho: novoCarrinho, total };
    });
  },

  // Limpar carrinho
  limparCarrinho: () => {
    set({ carrinho: [], total: 0 });
    get()._broadcast([], 0);
  },

  // Finalizar venda (online ou offline)
  finalizarVenda: async (tipoPagamento = 'dinheiro') => {
    const { carrinho, total } = get();
    if (carrinho.length === 0) return;

    set({ processando: true });

    const itens = carrinho.map(i => ({
      produtoId: i.id,
      quantidade: i.quantidade,
      precoUnitario: i.preco
    }));

    try {
      await api.post('/vendas', { itens, tipoPagamento });
      set({ carrinho: [], total: 0, processando: false });
      get()._broadcast([], 0);
      toast.success('✅ Venda finalizada com sucesso!');
    } catch {
      await db.vendasPendentes.add({
        itens,
        total,
        tipoPagamento,
        criadaEm: new Date().toISOString()
      });

      const pendentes = await db.vendasPendentes.count();
      set({ carrinho: [], total: 0, processando: false, vendaPendentes: pendentes });
      get()._broadcast([], 0);
      toast.success(`📴 Venda salva offline! (${pendentes} pendente${pendentes > 1 ? 's' : ''})`);
    }
  },

  // Sincronizar vendas pendentes quando voltar online
  sincronizarVendas: async () => {
    const pendentes = await db.vendasPendentes.toArray();
    if (pendentes.length === 0) return;

    let sincronizadas = 0;
    for (const venda of pendentes) {
      try {
        await api.post('/vendas', { itens: venda.itens, tipoPagamento: venda.tipoPagamento || 'dinheiro' });
        await db.vendasPendentes.delete(venda.id);
        sincronizadas++;
      } catch {
        break; // Para na primeira falha
      }
    }

    if (sincronizadas > 0) {
      const restantes = await db.vendasPendentes.count();
      set({ vendaPendentes: restantes });
      toast.success(`🔄 ${sincronizadas} venda${sincronizadas > 1 ? 's' : ''} sincronizada${sincronizadas > 1 ? 's' : ''}!`);
    }
  },

  // Carregar contagem de pendentes ao iniciar
  carregarPendentes: async () => {
    const count = await db.vendasPendentes.count();
    set({ vendaPendentes: count });
  }
}));

export default usePdvStore;
