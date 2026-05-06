// Controller de Integração com Mercado Pago (QR Code Dinâmico)
const { MercadoPagoConfig, Payment } = require('mercadopago');

// Configuração do Mercado Pago (pega a chave do .env)
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || 'SUA_ACCESS_TOKEN_AQUI',
  options: { timeout: 5000 }
});

const payment = new Payment(client);

// Gerar QR Code Dinâmico para uma venda do PDV
const gerarQrCode = async (req, res) => {
  try {
    const { total, descricao, vendaId } = req.body;

    if (!total) {
      return res.status(400).json({ erro: 'Total da venda é obrigatório' });
    }

    // Criar um pagamento via PIX (QR Code)
    const request = {
      transaction_amount: parseFloat(total),
      description: descricao || `Venda PDV #${vendaId || 'Avulsa'}`,
      payment_method_id: 'pix',
      payer: {
        email: 'cliente@marketflow.com' // Pode ser dinâmico no futuro se tiver cadastro de clientes
      },
      // Aqui você poderia passar o URL do seu webhook público (ngrok por exemplo)
      // notification_url: process.env.MP_WEBHOOK_URL
    };

    const resposta = await payment.create({ body: request });

    // Extrair o QR Code em base64 e o código "Copia e Cola"
    const qrCodeBase64 = resposta.point_of_interaction?.transaction_data?.qr_code_base64;
    const qrCodeCopiaCola = resposta.point_of_interaction?.transaction_data?.qr_code;

    res.json({
      pagamentoId: resposta.id,
      qrCodeBase64,
      qrCodeCopiaCola
    });
  } catch (erro) {
    console.error('Erro ao gerar QR Code MP:', erro);
    res.status(500).json({ erro: 'Erro ao conectar com Mercado Pago' });
  }
};

// Webhook para receber confirmação de pagamento do Mercado Pago
const webhookPagamento = async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment' && data?.id) {
      // Buscar o status real do pagamento no MP
      const paymentInfo = await payment.get({ id: data.id });
      
      if (paymentInfo.status === 'approved') {
        console.log(`✅ Pagamento MP ${data.id} aprovado!`);
        // Aqui você atualizaria o status da venda no banco de dados se houvesse uma tabela de pagamentos pendentes
      }
    }

    // O MP exige que retornemos 200/201 rapidamente
    res.sendStatus(200);
  } catch (erro) {
    console.error('Erro no webhook do MP:', erro);
    res.sendStatus(500);
  }
};

// Verificar status de um pagamento específico (usado pelo PDV para confirmação automática)
const verificarPagamento = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ erro: 'ID do pagamento não fornecido' });

    const paymentInfo = await payment.get({ id });
    res.json({ status: paymentInfo.status });
  } catch (erro) {
    console.error(`Erro ao verificar pagamento ${req.params.id}:`, erro.message);
    res.status(500).json({ erro: 'Erro ao verificar pagamento' });
  }
};

module.exports = { gerarQrCode, webhookPagamento, verificarPagamento };
