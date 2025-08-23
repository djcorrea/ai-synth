#!/bin/bash

# 🔥 SCRIPT EMERGENCIAL: Configurar Firebase Service Account no Vercel
# Execute este script após obter o service account do Firebase

echo "🚨 CONFIGURAÇÃO EMERGENCIAL VERCEL + FIREBASE"
echo "============================================="

echo ""
echo "📋 PASSOS OBRIGATÓRIOS:"
echo ""
echo "1️⃣  OBTER SERVICE ACCOUNT:"
echo "   - Acesse: https://console.firebase.google.com"
echo "   - Selecione seu projeto SOUNDY.AI"
echo "   - Project Settings → Service Accounts"
echo "   - 'Generate new private key'"
echo "   - Baixe o arquivo JSON"
echo ""

echo "2️⃣  CONFIGURAR NO VERCEL:"
echo "   - Acesse: https://vercel.com/dashboard"
echo "   - Projeto SOUNDY.AI → Settings → Environment Variables"
echo "   - Nome: FIREBASE_SERVICE_ACCOUNT"
echo "   - Valor: COLE TODO O CONTEÚDO DO JSON"
echo "   - Environment: Production, Preview, Development"
echo ""

echo "3️⃣  VERIFICAR FORMATO JSON:"
echo "   EXEMPLO CORRETO:"
echo '   {'
echo '     "type": "service_account",'
echo '     "project_id": "seu-projeto-firebase",'
echo '     "private_key_id": "abc123...",'
echo '     "private_key": "-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----\\n",'
echo '     "client_email": "firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com",'
echo '     "client_id": "123456789",'
echo '     "auth_uri": "https://accounts.google.com/o/oauth2/auth",'
echo '     "token_uri": "https://oauth2.googleapis.com/token",'
echo '     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",'
echo '     "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40seu-projeto.iam.gserviceaccount.com"'
echo '   }'
echo ""

echo "4️⃣  OUTRAS VARIÁVEIS NECESSÁRIAS:"
echo "   - OPENAI_API_KEY = sua-chave-openai"
echo "   - NODE_ENV = production"
echo ""

echo "5️⃣  REDEPLOY APÓS CONFIGURAR:"
echo "   vercel --prod"
echo ""

echo "🔗 LINKS ÚTEIS:"
echo "   Firebase Console: https://console.firebase.google.com"
echo "   Vercel Dashboard: https://vercel.com/dashboard"
echo "   Sua App: https://ai-synth-5kdsl7naq-dj-correas-projects.vercel.app"
echo ""

echo "⚠️  ATENÇÃO CRÍTICA:"
echo "   - A private_key deve ter \\n literais (quebras de linha)"
echo "   - JSON deve ser válido (use validador online)"
echo "   - Service account deve ter permissões Firebase Admin"
echo ""

read -p "Pressione ENTER após configurar as variáveis no Vercel..."

echo ""
echo "🧪 TESTANDO APÓS CONFIGURAÇÃO..."
echo "Verificando se a aplicação responde..."

curl -X POST https://ai-synth-5kdsl7naq-dj-correas-projects.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "teste emergencial",
    "idToken": "test-token",
    "conversationHistory": []
  }' \
  --max-time 30 \
  --silent \
  --show-error

echo ""
echo "✅ Se funcionou, parabéns!"
echo "❌ Se deu erro, verifique:"
echo "   1. Service account configurado corretamente"
echo "   2. JSON válido"
echo "   3. Variáveis salvas em Production"
echo "   4. Redeploy feito após configurar"
