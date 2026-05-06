// Rotas do dashboard - protegidas por JWT
const express = require('express');
const router = express.Router();
const { autenticar } = require('../middlewares/auth.middleware');
const { resumo } = require('../controllers/dashboard.controller');

router.use(autenticar);
router.get('/', resumo);

module.exports = router;
