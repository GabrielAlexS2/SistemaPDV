// Controller do dashboard - métricas do dia
const prisma = require('../prisma');

const resumo = async (req, res) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    // Agregação de vendas de hoje
    const [vendasHoje, totalHoje, ultimasVendas, produtosEstoqueBaixo, top5Items] = await Promise.all([
      // Contagem de vendas hoje
      prisma.venda.count({
        where: { data: { gte: hoje, lt: amanha } }
      }),
      // Soma do total de vendas hoje
      prisma.venda.aggregate({
        where: { data: { gte: hoje, lt: amanha } },
        _sum: { total: true }
      }),
      // Últimas 5 vendas
      prisma.venda.findMany({
        take: 5,
        orderBy: { data: 'desc' },
        include: {
          itens: { include: { produto: { select: { nome: true } } } }
        }
      }),
      // Produtos com estoque baixo (quantidade <= estoqueMinimo) usando query crua
      prisma.$queryRaw`SELECT * FROM produtos WHERE quantidade <= estoque_minimo ORDER BY quantidade ASC LIMIT 10`,
      // Top 5 Itens Mais Vendidos
      prisma.itemVenda.groupBy({
        by: ['produtoId'],
        _sum: { quantidade: true },
        where: { venda: { data: { gte: hoje, lt: amanha } } },
        orderBy: { _sum: { quantidade: 'desc' } },
        take: 5
      })
    ]);

    // Buscar nomes dos top 5 produtos
    const top5ComNomes = await Promise.all(
      top5Items.map(async (item) => {
        const p = await prisma.produto.findUnique({ where: { id: item.produtoId }, select: { nome: true } });
        return { ...item, nome: p?.nome || 'Desconhecido' };
      })
    );

    res.json({
      vendasHoje,
      totalHoje: totalHoje._sum.total || 0,
      ultimasVendas,
      produtosEstoqueBaixo,
      top5: top5ComNomes
    });
  } catch (erro) {
    console.error('Erro ao buscar dashboard:', erro);
    res.status(500).json({ erro: 'Erro ao buscar dados do dashboard' });
  }
};

module.exports = { resumo };
