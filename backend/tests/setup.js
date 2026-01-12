jest.mock('../src/models/database', () => {
  const { Pool } = require('pg');
  
  const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME_TEST || process.env.DB_NAME || 'sala_reuniao',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });
  
  return {
    pool
  };
});

const mockedDatabase = require('../src/models/database');
const testPool = mockedDatabase.pool;

async function setupTestDatabase() {
  try {
    await testPool.query(`
      DROP TABLE IF EXISTS agendamentos CASCADE;
      DROP TABLE IF EXISTS salas CASCADE;
      
      CREATE TABLE salas (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) UNIQUE NOT NULL,
        capacidade INTEGER NOT NULL CHECK (capacidade > 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE agendamentos (
        id SERIAL PRIMARY KEY,
        sala_id INTEGER NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
        data DATE NOT NULL,
        horario_inicio TIME NOT NULL,
        horario_fim TIME NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT horario_valido CHECK (horario_fim > horario_inicio)
      );
      
      CREATE INDEX idx_agendamentos_sala_id ON agendamentos(sala_id);
      CREATE INDEX idx_agendamentos_data ON agendamentos(data);
      CREATE INDEX idx_salas_nome ON salas(nome);
    `);
    
    console.log('Banco de teste configurado');
  } catch (error) {
    console.error('Erro ao configurar banco de teste:', error);
    throw error;
  }
}

async function cleanTestDatabase() {
  try {
    await testPool.query('TRUNCATE TABLE agendamentos, salas RESTART IDENTITY CASCADE');
  } catch (error) {
    console.error('Erro ao limpar banco:', error);
    throw error;
  }
}

async function closeTestDatabase() {
  await testPool.end();
}

beforeAll(async () => {
  await setupTestDatabase();
}, 30000);

beforeEach(async () => {
  await cleanTestDatabase();
});

afterAll(async () => {
  await closeTestDatabase();
}, 10000);

module.exports = {
  testPool
};
