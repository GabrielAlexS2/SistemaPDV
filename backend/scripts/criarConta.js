const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function criarConta() {
  // Pega os argumentos da linha de comando
  // Exemplo: node criarConta.js usuario@loja.com 123456
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('❌ Erro: Faltam argumentos.');
    console.error('Uso correto: npm run criar-conta <email> <senha>');
    process.exit(1);
  }

  const [email, senha] = args;

  try {
    // Verifica se já existe
    const existente = await prisma.usuario.findUnique({
      where: { email }
    });

    if (existente) {
      console.error(`❌ Erro: Já existe uma conta com o email "${email}".`);
      process.exit(1);
    }

    // Cria a conta
    console.log(`Criando conta para ${email}...`);
    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: {
        email,
        senhaHash
      }
    });

    console.log(`✅ Sucesso! Conta criada com sucesso.`);
    console.log(`ID: ${usuario.id}`);
    console.log(`Email: ${usuario.email}`);
    
  } catch (error) {
    console.error('❌ Erro inesperado ao criar conta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

criarConta();
