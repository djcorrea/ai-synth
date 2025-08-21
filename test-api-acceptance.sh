#!/bin/bash
# Bateria de testes para API de chat

BASE_URL="https://ai-synth.vercel.app"
# Para teste local: BASE_URL="http://localhost:3000"

echo "🧪 Iniciando testes da API de chat..."

# Teste 1: Sucesso com texto simples
echo "Test 1: Texto simples"
curl -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Olá, teste básico","idToken":"FIREBASE_TOKEN_AQUI","conversationHistory":[]}' \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n\n"

# Teste 2: Erro de autenticação
echo "Test 2: Token inválido"
curl -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"teste","idToken":"invalid-token","conversationHistory":[]}' \
  -w "\nStatus: %{http_code}\n\n"

# Teste 3: Payload inválido
echo "Test 3: Payload inválido"
curl -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"","idToken":""}' \
  -w "\nStatus: %{http_code}\n\n"

# Teste 4: CORS preflight
echo "Test 4: CORS OPTIONS"
curl -X OPTIONS "$BASE_URL/api/chat" \
  -H "Origin: https://ai-synth.vercel.app" \
  -w "\nStatus: %{http_code}\n\n"

echo "✅ Testes concluídos"
