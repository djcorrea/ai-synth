/**
 * 🎵 SPECTRAL BALANCE V2 - Sistema de balanço espectral por bandas
 * Implementação com cálculo interno em porcentagem e exibição em dB
 * 
 * Características:
 * - Normalização prévia para -14 LUFS (apenas para medição)
 * - Cálculo de energia por banda como % do total
 * - Comparação com referências em %
 * - Exibição de delta em dB na UI
 * - Bandas configuráveis e agregação para 3 bandas (graves, médios, agudos)
 */

import type { 
  SpectralBandData, 
  SpectralSummary3Band, 
  SpectralMode,
  BandName,
  BandStatus 
} from './spectralTypes.js';

// 🎛️ CONFIGURAÇÃO DAS BANDAS
export interface SpectralBandConfig {
  readonly name: BandName;
  readonly hz: readonly [number, number];
  readonly friendlyName: string;
}

export const SPECTRAL_BANDS: readonly SpectralBandConfig[] = [
  { name: 'sub', hz: [20, 60], friendlyName: 'Sub' },
  { name: 'bass', hz: [60, 120], friendlyName: 'Bass' },
  { name: 'low_mid', hz: [120, 250], friendlyName: 'Low-Mid' },
  { name: 'mid', hz: [250, 1000], friendlyName: 'Mid' },
  { name: 'high_mid', hz: [1000, 4000], friendlyName: 'High-Mid' },
  { name: 'presence', hz: [4000, 8000], friendlyName: 'Presence' },
  { name: 'air', hz: [8000, 16000], friendlyName: 'Air' }
] as const;

// 🎯 AGREGAÇÃO PARA 3 BANDAS
export const BAND_AGGREGATION = {
  low: ['sub', 'bass'] as const,           // Graves = Sub + Bass
  mid: ['low_mid', 'mid'] as const,        // Médios = Low-Mid + Mid  
  high: ['high_mid', 'presence'] as const  // Agudos = High-Mid + Presence (Air opcional)
} as const;

// 🔧 CONFIGURAÇÕES
export interface SpectralBalanceConfig {
  /** Modo interno: "percent" (novo) ou "legacy" (compatibilidade) */
  readonly mode: SpectralMode;
  /** Incluir banda Air na agregação de agudos */
  readonly includeAirInHigh: boolean;
  /** LUFS alvo para normalização interna */
  readonly normalizationLUFS: number;
  /** Tolerância padrão em pontos percentuais */
  readonly defaultTolerancePP: number;
}

export const DEFAULT_CONFIG: SpectralBalanceConfig = {
  mode: 'percent',
  includeAirInHigh: false,
  normalizationLUFS: -14.0,
  defaultTolerancePP: 2.5
};

export interface SpectralBalanceResult {
  readonly mode: SpectralMode;
  readonly bands: readonly SpectralBandData[];
  readonly summary3: SpectralSummary3Band;
  readonly totalEnergyLinear: number;
  readonly normalizationApplied: boolean;
  readonly processingTimeMs: number;
}

// 🎵 FUNÇÕES PURAS DO NÚCLEO

/**
 * 🎶 Normalizar áudio para LUFS alvo (apenas para medição)
 * @param audioData - Canal de áudio (Float32Array)
 * @param sampleRate - Taxa de amostragem
 * @param targetLUFS - LUFS alvo (default: -14)
 * @returns Áudio normalizado
 */
export function normalizeToLUFS(
  audioData: Float32Array, 
  sampleRate: number, 
  targetLUFS: number = -14.0
): Float32Array {
  // Implementação simplificada: usar RMS como proxy para LUFS
  // Em implementação real, usar medição LUFS adequada
  const rms = Math.sqrt(audioData.reduce((sum, sample) => sum + sample * sample, 0) / audioData.length);
  
  if (rms === 0) return new Float32Array(audioData.length);
  
  // Converter RMS para dB aproximado
  const currentDB = 20 * Math.log10(rms);
  const gainDB = targetLUFS - currentDB;
  const gainLinear = Math.pow(10, gainDB / 20);
  
  // Aplicar ganho
  const normalized = new Float32Array(audioData.length);
  for (let i = 0; i < audioData.length; i++) {
    normalized[i] = audioData[i] * gainLinear;
  }
  
  return normalized;
}

/**
 * 🔍 Analisar espectro usando FFT
 * @param audioData - Dados de áudio normalizados
 * @param sampleRate - Taxa de amostragem
 * @param fftSize - Tamanho da FFT (default: 8192)
 * @returns Magnitude do espectro e bins de frequência
 */
export function analyzeSpectrum(
  audioData: Float32Array, 
  sampleRate: number,
  fftSize: number = 8192
): { magnitudes: Float32Array; freqBins: Float32Array } {
  // Implementação simplificada - em produção usar biblioteca FFT otimizada
  const windowSize = Math.min(fftSize, audioData.length);
  const hopSize = Math.floor(windowSize / 4);
  const numFrames = Math.floor((audioData.length - windowSize) / hopSize) + 1;
  
  if (numFrames <= 0) {
    return {
      magnitudes: new Float32Array(windowSize / 2),
      freqBins: new Float32Array(windowSize / 2).map((_, i) => (i * sampleRate) / windowSize)
    };
  }
  
  // Acumular energia espectral
  const spectrumSum = new Float32Array(windowSize / 2);
  
  for (let frame = 0; frame < numFrames; frame++) {
    const start = frame * hopSize;
    const window = audioData.slice(start, start + windowSize);
    
    // FFT simples (placeholder - usar biblioteca real)
    const spectrum = performSimpleFFT(window);
    
    for (let i = 0; i < spectrum.length; i++) {
      spectrumSum[i] += spectrum[i];
    }
  }
  
  // Média
  for (let i = 0; i < spectrumSum.length; i++) {
    spectrumSum[i] /= numFrames;
  }
  
  // Bins de frequência
  const freqBins = new Float32Array(windowSize / 2);
  for (let i = 0; i < freqBins.length; i++) {
    freqBins[i] = (i * sampleRate) / windowSize;
  }
  
  return { magnitudes: spectrumSum, freqBins };
}

/**
 * 🔢 FFT simples (placeholder - substituir por implementação real)
 */
function performSimpleFFT(window: Float32Array): Float32Array {
  // Implementação placeholder - retorna espectro simulado
  const spectrum = new Float32Array(window.length / 2);
  
  for (let k = 0; k < spectrum.length; k++) {
    let real = 0, imag = 0;
    
    for (let n = 0; n < window.length; n++) {
      const angle = -2 * Math.PI * k * n / window.length;
      real += window[n] * Math.cos(angle);
      imag += window[n] * Math.sin(angle);
    }
    
    spectrum[k] = Math.sqrt(real * real + imag * imag);
  }
  
  return spectrum;
}

/**
 * 📊 Medir potência por banda como porcentagem
 * @param magnitudes - Magnitudes do espectro
 * @param freqBins - Bins de frequência
 * @param bands - Configuração das bandas
 * @returns Porcentagens por banda
 */
export function measureBandPowers(
  magnitudes: Float32Array,
  freqBins: Float32Array,
  bands: readonly SpectralBandConfig[] = SPECTRAL_BANDS
): Map<string, number> {
  const bandPowers = new Map<string, number>();
  let totalPower = 0;
  
  // Calcular potência total
  for (let i = 1; i < magnitudes.length; i++) { // Skip DC
    totalPower += magnitudes[i] * magnitudes[i];
  }
  
  if (totalPower === 0) {
    // Retornar distribuição uniforme se não há energia
    const uniformPct = 100 / bands.length;
    bands.forEach(band => bandPowers.set(band.name, uniformPct));
    return bandPowers;
  }
  
  // Calcular potência por banda
  for (const band of bands) {
    let bandPower = 0;
    
    for (let i = 1; i < freqBins.length; i++) {
      const freq = freqBins[i];
      if (freq >= band.hz[0] && freq < band.hz[1]) {
        bandPower += magnitudes[i] * magnitudes[i];
      }
    }
    
    const percentage = (bandPower / totalPower) * 100;
    bandPowers.set(band.name, percentage);
  }
  
  return bandPowers;
}

/**
 * 🔄 Agregar bandas em 3 grupos (graves, médios, agudos)
 * @param bandPowers - Porcentagens por banda
 * @param config - Configuração
 * @returns Agregação em 3 bandas
 */
export function aggregateTo3Bands(
  bandPowers: Map<string, number>,
  config: SpectralBalanceConfig = DEFAULT_CONFIG
): { low: number; mid: number; high: number } {
  const aggregation = BAND_AGGREGATION;
  
  const low = aggregation.low.reduce((sum, band) => sum + (bandPowers.get(band) || 0), 0);
  const mid = aggregation.mid.reduce((sum, band) => sum + (bandPowers.get(band) || 0), 0);
  
  const highBands: string[] = [...aggregation.high];
  if (config.includeAirInHigh) {
    highBands.push('air');
  }
  
  const high = highBands.reduce((sum, band) => sum + (bandPowers.get(band) || 0), 0);
  
  return { low, mid, high };
}

/**
 * 📈 Calcular delta em dB entre usuário e referência
 * @param userPct - Porcentagem do usuário
 * @param refPct - Porcentagem de referência
 * @returns Delta em dB
 */
export function calculateDeltaDB(userPct: number, refPct: number): number {
  if (refPct <= 0 || userPct <= 0) return 0;
  return 10 * Math.log10(userPct / refPct);
}

/**
 * 🎯 Análise completa de balanço espectral
 * @param audioData - Canal de áudio
 * @param sampleRate - Taxa de amostragem
 * @param referenceData - Dados de referência (% por banda)
 * @param config - Configuração
 * @returns Resultado completo da análise
 */
export function analyzeSpectralBalance(
  audioData: Float32Array,
  sampleRate: number,
  referenceData: Map<string, number> | null = null,
  config: SpectralBalanceConfig = DEFAULT_CONFIG
): SpectralBalanceResult {
  const startTime = performance.now();
  
  // 1. Normalizar para LUFS alvo (apenas para medição)
  const normalizedAudio = normalizeToLUFS(audioData, sampleRate, config.normalizationLUFS);
  
  // 2. Analisar espectro
  const { magnitudes, freqBins } = analyzeSpectrum(normalizedAudio, sampleRate);
  
  // 3. Medir potência por banda como %
  const bandPowers = measureBandPowers(magnitudes, freqBins, SPECTRAL_BANDS);
  
  // 4. Calcular deltas em dB vs referência
  const bands: SpectralBandData[] = SPECTRAL_BANDS.map(bandConfig => {
    const userPct = bandPowers.get(bandConfig.name) || 0;
    const refPct = referenceData?.get(bandConfig.name) || null;
    
    let deltaDB: number | null = null;
    let status: BandStatus = 'NO_REF';
    
    if (refPct !== null && refPct > 0) {
      deltaDB = calculateDeltaDB(userPct, refPct);
      
      // Determinar status baseado na tolerância em dB
      const toleranceDB = 10 * Math.log10((100 + config.defaultTolerancePP) / 100);
      if (Math.abs(deltaDB) <= toleranceDB) {
        status = 'OK';
      } else if (deltaDB > 0) {
        status = 'HIGH';
      } else {
        status = 'LOW';
      }
    }
    
    return {
      band: bandConfig.name,
      hz: `${bandConfig.hz[0]}–${bandConfig.hz[1]}Hz`,
      pctUser: userPct,
      pctRef: refPct,
      deltaDB,
      status
    };
  });
  
  // 5. Agregação em 3 bandas
  const aggregated = aggregateTo3Bands(bandPowers, config);
  
  // Calcular deltas para agregação (se referência disponível)
  let lowDB: number | null = null;
  let midDB: number | null = null;
  let highDB: number | null = null;
  
  if (referenceData) {
    const refAggregated = aggregateTo3Bands(referenceData, config);
    lowDB = calculateDeltaDB(aggregated.low, refAggregated.low);
    midDB = calculateDeltaDB(aggregated.mid, refAggregated.mid);
    highDB = calculateDeltaDB(aggregated.high, refAggregated.high);
  }
  
  const summary3: SpectralSummary3Band = {
    lowDB,
    midDB,
    highDB,
    lowPct: aggregated.low,
    midPct: aggregated.mid,
    highPct: aggregated.high
  };
  
  const processingTime = performance.now() - startTime;
  
  return {
    mode: config.mode,
    bands,
    summary3,
    totalEnergyLinear: magnitudes.reduce((sum, mag) => sum + mag * mag, 0),
    normalizationApplied: true,
    processingTimeMs: processingTime
  };
}

/**
 * 📄 Converter referências do formato JSON legado para Map
 * @param jsonBands - Bandas do JSON de referência
 * @returns Map com porcentagens por banda
 */
export function convertLegacyReferencesToPercent(
  jsonBands: Record<string, { target_db?: number; target_percent?: number }>
): Map<string, number> {
  const percentMap = new Map<string, number>();
  
  // Se já tem target_percent, usar diretamente
  for (const [band, data] of Object.entries(jsonBands)) {
    if (data.target_percent && data.target_percent > 0) {
      percentMap.set(band, data.target_percent);
    }
  }
  
  // Se temos todas as porcentagens, retornar
  if (percentMap.size === Object.keys(jsonBands).length) {
    return percentMap;
  }
  
  // Caso contrário, converter de dB para aproximação percentual
  // (Isto é uma aproximação - idealmente as referências já devem estar em %)
  const totalWeight = Object.values(jsonBands).reduce((sum, data) => {
    if (data.target_db && Number.isFinite(data.target_db)) {
      // Converter dB para peso linear (aproximação)
      const linear = Math.pow(10, data.target_db / 10);
      return sum + Math.max(0.001, linear); // Evitar valores negativos
    }
    return sum;
  }, 0);
  
  if (totalWeight > 0) {
    for (const [band, data] of Object.entries(jsonBands)) {
      if (!percentMap.has(band) && data.target_db && Number.isFinite(data.target_db)) {
        const linear = Math.pow(10, data.target_db / 10);
        const weight = Math.max(0.001, linear);
        const percent = (weight / totalWeight) * 100;
        percentMap.set(band, percent);
      }
    }
  }
  
  return percentMap;
}

/**
 * 🔄 Modo legado (compatibilidade)
 * @param audioData - Canal de áudio
 * @param sampleRate - Taxa de amostragem  
 * @param legacyRefs - Referências no formato antigo
 * @returns Resultado no formato legado
 */
export function analyzeLegacyMode(
  audioData: Float32Array,
  sampleRate: number,
  legacyRefs: any = null
): SpectralBalanceResult {
  // Implementação simplificada do modo legado
  // Retorna estrutura compatível mas com mode: 'legacy'
  
  const config: SpectralBalanceConfig = {
    ...DEFAULT_CONFIG,
    mode: 'legacy'
  };
  
  return analyzeSpectralBalance(audioData, sampleRate, null, config);
}
