require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./models/database');

const salasRoutes = require('./routes/salas');
const agendamentosRoutes = require('./routes/agendamentos');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'http://frontend:3000'],
  credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'API de Agendamento de Salas de Reunião',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      salas: '/api/salas',
      agendamentos: '/api/agendamentos'
    },
    frontend: 'http://localhost:3000'
  });
});

app.use('/api/salas', salasRoutes);
app.use('/api/agendamentos', agendamentosRoutes);

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', message: 'Servidor e banco de dados funcionando' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor'
  });
});

const waitForDatabase = async (maxRetries = 30, delay = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('Conectado ao PostgreSQL');
      return true;
    } catch (error) {
      console.log(`Tentativa ${i + 1}/${maxRetries} - Aguardando banco de dados...`);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error('Não foi possível conectar ao banco de dados após várias tentativas');
};

waitForDatabase()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Erro ao conectar ao banco de dados:', err);
    process.exit(1);
  });
