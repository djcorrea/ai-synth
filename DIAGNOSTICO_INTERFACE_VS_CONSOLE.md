# 🔍 DIAGNÓSTICO: DISCREPÂNCIA INTERFACE vs CONSOLE

## 🚨 **PROBLEMA IDENTIFICADO**

**Data**: 24/08/2025  
**Sintoma**: Valores corretos no console, mas **"presença -80"** e outros valores exagerados na interface  
**Causa**: **Incompatibilidade entre definições de bandas** do sistema espectral vs legado

---

## 🎯 **CAUSA RAIZ CONFIRMADA**

### **Discrepância de Definições**

**Sistema Espectral (calculateSpectralBalance)**:
```javascript
{ name: 'Presence', hzLow: 8000, hzHigh: 16000 }  // 8-16 kHz
```

**Sistema Legado (bandEnergies)**:
```javascript
presenca: [12000, 18000]  // 12-18 kHz  ❌ DIFERENTE!
```

### **Fluxo do Problema**:
1. ✅ **Sistema espectral** calcula Presence (8-16 kHz) corretamente
2. ❌ **Mapeamento** espectral → legado com faixas diferentes
3. ❌ **Interface** busca dados do sistema legado ou usa fallback
4. ❌ **Resultado**: "presença -80" (valor padrão para energia zero)

---

## 🔧 **CORREÇÕES APLICADAS**

### **1. Alinhamento de Definições de Bandas**

**ANTES (incompatível)**:
```javascript
// Espectral: Presence 8000-16000 Hz
// Legado: presenca 12000-18000 Hz
// Gap: 8000-12000 Hz sem cobertura!
```

**DEPOIS (alinhado)**:
```javascript
// Espectral corrigido:
{ name: 'High', hzLow: 4000, hzHigh: 12000 },     // Estendido
{ name: 'Presence', hzLow: 12000, hzHigh: 18000 }  // Alinhado
```

### **2. Cobertura Completa de Frequências**

**Antes**: Gap 8-12 kHz não coberto  
**Depois**: Cobertura contínua 20 Hz - 18 kHz

### **3. Debug de Fontes de Dados**

Adicionado log para identificar qual sistema está sendo usado:
```javascript
console.log(`🔍 BANDA ${band}: rms_db=${value}, scale=${source}`);
```

---

## 📊 **RESULTADOS ESPERADOS**

### **Banda Presence Corrigida**:
- **Antes**: -80 dB (sem energia por incompatibilidade)
- **Depois**: Valor real da faixa 12-18 kHz

### **Outras Bandas**:
- **Fonte**: Sistema espectral (scale: 'spectral_balance_auto')
- **Valores**: Matematicamente corretos conforme console

---

## 🧪 **COMO TESTAR**

1. **Faça upload de um arquivo de áudio**
2. **Verifique no console** os logs:
   ```
   🔍 BANDA presenca: rms_db=-XX.XX, scale=spectral_balance_auto
   ```
3. **Compare com interface** - valores devem estar alinhados
4. **Banda Presence** não deve mais mostrar -80 dB

---

## 🎯 **DIAGNÓSTICO COMPLETO**

### ✅ **Sistema Espectral (Console)**:
- Cálculo FFT correto
- Fórmulas matemáticas corretas  
- Valores: Low -6.24 dB, Mid -17.39 dB, High -1.28 dB

### ❌ **Interface (Antes da Correção)**:
- Usando sistema legado com definições incompatíveis
- Banda Presence com gap de frequência
- Fallback para -80 dB

### ✅ **Interface (Após Correção)**:
- Definições alinhadas espectral ↔ legado
- Cobertura completa de frequências
- Debug para verificar fonte dos dados

---

## 📝 **PRÓXIMO PASSO**

**Teste o sistema** - agora a interface deve exibir os mesmos valores corretos que aparecem no console!

**Se ainda houver discrepância**, o debug mostrará qual sistema está sendo usado e poderemos ajustar a priorização dos dados.
