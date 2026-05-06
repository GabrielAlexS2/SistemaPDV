// Controller de produtos - CRUD completo + busca por código de barras
const prisma = require('../prisma');

// Listar todos os produtos
const listar = async (req, res) => {
  try {
    const { busca } = req.query;
    const where = busca
      ? {
          OR: [
            { nome: { contains: busca, mode: 'insensitive' } },
            { codigoBarras: { contains: busca } }
          ]
        }
      : {};

    const produtos = await prisma.produto.findMany({
      where,
      orderBy: { nome: 'asc' }
    });

    res.json(produtos);
  } catch (erro) {
    console.error('Erro ao listar produtos:', erro);
    res.status(500).json({ erro: 'Erro ao buscar produtos' });
  }
};

// Buscar produto por código de barras
const buscarPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;

    const produto = await prisma.produto.findUnique({
      where: { codigoBarras: codigo }
    });

    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    res.json(produto);
  } catch (erro) {
    console.error('Erro ao buscar por código:', erro);
    res.status(500).json({ erro: 'Erro ao buscar produto' });
  }
};

// Buscar produto por ID
const buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const produto = await prisma.produto.findUnique({
      where: { id: parseInt(id) }
    });

    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    res.json(produto);
  } catch (erro) {
    console.error('Erro ao buscar produto:', erro);
    res.status(500).json({ erro: 'Erro ao buscar produto' });
  }
};

// Criar novo produto
const criar = async (req, res) => {
  try {
    const { nome, codigoBarras, preco, quantidade, precoCusto, estoqueMinimo } = req.body;

    if (!nome || preco === undefined) {
      return res.status(400).json({ erro: 'Nome e preço são obrigatórios' });
    }

    const produto = await prisma.produto.create({
      data: {
        nome,
        codigoBarras: codigoBarras || null,
        preco: parseFloat(preco),
        precoCusto: precoCusto ? parseFloat(precoCusto) : null,
        quantidade: parseInt(quantidade) || 0,
        estoqueMinimo: estoqueMinimo ? parseInt(estoqueMinimo) : 5
      }
    });

    res.status(201).json(produto);
  } catch (erro) {
    // Erro de código de barras duplicado
    if (erro.code === 'P2002') {
      return res.status(400).json({ erro: 'Código de barras já cadastrado' });
    }
    console.error('Erro ao criar produto:', erro);
    res.status(500).json({ erro: 'Erro ao criar produto' });
  }
};

// Atualizar produto
const atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, codigoBarras, preco, quantidade, precoCusto, estoqueMinimo } = req.body;

    const produto = await prisma.produto.update({
      where: { id: parseInt(id) },
      data: {
        ...(nome !== undefined && { nome }),
        ...(codigoBarras !== undefined && { codigoBarras }),
        ...(preco !== undefined && { preco: parseFloat(preco) }),
        ...(precoCusto !== undefined && { precoCusto: precoCusto ? parseFloat(precoCusto) : null }),
        ...(quantidade !== undefined && { quantidade: parseInt(quantidade) }),
        ...(estoqueMinimo !== undefined && { estoqueMinimo: parseInt(estoqueMinimo) })
      }
    });

    res.json(produto);
  } catch (erro) {
    if (erro.code === 'P2025') {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }
    console.error('Erro ao atualizar produto:', erro);
    res.status(500).json({ erro: 'Erro ao atualizar produto' });
  }
};

// Excluir produto
const excluir = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.produto.delete({
      where: { id: parseInt(id) }
    });

    res.json({ mensagem: 'Produto excluído com sucesso' });
  } catch (erro) {
    if (erro.code === 'P2025') {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }
    console.error('Erro ao excluir produto:', erro);
    res.status(500).json({ erro: 'Erro ao excluir produto' });
  }
};

module.exports = { listar, buscarPorCodigo, buscarPorId, criar, atualizar, excluir };
