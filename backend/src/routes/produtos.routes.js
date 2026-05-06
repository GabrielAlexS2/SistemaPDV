// Rotas de produtos - protegidas por JWT
const express = require('express');
const router = express.Router();
const { autenticar } = require('../middlewares/auth.middleware');
const {
  listar,
  buscarPorCodigo,
  buscarPorId,
  criar,
  atualizar,
  excluir
} = require('../controllers/produtos.controller');

// Todas as rotas requerem autenticação
router.use(autenticar);

router.get('/', listar);
router.get('/barcode/:codigo', buscarPorCodigo);
router.get('/:id', buscarPorId);
router.post('/', criar);
router.put('/:id', atualizar);
router.delete('/:id', excluir);

module.exports = router;
