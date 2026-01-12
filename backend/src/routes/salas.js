const express = require('express');
const router = express.Router();
const { pool } = require('../models/database');
const { validateSala } = require('../middleware/validation');

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM salas ORDER BY nome');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const salaId = parseInt(id, 10);
    
    if (isNaN(salaId) || salaId <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const result = await pool.query('SELECT * FROM salas WHERE id = $1', [salaId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/', validateSala, async (req, res, next) => {
  try {
    const { nome, capacidade } = req.body;
    
    const existingSala = await pool.query(
      'SELECT id FROM salas WHERE nome = $1',
      [nome]
    );
    
    if (existingSala.rows.length > 0) {
      return res.status(400).json({ error: 'Já existe uma sala com este nome' });
    }
    
    const result = await pool.query(
      'INSERT INTO salas (nome, capacidade) VALUES ($1, $2) RETURNING *',
      [nome, capacidade]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Já existe uma sala com este nome' });
    }
    next(error);
  }
});

router.put('/:id', validateSala, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nome, capacidade } = req.body;
    
    const salaId = parseInt(id, 10);
    if (isNaN(salaId) || salaId <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const salaExistente = await pool.query('SELECT id FROM salas WHERE id = $1', [salaId]);
    if (salaExistente.rows.length === 0) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }
    
    const nomeExistente = await pool.query(
      'SELECT id FROM salas WHERE nome = $1 AND id != $2',
      [nome, salaId]
    );
    if (nomeExistente.rows.length > 0) {
      return res.status(400).json({ error: 'Já existe outra sala com este nome' });
    }
    
    const result = await pool.query(
      'UPDATE salas SET nome = $1, capacidade = $2 WHERE id = $3 RETURNING *',
      [nome, capacidade, salaId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Já existe outra sala com este nome' });
    }
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const salaId = parseInt(id, 10);
    if (isNaN(salaId) || salaId <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const salaExistente = await pool.query('SELECT id FROM salas WHERE id = $1', [salaId]);
    if (salaExistente.rows.length === 0) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeStr = hoje.toISOString().split('T')[0];
    const agora = new Date();
    const horaAtual = agora.toTimeString().split(' ')[0].substring(0, 5);
    
    const agendamentosFuturos = await pool.query(
      `SELECT id FROM agendamentos 
       WHERE sala_id = $1 AND (
         data > $2 OR 
         (data = $2 AND horario_inicio::time > $3::time)
       )`,
      [salaId, hojeStr, horaAtual]
    );
    
    if (agendamentosFuturos.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Não é permitido remover uma sala que possua agendamentos futuros' 
      });
    }
    
    await pool.query('DELETE FROM salas WHERE id = $1', [salaId]);
    res.json({ message: 'Sala removida com sucesso' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
