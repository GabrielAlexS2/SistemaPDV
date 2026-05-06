// Rotas de vendas - protegidas por JWT
const express = require('express');
const router = express.Router();
const { autenticar } = require('../middlewares/auth.middleware');
const { criar, listar, vendaDeHoje } = require('../controllers/vendas.controller');

router.use(autenticar);

router.get('/', listar);
router.get('/hoje', vendaDeHoje);
router.post('/', criar);

module.exports = router;
