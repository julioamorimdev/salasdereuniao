#!/bin/bash

# Script para executar testes dentro do Docker
# Usa 'docker compose' (sem hífen) para compatibilidade com Docker Compose v2+

# Detectar qual comando usar (docker compose ou docker-compose)
if docker compose version > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
elif docker-compose version > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "Erro: docker compose não encontrado!"
    echo "   Por favor, instale Docker Compose v2 ou superior"
    exit 1
fi

echo "Executando testes automatizados no Docker..."
echo ""

# Verificar se o PostgreSQL está rodando
if ! $DOCKER_COMPOSE ps 2>/dev/null | grep -q "sala_reuniao_db"; then
    echo "PostgreSQL não está rodando. Iniciando..."
    $DOCKER_COMPOSE up -d postgres
    echo "Aguardando PostgreSQL ficar pronto..."
    sleep 10
fi

echo "Executando testes do backend..."
$DOCKER_COMPOSE --profile test run --rm backend-test

if [ $? -eq 0 ]; then
    echo ""
    echo "Testes do backend concluídos com sucesso!"
else
    echo ""
    echo "Testes do backend falharam!"
    exit 1
fi

echo ""
echo "Executando testes do frontend..."
$DOCKER_COMPOSE --profile test run --rm frontend-test

if [ $? -eq 0 ]; then
    echo ""
    echo "Testes do frontend concluídos com sucesso!"
else
    echo ""
    echo "Testes do frontend falharam!"
    exit 1
fi

echo ""
echo "Todos os testes foram executados com sucesso!"
