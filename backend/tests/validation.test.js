const { validateSala, validateAgendamento } = require('../src/middleware/validation');

describe('Testes de Validação - Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('Validação de Sala', () => {
    test('Valida sala com dados corretos', () => {
      req.body = { nome: 'Sala Teste', capacidade: 10 };
      validateSala(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Rejeita nome vazio', () => {
      req.body = { nome: '', capacidade: 10 };
      validateSala(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    test('Rejeita capacidade inválida', () => {
      req.body = { nome: 'Sala Teste', capacidade: 0 };
      validateSala(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    test('Rejeita capacidade decimal', () => {
      req.body = { nome: 'Sala Teste', capacidade: 10.5 };
      validateSala(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Validação de Agendamento', () => {
    test('Valida agendamento com dados corretos', () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      req.body = {
        sala_id: 1,
        data: dataFutura,
        horario_inicio: '10:00',
        horario_fim: '11:00',
        titulo: 'Reunião Teste'
      };
      validateAgendamento(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('Rejeita agendamento no passado', () => {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      const dataPassada = ontem.toISOString().split('T')[0];
      
      req.body = {
        sala_id: 1,
        data: dataPassada,
        horario_inicio: '10:00',
        horario_fim: '11:00',
        titulo: 'Reunião Passada'
      };
      validateAgendamento(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    test('Rejeita horário fim menor ou igual ao início', () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      req.body = {
        sala_id: 1,
        data: dataFutura,
        horario_inicio: '11:00',
        horario_fim: '10:00',
        titulo: 'Reunião Inválida'
      };
      validateAgendamento(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    test('Rejeita título vazio', () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const dataFutura = amanha.toISOString().split('T')[0];
      
      req.body = {
        sala_id: 1,
        data: dataFutura,
        horario_inicio: '10:00',
        horario_fim: '11:00',
        titulo: ''
      };
      validateAgendamento(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
