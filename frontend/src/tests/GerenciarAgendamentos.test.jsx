import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import GerenciarAgendamentos from '../components/GerenciarAgendamentos';

jest.mock('axios');

describe('Testes Frontend - Gerenciar Agendamentos', () => {
  const mockSalas = [
    { id: 1, nome: 'Sala A', capacidade: 10 },
    { id: 2, nome: 'Sala B', capacidade: 20 }
  ];

  const mockAgendamentos = [
    {
      id: 1,
      sala_id: 1,
      sala_nome: 'Sala A',
      data: '2024-01-15',
      horario_inicio: '10:00',
      horario_fim: '11:00',
      titulo: 'Reunião Teste',
      descricao: 'Descrição teste'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: mockAgendamentos });
  });

  test(' Deve exibir lista de agendamentos', async () => {
    render(<GerenciarAgendamentos salas={mockSalas} loading={false} />);

    await waitFor(() => {
      expect(screen.getByText('Reunião Teste')).toBeInTheDocument();
      expect(screen.getAllByText('Sala A').length).toBeGreaterThan(0);
    });
  });

  test(' Deve exibir mensagem quando não há agendamentos', async () => {
    axios.get.mockResolvedValue({ data: [] });

    render(<GerenciarAgendamentos salas={mockSalas} loading={false} />);

    await waitFor(() => {
      expect(screen.getByText(/Nenhum agendamento cadastrado/i)).toBeInTheDocument();
    });
  });

  test(' Deve exibir filtros por sala e data', () => {
    render(<GerenciarAgendamentos salas={mockSalas} loading={false} />);

    expect(screen.getByText(/Filtrar por Sala/i)).toBeInTheDocument();
    expect(screen.getByText(/Filtrar por Data/i)).toBeInTheDocument();
  });

  test(' Deve abrir formulário ao clicar em "Novo Agendamento"', async () => {
    const user = userEvent.setup();
    render(<GerenciarAgendamentos salas={mockSalas} loading={false} />);

    const novoButton = screen.getByText('Novo Agendamento');
    await user.click(novoButton);

    expect(screen.getByLabelText(/Sala/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Data/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Horário de Início/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Horário de Término/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Título/i)).toBeInTheDocument();
  });

  test(' Deve validar campos obrigatórios no frontend', async () => {
    const user = userEvent.setup();
    render(<GerenciarAgendamentos salas={mockSalas} loading={false} />);

    const novoButton = screen.getByText('Novo Agendamento');
    await user.click(novoButton);

    const salaSelect = screen.getByLabelText(/Sala/i);
    const dataInput = screen.getByLabelText(/Data/i);
    const inicioInput = screen.getByLabelText(/Horário de Início/i);
    const fimInput = screen.getByLabelText(/Horário de Término/i);
    const tituloInput = screen.getByLabelText(/Título/i);

    expect(salaSelect).toBeRequired();
    expect(dataInput).toBeRequired();
    expect(inicioInput).toBeRequired();
    expect(fimInput).toBeRequired();
    expect(tituloInput).toBeRequired();
  });

  test(' Deve criar novo agendamento', async () => {
    const user = userEvent.setup();
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const dataFutura = amanha.toISOString().split('T')[0];

    axios.post.mockResolvedValue({
      data: {
        id: 2,
        sala_id: 1,
        data: dataFutura,
        horario_inicio: '10:00',
        horario_fim: '11:00',
        titulo: 'Nova Reunião'
      }
    });

    render(<GerenciarAgendamentos salas={mockSalas} loading={false} />);

    const novoButton = screen.getByText('Novo Agendamento');
    await user.click(novoButton);

    const salaSelect = screen.getByLabelText(/Sala/i);
    const dataInput = screen.getByLabelText(/Data/i);
    const inicioInput = screen.getByLabelText(/Horário de Início/i);
    const fimInput = screen.getByLabelText(/Horário de Término/i);
    const tituloInput = screen.getByLabelText(/Título/i);
    const criarButton = screen.getByText('Criar');

    await user.selectOptions(salaSelect, '1');
    await user.type(dataInput, dataFutura);
    await user.type(inicioInput, '10:00');
    await user.type(fimInput, '11:00');
    await user.type(tituloInput, 'Nova Reunião');
    await user.click(criarButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });

  test(' Deve exibir erro quando criação falha', async () => {
    const user = userEvent.setup();
    axios.post.mockRejectedValue({
      response: { data: { error: 'Já existe um agendamento para esta sala neste horário' } }
    });

    render(<GerenciarAgendamentos salas={mockSalas} loading={false} />);

    const novoButton = screen.getByText('Novo Agendamento');
    await user.click(novoButton);

    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const dataFutura = amanha.toISOString().split('T')[0];

    const salaSelect = screen.getByLabelText(/Sala/i);
    const dataInput = screen.getByLabelText(/Data/i);
    const inicioInput = screen.getByLabelText(/Horário de Início/i);
    const fimInput = screen.getByLabelText(/Horário de Término/i);
    const tituloInput = screen.getByLabelText(/Título/i);
    const criarButton = screen.getByText('Criar');

    await user.selectOptions(salaSelect, '1');
    await user.type(dataInput, dataFutura);
    await user.type(inicioInput, '10:00');
    await user.type(fimInput, '11:00');
    await user.type(tituloInput, 'Reunião Conflitante');
    await user.click(criarButton);

    await waitFor(() => {
      expect(screen.getByText(/conflito/i)).toBeInTheDocument();
    });
  });

  test(' Deve impedir criar agendamento no passado', async () => {
    const user = userEvent.setup();
    render(<GerenciarAgendamentos salas={mockSalas} loading={false} />);

    const novoButton = screen.getByText('Novo Agendamento');
    await user.click(novoButton);

    const dataInput = screen.getByLabelText(/Data/i);
    const hoje = new Date().toISOString().split('T')[0];

    expect(dataInput).toHaveAttribute('min', hoje);
  });

  test(' Deve filtrar agendamentos por sala', async () => {
    const user = userEvent.setup();
    render(<GerenciarAgendamentos salas={mockSalas} loading={false} />);

    const filtroSala = screen.getAllByRole('combobox')[0];
    await user.selectOptions(filtroSala, '1');

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('sala_id=1')
      );
    });
  });

  test(' Deve filtrar agendamentos por data', async () => {
    const user = userEvent.setup();
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const dataFutura = amanha.toISOString().split('T')[0];

    render(<GerenciarAgendamentos salas={mockSalas} loading={false} />);

    const filtroData = screen.getByDisplayValue('');
    await user.type(filtroData, dataFutura);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining(`data=${dataFutura}`)
      );
    });
  });

  test(' Deve deletar agendamento com confirmação', async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => true);
    axios.delete.mockResolvedValue({ data: { message: 'Agendamento removido' } });

    render(<GerenciarAgendamentos salas={mockSalas} loading={false} />);

    await waitFor(() => {
      const removerButtons = screen.getAllByText('Remover');
      if (removerButtons.length > 0) {
        user.click(removerButtons[0]);
      }
    });

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(axios.delete).toHaveBeenCalled();
    });
  });

  test(' Deve exibir mensagem quando não há agendamentos com filtro aplicado', async () => {
    axios.get.mockResolvedValue({ data: [] });

    const user = userEvent.setup();
    render(<GerenciarAgendamentos salas={mockSalas} loading={false} />);

    const filtroSala = screen.getAllByRole('combobox')[0];
    await user.selectOptions(filtroSala, '1');

    await waitFor(() => {
      expect(screen.getByText(/Nenhum agendamento encontrado/i)).toBeInTheDocument();
    });
  });
});
