#!/bin/bash
# Sobe o site Florescer
cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
  echo "Instalando dependências (primeira vez)..."
  npm install
fi

if [ ! -f "data/florescer.db" ]; then
  echo "Criando banco de dados..."
  node seed.js
fi

echo ""
echo "========================================="
echo "  Florescer no ar: http://localhost:3001"
echo "  Pare com Ctrl+C"
echo "========================================="
echo ""
node server.js
