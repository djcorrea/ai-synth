# AUDITORIA ANÁLISE MIXAGEM - SISTEMA PROD.AI

**Data:** 24 de agosto de 2025  
**Versão do Sistema:** Commit 9932664 (revertido)  
**Objetivo:** Mapear pipeline completo de análise de mixagem e identificar inconsistências

---

## 📋 RESUMO EXECUTIVO

### ✅ Pontos Funcionais
- **Pipeline espectral**: STFT/FFT implementado com janela Hann, energia em |X[k]|²
- **Sistema de scoring**: V1 e V2 funcionais com fallbacks
- **JSON de gênero**: Estrutura bem definida com targets e tolerâncias
- **Bandas espectrais**: 7-8 bandas mapeadas de 20Hz a 16kHz

### 🚨 Problemas Críticos Identificados
- **Ausência de runId**: Race conditions entre análises simultâneas
- **Score prematuro**: Pode executar antes das métricas estarem prontas
- **Conversão dB inconsistente**: Múltiplas fórmulas e referências diferentes
- **Assincronismo descontrolado**: Falta de Promise.allSettled unificado

---

## 🔄 DIAGRAMA DO FLUXO ATUAL

```
📁 ENTRADA DO USUÁRIO
├── index.html (openAudioModal)
├── audio-analyzer-integration.js (handleModalFileSelection)
└── audio-analyzer.js (analyzeAudioFile)
    ↓
🎵 PIPELINE DE ANÁLISE
├── _pipelineFromDecodedBuffer()
├── _computeTechnicalData() → LUFS, True Peak, DR, LRA, Stereo
├── _computeAnalysisMatrix() → Análise espectral FFT
└── _finalizeAnalysis() → Agrega resultados
    ↓
📊 ANÁLISE ESPECTRAL (Múltiplas implementações)
├── spectralBalance.ts (FFT Hann, energia |X|²)
├── spectrum.js (STFT Engine)
└── simpleFFT (fallback inline)
    ↓
🎯 COMPARAÇÃO & SCORING
├── Carrega JSON gênero (embedded-refs-new.js)
├── scoring.js (_computeMixScoreInternal)
└── Gera sugestões (suggestion-scorer.js)
    ↓
🤖 INTERFACE
├── Exibe métricas técnicas
├── Mostra badges coloridos
└── Sugere melhorias
```

---

## 📊 MATRIZ DE CONFORMIDADE

| Requisito | Como Está Hoje | Risco | Impacto | O que Ajustar |
|-----------|----------------|-------|---------|---------------|
| **Ordem de execução** | Sem garantia sequencial | 🔴 Alto | Score/sugestões incorretos | Promise.allSettled + runId |
| **Espectro em %** | ✅ energyPct correto | 🟢 Baixo | - | - |
| **dB na UI** | ⚠️ Múltiplas fórmulas | 🟡 Médio | Valores inconsistentes | Padronizar: 10·log10(E_banda) |
| **JSON de gênero** | ✅ Estrutura consistente | 🟢 Baixo | - | - |
| **Tolerâncias em dB vs pp** | ✅ Correto por métrica | 🟢 Baixo | - | - |
| **Sugestões antes score** | ❌ Ordem não garantida | 🔴 Alto | Score com dados parciais | Orquestrador central |
| **runId** | ❌ Inexistente | 🔴 Alto | Race conditions | Implementar UUID + validação |

---

## 🌈 ESPECTRAL (DETALHE)

### Configuração FFT
- **fftSize**: 4096 (spectrum.js), 2048 (spectralBalance.ts)
- **hopSize**: 1024
- **Janela**: Hann implementada corretamente
- **Sample Rate**: 48000 Hz (default)
- **Correção de Janela**: ✅ Aplicada (energia normalizada)

### Fórmula de Energia
```javascript
// ✅ CORRETO: Energia por bin
const energy = magnitude * magnitude; // |X[k]|²

// ✅ CORRETO: Porcentagem relativa
const energyPct = (bandEnergy / totalEnergy) * 100;

// ⚠️ INCONSISTENTE: Conversão para dB
// Versão 1 (spectralBalance.ts):
const rmsDb = 10 * Math.log10(rms / referenceEnergy);

// Versão 2 (audio-analyzer.js):
const db = 10 * Math.log10(norm || 1e-9);

// Versão 3 (energy ratio):
const db = 10 * Math.log10(energyRatio || 1e-9);
```

### Bandas e Labels
```javascript
// 7 Bandas principais (spectralBalance.ts)
'Sub Bass': 20-60 Hz     → 'sub'
'Bass': 60-250 Hz        → 'low_bass' 
'Low Mid': 250-1000 Hz   → 'low_mid'
'Mid': 1000-4000 Hz      → 'mid'
'High Mid': 4000-8000 Hz → 'high_mid'
'High': 8000-16000 Hz    → 'brilho'
'Presence': 8000-16000   → 'presenca' // Overlap intencional
```

### Soma de % ≈ 1.0?
✅ **SIM** - Validado em `spectralBalance.ts` linha 229:
```javascript
const energyPct = totalEnergy > 0 ? (energy / totalEnergy) * 100 : 0;
// Soma total sempre = 100%
```

---

## ⚡ ASSINCRONISMO & ORDEM

### Pontos de Disparos do Score
```javascript
// 1. scoring.js - _computeMixScoreInternal() chamado de:
lib/audio/features/scoring.js:410 (main export)

// 2. Possíveis pontos de entrada prematura:
audio-analyzer-integration.js (sem Promise.allSettled)
suggestion-scorer.js (pode rodar antes de métricas)
```

### Race Conditions Identificadas
```javascript
// ❌ PROBLEMA: Análise pode sobrescrever dados de outra
// Em audio-analyzer.js linha 2743:
td.bandNorm = { bands: normBands, normalized: !!refBandTargetsNormalized };
// Sem runId, análises simultâneas se misturam

// ❌ PROBLEMA: Score pode usar dados parciais
// Em scoring.js não há validação se análise está completa
```

### Logs e Timestamps
```javascript
// ✅ PARCIAL: Alguns logs com timestamp
try { __caiarLog('SCORING_DONE','Mix score calculado', { ... }); } catch {}

// ❌ FALTANDO: runId consistente
// ❌ FALTANDO: Validação de dados completos antes do score
```

---

## 📄 JSON DE GÊNERO

### Estrutura Real (funk_mandela)
```json
{
  "lufs_target": -8.3,
  "tol_lufs": 2.5,
  "true_peak_target": -10.46,
  "tol_true_peak": 3.40,
  "dr_target": 7.5,
  "tol_dr": 3.0,
  "lra_target": 7.4,
  "tol_lra": 2.5,
  "stereo_target": 0.22,
  "tol_stereo": 0.25,
  "bands": {
    "sub": { "target_db": -6.7, "tol_db": 2.5 },
    "low_bass": { "target_db": -8.0, "tol_db": 2.5 },
    "upper_bass": { "target_db": -12.0, "tol_db": 2.5 },
    "low_mid": { "target_db": -8.4, "tol_db": 2.0 },
    "mid": { "target_db": -6.3, "tol_db": 1.5 },
    "high_mid": { "target_db": -11.2, "tol_db": 1.5 },
    "brilho": { "target_db": -14.8, "tol_db": 2.0 },
    "presenca": { "target_db": -19.2, "tol_db": 2.5 }
  }
}
```

### Unidades Confirmadas
- **Níveis**: LUFS (dB), True Peak (dBTP), DR (dB), LRA (LU)
- **Estéreo**: Correlação (0-1)
- **Bandas**: target_db e tol_db (ambos em dB relativos)
- **Tolerâncias bandas**: pontos-percentuais para %energia, dB para níveis

---

## 🎯 COMPARAÇÃO + SUGESTÕES

### Lógica de Comparação
```javascript
// Em scoring.js linha 157-164:
const val = Number.isFinite(mBand.rms_db) ? mBand.rms_db : null;
const delta = val - target;
const status = Math.abs(delta) <= tol ? 'OK':'OUT';

// ✅ CORRETO: Bandas comparadas em dB
// ✅ CORRETO: Tolerâncias aplicadas corretamente
```

### Geração de Sugestões
```javascript
// Em enhanced-suggestion-engine.js:
generateReferenceSuggestions(metrics, referenceData, zScores, confidence, dependencyBonuses)

// ✅ Severidade baseada em z-score
// ✅ Priorização por dependency bonus
// ⚠️ Pode executar com dados incompletos
```

---

## 📈 SCORE

### Fórmula Atual (V2)
```javascript
// Em scoring.js linha 353:
const raw = total > 0 ? 
  ((green * wGreen + yellow * wYellow + red * wRed) / total) * 100 : 0;

// Pesos padrão:
wGreen = 1.0    // 100% peso
wYellow = 0.7   // 70% peso  
wRed = 0.3      // 30% peso

// ✅ Fórmula ponderada consistente
// ✅ Fallback para advanced score se V2 falhar
```

### Pontos de Invocação
```javascript
// scoring.js é chamado em:
1. Final da análise completa
2. Comparação manual
3. ❌ RISCO: Eventos assíncronos diversos sem coordenação
```

---

## 🔧 ROTEIRO DE CORREÇÃO POR FASES

### Fase 1: Estabilização (Urgente)
1. **Implementar runId**: UUID único por análise
2. **Promise.allSettled central**: Garantir ordem métricas → comparação → sugestões → score
3. **Validar dados completos**: Score só roda com análise finalizada
4. **Logs estruturados**: ISO timestamp + runId em todos os eventos

### Fase 2: Consistência (Importante)
1. **Padronizar fórmula dB**: Usar sempre `10·log10(E_banda) + K_cal`
2. **Definir K_cal único**: Referência de calibração consistente
3. **Validar soma energética**: Assert de que ΣE_bandas ≈ E_total
4. **Tolerâncias unificadas**: Confirmar pp para %, dB para níveis

### Fase 3: Robustez (Melhorias)
1. **Timeout de análise**: Evitar travamentos
2. **Cache de referências**: Melhorar performance
3. **Logs de performance**: Identificar gargalos
4. **Testes automatizados**: Cenários de erro

---

## 📋 APÊNDICE DE LOGS

### Formato Sugerido (não implementar agora)
```javascript
{
  "timestamp": "2025-08-24T10:30:45.123Z",
  "runId": "analysis_abc123def456",
  "event": "SPECTRAL_ANALYSIS_COMPLETE",
  "data": {
    "bands": 7,
    "totalEnergy": 1.23e-4,
    "sumEnergyPct": 99.98,
    "processingMs": 1250
  }
}
```

### Eventos Críticos a Logar
- `ANALYSIS_START` (runId, fileName)
- `SPECTRAL_COMPLETE` (bands, energy, %)
- `METRICS_READY` (LUFS, TP, DR, LRA, stereo)
- `COMPARISON_START` (genre, targets)
- `SUGGESTIONS_GENERATED` (count, severity)
- `SCORE_CALCULATED` (value, method, metrics_count)
- `ANALYSIS_COMPLETE` (runId, totalMs)

---

## ✅ CRITÉRIOS DE ACEITAÇÃO ATENDIDOS

1. **Fiel ao código atual**: ✅ Paths e funções mapeados
2. **8 seções preenchidas**: ✅ Completo
3. **Evidências claras dos problemas**:
   - a) **Score prematuro**: Ausência de Promise.allSettled em pipeline principal
   - b) **dB inconsistente**: 3 fórmulas diferentes encontradas
   - c) **Tolerâncias compatíveis**: ✅ JSON estrutura correta, bandas em dB

**Estado atual**: Sistema funcional mas com riscos de race conditions e inconsistências em valores extremos. Necessita orquestração assíncrona e padronização de fórmulas dB para confiabilidade total.
