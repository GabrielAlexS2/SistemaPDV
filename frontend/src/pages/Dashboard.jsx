// Dashboard - resumo do dia com métricas de vendas
import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  TrendingUp, ShoppingBag, AlertTriangle, Clock,
  Package, RefreshCw, Trophy
} from 'lucide-react';

// Card de métrica
const MetricaCard = ({ icone: Icone, label, valor, cor, sub }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex items-start gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cor}`}>
      <Icone size={22} className="text-white" />
    </div>
    <div>
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-white font-bold text-2xl mt-0.5">{valor}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  </div>
);

const Dashboard = () => {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = async () => {
    setCarregando(true);
    try {
      const { data } = await api.get('/dashboard');
      setDados(data);
    } catch {
      // offline - mostrar dados básicos
      setDados(null);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const hojeFormatado = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="text-purple-400" size={26} />
            Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-0.5 capitalize">{hojeFormatado}</p>
        </div>
        <button
          onClick={carregar}
          disabled={carregando}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm transition-all"
        >
          <RefreshCw size={15} className={carregando ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
        </div>
      ) : !dados ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-center">
          <p className="text-amber-400 font-medium">📴 Modo offline — dados não disponíveis</p>
          <p className="text-slate-400 text-sm mt-1">Conecte-se à internet para ver o dashboard</p>
        </div>
      ) : (
        <>
          {/* Cards principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MetricaCard
              icone={ShoppingBag}
              label="Vendas hoje"
              valor={dados.vendasHoje}
              cor="bg-gradient-to-br from-emerald-500 to-teal-600"
              sub="Transações realizadas"
            />
            <MetricaCard
              icone={TrendingUp}
              label="Total arrecadado"
              valor={`R$ ${(dados.totalHoje || 0).toFixed(2).replace('.', ',')}`}
              cor="bg-gradient-to-br from-blue-500 to-indigo-600"
              sub="Faturamento do dia"
            />
          </div>

          {/* Alertas de estoque baixo */}
          {dados.produtosEstoqueBaixo?.length > 0 && (
            <div>
              <h2 className="text-white font-semibold flex items-center gap-2 mb-3">
                <AlertTriangle size={18} className="text-amber-400" />
                Estoque Baixo ({dados.produtosEstoqueBaixo.length} produto{dados.produtosEstoqueBaixo.length > 1 ? 's' : ''})
              </h2>
              <div className="space-y-2">
                {dados.produtosEstoqueBaixo.map(p => (
                  <div key={p.id} className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex justify-between items-center">
                    <span className="text-amber-200 font-medium">{p.nome}</span>
                    <span className={`font-bold text-sm px-2.5 py-0.5 rounded-full ${
                      p.quantidade === 0
                        ? 'bg-red-500/30 text-red-300'
                        : 'bg-amber-500/30 text-amber-300'
                    }`}>
                      {p.quantidade === 0 ? 'SEM ESTOQUE' : `${p.quantidade} un.`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top 5 Itens Mais Vendidos */}
          {dados.top5?.length > 0 && (
            <div>
              <h2 className="text-white font-semibold flex items-center gap-2 mb-3">
                <Trophy size={18} className="text-yellow-400" />
                Top 5 Itens Mais Vendidos
              </h2>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                <div className="space-y-3">
                  {dados.top5.map((item, idx) => (
                    <div key={item.produtoId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold">{idx + 1}º</span>
                        <span className="text-slate-200 font-medium">{item.nome}</span>
                      </div>
                      <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg text-sm">
                        {item._sum.quantidade} un.
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Últimas vendas */}
          <div>
            <h2 className="text-white font-semibold flex items-center gap-2 mb-3">
              <Clock size={18} className="text-slate-400" />
              Últimas Vendas
            </h2>
            {dados.ultimasVendas?.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
                <Package size={40} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Nenhuma venda realizada hoje ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dados.ultimasVendas?.map((venda, idx) => (
                  <div key={venda.id}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div>
                      <p className="text-white font-medium text-sm">
                        Venda #{venda.id}
                        <span className="text-slate-400 font-normal ml-2 text-xs">
                          {venda.itens?.length} item{venda.itens?.length !== 1 ? 's' : ''}
                        </span>
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {new Date(venda.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="text-emerald-400 font-bold">
                      R$ {venda.total.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
