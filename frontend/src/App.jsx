import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GerenciarSalas from './components/GerenciarSalas';
import GerenciarAgendamentos from './components/GerenciarAgendamentos';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function App() {
  const [activeTab, setActiveTab] = useState('salas');
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(false);

  const carregarSalas = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/salas`);
      setSalas(response.data);
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarSalas();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent sm:text-3xl">
            Sistema de Agendamento de Salas de Reunião
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Cadastre salas e organize agendamentos com filtros e validações.
          </p>
        </div>
      </header>

      <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setActiveTab('salas')}
              aria-current={activeTab === 'salas' ? 'page' : undefined}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'salas'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-700 hover:bg-white/70 hover:text-slate-900'
              }`}
            >
              Gerenciar Salas
            </button>
            <button
              onClick={() => setActiveTab('agendamentos')}
              aria-current={activeTab === 'agendamentos' ? 'page' : undefined}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'agendamentos'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-700 hover:bg-white/70 hover:text-slate-900'
              }`}
            >
              Gerenciar Agendamentos
            </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
        {activeTab === 'salas' && (
          <GerenciarSalas salas={salas} onSalasChange={carregarSalas} />
        )}
        {activeTab === 'agendamentos' && (
          <GerenciarAgendamentos salas={salas} loading={loading} />
        )}
        </div>
      </main>
    </div>
  );
}

export default App;
