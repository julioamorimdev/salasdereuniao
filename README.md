# Sistema de Agendamento de Salas de Reunião

Sistema completo de gerenciamento de salas de reunião e agendamentos, desenvolvido com React.js, Express, Node.js, PostgreSQL e TailwindCSS, totalmente containerizado com Docker.

### Pré-requisitos

- Docker (versão 20.10 ou superior)
- Docker Compose (versão 2.0 ou superior)

### Como executar o projeto

1. Clone esse repositório

2. Execute o seguinte comando na raiz do projeto:

```bash
docker compose up --build
```

Após executar o comando acima irá:
- Construir as imagens Docker do backend e frontend
- Iniciar o banco de dados PostgreSQL
- Executar o script de criação do banco e tabelas
- Ligar todos os serviços

## Como testar a aplicação

- Acesse **http://localhost:3000**

### Parando os serviços

Você pode parar todos os containers utilizando o comando:

```bash
docker compose down
```

Se quiser remover os volumes (incluindo banco de dados), você pode executar o comando:

```bash
docker compose down -v
```

## Funcionalidades

### Salas de Reunião

- Criar, editar e listar salas
- Cada sala possui nome único e capacidade
- Validações:
  - Capacidade deve ser um número inteiro maior que zero
  - Não permite remover sala com agendamentos futuros

### Agendamentos

- Criar, editar e listar agendamentos
- Cada agendamento possui: data, horário de início, horário de término, título e descrição opcional
- Validações:
  - Não permite agendamentos no passado
  - Horário de término deve ser maior que o de início
  - Não permite conflitos de horário na mesma sala e data
  - Todos os campos obrigatórios validados

### Visualização

- Filtros por sala e/ou data
- Agendamentos exibidos em ordem cronológica
- Aviso quando não há agendamentos

## Arquitetura

```
.
├── backend/                 # API Express/Node.js
│   ├── src/
│   │   ├── models/         # Modelo de banco de dados
│   │   ├── routes/         # Rotas da API
│   │   ├── middleware/     # Validação
│   │   └── server.js       # Servidor principal
│   ├── Dockerfile
│   └── package.json
├── frontend/               # Aplicação React
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── index.js
│   ├── Dockerfile
│   ├── tailwind.config.js
│   └── package.json
├── docker/                 # Scripts SQL
│   └── banco.sql           # Script de inicialização do banco
├── docker-compose.yml
└── README.md
```

## Tecnologias Utilizadas

- **Node.js** 18
- **Express.js** 4.18
- **PostgreSQL** 15
- **pg**
- **React** 18.2
- **TailwindCSS** 3.3
- **Axios**
- **Docker**

## Endpoints

### Salas

- `GET /api/salas` - Lista todas as salas
- `GET /api/salas/:id` - Busca sala por ID
- `POST /api/salas` - Cria uma nova sala
- `PUT /api/salas/:id` - Atualiza a sala
- `DELETE /api/salas/:id` - Remove a sala

### Agendamentos

- `GET /api/agendamentos` - Lista agendamentos (query params: `sala_id`, `data`)
- `GET /api/agendamentos/:id` - Busca agendamento por ID
- `POST /api/agendamentos` - Cria novo agendamento
- `PUT /api/agendamentos/:id` - Atualiza agendamento
- `DELETE /api/agendamentos/:id` - Remove agendamento

### Health Check

- `GET /api/health` - Verifica o status do servidor e banco de dados

## Variáveis de Ambiente

### Backend

As variáveis de ambiente do backend estão configuradas no `docker-compose.yml` com os seguintes dados para teste:

- `NODE_ENV`: ambiente (production)
- `PORT`: porta do servidor (5000 dentro do container, mapeado para 5001 no host)
- `DB_HOST`: host do banco (postgres)
- `DB_PORT`: porta do banco (5432)
- `DB_NAME`: nome do banco (sala_reuniao)
- `DB_USER`: usuário do banco (postgres)
- `DB_PASSWORD`: senha do banco (postgres)

### Frontend

- `REACT_APP_API_URL`: URL da API backend (http://localhost:5001)

## Estrutura do Banco de Dados

### Tabela: salas
- `id` (SERIAL PRIMARY KEY)
- `nome` (VARCHAR(100) UNIQUE)
- `capacidade` (INTEGER > 0)
- `created_at`, `updated_at` (TIMESTAMP)

### Tabela: agendamentos
- `id` (SERIAL PRIMARY KEY)
- `sala_id` (INTEGER, FOREIGN KEY)
- `data` (DATE)
- `horario_inicio` (TIME)
- `horario_fim` (TIME)
- `titulo` (VARCHAR(255))
- `descricao` (TEXT)
- `created_at`, `updated_at` (TIMESTAMP)

## Licença

Este projeto foi desenvolvido como teste prático.

## Testes Automatizados

Desenvolvi para complementar esse projeto testes automatizados cobrindo todas as regras de negócio.

Ao executar `docker compose up --build`, todas as dependências (incluindo Jest e outras ferramentas de teste) são instaladas automaticamente nos containers.

### Executar Testes

**Todos os testes de uma só vez com o script:**
```bash
./scripts/run-tests-docker.sh
```

ou

**Apenas backend:**
```bash
docker compose --profile test run --rm backend-test
```

**Apenas frontend:**
```bash
docker compose --profile test run --rm frontend-test
```

### Resultados dos Testes em Ambiente Local

**Backend:**
- **65 testes passaram** com sucesso
- **4 suites de teste** executadas:
  - `agendamentos.test.js`: 30 testes (regras de negócio e CRUD)
  - `salas.test.js`: 17 testes (regras de negócio e CRUD)
  - `integration.test.js`: 5 testes (fluxo completo)
  - `validation.test.js`: 8 testes (middleware de validação)
- **Cobertura de código**: 78.66% de statements, 70.58% de branches, 92.3% de funções
- Todos os testes executados em **1.278 segundos**

**Frontend:**
- Testes executados com sucesso
- Cobertura de código gerada para componentes React