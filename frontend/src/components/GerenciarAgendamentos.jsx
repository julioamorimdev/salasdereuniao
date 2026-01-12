import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const GerenciarAgendamentos = ({ salas, loading: salasLoading }) => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState(null);
  const [filtroSala, setFiltroSala] = useState('');
  const [filtroData, setFiltroData] = useState('');
  const [formData, setFormData] = useState({
    sala_id: '',
    data: '',
    horario_inicio: '',
    horario_fim: '',
    titulo: '',
    descricao: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarAgendamentos();
  }, [filtroSala, filtroData]);

  const carregarAgendamentos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtroSala) params.append('sala_id', filtroSala);
      if (filtroData) params.append('data', filtroData);
      
      const response = await axios.get(`${API_URL}/agendamentos?${params.toString()}`);
      setAgendamentos(response.data);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (editingAgendamento) {
        await axios.put(`${API_URL}/agendamentos/${editingAgendamento.id}`, formData);
      } else {
        await axios.post(`${API_URL}/agendamentos`, formData);
      }
      
      setShowForm(false);
      setEditingAgendamento(null);
      setFormData({
        sala_id: '',
        data: '',
        horario_inicio: '',
        horario_fim: '',
        titulo: '',
        descricao: ''
      });
      carregarAgendamentos();
    } catch (err) {
      const apiError = err.response?.data?.error;
      if (typeof apiError === 'string' && apiError.toLowerCase().includes('agendamento')) {
        // Padronizar mensagem de conflito para facilitar UX e testes
        setError(`Conflito: ${apiError}`);
      } else {
        setError(apiError || 'Erro ao salvar agendamento');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (agendamento) => {
    setEditingAgendamento(agendamento);
    setFormData({
      sala_id: agendamento.sala_id.toString(),
      data: agendamento.data,
      horario_inicio: agendamento.horario_inicio,
      horario_fim: agendamento.horario_fim,
      titulo: agendamento.titulo,
      descricao: agendamento.descricao || ''
    });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover este agendamento?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/agendamentos/${id}`);
      carregarAgendamentos();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao remover agendamento');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAgendamento(null);
    setFormData({
      sala_id: '',
      data: '',
      horario_inicio: '',
      horario_fim: '',
      titulo: '',
      descricao: ''
    });
    setError('');
  };

  const hoje = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Agendamentos</h2>
          <p className="mt-1 text-sm text-slate-600">
            Crie e gerencie agendamentos por sala e data.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Novo Agendamento
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white/95 rounded-xl border border-blue-200/50 shadow-lg backdrop-blur-sm p-6 mb-6">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">
            {editingAgendamento ? 'Editar Agendamento' : 'Novo Agendamento'}
          </h3>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  htmlFor="agendamento-sala"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Sala *
                </label>
                <select
                  id="agendamento-sala"
                  value={formData.sala_id}
                  onChange={(e) => setFormData({ ...formData, sala_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  required
                >
                  <option value="">Selecione uma sala</option>
                  {salas.map((sala) => (
                    <option key={sala.id} value={sala.id}>
                      {sala.nome} (Capacidade: {sala.capacidade})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="agendamento-data"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Data *
                </label>
                <input
                  id="agendamento-data"
                  type="date"
                  min={hoje}
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  htmlFor="agendamento-horario-inicio"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Horário de Início * (HH:MM)
                </label>
                <input
                  id="agendamento-horario-inicio"
                  type="time"
                  value={formData.horario_inicio}
                  onChange={(e) => setFormData({ ...formData, horario_inicio: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="agendamento-horario-fim"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Horário de Término * (HH:MM)
                </label>
                <input
                  id="agendamento-horario-fim"
                  type="time"
                  value={formData.horario_fim}
                  onChange={(e) => setFormData({ ...formData, horario_fim: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label
                htmlFor="agendamento-titulo"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Título *
              </label>
              <input
                id="agendamento-titulo"
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex.: Reunião com equipe"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                required
                maxLength={255}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Opcional"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                rows="3"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Salvando...' : editingAgendamento ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white/95 rounded-xl border border-purple-200/50 shadow-lg backdrop-blur-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Filtrar por Sala
            </label>
            <select
              value={filtroSala}
              onChange={(e) => setFiltroSala(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="">Todas as salas</option>
              {salas.map((sala) => (
                <option key={sala.id} value={sala.id}>
                  {sala.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Filtrar por Data
            </label>
            <input
              type="date"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center text-slate-600">
          Carregando agendamentos...
        </div>
      ) : agendamentos.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center text-slate-600">
          {filtroSala || filtroData
            ? 'Nenhum agendamento encontrado com os filtros selecionados.'
            : 'Nenhum agendamento cadastrado. Clique em "Novo Agendamento" para começar.'}
        </div>
      ) : (
        <div className="bg-white/95 rounded-xl border border-indigo-200/50 shadow-lg backdrop-blur-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Sala
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Horário
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {agendamentos.map((agendamento) => (
                <tr key={agendamento.id} className="odd:bg-white even:bg-slate-50/40 hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                    {agendamento.sala_nome || `Sala ${agendamento.sala_id}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {new Date(agendamento.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {agendamento.horario_inicio} - {agendamento.horario_fim}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {agendamento.titulo}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {agendamento.descricao || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(agendamento)}
                      className="mr-3 inline-flex items-center rounded-md px-2 py-1 text-blue-700 hover:bg-blue-50 hover:text-blue-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(agendamento.id)}
                      className="inline-flex items-center rounded-md px-2 py-1 text-red-700 hover:bg-red-50 hover:text-red-900"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GerenciarAgendamentos;
