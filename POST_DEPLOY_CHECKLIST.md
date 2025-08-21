# 📊 CHECKLIST PÓS-DEPLOY

## ✅ Verificações Imediatas:
- [ ] Status 200 para requests válidos
- [ ] Status 401 para tokens inválidos  
- [ ] Status 400 para payload malformado
- [ ] CORS funcionando (Origin headers)
- [ ] Tempo de resposta < 5s para texto simples
- [ ] Tempo de resposta < 15s para análise de imagens

## 📈 Métricas de Sucesso:
- [ ] Taxa de erro 500 < 1%
- [ ] Tempo médio de resposta < 3s
- [ ] Rate limit 429 funcionando corretamente
- [ ] Logs estruturados visíveis em `vercel logs`

## 🔍 Comandos de Debug:
```bash
# Ver logs em tempo real
vercel logs --follow

# Verificar variáveis de ambiente
vercel env ls

# Testar API rapidamente
curl -X POST https://ai-synth.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"teste health check","idToken":"VALID_TOKEN","conversationHistory":[]}'
```

## 🚨 Sinais de Problemas:
- HTTP 500 persistindo
- "FIREBASE_SERVICE_ACCOUNT environment variable is required" nos logs
- "Cannot set headers after they are sent" nos logs  
- Timeout em chamadas OpenAI
- CORS errors no frontend

## 🔧 Rollback Plan:
Se houver problemas críticos:
```bash
git revert HEAD
git push origin main
```
