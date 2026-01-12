const request = require('supertest');
const { createTestApp } = require('./helpers/testApp');
const { testPool } = require('./helpers/testDb');

describe('Regras de Negócio - Salas de Reunião', () => {
  let app;
  
  beforeAll(() => {
    app = createTestApp();
  });
  
  describe('Regra 1: Uma sala possui um nome e uma capacidade', () => {
    test('Cria sala com nome e capacidade válidos', async () => {
      const response = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala A', capacidade: 10 });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.nome).toBe('Sala A');
      expect(response.body.capacidade).toBe(10);
    });

    test('Retorna erro se nome não for fornecido', async () => {
      const response = await request(app)
        .post('/api/salas')
        .send({ capacidade: 10 });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Nome da sala é obrigatório');
    });

    test('Retorna erro se capacidade não for fornecida', async () => {
      const response = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala A' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Capacidade é obrigatória');
    });

    test('Retorna erro se nome for vazio', async () => {
      const response = await request(app)
        .post('/api/salas')
        .send({ nome: '', capacidade: 10 });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Nome da sala é obrigatório');
    });
  });

  describe('Regra 2: Não existem duas salas com o mesmo nome', () => {
    test('Cria primeira sala com sucesso', async () => {
      const response = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala B', capacidade: 15 });
      
      expect(response.status).toBe(201);
    });

    test('Retorna erro ao tentar criar sala com nome duplicado', async () => {
      const primeiraSala = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala B', capacidade: 15 });
      
      expect(primeiraSala.status).toBe(201);
      expect(primeiraSala.body.nome).toBe('Sala B');
      expect(primeiraSala.body.id).toBeDefined();
      
      const verificarSala = await request(app)
        .get(`/api/salas/${primeiraSala.body.id}`);
      
      expect(verificarSala.status).toBe(200);
      expect(verificarSala.body.nome).toBe('Sala B');
      
      const response = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala B', capacidade: 20 });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Já existe uma sala com este nome');
    });

    test('Permite criar salas com nomes diferentes', async () => {
      await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala C', capacidade: 10 });
      
      const response = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala D', capacidade: 20 });
      
      expect(response.status).toBe(201);
      expect(response.body.nome).toBe('Sala D');
    });

      test('Retorna erro ao atualizar sala para nome existente', async () => {
      const sala1 = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala E', capacidade: 10 });
      
      expect(sala1.status).toBe(201);
      expect(sala1.body.nome).toBe('Sala E');
      expect(sala1.body.id).toBeDefined();
      
      const verificarSala1 = await request(app)
        .get(`/api/salas/${sala1.body.id}`);
      
      expect(verificarSala1.status).toBe(200);
      expect(verificarSala1.body.nome).toBe('Sala E');
      
      const sala2 = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala F', capacidade: 20 });
      
      expect(sala2.status).toBe(201);
      expect(sala2.body.nome).toBe('Sala F');
      expect(sala2.body.id).toBeDefined();
      expect(sala2.body.id).not.toBe(sala1.body.id);
      
      const response = await request(app)
        .put(`/api/salas/${sala2.body.id}`)
        .send({ nome: 'Sala E', capacidade: 20 });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Já existe outra sala com este nome');
    });
  });

  describe('Regra 3: A capacidade da sala é um número inteiro maior que zero', () => {
    test('Rejeita capacidade zero', async () => {
      const response = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala G', capacidade: 0 });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('maior que zero');
    });

    test('Rejeita capacidade negativa', async () => {
      const response = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala H', capacidade: -5 });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('maior que zero');
    });

    test('Aceita capacidade positiva inteira', async () => {
      const response = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala I', capacidade: 25 });
      
      expect(response.status).toBe(201);
      expect(response.body.capacidade).toBe(25);
    });

    test('Rejeita capacidade decimal', async () => {
      const response = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala J', capacidade: 10.5 });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('número inteiro');
    });

    test('Aceita capacidade 1 (mínimo válido)', async () => {
      const response = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala K', capacidade: 1 });
      
      expect(response.status).toBe(201);
      expect(response.body.capacidade).toBe(1);
    });
  });

  describe('Regra 5: Não é permitido remover uma sala que possua agendamentos futuros', () => {
    test('Permite remover sala sem agendamentos', async () => {
      const sala = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala L', capacidade: 10 });
      
      expect(sala.status).toBe(201);
      expect(sala.body.id).toBeDefined();
      
      const response = await request(app)
        .delete(`/api/salas/${sala.body.id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('removida com sucesso');
    });

      test('Permite remover sala com agendamentos passados', async () => {
      const sala = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala M', capacidade: 10 });
      
      expect(sala.status).toBe(201);
      expect(sala.body.id).toBeDefined();
      expect(typeof sala.body.id).toBe('number');
      const salaId = sala.body.id;
      
      const verificarSala = await testPool.query('SELECT id FROM salas WHERE id = $1', [salaId]);
      if (verificarSala.rows.length === 0) {
        throw new Error(`Sala com id ${salaId} não encontrada no banco após criação via API`);
      }
      
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      const dataPassada = ontem.toISOString().split('T')[0];
      
      await testPool.query(
        `INSERT INTO agendamentos (sala_id, data, horario_inicio, horario_fim, titulo)
         VALUES ($1, $2, '10:00', '11:00', 'Reunião Passada')`,
        [salaId, dataPassada]
      );
      
      const response = await request(app)
        .delete(`/api/salas/${salaId}`);
      
      expect(response.status).toBe(200);
    });

    test('Impede remover sala com agendamento futuro hoje', async () => {
      const sala = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala N', capacidade: 10 });
      
      expect(sala.status).toBe(201);
      expect(sala.body.id).toBeDefined();
      expect(typeof sala.body.id).toBe('number');
      const salaId = sala.body.id;
      
      const verificarSala = await testPool.query('SELECT id FROM salas WHERE id = $1', [salaId]);
      if (verificarSala.rows.length === 0) {
        throw new Error(`Sala com id ${salaId} não encontrada no banco após criação via API`);
      }
      
      const hoje = new Date().toISOString().split('T')[0];
      const agora = new Date();
      const horaAtual = agora.getHours();
      const minutoAtual = agora.getMinutes();
      
      let dataAgendamento = hoje;
      let horarioInicio = '';
      let horarioFim = '';
      
      if (horaAtual >= 22) {
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);
        dataAgendamento = amanha.toISOString().split('T')[0];
        horarioInicio = '10:00';
        horarioFim = '11:00';
      } else {
        const horaFutura = horaAtual + 2;
        if (horaFutura >= 24) {
          const amanha = new Date();
          amanha.setDate(amanha.getDate() + 1);
          dataAgendamento = amanha.toISOString().split('T')[0];
          horarioInicio = '10:00';
          horarioFim = '11:00';
        } else {
          horarioInicio = `${horaFutura.toString().padStart(2, '0')}:00`;
          horarioFim = `${(horaFutura + 1).toString().padStart(2, '0')}:00`;
        }
      }
      
      const agendamentoResponse = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataAgendamento,
          horario_inicio: horarioInicio,
          horario_fim: horarioFim,
          titulo: 'Reunião Futura'
        });
      
      if (agendamentoResponse.status !== 201) {
        console.log('Erro ao criar agendamento:', agendamentoResponse.status, agendamentoResponse.body);
      }
      
      expect(agendamentoResponse.status).toBe(201);
      expect(agendamentoResponse.body.id).toBeDefined();
      
      const response = await request(app)
        .delete(`/api/salas/${salaId}`);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('agendamentos futuros');
    });

    test('Impede remover sala com agendamento futuro em outro dia', async () => {
      const sala = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala O', capacidade: 10 });
      
      expect(sala.status).toBe(201);
      expect(sala.body.id).toBeDefined();
      expect(typeof sala.body.id).toBe('number');
      const salaId = sala.body.id;
      
      const verificarSala = await testPool.query('SELECT id FROM salas WHERE id = $1', [salaId]);
      if (verificarSala.rows.length === 0) {
        throw new Error(`Sala com id ${salaId} não encontrada no banco após criação via API`);
      }
      
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      const agendamentoResponse = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '10:00',
          horario_fim: '11:00',
          titulo: 'Reunião Futura'
        });
      
      expect(agendamentoResponse.status).toBe(201);
      expect(agendamentoResponse.body.id).toBeDefined();
      
      const response = await request(app)
        .delete(`/api/salas/${salaId}`);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('agendamentos futuros');
    });
  });

  describe('CRUD Completo de Salas', () => {
    test('Lista todas as salas', async () => {
      const sala1 = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala P', capacidade: 10 });
      
      expect(sala1.status).toBe(201);
      expect(sala1.body.id).toBeDefined();
      
      const sala2 = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala Q', capacidade: 20 });
      
      expect(sala2.status).toBe(201);
      expect(sala2.body.id).toBeDefined();
      
      const response = await request(app)
        .get('/api/salas');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    test('Busca sala por ID', async () => {
      const sala = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala R', capacidade: 15 });
      
      expect(sala.status).toBe(201);
      expect(sala.body.id).toBeDefined();
      expect(typeof sala.body.id).toBe('number');
      
      const response = await request(app)
        .get(`/api/salas/${sala.body.id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(sala.body.id);
      expect(response.body.nome).toBe('Sala R');
    });

    test('Retorna 404 para sala inexistente', async () => {
      const response = await request(app)
        .get('/api/salas/99999');
      
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('não encontrada');
    });

    test('Atualiza sala existente', async () => {
      const sala = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala S', capacidade: 10 });
      
      expect(sala.status).toBe(201);
      expect(sala.body.id).toBeDefined();
      expect(typeof sala.body.id).toBe('number');
      
      const response = await request(app)
        .put(`/api/salas/${sala.body.id}`)
        .send({ nome: 'Sala S Atualizada', capacidade: 25 });
      
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(sala.body.id);
      expect(response.body.nome).toBe('Sala S Atualizada');
      expect(response.body.capacidade).toBe(25);
    });
  });
});
