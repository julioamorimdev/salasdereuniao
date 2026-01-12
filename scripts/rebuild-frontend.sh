#!/bin/bash

# Script para reconstruir o container do frontend e resolver problemas de dependências

echo "Parando container do frontend..."
docker compose stop frontend

echo "Removendo container do frontend..."
docker compose rm -f frontend

echo "Removendo volumes órfãos relacionados ao node_modules..."
docker volume prune -f

echo "Reconstruindo imagem do frontend (sem cache)..."
docker compose build --no-cache frontend

echo "Iniciando container do frontend..."
docker compose up -d frontend

echo "Verificando logs do frontend..."
docker compose logs -f frontend
