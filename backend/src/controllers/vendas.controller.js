// Controller de vendas - registro e consulta
const prisma = require('../prisma');

// Registrar nova venda e atualizar estoque
const criar = async (req, res) => {
  try {
    const { itens, tipoPagamento } = req.body;

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ erro: 'Itens da venda são obrigatórios' });
    }

    // Calcular total e validar produtos em uma transação
    const venda = await prisma.$transaction(async (tx) => {
      let total = 0;
      const itensValidados = [];

      for (const item of itens) {
        const produto = await tx.produto.findUnique({
          where: { id: parseInt(item.produtoId) }
        });

        if (!produto) {
          throw new Error(`Produto ${item.produtoId} não encontrado`);
        }

        if (produto.quantidade < item.quantidade) {
          throw new Error(`Estoque insuficiente para ${produto.nome}`);
        }

        const precoUnitario = parseFloat(item.precoUnitario) || produto.preco;
        total += precoUnitario * item.quantidade;

        itensValidados.push({
          produtoId: produto.id,
          quantidade: item.quantidade,
          precoUnitario
        });

        // Atualizar quantidade no estoque
        await tx.produto.update({
          where: { id: produto.id },
          data: { quantidade: produto.quantidade - item.quantidade }
        });
      }

      // Criar a venda com seus itens
      const novaVenda = await tx.venda.create({
        data: {
          total,
          tipoPagamento: tipoPagamento || 'dinheiro',
          itens: {
            create: itensValidados
          }
        },
        include: {
          itens: {
            include: { produto: true }
          }
        }
      });

      return novaVenda;
    });

    res.status(201).json(venda);
  } catch (erro) {
    console.error('Erro ao criar venda:', erro);
    res.status(400).json({ erro: erro.message || 'Erro ao registrar venda' });
  }
};

// Listar vendas com filtro de data
const listar = async (req, res) => {
  try {
    const { data } = req.query;

    let where = {};
    if (data) {
      const inicio = new Date(data);
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(data);
      fim.setHours(23, 59, 59, 999);
      where = { data: { gte: inicio, lte: fim } };
    }

    const vendas = await prisma.venda.findMany({
      where,
      include: {
        itens: {
          include: { produto: true }
        }
      },
      orderBy: { data: 'desc' }
    });

    res.json(vendas);
  } catch (erro) {
    console.error('Erro ao listar vendas:', erro);
    res.status(500).json({ erro: 'Erro ao buscar vendas' });
  }
};

// Buscar vendas de hoje
const vendaDeHoje = async (req, res) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const vendas = await prisma.venda.findMany({
      where: { data: { gte: hoje, lt: amanha } },
      include: { itens: { include: { produto: true } } },
      orderBy: { data: 'desc' }
    });

    res.json(vendas);
  } catch (erro) {
    console.error('Erro ao buscar vendas de hoje:', erro);
    res.status(500).json({ erro: 'Erro ao buscar vendas' });
  }
};

module.exports = { criar, listar, vendaDeHoje };
