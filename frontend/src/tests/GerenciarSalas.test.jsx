import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import GerenciarSalas from '../components/GerenciarSalas';

jest.mock('axios');

describe('Testes Frontend - Gerenciar Salas', () => {
  const mockSalas = [
    { id: 1, nome: 'Sala A', capacidade: 10 },
    { id: 2, nome: 'Sala B', capacidade: 20 }
  ];

  const mockOnSalasChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: mockSalas });
  });

  test('Exibe lista de salas', async () => {
    render(<GerenciarSalas salas={mockSalas} onSalasChange={mockOnSalasChange} />);

    expect(screen.getByText('Sala A')).toBeInTheDocument();
    expect(screen.getByText('Sala B')).toBeInTheDocument();
    expect(screen.getByText('10 pessoas')).toBeInTheDocument();
    expect(screen.getByText('20 pessoas')).toBeInTheDocument();
  });

  test(' Deve exibir mensagem quando não há salas', () => {
    render(<GerenciarSalas salas={[]} onSalasChange={mockOnSalasChange} />);

    expect(screen.getByText(/Nenhuma sala cadastrada/i)).toBeInTheDocument();
  });

  test(' Deve abrir formulário ao clicar em "Nova Sala"', async () => {
    const user = userEvent.setup();
    render(<GerenciarSalas salas={mockSalas} onSalasChange={mockOnSalasChange} />);

    const novoButton = screen.getByText('Nova Sala');
    await user.click(novoButton);

    expect(screen.getByText(/Nova Sala/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome da Sala/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Capacidade/i)).toBeInTheDocument();
  });

  test(' Deve validar campos obrigatórios no frontend', async () => {
    const user = userEvent.setup();
    render(<GerenciarSalas salas={mockSalas} onSalasChange={mockOnSalasChange} />);

    const novoButton = screen.getByText('Nova Sala');
    await user.click(novoButton);

    const nomeInput = screen.getByLabelText(/Nome da Sala/i);
    const capacidadeInput = screen.getByLabelText(/Capacidade/i);

    expect(nomeInput).toBeRequired();
    expect(capacidadeInput).toBeRequired();
  });

  test(' Deve criar nova sala', async () => {
    const user = userEvent.setup();
    axios.post.mockResolvedValue({ data: { id: 3, nome: 'Sala C', capacidade: 15 } });

    render(<GerenciarSalas salas={mockSalas} onSalasChange={mockOnSalasChange} />);

    const novoButton = screen.getByText('Nova Sala');
    await user.click(novoButton);

    const nomeInput = screen.getByLabelText(/Nome da Sala/i);
    const capacidadeInput = screen.getByLabelText(/Capacidade/i);
    const criarButton = screen.getByText('Criar');

    await user.type(nomeInput, 'Sala C');
    await user.type(capacidadeInput, '15');
    await user.click(criarButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/salas'),
        { nome: 'Sala C', capacidade: '15' }
      );
      expect(mockOnSalasChange).toHaveBeenCalled();
    });
  });

  test(' Deve exibir erro quando criação falha', async () => {
    const user = userEvent.setup();
    axios.post.mockRejectedValue({
      response: { data: { error: 'Já existe uma sala com este nome' } }
    });

    render(<GerenciarSalas salas={mockSalas} onSalasChange={mockOnSalasChange} />);

    const novoButton = screen.getByText('Nova Sala');
    await user.click(novoButton);

    const nomeInput = screen.getByLabelText(/Nome da Sala/i);
    const capacidadeInput = screen.getByLabelText(/Capacidade/i);
    const criarButton = screen.getByText('Criar');

    await user.type(nomeInput, 'Sala A');
    await user.type(capacidadeInput, '10');
    await user.click(criarButton);

    await waitFor(() => {
      expect(screen.getByText(/Já existe uma sala com este nome/i)).toBeInTheDocument();
    });
  });

  test(' Deve editar sala existente', async () => {
    const user = userEvent.setup();
    axios.put.mockResolvedValue({ data: { id: 1, nome: 'Sala A Atualizada', capacidade: 25 } });

    render(<GerenciarSalas salas={mockSalas} onSalasChange={mockOnSalasChange} />);

    const editarButtons = screen.getAllByText('Editar');
    await user.click(editarButtons[0]);

    const nomeInput = screen.getByLabelText(/Nome da Sala/i);
    const capacidadeInput = screen.getByLabelText(/Capacidade/i);
    const atualizarButton = screen.getByText('Atualizar');

    await user.clear(nomeInput);
    await user.type(nomeInput, 'Sala A Atualizada');
    await user.clear(capacidadeInput);
    await user.type(capacidadeInput, '25');
    await user.click(atualizarButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
      expect(mockOnSalasChange).toHaveBeenCalled();
    });
  });

  test(' Deve deletar sala com confirmação', async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => true);
    axios.delete.mockResolvedValue({ data: { message: 'Sala removida' } });

    render(<GerenciarSalas salas={mockSalas} onSalasChange={mockOnSalasChange} />);

    const removerButtons = screen.getAllByText('Remover');
    await user.click(removerButtons[0]);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(axios.delete).toHaveBeenCalled();
      expect(mockOnSalasChange).toHaveBeenCalled();
    });
  });

  test(' Deve cancelar criação de sala', async () => {
    const user = userEvent.setup();
    render(<GerenciarSalas salas={mockSalas} onSalasChange={mockOnSalasChange} />);

    const novoButton = screen.getByText('Nova Sala');
    await user.click(novoButton);

    const cancelarButton = screen.getByText('Cancelar');
    await user.click(cancelarButton);

    expect(screen.queryByLabelText(/Nome da Sala/i)).not.toBeInTheDocument();
  });

  test(' Deve validar capacidade maior que zero no frontend', async () => {
    const user = userEvent.setup();
    render(<GerenciarSalas salas={mockSalas} onSalasChange={mockOnSalasChange} />);

    const novoButton = screen.getByText('Nova Sala');
    await user.click(novoButton);

    const capacidadeInput = screen.getByLabelText(/Capacidade/i);
    expect(capacidadeInput).toHaveAttribute('min', '1');
    expect(capacidadeInput).toHaveAttribute('step', '1');
  });

  test(' Deve validar tamanho máximo do nome no frontend', async () => {
    const user = userEvent.setup();
    render(<GerenciarSalas salas={mockSalas} onSalasChange={mockOnSalasChange} />);

    const novoButton = screen.getByText('Nova Sala');
    await user.click(novoButton);

    const nomeInput = screen.getByLabelText(/Nome da Sala/i);
    expect(nomeInput).toHaveAttribute('maxLength', '100');
  });
});
