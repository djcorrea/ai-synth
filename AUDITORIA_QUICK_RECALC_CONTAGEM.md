# AUDITORIA - QUICK-RECALC.JS CONTAGEM DE FAIXAS

**Data:** 23 de agosto de 2025  
**Problema:** Log mostrava 57 faixas quando só existem 17 WAV válidos  
**Status:** ✅ PROBLEMA IDENTIFICADO E CORRIGIDO  

---

## 🔍 PROBLEMA IDENTIFICADO

### 📊 Discrepância de Contagem
- **WAV reais na pasta:** 17 arquivos (refs/funk_mandela/samples/*.wav)
- **Reportado no log:** "Faixas: 57" (valor antigo preservado)
- **Processamento real:** 17 arquivos válidos

### 🎯 Raiz do Problema
O script `quick-recalc.js` chama `ref-calibrator.js`, que:

1. **Processa corretamente 17 WAV** da pasta atual
2. **Atualiza apenas tolerâncias** no JSON
3. **Preserva campo `num_tracks: 57`** do JSON antigo via spread operator

## 🔧 ANÁLISE DO CÓDIGO

### 📍 Ponto Problemático Identificado
**Arquivo:** `tools/ref-calibrator.js`  
**Linha:** 447  

```javascript
const out = { ...json, [genre]: gNew };
```

**Problema:** O spread `...json` preserva todos os campos antigos, incluindo `num_tracks: 57` de processamentos anteriores.

### 🔍 Fluxo de Dados Mapeado

1. **Entrada real:** 17 arquivos WAV processados
2. **Variável `perFile.length`:** 17 (correto)
3. **Log processamento:** "arquivos: 17" (correto)
4. **JSON final:** `num_tracks: 57` (INCORRETO - herdado)

### 📋 Pontos de Coleta de Faixas

| Local | Fonte | Contagem | Status |
|-------|-------|----------|---------|
| `collectInputFiles()` | Pasta refs/funk_mandela/samples | 17 WAV | ✅ Correto |
| `perFile` array | Arquivos processados com sucesso | 17 | ✅ Correto |
| `files.length` log | Cabeçalho do calibrator | 17 | ✅ Correto |
| `num_tracks` JSON | Campo preservado do JSON antigo | 57 | ❌ Incorreto |

---

## ✅ SOLUÇÃO IMPLEMENTADA

### 🔧 Correção Mínima
**Arquivo:** `tools/ref-calibrator.js`  
**Mudança:** Uma linha adicionada

```javascript
// ANTES (linha 434-443)
const gNew = { ...g };
for (const [tolKey, val] of Object.entries(proposals.top)) gNew[tolKey] = val;
// ... (configuração de bandas)
// Bump version & timestamp

// DEPOIS (linha 434-444)  
const gNew = { ...g };
for (const [tolKey, val] of Object.entries(proposals.top)) gNew[tolKey] = val;
// ... (configuração de bandas)
// Atualizar contagem real de faixas processadas
gNew.num_tracks = perFile.length;
// Bump version & timestamp
```

### 🎯 Princípios da Correção
- ✅ **Mínima:** Apenas 1 linha adicionada
- ✅ **Segura:** Não altera outros campos
- ✅ **Precisa:** Usa `perFile.length` (faixas realmente processadas)
- ✅ **Consistente:** Reflete a contagem real do processamento

---

## 📊 VALIDAÇÃO DA CORREÇÃO

### ✅ Teste Executado
```bash
node tools/quick-recalc.js
```

**Resultado:**
```
=== Calibração de funk_mandela | arquivos: 17 ===
...
📊 === BANCO REPROCESSADO ===
Versão: 2025-08-fixed-flex.2.1.1
Faixas: 17  ← CORRIGIDO!
Data: 2025-08-23T17:33:17.297Z
```

### ✅ JSON Atualizado
**ANTES:**
```json
{
  "funk_mandela": {
    "num_tracks": 57,  // ← Valor antigo preservado
    ...
  }
}
```

**DEPOIS:**
```json
{
  "funk_mandela": {
    "num_tracks": 17,  // ← Valor correto da execução atual
    ...
  }
}
```

### ✅ Propagação Validada
- ✅ `refs/out/funk_mandela.json`: `"num_tracks": 17`
- ✅ `public/refs/out/funk_mandela.json`: `"num_tracks": 17`
- ✅ Sistema frontend receberá contagem correta

---

## 🔍 AUDITORIA COMPLETA

### 📁 Fonte dos Arquivos
- **Pasta única:** `refs/funk_mandela/samples/*.wav`
- **Sem pastas extras:** Confirmado que não busca em outros locais
- **Filtro WAV:** MP3/FLAC automaticamente excluídos pelo reader

### 🎛️ Uso de Cache/JSON Antigo
- **Merging identificado:** `{ ...json, [genre]: gNew }` preserva campos antigos
- **Sem flag --fresh:** Script não tem lógica de reset completo
- **Sem --wavOnly:** Parâmetros não implementados no quick-recalc

### 📊 Linha de Log "Faixas: X"
- **Origem:** Campo `num_tracks` do JSON final
- **ANTES:** Herdado de processamentos anteriores (57)
- **DEPOIS:** Reflete processamento atual (17)

---

## 🚀 IMPACTO E BENEFÍCIOS

### 🎯 Transparência Corrigida
- **Log preciso:** Faixas reportadas = faixas processadas
- **Auditoria confiável:** Contagem reflete realidade do dataset
- **Debug facilitado:** Inconsistências visíveis imediatamente

### 📊 Integridade de Dados
- **Metadados corretos:** `num_tracks` reflete dataset atual
- **Rastreabilidade:** Cada processamento gera contagem própria
- **Versionamento limpo:** Contagem alinhada com conteúdo

### 🔧 Robustez Técnica
- **Correção automática:** Não depende de intervenção manual
- **Prova de regressão:** Correção aplicada a futuros processamentos
- **Compatibilidade:** Não quebra funcionalidades existentes

---

## 📋 RESUMO EXECUTIVO

### ✅ Problema Resolvido
O script `quick-recalc.js` mostrava **57 faixas** devido à preservação de campo antigo no JSON, quando na realidade processava apenas **17 WAV válidos**. A correção garante que `num_tracks` reflita sempre o processamento atual.

### 🔧 Solução Minimal
**Uma linha de código** adicionada em `ref-calibrator.js`:
```javascript
gNew.num_tracks = perFile.length;
```

### 📊 Status Final
**🟢 AUDITORIA CONCLUÍDA**

O sistema agora reporta contagem precisa:
- **Log:** "Calibração de funk_mandela | arquivos: 17"
- **JSON:** `"num_tracks": 17`
- **Frontend:** Recebe metadados corretos

**Próximos reprocessamentos mostrarão automaticamente a contagem real de faixas processadas.**

---

**Documento gerado automaticamente**  
**Sistema:** AI-Synth Quick-Recalc Auditor v1.0  
**Timestamp:** 2025-08-23T17:35:00.000Z
