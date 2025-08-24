/**
 * 🔗 SPECTRAL INTEGRATION - Integração com o sistema existente
 * Ponte entre o novo sistema de balanço espectral e o audio-analyzer.js
 */

import type { 
  SpectralBalanceAnalysis, 
  SpectralBalanceEndpointResponse,
  SpectralConfig,
  LegacySpectralData,
  SpectralIntegrationResult
} from './spectralTypes.js';

import { 
  analyzeSpectralBalance, 
  convertLegacyReferencesToPercent,
  analyzeLegacyMode,
  DEFAULT_CONFIG
} from './spectralBalance.js';

import { 
  getSpectralFlag, 
  createSpectralCacheKey, 
  spectralLog, 
  spectralWarn,
  SPECTRAL_CACHE_VERSION
} from './spectralFeatureFlags.js';

// 🎯 CACHE GLOBAL
const spectralCache = new Map<string, SpectralBalanceAnalysis>();

/**
 * 🎪 FUNÇÃO PRINCIPAL DE INTEGRAÇÃO
 * Substitui a análise espectral no audio-analyzer.js
 * 
 * @param audioData - Canal de áudio (Float32Array)
 * @param sampleRate - Taxa de amostragem
 * @param referenceData - Dados de referência do PROD_AI_REF_DATA
 * @param audioHash - Hash do áudio para cache (opcional)
 * @returns Análise espectral completa
 */
export async function performSpectralAnalysis(
  audioData: Float32Array,
  sampleRate: number,
  referenceData: any = null,
  audioHash?: string
): Promise<SpectralIntegrationResult> {
  const startTime = performance.now();
  
  try {
    spectralLog('Iniciando análise espectral', { 
      audioLength: audioData.length, 
      sampleRate,
      hasReference: !!referenceData 
    });

    // 1. Verificar modo e configuração
    const mode = getSpectralFlag('SPECTRAL_INTERNAL_MODE');
    const config: SpectralConfig = {
      mode,
      includeAirInHigh: false, // Configurável no futuro
      normalizationLUFS: -14.0,
      defaultTolerancePP: 2.5,
      fftSize: 8192,
      enableCache: getSpectralFlag('ENABLE_SPECTRAL_CACHE')
    };

    // 2. Verificar cache se habilitado
    let cacheKey = '';
    if (config.enableCache && audioHash) {
      cacheKey = createSpectralCacheKey(audioHash, config);
      const cached = spectralCache.get(cacheKey);
      if (cached) {
        spectralLog('Cache hit para análise espectral');
        return {
          newSystem: cached,
          legacyCompat: convertToLegacyFormat(cached),
          migrationApplied: false
        };
      }
    }

    // 3. Preparar referências
    let referenceMap: Map<string, number> | null = null;
    if (referenceData && referenceData.bands) {
      if (mode === 'percent') {
        referenceMap = convertLegacyReferencesToPercent(referenceData.bands);
        spectralLog('Referências convertidas para porcentagem', { 
          bandCount: referenceMap.size 
        });
      }
    }

    // 4. Executar análise
    let analysisResult: any;
    
    if (mode === 'legacy') {
      spectralLog('Executando análise no modo legacy');
      analysisResult = analyzeLegacyMode(audioData, sampleRate, referenceData);
    } else {
      spectralLog('Executando análise no modo percent');
      analysisResult = analyzeSpectralBalance(audioData, sampleRate, referenceMap, {
        mode: config.mode,
        includeAirInHigh: config.includeAirInHigh,
        normalizationLUFS: config.normalizationLUFS,
        defaultTolerancePP: config.defaultTolerancePP
      });
    }
    
    const analysis: SpectralBalanceAnalysis = {
      ...analysisResult,
      version: "v2" as const,
      cacheKey: cacheKey || 'no-cache'
    };

    // 5. Armazenar em cache se habilitado
    if (config.enableCache && cacheKey) {
      spectralCache.set(cacheKey, analysis);
      
      // Limpar cache antigo (manter apenas 50 entradas)
      if (spectralCache.size > 50) {
        const firstKey = spectralCache.keys().next().value;
        spectralCache.delete(firstKey);
      }
    }

    // 6. Converter para formato legado para compatibilidade
    const legacyCompat = convertToLegacyFormat(analysis);

    const totalTime = performance.now() - startTime;
    spectralLog('Análise espectral concluída', { 
      totalTimeMs: totalTime,
      bandsAnalyzed: analysis.bands.length,
      mode: analysis.mode
    });

    return {
      newSystem: analysis,
      legacyCompat,
      migrationApplied: true
    };

  } catch (error) {
    spectralWarn('Erro na análise espectral, retornando fallback', error);
    
    // Fallback para modo seguro
    const fallback = createFallbackAnalysis();
    return {
      newSystem: fallback,
      legacyCompat: convertToLegacyFormat(fallback),
      migrationApplied: false
    };
  }
}

/**
 * 🔄 Converter resultado novo para formato legado
 * @param analysis - Análise no novo formato
 * @returns Dados no formato legado
 */
export function convertToLegacyFormat(analysis: SpectralBalanceAnalysis): LegacySpectralData {
  const bandEnergies: Record<string, { rms_db: number; energy?: number }> = {};
  const tonalBalance: Record<string, { rms_db: number }> = {};

  // Converter bandas individuais
  for (const band of analysis.bands) {
    // Converter % para aproximação dB (baseado na energia relativa)
    const approximateDB = band.pctUser > 0 
      ? 10 * Math.log10(band.pctUser / 100) 
      : -80;

    bandEnergies[band.band] = {
      rms_db: approximateDB,
      energy: band.pctUser
    };
  }

  // Converter resumo de 3 bandas para tonalBalance
  const summary = analysis.summary3;
  if (summary.lowPct > 0) {
    tonalBalance.sub = { rms_db: 10 * Math.log10(summary.lowPct / 100) };
  }
  if (summary.midPct > 0) {
    tonalBalance.mid = { rms_db: 10 * Math.log10(summary.midPct / 100) };
  }
  if (summary.highPct > 0) {
    tonalBalance.high = { rms_db: 10 * Math.log10(summary.highPct / 100) };
  }

  return {
    bandEnergies,
    tonalBalance,
    bandScale: analysis.mode === 'percent' ? 'log_percent_db' : 'log_ratio_db'
  };
}

/**
 * 🚨 Criar análise de fallback em caso de erro
 * @returns Análise básica de fallback
 */
function createFallbackAnalysis(): SpectralBalanceAnalysis {
  const bands = [
    { band: 'sub' as const, hz: '20–60Hz', deltaDB: null, pctUser: 10, pctRef: null, status: 'NO_REF' as const },
    { band: 'bass' as const, hz: '60–120Hz', deltaDB: null, pctUser: 15, pctRef: null, status: 'NO_REF' as const },
    { band: 'low_mid' as const, hz: '120–250Hz', deltaDB: null, pctUser: 20, pctRef: null, status: 'NO_REF' as const },
    { band: 'mid' as const, hz: '250–1000Hz', deltaDB: null, pctUser: 25, pctRef: null, status: 'NO_REF' as const },
    { band: 'high_mid' as const, hz: '1–4kHz', deltaDB: null, pctUser: 20, pctRef: null, status: 'NO_REF' as const },
    { band: 'presence' as const, hz: '4–8kHz', deltaDB: null, pctUser: 8, pctRef: null, status: 'NO_REF' as const },
    { band: 'air' as const, hz: '8–16kHz', deltaDB: null, pctUser: 2, pctRef: null, status: 'NO_REF' as const }
  ];

  return {
    mode: 'percent',
    bands,
    summary3: {
      lowDB: null,
      midDB: null,
      highDB: null,
      lowPct: 25, // sub + bass
      midPct: 45, // low_mid + mid
      highPct: 30  // high_mid + presence + air
    },
    totalEnergyLinear: 1.0,
    normalizationApplied: false,
    processingTimeMs: 0,
    version: "v2",
    cacheKey: 'fallback'
  };
}

/**
 * 🎪 Preparar resposta para endpoint/API
 * @param analysis - Análise espectral
 * @returns Resposta formatada para API
 */
export function prepareEndpointResponse(
  analysis: SpectralBalanceAnalysis
): SpectralBalanceEndpointResponse {
  return {
    mode: analysis.mode,
    bands: analysis.bands.map(band => ({
      band: band.band as any,
      hz: band.hz,
      deltaDB: band.deltaDB,
      pctUser: band.pctUser,
      pctRef: band.pctRef,
      status: band.status
    })),
    summary3: analysis.summary3,
    metadata: {
      processingTimeMs: analysis.processingTimeMs,
      normalizationApplied: analysis.normalizationApplied,
      version: analysis.version,
      cacheKey: analysis.cacheKey
    }
  };
}

/**
 * 🧹 Limpar cache espectral
 * @param pattern - Padrão para limpar (opcional)
 */
export function clearSpectralCache(pattern?: string): number {
  let cleared = 0;
  
  if (pattern) {
    for (const [key] of spectralCache) {
      if (key.includes(pattern)) {
        spectralCache.delete(key);
        cleared++;
      }
    }
  } else {
    cleared = spectralCache.size;
    spectralCache.clear();
  }
  
  spectralLog(`Cache espectral limpo: ${cleared} entradas removidas`);
  return cleared;
}

/**
 * 📊 Estatísticas do cache
 */
export function getSpectralCacheStats(): {
  size: number;
  version: string;
  keys: string[];
} {
  return {
    size: spectralCache.size,
    version: SPECTRAL_CACHE_VERSION,
    keys: Array.from(spectralCache.keys())
  };
}

/**
 * 🔧 INTEGRAÇÃO COM AUDIO-ANALYZER.JS
 * Esta função substitui a lógica espectral existente
 */
export async function integrateWithAudioAnalyzer(
  audioAnalyzerContext: {
    left: Float32Array;
    right?: Float32Array;
    sampleRate: number;
    technicalData: any;
    referenceData?: any;
  }
): Promise<void> {
  try {
    // Usar canal esquerdo por padrão, ou mix estéreo se configurado
    const usesStereoMix = getSpectralFlag('SPECTRAL_FORCE_NORMALIZATION'); // Reusar flag
    let sourceChannel = audioAnalyzerContext.left;
    
    if (usesStereoMix && audioAnalyzerContext.right) {
      // Criar mix estéreo
      const mixedChannel = new Float32Array(audioAnalyzerContext.left.length);
      for (let i = 0; i < mixedChannel.length; i++) {
        mixedChannel[i] = 0.5 * (audioAnalyzerContext.left[i] + audioAnalyzerContext.right[i]);
      }
      sourceChannel = mixedChannel;
    }

    // Executar análise espectral
    const result = await performSpectralAnalysis(
      sourceChannel,
      audioAnalyzerContext.sampleRate,
      audioAnalyzerContext.referenceData
    );

    // Integrar resultados no technicalData
    audioAnalyzerContext.technicalData.spectralBalanceV2 = result.newSystem;
    audioAnalyzerContext.technicalData.bandEnergies = result.legacyCompat.bandEnergies;
    audioAnalyzerContext.technicalData.tonalBalance = result.legacyCompat.tonalBalance;
    audioAnalyzerContext.technicalData.bandScale = result.legacyCompat.bandScale;
    
    // Marcar fonte
    audioAnalyzerContext.technicalData._sources = audioAnalyzerContext.technicalData._sources || {};
    audioAnalyzerContext.technicalData._sources.spectralBalanceV2 = 'spectral:v2';
    audioAnalyzerContext.technicalData._sources.bandEnergies = 'spectral:v2:compat';

    spectralLog('Integração com audio-analyzer concluída', {
      bandsCount: result.newSystem.bands.length,
      mode: result.newSystem.mode
    });

  } catch (error) {
    spectralWarn('Falha na integração espectral, mantendo sistema legado', error);
  }
}

// 🎛️ EXPOR PARA ESCOPO GLOBAL (DEBUGGING)
if (typeof window !== 'undefined') {
  (window as any).SpectralIntegration = {
    performAnalysis: performSpectralAnalysis,
    clearCache: clearSpectralCache,
    getCacheStats: getSpectralCacheStats,
    prepareResponse: prepareEndpointResponse
  };
}
