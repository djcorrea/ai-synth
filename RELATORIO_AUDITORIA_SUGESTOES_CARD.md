# RELATÓRIO DE AUDITORIA COMPLETA - CARD DE SUGESTÕES

**Data:** 15 de agosto de 2025  
**Objetivo:** Mapear e auditar completamente o sistema de geração de sugestões exibidas no CARD

## 🎯 RESUMO EXECUTIVO

O sistema de sugestões no CARD funciona através de **múltiplas fontes** que geram recomendações baseadas tanto em **métricas de referência** quanto em **regras heurísticas**. A auditoria identificou que nem todas as sugestões exibidas no CARD são exclusivamente baseadas na comparação com métricas de referência, conforme solicitado.

## 🏗️ ARQUITETURA DO SISTEMA

### 1. FLUXO PRINCIPAL DE ANÁLISE

```
Áudio Enviado → Audio Analyzer V1/V2 → Cálculo de Métricas → Comparação com Referências → Geração de Sugestões → Exibição no CARD
```

### 2. COMPONENTES PRINCIPAIS

#### A) **Audio Analyzer V1** (`public/audio-analyzer.js`)
- **Função:** `performFullAnalysis(audioBuffer)`
- **Métricas geradas:** LUFS, DR, True Peak, Stereo Correlation, Bandas espectrais
- **Linha 884-1200:** Processamento principal de métricas

#### B) **Audio Analyzer V2** (`public/audio-analyzer-v2.js`) 
- **Função:** `generateDiagnostics(audioBuffer, metrics)`
- **Linha 109-165:** Sistema de referência síncrono
- **Responsabilidade:** Comparação direta com métricas de referência

#### C) **Integration Module** (`public/audio-analyzer-integration.js`)
- **Função:** `displayModalResults(analysis)` (linha 898)
- **Função:** `updateReferenceSuggestions(analysis)` (linha 1520)
- **Função:** `diagCard()` (linha 1027) - **RENDERIZA O CARD DE SUGESTÕES**

## 🔍 MAPEAMENTO DAS FONTES DE SUGESTÕES

### 1. SUGESTÕES BASEADAS EM REFERÊNCIA ✅

#### A) **Função `updateReferenceSuggestions()` - Linha 1520**
```javascript
const addRefSug = (val, target, tol, type, label, unit='') => {
    if (!Number.isFinite(val) || !Number.isFinite(target) || !Number.isFinite(tol)) return;
    const diff = val - target;
    if (Math.abs(diff) <= tol) return; // dentro da tolerância
    // Gera sugestão apenas se fora da tolerância
};
```

**Métricas verificadas:**
- **LUFS Integrado:** `addRefSug(lufsVal, ref.lufs_target, ref.tol_lufs, 'reference_loudness', 'LUFS')`
- **True Peak:** `addRefSug(tpVal, ref.true_peak_target, ref.tol_true_peak, 'reference_true_peak', 'True Peak', ' dBTP')`
- **Dynamic Range:** `addRefSug(tech.dynamicRange, ref.dr_target, ref.tol_dr, 'reference_dynamics', 'DR', ' dB')`
- **LRA:** `addRefSug(tech.lra, ref.lra_target, ref.tol_lra, 'reference_lra', 'LRA', ' dB')`
- **Stereo Correlation:** `addRefSug(tech.stereoCorrelation, ref.stereo_target, ref.tol_stereo, 'reference_stereo', 'Stereo Corr')`

#### B) **Bandas Espectrais - Linha 1888 (`audio-analyzer.js`)**
```javascript
for (const [band, data] of Object.entries(bandEnergies)) {
    const refBand = ref?.bands?.[band];
    if (!refBand || !Number.isFinite(refBand.target_db) || !Number.isFinite(refBand.tol_db)) continue;
    
    const diff = data.rms_db - refTarget;
    const tolMin = Number.isFinite(refBand.tol_min) ? refBand.tol_min : refBand.tol_db;
    const tolMax = Number.isFinite(refBand.tol_max) ? refBand.tol_max : refBand.tol_db;
    
    // Sugestão gerada apenas se fora dos limites
    if (data.rms_db < lowLimit || data.rms_db > highLimit) {
        // Cria sugestão type: 'band_adjust'
    }
}
```

**Bandas verificadas:** sub, low_bass, upper_bass, low_mid, mid, high_mid, brilho, presenca

### 2. SUGESTÕES NÃO BASEADAS EM REFERÊNCIA ⚠️

#### A) **V1 Heuristic Rules - Linha 1244 (`audio-analyzer.js`)**
```javascript
generateTechnicalSuggestions(analysis) {
    // Sugestões baseadas em thresholds fixos, não em referências
    if (spectralCentroid < thresholds.veryDark) {
        analysis.suggestions.push({
            type: 'low_end_excess',
            message: 'Excesso de graves (Centroide: ${Math.round(spectralCentroid)}Hz)',
            action: 'Reduzir 60-200Hz (-2 a -4dB) ou usar high-pass suave'
        });
    }
}
```

**Tipos de sugestões heurísticas:**
- `low_end_excess`, `highs_deficient`, `highs_excess`, `bass_deficient`
- `frequency_imbalance`, `mud_detected`, `bass_enhancement`, `brightness`
- `mastering`, `funk_specific`

#### B) **V2 Diagnostics - Linha 165 (`audio-analyzer-v2.js`)**
```javascript
// Verificar problemas básicos (NÃO baseado em referência)
if (metrics.lufs > -6) {
    problems.push({
        type: 'loudness_too_high',
        severity: 'high',
        message: 'Áudio muito alto - pode causar distorção'
    });
}
```

#### C) **Surgical EQ - Linha 2037 (`audio-analyzer.js`)**
- Detecção de ressonâncias problemáticas
- Baseado em análise espectral, não em referências
- Type: `surgical_eq`

## 📊 TOLERÂNCIAS E VALIDAÇÃO

### Como as tolerâncias são aplicadas:

1. **Carregamento de referências:** `loadReferenceData(genre)` - linha 264
2. **Estrutura das referências:** 
   ```json
   {
     "lufs_target": -14,
     "tol_lufs": 0.5,
     "bands": {
       "sub": { "target_db": -17.3, "tol_db": 1 }
     }
   }
   ```
3. **Validação:** `Math.abs(diff) <= tol` - linha 1536

## 🎨 EXIBIÇÃO NO CARD

### Função `diagCard()` - Linha 1027
```javascript
const renderSuggestionItem = (sug) => {
    // Renderização diferenciada por tipo
    const isSurgical = sug.type === 'surgical_eq';
    
    if (isSurgical) {
        // Formato especial para sugestões cirúrgicas
    } else {
        // Formato padrão para outras sugestões
    }
};
```

**Tipos de formatação:**
- **Cirúrgicas:** Badge de frequência + severidade
- **Padrão:** Título + ação + detalhes

## 🚨 PROBLEMAS IDENTIFICADOS

### 1. **Sugestões Mistas no CARD**
- ✅ **Baseadas em referência:** `reference_*`, `band_adjust`, `band_group_adjust`
- ⚠️ **Não baseadas em referência:** `low_end_excess`, `highs_deficient`, `mastering`, `surgical_eq`, etc.

### 2. **Ausência de Filtro Exclusivo**
- O CARD exibe **TODAS** as sugestões geradas, independente da origem
- Não há separação entre sugestões baseadas em referência vs. heurísticas

### 3. **Fontes de Dados Diferentes**
- **V1:** Usa thresholds fixos (ex: spectralCentroid < 600Hz = "muito escuro")
- **V2:** Usa comparação com referência + problemas básicos fixos
- **Integration:** Recalcula sugestões de referência dinamicamente

## 📋 RELATÓRIO DETALHADO POR SUGESTÃO

### SUGESTÕES EXCLUSIVAMENTE BASEADAS EM REFERÊNCIA:

1. **`reference_loudness`** - LUFS vs. target ± tolerância
   - **Origem:** `updateReferenceSuggestions()` linha 1540
   - **Cálculo:** `lufsIntegrated - ref.lufs_target`
   - **Exemplo:** "LUFS acima do alvo (-14)" se diff > tol_lufs

2. **`reference_dynamics`** - DR vs. target ± tolerância  
   - **Origem:** `updateReferenceSuggestions()` linha 1543
   - **Cálculo:** `dynamicRange - ref.dr_target`

3. **`reference_true_peak`** - True Peak vs. target ± tolerância
   - **Origem:** `updateReferenceSuggestions()` linha 1542
   - **Cálculo:** `truePeakDbtp - ref.true_peak_target`

4. **`reference_lra`** - LRA vs. target ± tolerância
   - **Origem:** `updateReferenceSuggestions()` linha 1544
   - **Cálculo:** `lra - ref.lra_target`

5. **`reference_stereo`** - Stereo Correlation vs. target ± tolerância
   - **Origem:** `updateReferenceSuggestions()` linha 1545
   - **Cálculo:** `stereoCorrelation - ref.stereo_target`

6. **`band_adjust`** - Energia por banda vs. target ± tolerância
   - **Origem:** `audio-analyzer.js` linha 1977
   - **Cálculo:** `bandEnergies[band].rms_db - refBand.target_db`
   - **Bandas:** sub, low_bass, upper_bass, low_mid, mid, high_mid, brilho, presenca

### SUGESTÕES NÃO BASEADAS EM REFERÊNCIA:

1. **`mastering`** - Thresholds fixos de LUFS (-16 a -13)
2. **`low_end_excess`** - Centroide < 600Hz  
3. **`highs_deficient`** - Centroide < 1200Hz
4. **`frequency_imbalance`** - Análise de distribuição de energia
5. **`surgical_eq`** - Detecção automática de ressonâncias
6. **`loudness_too_high`** - LUFS > -6 (V2)
7. **`funk_specific`** - Detecção de kick 50-100Hz

## 🎯 RECOMENDAÇÕES

### Para tornar o CARD exclusivamente baseado em referências:

1. **Implementar filtro no `diagCard()`:**
   ```javascript
   const isReferenceBasedSuggestion = (sug) => {
       const refTypes = ['reference_loudness', 'reference_dynamics', 'reference_lra', 
                        'reference_stereo', 'reference_true_peak', 'band_adjust', 'band_group_adjust'];
       return refTypes.includes(sug.type);
   };
   ```

2. **Separar sugestões por origem no HTML**
3. **Adicionar flag de controle** `window.SHOW_ONLY_REFERENCE_SUGGESTIONS`

## ✅ CONCLUSÃO

O sistema atual do CARD **NÃO** exibe exclusivamente sugestões baseadas em comparação com métricas de referência. Há uma **mistura** de sugestões baseadas em referência (corretas) com sugestões heurísticas baseadas em thresholds fixos (incorretas para o objetivo).

**Status da conformidade:** ❌ **PARCIALMENTE CONFORME**  
**Ação necessária:** Implementar filtro para exibir apenas sugestões baseadas em referência.
