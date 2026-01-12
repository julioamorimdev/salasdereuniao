const express = require('express');
const router = express.Router();
const { pool } = require('../models/database');
const { validateAgendamento } = require('../middleware/validation');

router.get('/', async (req, res, next) => {
  try {
    const { sala_id, data } = req.query;
    let query = `
      SELECT a.*, s.nome as sala_nome, s.capacidade as sala_capacidade
      FROM agendamentos a
      JOIN salas s ON a.sala_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (sala_id) {
      query += ` AND a.sala_id = $${paramIndex}`;
      params.push(sala_id);
      paramIndex++;
    }
    
    if (data) {
      query += ` AND a.data = $${paramIndex}`;
      params.push(data);
      paramIndex++;
    }
    
    query += ' ORDER BY a.data ASC, a.horario_inicio ASC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const agendamentoId = parseInt(id, 10);
    
    if (isNaN(agendamentoId) || agendamentoId <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const result = await pool.query(
      `SELECT a.*, s.nome as sala_nome, s.capacidade as sala_capacidade
       FROM agendamentos a
       JOIN salas s ON a.sala_id = s.id
       WHERE a.id = $1`,
      [agendamentoId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/', validateAgendamento, async (req, res, next) => {
  try {
    const { sala_id, data, horario_inicio, horario_fim, titulo, descricao } = req.body;
    
    if (!sala_id) {
      return res.status(400).json({ error: 'ID da sala é obrigatório' });
    }
    
    const salaExistente = await pool.query('SELECT id FROM salas WHERE id = $1', [sala_id]);
    if (salaExistente.rows.length === 0) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }
    
    const conflitos = await pool.query(
      `SELECT id FROM agendamentos
       WHERE sala_id = $1 AND data = $2
       AND horario_inicio < $4 AND horario_fim > $3`,
      [sala_id, data, horario_inicio, horario_fim]
    );
    
    if (conflitos.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Já existe um agendamento para esta sala neste horário. Escolha outro horário.' 
      });
    }
    
    const result = await pool.query(
      `INSERT INTO agendamentos (sala_id, data, horario_inicio, horario_fim, titulo, descricao)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [sala_id, data, horario_inicio, horario_fim, titulo, descricao || null]
    );
    
    const agendamentoCompleto = await pool.query(
      `SELECT a.*, s.nome as sala_nome, s.capacidade as sala_capacidade
       FROM agendamentos a
       JOIN salas s ON a.sala_id = s.id
       WHERE a.id = $1`,
      [result.rows[0].id]
    );
    
    res.status(201).json(agendamentoCompleto.rows[0]);
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Sala inválida' });
    }
    if (error.code === '23514') {
      return res.status(400).json({ error: 'Horário de término deve ser maior que horário de início' });
    }
    next(error);
  }
});

router.put('/:id', validateAgendamento, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sala_id, data, horario_inicio, horario_fim, titulo, descricao } = req.body;
    
    const agendamentoId = parseInt(id, 10);
    if (isNaN(agendamentoId) || agendamentoId <= 0) {
      return res.status(400).json({ error: 'ID do agendamento inválido' });
    }
    
    if (!sala_id) {
      return res.status(400).json({ error: 'ID da sala é obrigatório' });
    }
    
    const agendamentoExistente = await pool.query('SELECT id FROM agendamentos WHERE id = $1', [agendamentoId]);
    if (agendamentoExistente.rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    const salaExistente = await pool.query('SELECT id FROM salas WHERE id = $1', [sala_id]);
    if (salaExistente.rows.length === 0) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }
    
    const conflitos = await pool.query(
      `SELECT id FROM agendamentos
       WHERE sala_id = $1 AND data = $2 AND id != $5
       AND horario_inicio < $4 AND horario_fim > $3`,
      [sala_id, data, horario_inicio, horario_fim, agendamentoId]
    );
    
    if (conflitos.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Já existe um agendamento para esta sala neste horário. Escolha outro horário.' 
      });
    }
    
    const result = await pool.query(
      `UPDATE agendamentos 
       SET sala_id = $1, data = $2, horario_inicio = $3, horario_fim = $4, titulo = $5, descricao = $6
       WHERE id = $7 RETURNING *`,
      [sala_id, data, horario_inicio, horario_fim, titulo, descricao || null, agendamentoId]
    );
    
    const agendamentoCompleto = await pool.query(
      `SELECT a.*, s.nome as sala_nome, s.capacidade as sala_capacidade
       FROM agendamentos a
       JOIN salas s ON a.sala_id = s.id
       WHERE a.id = $1`,
      [agendamentoId]
    );
    
    res.json(agendamentoCompleto.rows[0]);
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Sala inválida' });
    }
    if (error.code === '23514') {
      return res.status(400).json({ error: 'Horário de término deve ser maior que horário de início' });
    }
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const agendamentoId = parseInt(id, 10);
    
    if (isNaN(agendamentoId) || agendamentoId <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const result = await pool.query('DELETE FROM agendamentos WHERE id = $1 RETURNING *', [agendamentoId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    res.json({ message: 'Agendamento removido com sucesso' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
