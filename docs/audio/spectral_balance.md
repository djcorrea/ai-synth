# 🎼 Sistema de Balanço Espectral por Bandas

## Visão Geral

O sistema de balanço espectral implementa análise determinística de energia por bandas de frequência com cálculo interno em porcentagem, exibindo na UI os desvios em dB em relação à referência.

**Características principais:**
- ✅ Cálculo interno em % de energia (0-1)
- ✅ Exibição em dB na UI (delta relativo)
- ✅ 7 bandas espectrais + resumo 3 bandas (Grave/Médio/Agudo)
- ✅ Pipeline determinístico de medição
- ✅ Retrocompatibilidade total
- ✅ Feature flag para controle

## Arquitetura

### Módulos Principais

```
analyzer/
├── core/
│   ├── spectralBalance.ts     # Implementação principal
│   ├── spectralTypes.ts       # Definições TypeScript
│   └── spectralFeatureFlags.ts # Controle de features
api/
└── audio/
    └── analyze.js             # Integração backend
public/
└── audio-analyzer-integration.js # Integração frontend
```

### Pipeline de Medição

1. **Normalização para Medição**
   - Target: -14 LUFS (EBU R128)
   - Apenas para medição (não altera áudio original)
   - Log: alvo, método, SR/oversampling

2. **Análise por Bandas**
   - Método: FFT com suavização 1/3 de oitava
   - Ignora DC < 20 Hz e limita em 16 kHz
   - Mede nível médio (RMS) em dB por banda

3. **Conversão para Energia**
   ```typescript
   P_band = 10^(dB_band/10)
   P_total = Σ P_band (20 Hz–16 kHz)
   pct_band = P_band / P_total (0–1)
   ```

4. **Cálculo de Delta**
   ```typescript
   delta_dB = 10 * log10(pct_user / pct_ref)
   ```

## Bandas Espectrais

| Banda | Frequência | Display | Categoria |
|-------|------------|---------|-----------|
| sub | 20-60 Hz | Sub Bass | Grave |
| bass | 60-120 Hz | Bass | Grave |
| low_mid | 120-250 Hz | Low-Mid | Médio |
| mid | 250-1000 Hz | Mid | Médio |
| high_mid | 1-4 kHz | High-Mid | Agudo |
| presence | 4-8 kHz | Presence | Agudo |
| air | 8-16 kHz | Air | Agudo |

### Agregação 3 Bandas

- **Grave** = Sub + Bass
- **Médio** = Low-Mid + Mid  
- **Agudo** = High-Mid + Presence + Air

## Decisões Técnicas

### Método de Filtragem: FFT

**Escolhido:** FFT com suavização 1/3 de oitava

**Justificativa:**
- Precisão determinística
- Performance adequada
- Implementação mais simples que filtros IIR/FIR
- Suavização reduz artefatos

**Implementação:**
```typescript
// Janela Hann de 2048 amostras
// Hop size de 1024 amostras
// Suavização 1/3 de oitava
const fftSize = 2048;
const hopSize = fftSize / 2;
const window = createHannWindow(fftSize);
```

### Normalização LUFS

**Target:** -14 LUFS (EBU R128 padrão)

**Justificativa:**
- Padrão internacional para medição
- Neutraliza diferenças de loudness
- Permite comparação direta de energia

**Implementação:** Placeholder (requer biblioteca LUFS real)

### Tolerâncias

| Banda | Tolerância | Justificativa |
|-------|------------|---------------|
| Sub/Bass/Air | ±2.5 dB | Bandas menos críticas |
| Low-Mid/Presence | ±2.0 dB | Moderadamente críticas |
| Mid/High-Mid | ±1.5 dB | Bandas mais críticas (vocal) |

## Feature Flags

```typescript
export const SPECTRAL_INTERNAL_MODE: "percent" | "legacy" = "percent";
export const ENABLE_SPECTRAL_BALANCE = true;
export const ENABLE_SPECTRAL_UI_ADVANCED = true;
```

### Comportamento por Modo

**Modo "percent":**
- Novo sistema ativo
- Cálculo em % de energia
- Exibição em dB delta
- UI avançada com 7 bandas

**Modo "legacy":**
- Sistema antigo mantido
- Comportamento inalterado
- Compatibilidade total

## Interface de Dados

### Entrada (DTO)

```typescript
interface SpectralAnalysisDTO {
    audioData: ArrayBuffer | Float32Array[];
    sampleRate: number;
    referenceTargets?: SpectralReferenceTargets;
    config?: {
        spectralMode: "percent" | "legacy";
        lufsTarget: number;
        filterMethod: 'fir' | 'iir' | 'fft';
        smoothing: '1/3_octave' | 'none';
    };
}
```

### Saída (UI)

```typescript
interface SpectralSummary {
    lowMidHigh: {
        lowDB: number;   // Delta grave em dB
        midDB: number;   // Delta médio em dB  
        highDB: number;  // Delta agudo em dB
        lowPct: number;  // % energia grave
        midPct: number;  // % energia médio
        highPct: number; // % energia agudo
    };
    bands: SpectralDelta[];
    mode: "percent" | "legacy";
    validation: ValidationResult;
}
```

## Persistência (JSON)

### Estrutura de Referências

```json
{
  "funk_mandela": {
    "targets": {
      "bands": {
        "sub": 15.2,      // % energia média
        "bass": 18.7,
        "low_mid": 16.5,
        "mid": 24.8,
        "high_mid": 17.3,
        "presence": 6.2,
        "air": 1.3
      }
    },
    "stats": {
      "bands": {
        "sub": { "median": 15.1, "std": 2.8, "count": 17 }
        // ... outras bandas
      }
    }
  }
}
```

### Agregação de Referência

- **Método oficial:** Média aritmética das porcentagens
- **Apoio:** Mediana e desvio padrão (não usado em regras)
- **Validação:** Nunca fazer média direta de dB

## UI e Exibição

### Sistema de Cores

```css
.spectral-green   /* |delta| ≤ 1.5 dB - Ideal */
.spectral-yellow  /* 1.5 < |delta| ≤ 3.0 dB - Ajustar */
.spectral-red     /* |delta| > 3.0 dB - Corrigir */
```

### Componentes

1. **Resumo 3 Bandas** (sempre visível)
   - Grade 3 colunas: Grave | Médio | Agudo
   - Valores: delta dB + porcentagem

2. **Análise Detalhada** (flag controlada)
   - Grade responsiva: 7 bandas individuais
   - Tooltips com faixas Hz
   - Status visual por banda

3. **Validação** (rodapé)
   - Bandas processadas
   - Soma de energia total
   - Avisos/erros

## Testes e Validação

### Casos de Teste

1. **Seno 60 Hz**
   - Expectativa: Sub > 80%, outras < 20%
   - Validação: Concentração de energia

2. **Ruído Rosa**
   - Expectativa: Distribuição log coerente
   - Validação: Mid > Air, total ~100%

3. **Regressão UI**
   - Modo percent: renderiza sem erros
   - Modo legacy: comportamento inalterado

### Fórmulas Validadas

```typescript
// Validação bidirecional
delta_dB = 10 * log10(pct_user / pct_ref)
within_tolerance = |delta_dB| ≤ tolerance

// Validação de energia
total_percent = Σ pct_band * 100
valid = |total_percent - 100| < 1e-6
```

## Performance

### Métricas Esperadas

- **Processamento:** < 500ms para áudio 30s
- **Memória:** < 50MB adicional
- **Precisão:** ±0.1 dB em medições

### Otimizações

- Cache de FFT entre bandas
- Processamento paralelo quando possível
- Lazy loading da UI avançada

## Troubleshooting

### Problemas Comuns

**"Energia total não soma 100%"**
- Verificar corte DC < 20 Hz
- Validar limite superior 16 kHz
- Checar normalização LUFS

**"UI não atualiza"**
- Verificar chave de cache (spectral:v2:percent)
- Invalidar memoizações antigas
- Verificar feature flags

**"Valores NaN/Infinity"**
- Validar pct_ref > 0 antes do log10
- Tratar divisão por zero
- Fallback para modo legacy

## Roadmap

### Versão Atual (v1.0)
- ✅ Implementação core
- ✅ Feature flags
- ✅ Integração UI/API
- ✅ Testes automatizados

### Próximas Versões
- 🔄 Biblioteca LUFS real
- 🔄 Filtros IIR/FIR opcionais
- 🔄 Cache persistente
- 🔄 Análise em tempo real

---

**Documentação técnica - Sistema de Balanço Espectral**  
*Versão 1.0 - 24 de agosto de 2025*
