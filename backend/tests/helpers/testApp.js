const express = require('express');
const cors = require('cors');
const salasRoutes = require('../../src/routes/salas');
const agendamentosRoutes = require('../../src/routes/agendamentos');

const createTestApp = () => {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  
  app.use('/api/salas', salasRoutes);
  app.use('/api/agendamentos', agendamentosRoutes);
  
  app.get('/api/health', async (req, res) => {
    try {
      const { testPool } = require('./testDb');
      await testPool.query('SELECT 1');
      res.json({ status: 'ok', message: 'Servidor e banco de dados funcionando' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });
  
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    console.error('Erro nos testes:', err.message || err);
    res.status(err.status || 500).json({
      error: err.message || 'Erro interno do servidor'
    });
  });
  
  app.use((req, res) => {
    if (!res.headersSent) {
      res.status(404).json({ error: 'Rota não encontrada' });
    }
  });
  
  return app;
};

module.exports = { createTestApp };
