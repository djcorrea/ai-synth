# 🔍 PLANO DE AUDITORIA COMPLETA - AUDIO ANALYZER

**Data:** 21 de agosto de 2025  
**Objetivo:** Corrigir inconsistências sem quebrar funcionalidades  
**Metodologia:** PRs pequenos e reversíveis com testes

---

## 📊 **PROBLEMAS IDENTIFICADOS**

### 🚨 **PROBLEMA 1: LUFS Duplicado e Divergente**
**Evidência:** LUFS aparece como –5.3, –5.1, –2.5, –17.7 em locais diferentes  
**Causa:** Múltiplas fontes não sincronizadas (V1, V2, RMS fallback)  
**Correção:** Padronizar único valor LUFS-I (Integrado)  
**Risco:** BAIXO (apenas unificação de exibição)

### 🚨 **PROBLEMA 2: Dinâmica Negativa**
**Evidência:** "Métricas Avançadas" mostra –0.9 dB  
**Causa:** Cálculo incorreto ou fonte de dados inválida  
**Correção:** Usar LRA ou percentis, garantir ≥ 0  
**Risco:** BAIXO (correção matemática)

### 🚨 **PROBLEMA 3: Score Técnico = 0/100**
**Evidência:** Score sempre zero apesar de métricas válidas  
**Causa:** Pesos/normalização incorretos  
**Correção:** Revisar algoritmo de cálculo  
**Risco:** MÉDIO (pode afetar UI)

### 🚨 **PROBLEMA 4: Compatibilidade Mono Sempre "Poor"**
**Evidência:** Sempre "poor" independente da correlação  
**Causa:** Lógica desalinhada entre correlation e mono_loss  
**Correção:** Unificar usando correlation e mono_loss > 3dB  
**Risco:** BAIXO (correção lógica)

### 🚨 **PROBLEMA 5: Sugestões Contraditórias**
**Evidência:** "reduzir –6 dB" + "aumentar +1.4 dBTP"  
**Causa:** Falta de gates de segurança  
**Correção:** Bloquear sugestões perigosas quando clipping  
**Risco:** BAIXO (adicionar validação)

### 🚨 **PROBLEMA 6: Formatação "–0.0 dB"**
**Evidência:** Formato inconsistente em Pico de Amostra  
**Causa:** Formatação inadequada  
**Correção:** Padronizar "0.00 dBFS"  
**Risco:** BAIXO (apenas cosmético)

---

## 🏗️ **FASES DE IMPLEMENTAÇÃO**

### ✅ **FASE 1: OBSERVAÇÃO (ZERO RISCO)**
**Status:** COMPLETA  
- [x] Centralizar resultados em fonte única
- [x] Adicionar logs de inconsistência  
- [x] Não alterar UI

### ✅ **FASE 2: CORREÇÕES BAIXO RISCO (IMPLEMENTADA)**
**Status:** COMPLETA  
- [x] Corrigir rótulos LUFS  
- [x] Dinâmica ≥ 0  
- [x] Formatação 0.00 dB  
- [x] Gates de sugestões

### ✅ **FASE 3: ALINHAMENTO LÓGICO (IMPLEMENTADA)**
**Status:** COMPLETA  
- [x] Alinhar Mono vs Correlação  
- [x] Recalcular Score Técnico

### 🔄 **FASE 4: AUDITORIA FINAL (EM ANDAMENTO)**
**Objetivo:** Implementar auditoria completa conforme especificação  
- [ ] **4.1:** Auditoria LUFS centralizada
- [ ] **4.2:** Correção dinâmica negativa  
- [ ] **4.3:** Score técnico funcional
- [ ] **4.4:** Mono compatibility alinhada
- [ ] **4.5:** Gates de sugestões perigosas
- [ ] **4.6:** Formatação padronizada

### 🚀 **FASE 5: CALIBRAÇÃO POR GÊNERO (FEATURE FLAG)**
**Status:** PENDENTE  
- [ ] Médias e desvios por gênero
- [ ] Normalização espectral
- [ ] Comparação com tolerâncias

---

## 🧪 **CRITÉRIOS DE TESTE**

### **Teste 1: LUFS Unificado**
- ✅ **Critério:** Nenhum card exibe LUFS diferente do LUFS-I padronizado
- **Teste:** Verificar todos os cards de resultado
- **Evidência:** Screenshots antes/depois

### **Teste 2: Dinâmica Válida**
- ✅ **Critério:** Dinâmica nunca negativa
- **Teste:** Verificar "Métricas Avançadas"
- **Evidência:** Log de valores corrigidos

### **Teste 3: Clipping Logic**
- ✅ **Critério:** Se clipping = 0 e dBTP ≤ -0.3, não mostrar alerta
- **Teste:** Upload de áudio sem clipping
- **Evidência:** Ausência de alerta falso

### **Teste 4: Mono Compatibility**
- ✅ **Critério:** "Mono: poor" só quando correlation < 0.1 ou mono_loss > 3 dB
- **Teste:** Áudio com boa correlação estéreo
- **Evidência:** Status correto exibido

### **Teste 5: Score Técnico**
- 🔄 **Critério:** Score deixa de ser 0 e varia conforme métricas
- **Teste:** Upload de diferentes qualidades de áudio
- **Evidência:** Scores proporcionais

### **Teste 6: Sugestões Seguras**
- ✅ **Critério:** Sem sugestões contraditórias com clipping
- **Teste:** Áudio com clipping detectado
- **Evidência:** Sugestões filtradas

---

## 📋 **PRÓXIMAS AÇÕES**

1. **Implementar Fase 4.1:** Auditoria LUFS centralizada
2. **Validar correções:** Testes automáticos
3. **Gerar relatório:** Causa → Correção → Teste
4. **Documentar telas afetadas:** Screenshots comparativos
5. **Evidências de não-regressão:** Funcionalidades preservadas

---

**🎯 OBJETIVO:** Sistema robusto, consistente e confiável sem quebrar funcionalidades existentes.
