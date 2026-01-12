const request = require('supertest');
const { createTestApp } = require('./helpers/testApp');
const { testPool } = require('./helpers/testDb');

describe('Regras de Negócio - Agendamentos', () => {
  let salaId;
  let app;
  
  beforeAll(() => {
    app = createTestApp();
  });
  
  beforeEach(async () => {
    await new Promise(resolve => setImmediate(resolve));
    
    const nomeUnico = `Sala Teste ${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const salaResponse = await request(app)
      .post('/api/salas')
      .send({ nome: nomeUnico, capacidade: 20 });
    
    expect(salaResponse.status).toBe(201);
    expect(salaResponse.body.id).toBeDefined();
    expect(typeof salaResponse.body.id).toBe('number');
    salaId = salaResponse.body.id;
  });

  describe('Regra 6: Um agendamento está vinculado a uma sala existente', () => {
    test('Cria agendamento vinculado a sala existente', async () => {
      expect(salaId).toBeDefined();
      expect(typeof salaId).toBe('number');
      
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '10:00',
          horario_fim: '11:00',
          titulo: 'Reunião Teste'
        });
      
      if (response.status !== 201) {
        console.log('Erro ao criar agendamento:', response.status, response.body);
      }
      
      expect(response.status).toBe(201);
      expect(response.body.sala_id).toBe(salaId);
    });

    test('Retorna erro para sala inexistente', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: 99999,
          data: dataFutura,
          horario_inicio: '10:00',
          horario_fim: '11:00',
          titulo: 'Reunião Teste'
        });
      
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Sala não encontrada');
    });
  });

  describe('Regra 7: Um agendamento possui Data, Horário início, Horário fim e Título', () => {
    test('Cria agendamento com todos os campos obrigatórios', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '14:00',
          horario_fim: '15:30',
          titulo: 'Reunião Completa',
          descricao: 'Descrição opcional'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('horario_inicio');
      expect(response.body).toHaveProperty('horario_fim');
      expect(response.body).toHaveProperty('titulo');
    });

    test('Retorna erro se data não for fornecida', async () => {
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          horario_inicio: '10:00',
          horario_fim: '11:00',
          titulo: 'Reunião Sem Data'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Data é obrigatória');
    });

    test('Retorna erro se horário início não for fornecido', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_fim: '11:00',
          titulo: 'Reunião Sem Início'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Horário de início é obrigatório');
    });

    test('Retorna erro se horário fim não for fornecido', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '10:00',
          titulo: 'Reunião Sem Fim'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Horário de término é obrigatório');
    });

    test('Retorna erro se título não for fornecido', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '10:00',
          horario_fim: '11:00'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Título é obrigatório');
    });

    test('Aceita descrição como opcional', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '10:00',
          horario_fim: '11:00',
          titulo: 'Reunião Sem Descrição'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.descricao === null || response.body.descricao === undefined || response.body.descricao === '').toBe(true);
    });
  });

  describe('Regra 8: O horário de término é maior que o horário de início', () => {
    test('Aceita horário fim maior que início', async () => {
      // Verificar que salaId é válido
      expect(salaId).toBeDefined();
      expect(typeof salaId).toBe('number');
      
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '10:00',
          horario_fim: '12:00',
          titulo: 'Reunião Válida'
        });
      
      if (response.status !== 201) {
        console.log('Erro ao criar agendamento (horário fim maior que início):', response.status, response.body);
      }
      
      expect(response.status).toBe(201);
    });

    test('Rejeita horário fim igual ao início', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '10:00',
          horario_fim: '10:00',
          titulo: 'Reunião Inválida'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('maior que horário de início');
    });

    test('Rejeita horário fim menor que início', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '12:00',
          horario_fim: '10:00',
          titulo: 'Reunião Inválida'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('maior que horário de início');
    });
  });

  describe('Regra 9: Não é permitido criar agendamentos no passado', () => {
    test('Aceita agendamento para hoje com horário futuro', async () => {
      // Verificar que salaId é válido
      expect(salaId).toBeDefined();
      expect(typeof salaId).toBe('number');
      
      const hoje = new Date().toISOString().split('T')[0];
      const horaFutura = new Date();
      horaFutura.setHours(horaFutura.getHours() + 3);
      horaFutura.setMinutes(0);
      horaFutura.setSeconds(0);
      horaFutura.setMilliseconds(0);
      const horarioFuturo = horaFutura.toTimeString().split(' ')[0].substring(0, 5);
      const horaFim = horaFutura.getHours() + 1;
      // Garante que horaFim não passe de 23
      const horaFimFinal = horaFim > 23 ? 23 : horaFim;
      const fimFuturo = `${horaFimFinal.toString().padStart(2, '0')}:00`;
      
      let dataAgendamento = hoje;
      let horarioInicio = horarioFuturo;
      let horarioFim = fimFuturo;
      
      if (horaFutura.getHours() >= 22) {
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);
        dataAgendamento = amanha.toISOString().split('T')[0];
        horarioInicio = '10:00';
        horarioFim = '11:00';
      }
      
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataAgendamento,
          horario_inicio: horarioInicio,
          horario_fim: horarioFim,
          titulo: 'Reunião Hoje Futura'
        });
      
      if (response.status !== 201) {
        console.log('Erro ao criar agendamento (hoje com horário futuro):', response.status, response.body);
      }
      
      expect(response.status).toBe(201);
    });

    test('Rejeita agendamento para data passada', async () => {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      const dataPassada = ontem.toISOString().split('T')[0];
      
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataPassada,
          horario_inicio: '10:00',
          horario_fim: '11:00',
          titulo: 'Reunião Passada'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('passado');
    });

    test('Rejeita agendamento para hoje com horário passado', async () => {
      const hoje = new Date().toISOString().split('T')[0];
      const horaPassada = new Date();
      horaPassada.setHours(horaPassada.getHours() - 1);
      const horarioPassado = horaPassada.toTimeString().split(' ')[0].substring(0, 5);
      const fimPassado = `${parseInt(horarioPassado.split(':')[0]) + 1}:00`;
      
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: hoje,
          horario_inicio: horarioPassado,
          horario_fim: fimPassado,
          titulo: 'Reunião Passada Hoje'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('passado');
    });
  });

  describe('Regra 10: Não é permitido criar agendamentos com duração zero ou negativa', () => {
    test('Rejeita duração zero', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '10:00',
          horario_fim: '10:00',
          titulo: 'Duração Zero'
        });
      
      expect(response.status).toBe(400);
    });

    test('Aceita duração positiva', async () => {
      // Verificar que salaId é válido
      expect(salaId).toBeDefined();
      expect(typeof salaId).toBe('number');
      
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '10:00',
          horario_fim: '10:30',
          titulo: 'Duração Positiva'
        });
      
      if (response.status !== 201) {
        console.log('Erro ao criar agendamento (duração positiva):', response.status, response.body);
      }
      
      expect(response.status).toBe(201);
    });
  });

  describe('Regra 11: Uma sala não pode ter dois agendamentos que se sobreponham no mesmo dia', () => {
    test('Permite agendamentos não sobrepostos no mesmo dia', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      const primeiroAgendamento = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '10:00',
          horario_fim: '11:00',
          titulo: 'Reunião 1'
        });
      
      expect(primeiroAgendamento.status).toBe(201);
      expect(primeiroAgendamento.body.id).toBeDefined();
      
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '11:00',
          horario_fim: '12:00',
          titulo: 'Reunião 2'
        });
      
      expect(response.status).toBe(201);
    });

    test('Rejeita agendamentos sobrepostos (mesmo horário)', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '10:00',
          horario_fim: '11:00',
          titulo: 'Reunião 1'
        });
      
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '10:00',
          horario_fim: '11:00',
          titulo: 'Reunião Conflitante'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
      expect(response.body.error.toLowerCase()).toMatch(/horário|conflito/i);
    });

    test('Rejeita agendamento que começa durante outro', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      const primeiroAgendamento = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '10:00',
          horario_fim: '12:00',
          titulo: 'Reunião Longa'
        });
      
      expect(primeiroAgendamento.status).toBe(201);
      expect(primeiroAgendamento.body.id).toBeDefined();
      
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '11:00',
          horario_fim: '13:00',
          titulo: 'Reunião Sobreposta'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
      expect(response.body.error.toLowerCase()).toMatch(/horário|conflito/i);
    });

    test('Rejeita agendamento que contém outro', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '11:00',
          horario_fim: '12:00',
          titulo: 'Reunião Interna'
        });
      
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '10:00',
          horario_fim: '13:00',
          titulo: 'Reunião Externa'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
      expect(response.body.error.toLowerCase()).toMatch(/horário|conflito/i);
    });
  });

  describe('Regra 12: Agendamentos podem ocorrer em dias diferentes, mesmo que no mesmo horário', () => {
    test('Permite mesmo horário em dias diferentes', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const data1 = amanha.toISOString().split('T')[0];
      
      const depoisAmanha = new Date();
      depoisAmanha.setDate(depoisAmanha.getDate() + 2);
      const data2 = depoisAmanha.toISOString().split('T')[0];
      
      // Primeiro agendamento
      await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: data1,
          horario_inicio: '10:00',
          horario_fim: '11:00',
          titulo: 'Reunião Dia 1'
        });
      
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: data2,
          horario_inicio: '10:00',
          horario_fim: '11:00',
          titulo: 'Reunião Dia 2'
        });
      
      expect(response.status).toBe(201);
    });

    test('Permite mesmo horário em salas diferentes no mesmo dia', async () => {
      const result2 = await testPool.query(
        'INSERT INTO salas (nome, capacidade) VALUES ($1, $2) RETURNING id',
        ['Sala Teste 2', 15]
      );
      const salaId2 = result2.rows[0].id;
      
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '10:00',
          horario_fim: '11:00',
          titulo: 'Reunião Sala 1'
        });
      
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId2,
          data: dataFutura,
          horario_inicio: '10:00',
          horario_fim: '11:00',
          titulo: 'Reunião Sala 2'
        });
      
      expect(response.status).toBe(201);
    });
  });

  describe('Regra 13: Caso exista conflito, informa erro de forma clara', () => {
    test('Retorna mensagem de erro clara para conflito', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '14:00',
          horario_fim: '15:00',
          titulo: 'Reunião Original'
        });
      
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '14:30',
          horario_fim: '15:30',
          titulo: 'Reunião Conflitante'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
      expect(typeof response.body.error).toBe('string');
      expect(response.body.error.length).toBeGreaterThan(0);
      expect(response.body.error).toContain('horário');
    });
  });

  describe('Regra 14: É possível visualizar agendamentos filtrando por data', () => {
    test('Filtra agendamentos por data', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const data1 = amanha.toISOString().split('T')[0];
      
      const depoisAmanha = new Date();
      depoisAmanha.setDate(depoisAmanha.getDate() + 2);
      const data2 = depoisAmanha.toISOString().split('T')[0];
      
      await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: data1,
          horario_inicio: '10:00',
          horario_fim: '11:00',
          titulo: 'Reunião Dia 1'
        });
      
      await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: data2,
          horario_inicio: '14:00',
          horario_fim: '15:00',
          titulo: 'Reunião Dia 2'
        });
      
      const response = await request(app)
        .get(`/api/agendamentos?data=${data1}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      const responseData = response.body[0].data;
      const expectedDate = data1;
      expect(responseData === expectedDate || responseData.includes(expectedDate)).toBe(true);
    });

    test('Filtra agendamentos por sala e data', async () => {
      // Criar segunda sala
      const result2 = await testPool.query(
        'INSERT INTO salas (nome, capacidade) VALUES ($1, $2) RETURNING id',
        ['Sala Filtro', 10]
      );
      const salaId2 = result2.rows[0].id;
      
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '10:00',
          horario_fim: '11:00',
          titulo: 'Reunião Sala 1'
        });
      
      await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId2,
          data: dataFutura,
          horario_inicio: '10:00',
          horario_fim: '11:00',
          titulo: 'Reunião Sala 2'
        });
      
      // Filtrar por sala
      const response = await request(app)
        .get(`/api/agendamentos?sala_id=${salaId}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].sala_id).toBe(salaId);
    });
  });

  describe('Regra 15: Agendamentos são exibidos em ordem cronológica', () => {
    test('Retorna agendamentos ordenados por data e horário', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '15:00',
          horario_fim: '16:00',
          titulo: 'Reunião Tarde'
        });
      
      await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '09:00',
          horario_fim: '10:00',
          titulo: 'Reunião Manhã'
        });
      
      await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '11:00',
          horario_fim: '12:00',
          titulo: 'Reunião Meio-dia'
        });
      
      const response = await request(app)
        .get(`/api/agendamentos?sala_id=${salaId}&data=${dataFutura}`);
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(3);
      
      expect(response.body[0].horario_inicio).toMatch(/^09:00/);
      expect(response.body[1].horario_inicio).toMatch(/^11:00/);
      expect(response.body[2].horario_inicio).toMatch(/^15:00/);
    });
  });

  describe('Regra 16: Caso não existam agendamentos para uma data, é indicado', () => {
    test('Retorna array vazio quando não há agendamentos', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      const response = await request(app)
        .get(`/api/agendamentos?data=${dataFutura}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('CRUD Completo de Agendamentos', () => {
    test('Lista todos os agendamentos', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '10:00',
          horario_fim: '11:00',
          titulo: 'Reunião 1'
        });
      
      const response = await request(app)
        .get('/api/agendamentos');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('Busca agendamento por ID', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      const agendamento = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '10:00',
          horario_fim: '11:00',
          titulo: 'Reunião Teste'
        });
      
      const response = await request(app)
        .get(`/api/agendamentos/${agendamento.body.id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(agendamento.body.id);
    });

    test('Atualiza agendamento', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      const agendamento = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '10:00',
          horario_fim: '11:00',
          titulo: 'Reunião Original'
        });
      
      const response = await request(app)
        .put(`/api/agendamentos/${agendamento.body.id}`)
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '14:00',
          horario_fim: '15:00',
          titulo: 'Reunião Atualizada'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.titulo).toBe('Reunião Atualizada');
    });

    test('Deleta agendamento', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      const agendamento = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '10:00',
          horario_fim: '11:00',
          titulo: 'Reunião Para Deletar'
        });
      
      const response = await request(app)
        .delete(`/api/agendamentos/${agendamento.body.id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('removido com sucesso');
    });
  });
});
