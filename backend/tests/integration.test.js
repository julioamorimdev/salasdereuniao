const request = require('supertest');
const { createTestApp } = require('./helpers/testApp');

describe('Testes de Integração - Fluxo Completo', () => {
  let salaId;
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('Fluxo Completo: Criar Sala, Criar Agendamentos, Verificar Regras', () => {
    test('Permite criar sala e agendamentos em dias diferentes', async () => {
      const salaResponse = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala Integração', capacidade: 15 });
      
      expect(salaResponse.status).toBe(201);
      expect(salaResponse.body.id).toBeDefined();
      expect(typeof salaResponse.body.id).toBe('number');
      salaId = salaResponse.body.id;

      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const data1 = amanha.toISOString().split('T')[0];

      const agendamento1 = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: data1,
          horario_inicio: '10:00',
          horario_fim: '11:00',
          titulo: 'Reunião Dia 1'
        });

      if (agendamento1.status !== 201) {
        console.log('Erro ao criar agendamento1:', agendamento1.status, agendamento1.body);
      }
      expect(agendamento1.status).toBe(201);
      expect(agendamento1.body.id).toBeDefined();

      const depoisAmanha = new Date();
      depoisAmanha.setDate(depoisAmanha.getDate() + 2);
      const data2 = depoisAmanha.toISOString().split('T')[0];

      const agendamento2 = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: data2,
          horario_inicio: '10:00',
          horario_fim: '11:00',
          titulo: 'Reunião Dia 2'
        });

      expect(agendamento2.status).toBe(201);
      expect(agendamento2.body.id).toBeDefined();

      const listResponse = await request(app)
        .get(`/api/agendamentos?sala_id=${salaId}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.length).toBe(2);
    });

    test('Impede remover sala com agendamentos futuros', async () => {
      // Cria sala
      const salaResponse = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala Protegida', capacidade: 20 });
      
      expect(salaResponse.status).toBe(201);
      expect(salaResponse.body.id).toBeDefined();
      expect(typeof salaResponse.body.id).toBe('number');
      salaId = salaResponse.body.id;

      const verificarSala1 = await request(app)
        .get(`/api/salas/${salaId}`);
      
      expect(verificarSala1.status).toBe(200);
      expect(verificarSala1.body.id).toBe(salaId);

      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];

      const agendamentoResponse = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '14:00',
          horario_fim: '15:00',
          titulo: 'Reunião Futura'
        });

      if (agendamentoResponse.status !== 201) {
        console.log('Erro ao criar agendamento:', agendamentoResponse.status, agendamentoResponse.body);
      }
      
      expect(agendamentoResponse.status).toBe(201);
      expect(agendamentoResponse.body.id).toBeDefined();

      const deleteResponse = await request(app)
        .delete(`/api/salas/${salaId}`);

      expect(deleteResponse.status).toBe(400);
      expect(deleteResponse.body.error).toContain('agendamentos futuros');
    });

    test('Permite remover sala após deletar agendamentos futuros', async () => {
      // Cria sala
      const salaResponse = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala Removível', capacidade: 10 });
      
      expect(salaResponse.status).toBe(201);
      expect(salaResponse.body.id).toBeDefined();
      expect(typeof salaResponse.body.id).toBe('number');
      salaId = salaResponse.body.id;

      const verificarSala2 = await request(app)
        .get(`/api/salas/${salaId}`);
      
      expect(verificarSala2.status).toBe(200);
      expect(verificarSala2.body.id).toBe(salaId);

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
          titulo: 'Reunião Para Deletar'
        });

      if (agendamentoResponse.status !== 201) {
        console.log('Erro ao criar agendamento:', agendamentoResponse.status, agendamentoResponse.body);
      }
      
      expect(agendamentoResponse.status).toBe(201);
      expect(agendamentoResponse.body.id).toBeDefined();

      const deleteAgendamentoResponse = await request(app)
        .delete(`/api/agendamentos/${agendamentoResponse.body.id}`);
      
      expect(deleteAgendamentoResponse.status).toBe(200);

      const deleteResponse = await request(app)
        .delete(`/api/salas/${salaId}`);

      expect(deleteResponse.status).toBe(200);
    });

    test('Ordena agendamentos cronologicamente', async () => {
      // Cria sala
      const salaResponse = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala Ordenação', capacidade: 10 });
      
      expect(salaResponse.status).toBe(201);
      expect(salaResponse.body.id).toBeDefined();
      expect(typeof salaResponse.body.id).toBe('number');
      salaId = salaResponse.body.id;

      // Checa se a sala existe antes de criar agendamentos
      const verificarSala3 = await request(app)
        .get(`/api/salas/${salaId}`);
      
      expect(verificarSala3.status).toBe(200);
      expect(verificarSala3.body.id).toBe(salaId);

      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];

      const agendamento1 = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '15:00',
          horario_fim: '16:00',
          titulo: 'Reunião Tarde'
        });
      
      if (agendamento1.status !== 201) {
        console.log('Erro ao criar agendamento1:', agendamento1.status, agendamento1.body);
      }
      expect(agendamento1.status).toBe(201);
      expect(agendamento1.body.id).toBeDefined();

      const verificarSala4 = await request(app)
        .get(`/api/salas/${salaId}`);
      
      expect(verificarSala4.status).toBe(200);

      const agendamento2 = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '09:00',
          horario_fim: '10:00',
          titulo: 'Reunião Manhã'
        });
      
      if (agendamento2.status !== 201) {
        console.log('Erro ao criar agendamento2:', agendamento2.status, agendamento2.body);
      }
      expect(agendamento2.status).toBe(201);
      expect(agendamento2.body.id).toBeDefined();

      const agendamento3 = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '12:00',
          horario_fim: '13:00',
          titulo: 'Reunião Meio-dia'
        });
      
      if (agendamento3.status !== 201) {
        console.log('Erro ao criar agendamento3:', agendamento3.status, agendamento3.body);
      }
      expect(agendamento3.status).toBe(201);
      expect(agendamento3.body.id).toBeDefined();

      const response = await request(app)
        .get(`/api/agendamentos?sala_id=${salaId}&data=${dataFutura}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(3);
      
      expect(response.body[0].horario_inicio).toMatch(/^09:00/);
      expect(response.body[1].horario_inicio).toMatch(/^12:00/);
      expect(response.body[2].horario_inicio).toMatch(/^15:00/);
    });

    test('Mensagens de erro são claras e objetivas', async () => {
      // Tenta criar sala sem dados
      const response1 = await request(app)
        .post('/api/salas')
        .send({});

      expect(response1.status).toBe(400);
      expect(response1.body.error).toBeTruthy();
      expect(typeof response1.body.error).toBe('string');
      expect(response1.body.error.length).toBeGreaterThan(0);

      const salaResponse = await request(app)
        .post('/api/salas')
        .send({ nome: 'Sala Erro', capacidade: 10 });
      
      expect(salaResponse.status).toBe(201);
      expect(salaResponse.body.id).toBeDefined();
      expect(typeof salaResponse.body.id).toBe('number');
      salaId = salaResponse.body.id;

      // Checa se a sala existe antes de criar agendamento
      const verificarSala5 = await request(app)
        .get(`/api/salas/${salaId}`);
      
      expect(verificarSala5.status).toBe(200);
      expect(verificarSala5.body.id).toBe(salaId);

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
          titulo: 'Primeira Reunião'
        });

      if (primeiroAgendamento.status !== 201) {
        console.log('Erro ao criar primeiro agendamento:', primeiroAgendamento.status, primeiroAgendamento.body);
      }
      
      expect(primeiroAgendamento.status).toBe(201);
      expect(primeiroAgendamento.body.id).toBeDefined();

      const response2 = await request(app)
        .post('/api/agendamentos')
        .send({
          sala_id: salaId,
          data: dataFutura,
          horario_inicio: '10:30',
          horario_fim: '11:30',
          titulo: 'Reunião Conflitante'
        });

      expect(response2.status).toBe(400);
      expect(response2.body.error).toBeTruthy();
      expect(response2.body.error).toContain('horário');
    });
  });
});
