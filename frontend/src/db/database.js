// Banco de dados local (IndexedDB via Dexie.js) para modo offline
import Dexie from 'dexie';

const db = new Dexie('EstoqueDB');

// Versão 1 - Schema inicial
db.version(1).stores({
  produtos: '++id, codigoBarras, nome',       // Produtos sincronizados
  vendasPendentes: '++id, criadaEm',           // Vendas feitas offline aguardando sync
  config: 'chave'                              // Configurações locais
});

export default db;
