// Tela de PDV (Caixa) - tela principal do sistema
// Input sempre focado para leitura de código de barras via leitor USB
import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../services/api';
import usePdvStore from '../store/pdvStore';
import db from '../db/database';
import toast from 'react-hot-toast';
import {
  Barcode, ShoppingCart, Trash2, Plus, Minus,
  CheckCircle, WifiOff, RefreshCw, Search, Banknote, QrCode, X, Camera
} from 'lucide-react';
import BarcodeScanner from '../components/BarcodeScanner';

const PDV = () => {
  const [codigo, setCodigo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [ultimoBuscado, setUltimoBuscado] = useState(null);
  const [erroBarcode, setErroBarcode] = useState('');
  const [modalPagamento, setModalPagamento] = useState(false);
  const [etapaPagamento, setEtapaPagamento] = useState('selecao'); // selecao, dinheiro
  const [precisaTroco, setPrecisaTroco] = useState(null);
  const [valorRecebido, setValorRecebido] = useState('');
  const [qrCodeMP, setQrCodeMP] = useState(null);
  const [gerandoQrCode, setGerandoQrCode] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const inputRef = useRef(null);

  const resetModal = () => {
    setModalPagamento(false);
    setEtapaPagamento('selecao');
    setPrecisaTroco(null);
    setValorRecebido('');
    setQrCodeMP(null);
  };

  const {
    carrinho, total, processando, vendaPendentes,
    buscarProduto, adicionarItem, removerItem, alterarQuantidade, finalizarVenda
  } = usePdvStore();

  // Manter o input sempre focado (fundamental para leitor USB)
  const focarInput = useCallback(() => {
    if (modalPagamento) return;
    if (inputRef.current) inputRef.current.focus();
  }, [modalPagamento]);

  useEffect(() => {
    focarInput();
    // Focar novamente se o usuário clicar fora
    document.addEventListener('click', focarInput);
    
    // Solicitar permissão para notificações (estoque baixo)
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    
    return () => document.removeEventListener('click', focarInput);
  }, [focarInput]);

  // Processar busca de código
  const processarCodigo = async (codigoBuscado) => {
    if (!codigoBuscado || buscando) return;

    setBuscando(true);
    setErroBarcode('');

    const produto = await buscarProduto(codigoBuscado);

    if (produto) {
      if (navigator.vibrate) navigator.vibrate(100); // Vibração ao bipar produto
      
      adicionarItem(produto);
      setUltimoBuscado(produto.nome);
      setTimeout(() => setUltimoBuscado(null), 2000);
      
      // Notificação de estoque baixo
      if (produto.quantidade_estoque <= produto.estoque_minimo && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Estoque Baixo', {
          body: `O produto "${produto.nome}" está acabando! Restam ${produto.quantidade_estoque} unidades.`,
          icon: '/pwa-192x192.png'
        });
      }
    } else {
      if (navigator.vibrate) navigator.vibrate([300, 100, 300]); // Vibração de erro
      setErroBarcode(`Código "${codigoBuscado}" não encontrado`);
      setTimeout(() => setErroBarcode(''), 3000);
    }

    setCodigo('');
    setBuscando(false);
    focarInput();
  };

  // Buscar produto ao pressionar Enter
  const handleBarcode = async (e) => {
    e.preventDefault();
    processarCodigo(codigo.trim());
  };

  // Finalizar venda com F12 no teclado (atalho)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F12') {
        e.preventDefault();
        if (carrinho.length > 0 && !processando && !modalPagamento) {
          setEtapaPagamento('selecao');
          setModalPagamento(true);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [carrinho, processando, modalPagamento]);

  // Verificação automática de pagamento PIX (Polling)
  useEffect(() => {
    let intervalo;
    if (qrCodeMP && !qrCodeMP.error && qrCodeMP.pagamentoId) {
      intervalo = setInterval(async () => {
        try {
          const { data } = await api.get(`/mercadopago/status/${qrCodeMP.pagamentoId}`);
          if (data.status === 'approved') {
            clearInterval(intervalo);
            toast.success('✅ Pagamento PIX aprovado automaticamente!');
            finalizarVenda('mercado_pago');
            resetModal();
          }
        } catch (error) {
          console.error('Erro ao verificar status do PIX:', error);
        }
      }, 3000); // Verifica a cada 3 segundos
    }

    return () => clearInterval(intervalo);
  }, [qrCodeMP, finalizarVenda]);

  const isOnline = navigator.onLine;

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-900 overflow-hidden">
      {/* Header do PDV */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <ShoppingCart size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">Caixa</h1>
            <p className="text-slate-400 text-xs hidden sm:block">PDV — Ponto de Venda</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {vendaPendentes > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full text-xs font-medium border border-amber-500/30">
              <WifiOff size={12} />
              {vendaPendentes} pendente{vendaPendentes > 1 ? 's' : ''}
            </div>
          )}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
            isOnline
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-red-500/20 text-red-400 border-red-500/30'
          }`}>
            {isOnline ? '🌐 Online' : '📴 Offline'}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Coluna Esquerda - Input de barcode + Lista de itens */}
        <div className="flex-1 flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-700">

          {/* Campo de código de barras */}
          <div className="p-4 bg-slate-800/50 border-b border-slate-700 shrink-0">
            <form onSubmit={handleBarcode} className="flex gap-2">
              <div className="relative flex-1">
                <Barcode size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoFocus
                  disabled={modalPagamento}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Escaneie ou digite o código de barras..."
                  className="w-full bg-slate-900 border-2 border-slate-600 focus:border-emerald-500 text-white text-lg placeholder-slate-500 rounded-xl pl-10 pr-24 py-3.5 focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={buscando || !codigo.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-1.5"
                >
                  {buscando ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                  Buscar
                </button>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowScanner(true); }}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-sm"
                title="Escanear com a câmera"
              >
                <Camera size={24} />
              </button>
            </form>

            {/* Feedback de busca */}
            {ultimoBuscado && (
              <div className="mt-2 flex items-center gap-2 text-emerald-400 text-sm animate-fade-in">
                <CheckCircle size={14} />
                <span>✅ {ultimoBuscado} adicionado!</span>
              </div>
            )}
            {erroBarcode && (
              <div className="mt-2 text-red-400 text-sm animate-fade-in">
                ⚠️ {erroBarcode}
              </div>
            )}
          </div>

          {/* Lista de itens no carrinho */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {carrinho.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <ShoppingCart size={64} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">Carrinho vazio</p>
                <p className="text-sm mt-1">Escaneie um produto para começar</p>
                <p className="text-xs mt-4 text-slate-600">F12 = Finalizar Venda</p>
              </div>
            ) : (
              carrinho.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-center gap-3 animate-slide-up"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  {/* Número do item */}
                  <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-xs text-slate-400 font-mono shrink-0">
                    {idx + 1}
                  </div>

                  {/* Nome e preço */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{item.nome}</p>
                    <p className="text-slate-400 text-xs">
                      R$ {item.preco.toFixed(2)} × {item.quantidade} =
                      <span className="text-emerald-400 font-medium ml-1">
                        R$ {(item.preco * item.quantidade).toFixed(2)}
                      </span>
                    </p>
                  </div>

                  {/* Controles de quantidade */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}
                      className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-white font-semibold text-sm">
                      {item.quantidade}
                    </span>
                    <button
                      onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
                      className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Remover */}
                  <button
                    onClick={() => removerItem(item.id)}
                    className="w-8 h-8 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Coluna Direita - Total e finalizar */}
        <div className="w-full lg:w-72 flex flex-col bg-slate-800/50 shrink-0 max-h-[40vh] lg:max-h-full">
          <div className="p-4 flex-1 overflow-y-auto">
            <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2 lg:mb-4 hidden lg:block">
              Resumo da Venda
            </h2>

            {/* Contagens */}
            <div className="space-y-1 lg:space-y-3 mb-2 lg:mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Itens diferentes</span>
                <span className="text-white font-medium">{carrinho.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total de unidades</span>
                <span className="text-white font-medium">
                  {carrinho.reduce((acc, i) => acc + i.quantidade, 0)}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="bg-slate-900 rounded-2xl p-3 lg:p-5 text-center border border-slate-700 mb-2 lg:mb-4">
              <p className="text-slate-400 text-sm mb-1">Total</p>
              <p className="text-4xl font-bold text-emerald-400">
                R$ {total.toFixed(2).replace('.', ',')}
              </p>
            </div>

            {/* Dica de teclado */}
            <div className="bg-slate-900/50 rounded-xl p-3 text-center">
              <p className="text-slate-500 text-xs">
                Pressione <kbd className="bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-xs font-mono">F12</kbd> para finalizar
              </p>
            </div>
          </div>

          {/* Botão Finalizar Venda */}
          <div className="p-3 lg:p-4 border-t border-slate-700 bg-slate-800">
            <button
              onClick={() => {
                setEtapaPagamento('selecao');
                setModalPagamento(true);
              }}
              disabled={carrinho.length === 0 || processando}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 lg:py-5 rounded-xl lg:rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20 text-base lg:text-lg"

            >
              {processando ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Finalizando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle size={22} />
                  Finalizar Venda
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Pagamento */}
      {modalPagamento && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-xl">
                {etapaPagamento === 'dinheiro' ? 'Pagamento em Dinheiro' : 'Finalizar Venda'}
              </h2>
              <button 
                onClick={resetModal} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            <div className="text-center mb-6">
              <p className="text-slate-400 mb-1">Total a Pagar</p>
              <p className="text-4xl font-bold text-emerald-400">R$ {total.toFixed(2).replace('.', ',')}</p>
            </div>

            {etapaPagamento === 'selecao' && !qrCodeMP && (
              <div className="space-y-3">
                <p className="text-slate-300 font-medium mb-3">Selecione a forma de pagamento:</p>
                
                <button
                  onClick={() => setEtapaPagamento('dinheiro')}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-xl flex items-center gap-4 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Banknote size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">Dinheiro</p>
                    <p className="text-slate-400 text-sm">Receber em espécie</p>
                  </div>
                </button>

                <button
                  onClick={async () => {
                    setGerandoQrCode(true);
                    try {
                      const { data } = await api.post('/mercadopago/qr-code', { total });
                      setQrCodeMP(data);
                    } catch (error) {
                      setQrCodeMP({ error: true });
                    } finally {
                      setGerandoQrCode(false);
                    }
                  }}
                  disabled={gerandoQrCode}
                  className="w-full bg-[#009EE3] hover:bg-[#008DD0] text-white p-4 rounded-xl flex items-center gap-4 transition-colors disabled:opacity-50"
                >
                  <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-white">
                    {gerandoQrCode ? <RefreshCw size={24} className="animate-spin" /> : <QrCode size={24} />}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">Mercado Pago</p>
                    <p className="text-white/80 text-sm">Gerar QR Code PIX</p>
                  </div>
                </button>
              </div>
            )}

            {etapaPagamento === 'dinheiro' && (
              <div className="space-y-4 animate-fade-in">
                {precisaTroco === null ? (
                  <>
                    <p className="text-slate-300 font-medium text-center mb-4">O cliente precisa de troco?</p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setPrecisaTroco(false);
                          finalizarVenda('dinheiro');
                          resetModal();
                        }}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-4 rounded-xl font-bold transition-colors"
                      >
                        Não, valor exato
                      </button>
                      <button
                        onClick={() => setPrecisaTroco(true)}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-xl font-bold transition-colors"
                      >
                        Sim
                      </button>
                    </div>
                    <button
                      onClick={() => setEtapaPagamento('selecao')}
                      className="w-full mt-4 text-slate-400 hover:text-white py-2 text-sm transition-colors"
                    >
                      Voltar
                    </button>
                  </>
                ) : precisaTroco === true ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-slate-300 text-sm">Valor recebido do cliente (R$):</label>
                      <input
                        type="number"
                        step="0.01"
                        min={total}
                        value={valorRecebido}
                        onChange={(e) => setValorRecebido(e.target.value)}
                        placeholder="Ex: 50.00"
                        className="w-full bg-slate-900 border-2 border-slate-600 focus:border-emerald-500 text-white text-xl placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none transition-all text-center"
                        autoFocus
                      />
                    </div>
                    
                    {parseFloat(valorRecebido) >= total && (
                      <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 text-center my-4 animate-scale-in">
                        <p className="text-emerald-400 text-sm mb-1">Troco a devolver</p>
                        <p className="text-3xl font-bold text-emerald-400">
                          R$ {(parseFloat(valorRecebido) - total).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setPrecisaTroco(null)}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium transition-colors"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={() => {
                          finalizarVenda('dinheiro');
                          resetModal();
                        }}
                        disabled={!valorRecebido || parseFloat(valorRecebido) < total}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-600 disabled:text-slate-400 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={20} />
                        Confirmar
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {etapaPagamento === 'selecao' && qrCodeMP && (
              qrCodeMP.error ? (
                <div className="text-center py-6">
                  <p className="text-red-400 mb-4">Erro ao gerar QR Code. Verifique se o backend está online e configurado.</p>
                  <button onClick={resetModal} className="bg-slate-700 text-white px-6 py-2 rounded-xl">Voltar</button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-slate-300 mb-4">Peça para o cliente escanear o QR Code abaixo com o aplicativo do banco ou Mercado Pago:</p>
                  
                  <div className="bg-white p-4 rounded-xl inline-block mb-4">
                    <img src={`data:image/png;base64,${qrCodeMP.qrCodeBase64}`} alt="QR Code PIX" className="w-48 h-48 mx-auto" />
                  </div>
                  
                  <p className="text-xs text-slate-500 mb-6 truncate px-4">{qrCodeMP.qrCodeCopiaCola}</p>
                  
                  <button
                    onClick={() => {
                      finalizarVenda('mercado_pago');
                      resetModal();
                    }}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} />
                    Confirmar Pagamento Recebido
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Leitor de código de barras pela câmera */}
      {showScanner && (
        <BarcodeScanner 
          onScan={(code) => {
            setShowScanner(false);
            processarCodigo(code);
          }}
          onClose={() => {
            setShowScanner(false);
            focarInput();
          }}
        />
      )}
    </div>
  );
};

export default PDV;
