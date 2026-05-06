// Instância global do Prisma Client (singleton para evitar múltiplas conexões)
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
