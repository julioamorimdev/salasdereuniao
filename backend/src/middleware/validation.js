const validateSala = (req, res, next) => {
  const { nome, capacidade } = req.body;
  const errors = [];

  if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
    errors.push('Nome da sala é obrigatório');
  } else if (nome.trim().length > 100) {
    errors.push('Nome da sala deve ter no máximo 100 caracteres');
  }

  if (capacidade === undefined || capacidade === null) {
    errors.push('Capacidade é obrigatória');
  } else {
    const cap = parseInt(capacidade);
    if (isNaN(cap) || cap <= 0 || !Number.isInteger(Number(capacidade))) {
      errors.push('Capacidade deve ser um número inteiro maior que zero');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  req.body.capacidade = parseInt(capacidade);
  req.body.nome = nome.trim();
  next();
};

const validateAgendamento = (req, res, next) => {
  const { sala_id, data, horario_inicio, horario_fim, titulo, descricao } = req.body;
  const errors = [];

  if (sala_id === undefined || sala_id === null || sala_id === '') {
    errors.push('ID da sala é obrigatório e deve ser um número positivo');
  } else {
    const salaId = parseInt(sala_id, 10);
    if (isNaN(salaId) || salaId <= 0 || !Number.isInteger(salaId)) {
      errors.push('ID da sala deve ser um número inteiro positivo válido');
    } else {
      req.body.sala_id = salaId;
    }
  }

  if (!data) {
    errors.push('Data é obrigatória');
  } else {
    const dataObj = new Date(data + 'T00:00:00');
    if (isNaN(dataObj.getTime())) {
      errors.push('Data inválida. Use o formato YYYY-MM-DD');
    } else {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      if (dataObj < hoje) {
        errors.push('Não é permitido criar agendamentos no passado');
      }
      req.body.data = data;
    }
  }

  if (!horario_inicio) {
    errors.push('Horário de início é obrigatório');
  } else if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(horario_inicio)) {
    errors.push('Horário de início inválido. Use o formato HH:MM (24 horas)');
  }

  if (!horario_fim) {
    errors.push('Horário de término é obrigatório');
  } else if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(horario_fim)) {
    errors.push('Horário de término inválido. Use o formato HH:MM (24 horas)');
  }

  if (horario_inicio && horario_fim) {
    const [hInicio, mInicio] = horario_inicio.split(':').map(Number);
    const [hFim, mFim] = horario_fim.split(':').map(Number);
    const minutosInicio = hInicio * 60 + mInicio;
    const minutosFim = hFim * 60 + mFim;

    if (minutosFim <= minutosInicio) {
      errors.push('Horário de término deve ser maior que horário de início');
    }

    if (data && horario_inicio) {
      const hoje = new Date().toISOString().split('T')[0];
      if (data === hoje) {
        const agora = new Date();
        const [hInicioVal, mInicioVal] = horario_inicio.split(':').map(Number);
        const minutosInicioVal = hInicioVal * 60 + mInicioVal;
        const horaAtual = agora.getHours();
        const minutosAtuais = agora.getMinutes();
        const minutosAtuaisTotais = horaAtual * 60 + minutosAtuais;
        
        if (minutosInicioVal < minutosAtuaisTotais + 2) {
          errors.push('Não é permitido criar agendamentos no passado');
        }
      }
    }
  }

  if (!titulo || typeof titulo !== 'string' || titulo.trim().length === 0) {
    errors.push('Título é obrigatório');
  } else if (titulo.length > 255) {
    errors.push('Título deve ter no máximo 255 caracteres');
  } else {
    req.body.titulo = titulo.trim();
  }

  if (descricao && typeof descricao !== 'string') {
    errors.push('Descrição deve ser um texto');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('. ') });
  }

  next();
};

module.exports = {
  validateSala,
  validateAgendamento
};
