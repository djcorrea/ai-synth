# Metrics & Feature Flags Specification

Status: Draft (Audit Phase)

## Flags (central: lib/audio/feature-flags.js)
| Flag | Default (prod) | Em Audit | Descrição |
|------|----------------|----------|-----------|
| AUDIT_MODE | false | true | Habilita recursos experimentais/audit |
| TP_UPGRADE | off | on | True Peak 8× 192-tap FIR |
| DR_REDEF | off | on | Adiciona dr_stat (P95-P10 300ms RMS) |
| SCORING_V2 | off | on | Usa dr_stat, rolloff50, THD, novos pesos |
| BAND_NORM | off | on | Normaliza bandas & marca N/A |
| DC_HPF20 | off | on | Aplica HPF 20Hz para medir DC offset por canal |
| INVARIANTS_CHECK | off | on | Executa validator de invariants |

Se AUDIT_MODE = false, todos os demais ficam desativados automaticamente.

## Métricas Principais
| Campo | Unidade | Origem | Flag Depend. | Notas |
|-------|---------|--------|--------------|-------|
| lufsIntegrated | LUFS | loudness.js (BS.1770) | - | Gating abs -70 / rel -10 |
| lra | LU | loudness.js | - | Legacy LRA; versão R128 pode ser adicionada |
| truePeakDbtp | dBTP | truepeak.js | TP_UPGRADE | 4× legacy / 8× upgrade |
| dynamicRange (dr) | dB | crest (peak - rms) | - | Legado |
| dr_stat | dB | dynamics.js / front calc | DR_REDEF | P95 - P10 RMS (300ms/100ms) |
| crestFactor | dB | peak-rms | - | Igual dynamicRange atual |
| spectralRolloff50 | Hz | spectrum.js | SCORING_V2 | 50% energia cumulativa |
| spectralRolloff85 | Hz | spectrum.js | - | 85% energia |
| thdPercent | % | spectrum.js | SCORING_V2 | sqrt(sum(harmônicos)/fundamental)*100 |
| spectralCentroid | Hz | spectrum.js | - | Média ponderada |
| spectralFlux | norm | spectrum.js | - | Half-wave frame diff |
| spectralFlatness | ratio | spectrum.js | - | Geo/arith por frame |
| stereoWidth | 0..1 | analyzer / refs | - | side/mid RMS clamp |
| stereoCorrelation | -1..1 | fallback/V2 | - | Correlação Pearson simplificada |
| balanceLR | -1..1 | fallback | - | Média relativa |
| dcOffset | linear | fallback | DC_HPF20 | Offset após HPF se flag |
| clippingPct | % | fallback | - | >=0.99 sample threshold |
| bandEnergies.* | dB rel | refs builder | BAND_NORM | dB relativo global |

## Scoring V2 (resumo)
Categorias (peso proposto): loudness 15, dynamics 20, peak 10, stereo 10, tonal 25, spectral 10, technical 10.
Em V2 substituições/adições: dr_stat pode substituir dr; rolloff50 + thdPercent adicionam cobertura.

## Invariants Checados
1. truePeak >= samplePeak - 0.1 dB.
2. -60 <= lufsIntegrated <= -1.
3. dr_stat não excede crestFactor + 6 dB.
4. thdPercent >= 0.
5. Sem NaN/Infinity.

## Segurança
- Nenhum campo legacy é removido.
- Flags desligadas: comportamento idêntico a antes das mudanças.
- Upgrades só agregam chaves novas; UI pode ignorar se não usar.

## Próximos Itens (Planejados)
- DC offset por canal (dcOffsetLeft/Right) e pós-HPF.
- Persistência de estado true peak streaming.
- Batch audit harness (scripts audit:one, audit:batch).
- Export invariants + score em CSV/JSON/MD.
