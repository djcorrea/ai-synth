# 📋 RELATÓRIO DE AUDITORIA - MÉTRICAS DE REFERÊNCIA FUNK MANDELA

**Data da Auditoria:** 24 de agosto de 2025  
**Sistema:** AI-Synth v2025-08-fixed-flex.2.1.1  
**Método de Agregação:** hybrid_fixed_flexible  
**Faixas de Referência:** 17 faixas (✅ CORRETO)

---

## 🎯 MÉTRICAS PRINCIPAIS DE REFERÊNCIA

### 📊 Valores Atualmente Salvos no Sistema

| Métrica | Valor Atual | Unidade | Origem do Cálculo | Faixas Usadas |
|---------|-------------|---------|-------------------|---------------|
| **LUFS Integrado** | -8.000 | LUFS | Valor FIXO (padrão gênero) | N/A |
| **True Peak** | -10.900 | dBTP | Valor FIXO (padrão streaming) | N/A |
| **Dynamic Range (DR)** | 8.000 | DR | Valor FIXO (padrão gênero) | N/A |
| **Loudness Range (LRA)** | 9.900 | LU | CALCULADO (mediana) | 17 faixas |
| **Correlação Estéreo** | 0.600 | - | CALCULADO (mediana) | 17 faixas |

### 📏 Tolerâncias Configuradas

| Métrica | Tolerância | Unidade |
|---------|------------|---------|
| LUFS | ±1.000 | LUFS |
| True Peak | ±2.000 | dB |
| DR | ±1.000 | DR |
| LRA | ±2.300 | LU |
| Correlação Estéreo | ±0.190 | - |

---

## 🎵 BANDAS DE FREQUÊNCIA

### 📍 Valores de Referência por Banda Espectral

| Banda | Faixa (Hz) | Target | Tolerância | Severidade | Origem |
|-------|------------|---------|------------|------------|--------|
| **Sub** | 20-60 Hz | -6.7 dB | ±3.0 dB | soft | Mediana (17 faixas) |
| **Low Bass** | 60-100 Hz | -8.0 dB | ±2.5 dB | soft | Mediana (17 faixas) |
| **Upper Bass** | 100-200 Hz | -12.0 dB | ±2.5 dB | soft | Mediana (17 faixas) |
| **Low Mid** | 200-500 Hz | -8.4 dB | ±2.0 dB | soft | Mediana (17 faixas) |
| **Mid** | 500-2000 Hz | -6.3 dB | ±2.0 dB | **hard** | Mediana (17 faixas) |
| **High Mid** | 2000-6000 Hz | -11.2 dB | ±2.5 dB | soft | Mediana (17 faixas) |
| **Brilho** | 6000-12000 Hz | -14.8 dB | ±3.0 dB | soft | Mediana (17 faixas) |
| **Presença** | 12000-20000 Hz | -19.2 dB | ±3.5 dB | **hard** | Mediana (17 faixas) |

### 🎯 Métricas Tonais Especiais

| Métrica | Valor | Unidade | Origem |
|---------|-------|---------|--------|
| **Calor** | -8.420 | dB | Calculado (17 faixas) |
| **Brilho** | -14.830 | dB | Calculado (17 faixas) |
| **Clareza** | -0.350 | dB | Calculado (17 faixas) |

---

## 🏗️ ESTRUTURAS DE CONFIGURAÇÃO

### 📌 Estrutura "Fixed" (Valores Fixos)
- **LUFS Target:** -8.0 LUFS (tolerância: ±1.0)
- **True Peak Streaming Max:** -10.9 dBTP
- **Dynamic Range Target:** 8.0 DR (tolerância: ±1.0)
- **Corte Mono Grave:** 100 Hz
- **Presença Vocal:** 1000-4000 Hz (delta mínimo: -1.5 dB)

### 📌 Estrutura "Flex" (Valores Flexíveis)
- **LRA Mín:** 7.600 LU
- **LRA Máx:** 12.200 LU
- **Clipping Máximo:** 0.02% das amostras
- **Largura Estéreo:** tolerância "wide" para médios/agudos

---

## 🔍 ORIGEM E METODOLOGIA DOS CÁLCULOS

### ✅ Valores FIXOS (Padrões do Gênero)
- **LUFS (-8.0):** Padrão estabelecido para funk mandela
- **True Peak (-10.9):** Padrão para streaming/distribuição
- **DR (8.0):** Padrão de dinâmica para o gênero

### 📊 Valores CALCULADOS (Baseados em 17 Faixas)
- **LRA (9.9 LU):** Mediana das 17 faixas de referência
- **Correlação Estéreo (0.6):** Mediana das 17 faixas de referência
- **Todas as Bandas Espectrais:** Mediana das 17 faixas de referência
- **Métricas Tonais (Calor, Brilho, Clareza):** Mediana das 17 faixas

### 🛡️ Método Estatístico Usado
- **Técnica:** MEDIANA (não média aritmética)
- **Justificativa:** Maior robustez contra outliers
- **Base de Dados:** 17 arquivos WAV de referência
- **Última Atualização:** 24/08/2025 12:49:02

---

## 📋 RESUMO EXECUTIVO

### ✅ Status Atual do Sistema
- **Faixas de Referência:** 17 faixas identificadas corretamente
- **Estrutura de Dados:** Consistente e bem organizada
- **Método de Cálculo:** Híbrido (fixo + flexível)
- **Robustez Estatística:** Alta (uso de mediana)

### 🎯 Características do Funk Mandela
- **LUFS Alvo:** -8.0 (mais alto que padrões conservadores)
- **Dinâmica:** Moderada (DR = 8.0)
- **Perfil Tonal:** Graves proeminentes, médios presentes
- **Estéreo:** Correlação moderada (0.6), permite abertura controlada
- **Tolerância a Clipping:** Até 0.02% das amostras

### 📊 Métricas Críticas (Hard Constraints)
- LUFS Integrado
- True Peak  
- Dynamic Range
- Graves Mono (< 100 Hz)
- Presença Vocal (500-2000 Hz e 12000-20000 Hz)

---

**Conclusão:** O sistema está configurado com métricas consistentes baseadas em análise robusta de 17 faixas de referência, utilizando mediana para garantir estabilidade contra outliers, com valores fixos apropriados para as características do gênero funk mandela.
