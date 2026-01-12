import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const GerenciarSalas = ({ salas, onSalasChange }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingSala, setEditingSala] = useState(null);
  const [formData, setFormData] = useState({ nome: '', capacidade: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (editingSala) {
        await axios.put(`${API_URL}/salas/${editingSala.id}`, formData);
      } else {
        await axios.post(`${API_URL}/salas`, formData);
      }
      
      setShowForm(false);
      setEditingSala(null);
      setFormData({ nome: '', capacidade: '' });
      onSalasChange();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar sala');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sala) => {
    setEditingSala(sala);
    setFormData({ nome: sala.nome, capacidade: sala.capacidade.toString() });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover esta sala?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/salas/${id}`);
      onSalasChange();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao remover sala');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSala(null);
    setFormData({ nome: '', capacidade: '' });
    setError('');
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Salas de Reunião</h2>
          <p className="mt-1 text-sm text-slate-600">
            Crie, edite e remova salas. A capacidade deve ser um inteiro &gt; 0.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Nova Sala
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white/95 rounded-xl border border-blue-200/50 shadow-lg backdrop-blur-sm p-6 mb-6">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">
            {editingSala ? 'Editar Sala' : 'Nova Sala'}
          </h3>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}
            <div className="mb-4">
              <label
                htmlFor="sala-nome"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Nome da Sala *
              </label>
              <input
                id="sala-nome"
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex.: Sala 101"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                required
                maxLength={100}
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="sala-capacidade"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Capacidade *
              </label>
              <input
                id="sala-capacidade"
                type="number"
                min="1"
                step="1"
                value={formData.capacidade}
                onChange={(e) => setFormData({ ...formData, capacidade: e.target.value })}
                placeholder="Ex.: 12"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                required
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
                {loading ? 'Salvando...' : editingSala ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white/95 rounded-xl border border-indigo-200/50 shadow-lg backdrop-blur-sm overflow-hidden">
        {salas.length === 0 ? (
          <div className="p-10 text-center text-slate-600">
            Nenhuma sala cadastrada. Clique em "Nova Sala" para começar.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Capacidade
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {salas.map((sala) => (
                <tr key={sala.id} className="odd:bg-white even:bg-slate-50/40 hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                    {sala.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {sala.capacidade} pessoa{sala.capacidade > 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(sala)}
                      className="mr-3 inline-flex items-center rounded-md px-2 py-1 text-blue-700 hover:bg-blue-50 hover:text-blue-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(sala.id)}
                      className="inline-flex items-center rounded-md px-2 py-1 text-red-700 hover:bg-red-50 hover:text-red-900"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default GerenciarSalas;
