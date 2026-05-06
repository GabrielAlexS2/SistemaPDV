# MarketFlow - Sistema de PDV e Controle de Estoque

O **MarketFlow** é um sistema web completo (PWA) de Ponto de Venda e controle de estoque com foco em pequenos comércios, projetado para operar com altíssima velocidade e suporte à operação **offline-first**.

## 🚀 Tecnologias Utilizadas

- **Frontend:** React (Vite), Zustand, Tailwind CSS, Dexie.js (IndexedDB).
- **Backend:** Node.js, Express, Prisma ORM.
- **Banco de Dados:** PostgreSQL.
- **Integrações:** Mercado Pago (PIX QR Code Dinâmico), html5-qrcode (Scanner por câmera).

### 1. Configurar e Iniciar o Backend
Abra um terminal na pasta `backend`:
```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```
*(Opcional) Verifique as variáveis no arquivo `.env` para preencher com seus tokens reais do Mercado Pago.*

### 2. Configurar e Iniciar o Frontend
Abra outro terminal na pasta `frontend`:
```bash
cd frontend
npm install
npm run dev
```

### 3. Acessar o Sistema
Abra o navegador em `http://localhost:5173` (ou a porta informada pelo Vite).
- **Usuário padrão:** `admin@estoque.com`
- **Senha:** `admin123`

## 🔑 Funcionalidades Principais
- **PDV Offline:** Se a internet cair, as vendas são salvas localmente e enviadas assim que a conexão retornar.
- **UX Focada em Hardware:** O caixa (`F12`) e a busca (`Enter`) estão preparados para uso direto com leitor de código de barras USB.
- **Mobile First na Gestão:** Câmera integrada para ler códigos ao cadastrar produtos no celular.
- **Dashboard:** Visão geral rápida com alerta de estoque e top produtos vendidos.
