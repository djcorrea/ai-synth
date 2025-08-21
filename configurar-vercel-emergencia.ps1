# 🔥 SCRIPT EMERGENCIAL: Configurar Firebase Service Account no Vercel
# Execute este script após obter o service account do Firebase

Write-Host "🚨 CONFIGURAÇÃO EMERGENCIAL VERCEL + FIREBASE" -ForegroundColor Red
Write-Host "=============================================" -ForegroundColor Yellow

Write-Host ""
Write-Host "📋 PASSOS OBRIGATÓRIOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  OBTER SERVICE ACCOUNT:" -ForegroundColor Green
Write-Host "   - Acesse: https://console.firebase.google.com" -ForegroundColor White
Write-Host "   - Selecione seu projeto AI.SYNTH" -ForegroundColor White
Write-Host "   - Project Settings → Service Accounts" -ForegroundColor White
Write-Host "   - 'Generate new private key'" -ForegroundColor White
Write-Host "   - Baixe o arquivo JSON" -ForegroundColor White
Write-Host ""

Write-Host "2️⃣  CONFIGURAR NO VERCEL:" -ForegroundColor Green
Write-Host "   - Acesse: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "   - Projeto AI.SYNTH → Settings → Environment Variables" -ForegroundColor White
Write-Host "   - Nome: FIREBASE_SERVICE_ACCOUNT" -ForegroundColor Yellow
Write-Host "   - Valor: COLE TODO O CONTEÚDO DO JSON" -ForegroundColor Yellow
Write-Host "   - Environment: Production, Preview, Development" -ForegroundColor White
Write-Host ""

Write-Host "3️⃣  VERIFICAR FORMATO JSON:" -ForegroundColor Green
Write-Host "   EXEMPLO CORRETO:" -ForegroundColor White
Write-Host @'
   {
     "type": "service_account",
     "project_id": "seu-projeto-firebase",
     "private_key_id": "abc123...",
     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com",
     "client_id": "123456789",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40seu-projeto.iam.gserviceaccount.com"
   }
'@ -ForegroundColor Gray
Write-Host ""

Write-Host "4️⃣  OUTRAS VARIÁVEIS NECESSÁRIAS:" -ForegroundColor Green
Write-Host "   - OPENAI_API_KEY = sua-chave-openai" -ForegroundColor White
Write-Host "   - NODE_ENV = production" -ForegroundColor White
Write-Host ""

Write-Host "5️⃣  REDEPLOY APÓS CONFIGURAR:" -ForegroundColor Green
Write-Host "   vercel --prod" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔗 LINKS ÚTEIS:" -ForegroundColor Cyan
Write-Host "   Firebase Console: https://console.firebase.google.com" -ForegroundColor Blue
Write-Host "   Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor Blue
Write-Host "   Sua App: https://ai-synth-5kdsl7naq-dj-correas-projects.vercel.app" -ForegroundColor Blue
Write-Host ""

Write-Host "⚠️  ATENÇÃO CRÍTICA:" -ForegroundColor Red
Write-Host "   - A private_key deve ter \n literais (quebras de linha)" -ForegroundColor White
Write-Host "   - JSON deve ser válido (use validador online)" -ForegroundColor White
Write-Host "   - Service account deve ter permissões Firebase Admin" -ForegroundColor White
Write-Host ""

Read-Host "Pressione ENTER após configurar as variáveis no Vercel"

Write-Host ""
Write-Host "🧪 TESTANDO APÓS CONFIGURAÇÃO..." -ForegroundColor Yellow
Write-Host "Verificando se a aplicação responde..." -ForegroundColor White

try {
    $headers = @{
        'Content-Type' = 'application/json'
    }
    
    $body = @{
        message = 'teste emergencial'
        idToken = 'test-token'
        conversationHistory = @()
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri 'https://ai-synth-5kdsl7naq-dj-correas-projects.vercel.app/api/chat' -Method POST -Headers $headers -Body $body -TimeoutSec 30
    
    Write-Host "✅ SUCESSO! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Resposta: $($response.Content)" -ForegroundColor Gray
}
catch {
    Write-Host "❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 VERIFIQUE:" -ForegroundColor Yellow
    Write-Host "   1. Service account configurado corretamente" -ForegroundColor White
    Write-Host "   2. JSON válido" -ForegroundColor White
    Write-Host "   3. Variáveis salvas em Production" -ForegroundColor White
    Write-Host "   4. Redeploy feito após configurar" -ForegroundColor White
}

Write-Host ""
Write-Host "🚀 PRÓXIMOS PASSOS:" -ForegroundColor Green
Write-Host "   1. Configure Firebase Service Account no Vercel" -ForegroundColor White
Write-Host "   2. Faça redeploy: vercel --prod" -ForegroundColor White
Write-Host "   3. Teste novamente" -ForegroundColor White
