# 🔧 Configuração Vercel + Firebase - CORRIGIDA

## ❌ Problemas Identificados nos Logs
1. **Firebase Authentication Error**: `16 UNAUTHENTICATED` - Service account não configurado
2. **ReferenceError**: `decoded is not defined` - Variável fora de escopo (✅ CORRIGIDO)

## 🔐 Configurar Variáveis de Ambiente no Vercel

### 1. Acessar Configurações
```
1. Acesse: https://vercel.com/dashboard
2. Clique no seu projeto Soundy.AI
3. Vá em "Settings" → "Environment Variables"
```

### 2. Adicionar Variáveis Necessárias

#### FIREBASE_SERVICE_ACCOUNT
```json
{
  "type": "service_account",
  "project_id": "seu-projeto-id",
  "private_key_id": "sua-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nsua-private-key-aqui\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com",
  "client_id": "seu-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40seu-projeto.iam.gserviceaccount.com"
}
```

#### OPENAI_API_KEY
```
sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### NODE_ENV
```
production
```

### 3. Obter Service Account do Firebase

#### Pelo Console Firebase:
```
1. Acesse: https://console.firebase.google.com
2. Selecione seu projeto
3. Vá em "Project Settings" (ícone de engrenagem)
4. Aba "Service Accounts"
5. Clique em "Generate new private key"
6. Baixe o arquivo JSON
7. Copie TODO o conteúdo JSON para a variável FIREBASE_SERVICE_ACCOUNT
```

#### Pelo Google Cloud Console:
```
1. Acesse: https://console.cloud.google.com
2. Selecione o projeto Firebase
3. Menu → "IAM & Admin" → "Service Accounts"
4. Encontre a conta firebase-adminsdk-xxxxx@xxx.iam.gserviceaccount.com
5. Clique nos 3 pontos → "Manage keys"
6. "Add Key" → "Create new key" → "JSON"
7. Baixe e copie o conteúdo para Vercel
```

### 4. Configuração no Vercel

#### Interface Web:
```
1. Nome: FIREBASE_SERVICE_ACCOUNT
2. Valor: Cole TODO o JSON do service account
3. Environment: Production, Preview, Development
4. Clique "Save"

2. Nome: OPENAI_API_KEY  
3. Valor: sua-chave-openai
4. Environment: Production, Preview, Development
5. Clique "Save"

3. Nome: NODE_ENV
4. Valor: production
5. Environment: Production
6. Clique "Save"
```

#### Via CLI Vercel:
```bash
# Instalar CLI se não tiver
npm i -g vercel

# Login
vercel login

# Adicionar variáveis
vercel env add FIREBASE_SERVICE_ACCOUNT
# Cole o JSON quando solicitado

vercel env add OPENAI_API_KEY
# Cole a chave da OpenAI

vercel env add NODE_ENV
# Digite: production
```

### 5. Testar Configuração

#### 1. Redeploy:
```bash
vercel --prod
```

#### 2. Verificar Logs:
```bash
vercel logs --url=sua-url-vercel.vercel.app
```

#### 3. Teste Manual:
```bash
curl -X POST https://sua-url-vercel.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "teste",
    "idToken": "token-valido-aqui",
    "conversationHistory": []
  }'
```

## 🔍 Verificações de Segurança

### Service Account Permissions:
```
- Firebase Authentication Admin
- Cloud Firestore User
- Firestore Database User
```

### Formato da Private Key:
```
⚠️  A private_key deve incluir os \n literais:
"private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADA...sua-key...==\n-----END PRIVATE KEY-----\n"
```

### JSON Válido:
```
✅ Use um validador JSON online para verificar
✅ Escape aspas duplas se necessário
✅ Mantenha quebras de linha como \n
```

## 🚀 Deploy e Teste

### 1. Após configurar variáveis:
```bash
# Redeploy forçado
vercel --prod --force

# Verificar status
vercel ls
```

### 2. Monitorar logs em tempo real:
```bash
vercel logs --follow
```

### 3. Teste de produção:
```
Acesse: https://sua-url-vercel.vercel.app
Teste o chat com imagens
Verifique console do navegador
```

## ✅ Problemas Comuns Resolvidos

### 1. "decoded is not defined"
- ✅ **CORRIGIDO**: Movida declaração para escopo correto

### 2. "FIREBASE_SERVICE_ACCOUNT not found"
- Verificar se variável foi salva no Vercel
- Verificar se está em todas as environments (prod, preview, dev)

### 3. "Firebase Admin authentication failed"
- Verificar formato JSON do service account
- Verificar permissões da service account
- Verificar se project_id está correto

### 4. "Invalid private key"
- Verificar se \n estão presentes na private_key
- Verificar se não há caracteres extras/quebras

## 🎯 Status Atual
- ✅ Erro "decoded is not defined" corrigido
- ⏳ Aguardando configuração Firebase no Vercel
- ⏳ Aguardando redeploy para teste

## 📞 Próximos Passos
1. Configure FIREBASE_SERVICE_ACCOUNT no Vercel
2. Configure OPENAI_API_KEY no Vercel  
3. Faça redeploy: `vercel --prod`
4. Teste a aplicação
5. Verifique logs se houver problemas
