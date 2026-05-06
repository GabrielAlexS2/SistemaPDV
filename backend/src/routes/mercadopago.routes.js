// Rotas do Mercado Pago
const express = require('express');
const router = express.Router();
const { autenticar } = require('../middlewares/auth.middleware');
const { gerarQrCode, webhookPagamento, verificarPagamento } = require('../controllers/mercadopago.controller');

// Rota de webhook precisa ser pública (para o MP enviar o POST)
router.post('/webhook', webhookPagamento);

// Rotas protegidas (PDV)
router.post('/qr-code', autenticar, gerarQrCode);
router.get('/status/:id', autenticar, verificarPagamento);

module.exports = router;
