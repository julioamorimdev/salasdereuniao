#!/bin/bash

# Script para instalar dependências necessárias para os testes

echo "Instalando dependências para os testes..."
echo ""

# Instalar dependências do backend
echo "Instalando dependências do backend..."
cd backend
if npm install; then
    echo "Backend: Dependências instaladas com sucesso!"
else
    echo "Backend: Erro ao instalar dependências"
    exit 1
fi
cd ..

# Instalar dependências do frontend
echo ""
echo "🔧 Instalando dependências do frontend..."
cd frontend
if npm install; then
    echo "Frontend: Dependências instaladas com sucesso!"
else
    echo "Frontend: Erro ao instalar dependências"
    exit 1
fi
cd ..

# Instalar dependências da raiz (se houver)
echo ""
echo "Instalando dependências da raiz..."
if npm install; then
    echo "Raiz: Dependências instaladas com sucesso!"
else
    echo "Raiz: Algumas dependências podem não ter sido instaladas (normal se não houver)"
fi

echo ""
echo "Todas as dependências foram instaladas!"
echo ""
echo "Você pode agora executar os testes com:"
echo "   npm test"
echo ""

# Verificar se Jest foi instalado
echo "Verificando instalação do Jest..."
if [ -d "backend/node_modules/jest" ]; then
    echo "Jest encontrado no backend"
else
    echo "Jest não encontrado no backend - pode haver problemas"
fi

if [ -d "frontend/node_modules" ]; then
    echo "Frontend node_modules encontrado"
else
    echo "Frontend node_modules não encontrado"
fi