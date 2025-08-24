# AUDITORIA DAS MÉTRICAS MÉDIAS - FUNK MANDELA

**Data:** 24 de agosto de 2025  
**Objetivo:** Verificar se as médias de cada métrica no JSON estão corretas  
**Status:** ✅ AUDITORIA CONCLUÍDA  

---

## 📋 RESUMO EXECUTIVO

🔍 **METODOLOGIA IDENTIFICADA:**
- O sistema **NÃO usa média aritmética simples**
- Utiliza **MEDIANA estatística** para robustez contra outliers
- Isso é o comportamento **CORRETO** e esperado

📊 **DADOS ANALISADOS:**
- **17 faixas WAV** declaradas no JSON
- **22 detecções True Peak** (múltiplas por faixa)
- **11 faixas com análise completa** (LRA, DR, Estéreo)
- **Base:** logs de calibração em `refs/out/calib-funk_mandela.txt`

---

## 🔍 VERIFICAÇÃO DETALHADA POR MÉTRICA

### 📌 TRUE PEAK
- **Valores extraídos:** 22 detecções
- **Dados:** -10.38, -10.38, -11.03, -11.03, -11.69, -11.69, -11.68, -11.68, -7.66, -7.66, -10.86, -10.86, -10.78, -10.78, -12.61, -12.61, -11.66, -11.66, -9.29, -9.29, -6.06, -6.06
- **Soma:** -227.40 dBTP
- **Média aritmética:** -10.34 dBTP
- **Mediana:** -10.86 dBTP
- **JSON target:** -10.9 dBTP
- **✅ STATUS:** **CORRETO** (usando mediana)

### 📌 LRA (Loudness Range)
- **Valores extraídos:** 11 faixas
- **Dados:** 7.6, 11.5, 6.3, 11.6, 7.7, 11.0, 8.3, 7.0, 10.0, 14.2, 9.9
- **Soma:** 105.10 LU
- **Média aritmética:** 9.55 LU
- **Mediana:** 9.90 LU
- **JSON target:** 9.9 LU
- **✅ STATUS:** **CORRETO** (usando mediana)

### 📌 DYNAMIC RANGE
- **Valores extraídos:** 11 faixas
- **Dados:** 7.1, 7.2, 7.0, 6.2, 9.7, 6.9, 7.5, 5.3, 6.8, 8.1, 11.6
- **Soma:** 83.40
- **Média aritmética:** 7.58
- **Mediana:** 7.10
- **JSON target:** 8.0
- **⚠️ STATUS:** **DISCREPÂNCIA DETECTADA**

### 📌 CORRELAÇÃO ESTÉREO
- **Larguras extraídas:** 11 faixas
- **Larguras:** 0.130, 0.180, 0.270, 0.200, 0.280, 0.120, 0.320, 0.170, 0.250, 0.150, 0.400
- **Correlações:** 0.740, 0.640, 0.460, 0.600, 0.440, 0.760, 0.360, 0.660, 0.500, 0.700, 0.200
- **Correlação mediana:** 0.600
- **JSON target:** 0.6
- **✅ STATUS:** **CORRETO** (usando mediana)

### 📌 LUFS (Informativo)
- **Valores extraídos:** 11 faixas
- **Dados:** -5.5, -4.8, -4.2, -4.2, -8.2, -5.0, -5.1, -3.5, -4.2, -6.6, -9.8
- **Mediana:** -5.00 LUFS
- **JSON target:** -8.0 LUFS
- **📝 NOTA:** LUFS é fixo por design (-8), não calculado das amostras

---

## ⚠️ PROBLEMA IDENTIFICADO

### 🔍 Dynamic Range Incorreto

**Situação:**
- **Mediana calculada dos dados:** 7.1
- **Valor atual no JSON:** 8.0
- **Diferença:** +0.9 (12.7% acima do correto)

**Causa Provável:**
- Possível uso de valor antigo ou método de cálculo diferente
- Pode estar usando dados de processamento diferente dos logs atuais

**Impacto:**
- Target muito alto pode causar falsos negativos
- Faixas com DR 7.1-7.9 serão incorretamente penalizadas

---

## 📊 EXPLICAÇÃO DAS DISCREPÂNCIAS NUMÉRICAS

### 🎯 Por que 17 tracks vs 11 análises?

1. **17 faixas WAV:** Número total de arquivos válidos encontrados
2. **11 análises completas:** Faixas que passaram por todo o pipeline
3. **22 True Peaks:** Algumas faixas têm múltiplas detecções

### 🎯 Por que usar mediana em vez de média?

1. **Robustez a outliers:** Mediana não é afetada por valores extremos
2. **Melhor representação:** Para dados não-gaussianos
3. **Padrão da indústria:** Comum em análise de áudio

**Exemplo com True Peak:**
- **Média aritmética:** -10.34 dBTP
- **Mediana:** -10.86 dBTP
- **Outliers:** -6.06 dBTP (muito alto) puxaria a média para cima

---

## ✅ CONCLUSÕES

### 🎯 Status das Métricas

| Métrica | Status | Valor Correto | Valor JSON | Ação |
|---------|---------|---------------|------------|------|
| **True Peak** | ✅ | -10.9 dBTP | -10.9 dBTP | Nenhuma |
| **LRA** | ✅ | 9.9 LU | 9.9 LU | Nenhuma |
| **Estéreo** | ✅ | 0.6 | 0.6 | Nenhuma |
| **DR** | ❌ | 7.1 | 8.0 | **Correção necessária** |
| **LUFS** | ➖ | -5.0 | -8.0 | Fixo por design |

### 🔧 Recomendações

1. **Correção do DR:** Atualizar de 8.0 para 7.1
2. **Validação:** Executar nova análise para confirmar
3. **Monitoramento:** Verificar impacto na análise de usuários

### 📝 Observações Finais

- **Metodologia CORRETA:** Uso de mediana é apropriado
- **Dados VÁLIDOS:** Base de 11-22 amostras é estatisticamente suficiente
- **Sistema ROBUSTO:** Apenas 1 métrica precisa correção

---

**Documento gerado automaticamente**  
**Sistema:** AI-Synth Metrics Auditor v1.0  
**Timestamp:** 2025-08-24T[timestamp]
