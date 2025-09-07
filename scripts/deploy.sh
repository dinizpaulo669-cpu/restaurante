#!/bin/bash

# Script de deploy para Render
echo "🚀 Iniciando deploy do RestaurantePro..."

# Verificar se as variáveis estão definidas
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ Erro: SUPABASE_URL não definida"
    exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
    echo "❌ Erro: SESSION_SECRET não definida"
    exit 1
fi

echo "✅ Variáveis de ambiente verificadas"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Build da aplicação
echo "🔨 Fazendo build da aplicação..."
npm run build

# Verificar se o build foi bem-sucedido
if [ ! -f "dist/index.js" ]; then
    echo "❌ Erro: Build falhou - arquivo dist/index.js não encontrado"
    exit 1
fi

echo "✅ Build concluído com sucesso"

# Executar migrations do banco
echo "🗄️ Sincronizando schema do banco..."
npm run db:push --force

echo "🎉 Deploy concluído com sucesso!"
echo "🌐 Aplicação disponível na URL fornecida pelo Render"