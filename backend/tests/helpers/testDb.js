const mockedDatabase = require('../../src/models/database');

if (!mockedDatabase || !mockedDatabase.pool) {
  throw new Error('Pool de teste não encontrado');
}

if (typeof mockedDatabase.pool.query !== 'function') {
  throw new Error('Pool de teste inválido');
}

const testPool = mockedDatabase.pool;

module.exports = {
  testPool
};
