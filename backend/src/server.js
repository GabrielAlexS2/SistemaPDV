// Servidor principal - Sistema de Estoque + PDV
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth.routes');
const produtosRoutes = require('./routes/produtos.routes');
const vendasRoutes = require('./routes/vendas.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const mpRoutes = require('./routes/mercadopago.routes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Permitir de qualquer origem (idealmente seria a URL do frontend)
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Socket.io middleware para autenticação
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Autenticação necessária'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.usuarioId = decoded.id;
    next();
  } catch (error) {
    next(new Error('Token inválido ou expirado'));
  }
});

// Configuração das conexões WebSocket
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: Socket ${socket.id} | Usuário ID: ${socket.usuarioId}`);
  
  // O cliente entra em uma sala exclusiva baseada no seu ID de usuário
  const userRoom = `user_${socket.usuarioId}`;
  socket.join(userRoom);

  // Recebe atualizações do carrinho e repassa para outros dispositivos na mesma sala
  socket.on('cart_update', (dadosCarrinho) => {
    // .to(room) emite para todos na sala EXCETO o remetente
    socket.to(userRoom).emit('sync_cart', dadosCarrinho);
  });

  // Solicita que outros dispositivos na sala enviem o carrinho atual
  socket.on('request_sync', () => {
    socket.to(userRoom).emit('send_current_cart');
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Cliente desconectado: Socket ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;

// Middlewares globais
app.use(cors()); // Aceita conexões de qualquer IP na rede
app.use(express.json());

// Rota de saúde
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas da aplicação
app.use('/api/auth', authRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/vendas', vendasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/mercadopago', mpRoutes);

// Importante: Servir os arquivos estáticos do frontend em produção
// Quando em Docker, o frontend compilado estará na pasta "public" do backend
const staticPath = path.join(__dirname, '../public');
app.use(express.static(staticPath));

// Rota de fallback para o React Router (SPA)
// Qualquer rota que NÃO seja da API (/api/*) vai retornar o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Middleware de Tratamento de Erros Globais
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

// Iniciar servidor via HTTP (que inclui Express e Socket.io)
server.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`📡 API e WebSockets disponíveis em http://localhost:${PORT}`);
});
