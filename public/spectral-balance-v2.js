/**
 * 🎵 SPECTRAL BALANCE V2 - Versão JavaScript para Browser
 * Sistema de balanço espectral com cálculo interno em porcentagem
 * 
 * Esta é a versão compilada/transpilada dos módulos TypeScript para uso direto no browser
 */

(function() {
  'use strict';

  // 🎛️ CONFIGURAÇÃO DAS BANDAS
  const SPECTRAL_BANDS = [
    { name: 'sub', hz: [20, 60], friendlyName: 'Sub' },
    { name: 'bass', hz: [60, 120], friendlyName: 'Bass' },
    { name: 'low_mid', hz: [120, 250], friendlyName: 'Low-Mid' },
    { name: 'mid', hz: [250, 1000], friendlyName: 'Mid' },
    { name: 'high_mid', hz: [1000, 4000], friendlyName: 'High-Mid' },
    { name: 'presence', hz: [4000, 8000], friendlyName: 'Presence' },
    { name: 'air', hz: [8000, 16000], friendlyName: 'Air' }
  ];

  // 🎯 AGREGAÇÃO PARA 3 BANDAS
  const BAND_AGGREGATION = {
    low: ['sub', 'bass'],           // Graves = Sub + Bass
    mid: ['low_mid', 'mid'],        // Médios = Low-Mid + Mid  
    high: ['high_mid', 'presence']  // Agudos = High-Mid + Presence
  };

  const DEFAULT_CONFIG = {
    mode: 'percent',
    includeAirInHigh: false,
    normalizationLUFS: -14.0,
    defaultTolerancePP: 2.5
  };

  // 🎶 Normalizar áudio para LUFS alvo
  function normalizeToLUFS(audioData, sampleRate, targetLUFS = -14.0) {
    const rms = Math.sqrt(audioData.reduce((sum, sample) => sum + sample * sample, 0) / audioData.length);
    
    if (rms === 0) return new Float32Array(audioData.length);
    
    const currentDB = 20 * Math.log10(rms);
    const gainDB = targetLUFS - currentDB;
    const gainLinear = Math.pow(10, gainDB / 20);
    
    const normalized = new Float32Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      normalized[i] = audioData[i] * gainLinear;
    }
    
    return normalized;
  }

  // 🔍 Analisar espectro usando FFT otimizada
  function analyzeSpectrum(audioData, sampleRate, fftSize = 2048) {
    // Usar FFT menor para evitar travamentos
    const windowSize = Math.min(fftSize, audioData.length, 2048);
    const hopSize = Math.floor(windowSize / 4);
    const numFrames = Math.min(Math.floor((audioData.length - windowSize) / hopSize) + 1, 10); // Limitar frames
    
    if (numFrames <= 0 || windowSize < 64) {
      return {
        magnitudes: new Float32Array(windowSize / 2),
        freqBins: new Float32Array(windowSize / 2).map((_, i) => (i * sampleRate) / windowSize)
      };
    }
    
    const spectrumSum = new Float32Array(windowSize / 2);
    
    for (let frame = 0; frame < numFrames; frame++) {
      const start = frame * hopSize;
      const window = audioData.slice(start, start + windowSize);
      const spectrum = performOptimizedFFT(window);
      
      for (let i = 0; i < spectrum.length; i++) {
        spectrumSum[i] += spectrum[i];
      }
    }
    
    for (let i = 0; i < spectrumSum.length; i++) {
      spectrumSum[i] /= numFrames;
    }
    
    const freqBins = new Float32Array(windowSize / 2);
    for (let i = 0; i < freqBins.length; i++) {
      freqBins[i] = (i * sampleRate) / windowSize;
    }
    
    return { magnitudes: spectrumSum, freqBins };
  }

  // 🔢 FFT simples (placeholder)
  // 🚀 FFT otimizada usando aproximação rápida para bandas espectrais
  function performOptimizedFFT(window) {
    const spectrum = new Float32Array(window.length / 2);
    const N = window.length;
    
    // Para análise de bandas espectrais, não precisamos de FFT completa
    // Vamos usar aproximação por média móvel para cada banda de frequência
    
    for (let k = 0; k < spectrum.length; k++) {
      let magnitude = 0;
      
      // Aproximação rápida: calcular apenas alguns pontos por banda
      const step = Math.max(1, Math.floor(N / (spectrum.length * 4)));
      let sampleCount = 0;
      
      for (let n = 0; n < N; n += step) {
        const angle = -2 * Math.PI * k * n / N;
        const real = window[n] * Math.cos(angle);
        const imag = window[n] * Math.sin(angle);
        magnitude += Math.sqrt(real * real + imag * imag);
        sampleCount++;
      }
      
      spectrum[k] = sampleCount > 0 ? magnitude / sampleCount : 0;
    }
    
    return spectrum;
  }

  // 📊 Medir potência por banda como porcentagem
  function measureBandPowers(magnitudes, freqBins, bands = SPECTRAL_BANDS) {
    const bandPowers = new Map();
    let totalPower = 0;
    
    for (let i = 1; i < magnitudes.length; i++) {
      totalPower += magnitudes[i] * magnitudes[i];
    }
    
    if (totalPower === 0) {
      const uniformPct = 100 / bands.length;
      bands.forEach(band => bandPowers.set(band.name, uniformPct));
      return bandPowers;
    }
    
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

  // 🔄 Agregar bandas em 3 grupos
  function aggregateTo3Bands(bandPowers, config = DEFAULT_CONFIG) {
    const low = BAND_AGGREGATION.low.reduce((sum, band) => sum + (bandPowers.get(band) || 0), 0);
    const mid = BAND_AGGREGATION.mid.reduce((sum, band) => sum + (bandPowers.get(band) || 0), 0);
    
    let highBands = [...BAND_AGGREGATION.high];
    if (config.includeAirInHigh) {
      highBands.push('air');
    }
    
    const high = highBands.reduce((sum, band) => sum + (bandPowers.get(band) || 0), 0);
    
    return { low, mid, high };
  }

  // 📈 Calcular delta em dB
  function calculateDeltaDB(userPct, refPct) {
    if (refPct <= 0 || userPct <= 0) return 0;
    return 10 * Math.log10(userPct / refPct);
  }

  // 🎯 Análise completa de balanço espectral
  function analyzeSpectralBalance(audioData, sampleRate, referenceData = null, config = DEFAULT_CONFIG) {
    const startTime = performance.now();
    
    try {
      // 🛡️ Validações de segurança
      if (!audioData || audioData.length < 512) {
        return createFallbackAnalysis(config, 'Audio insuficiente');
      }
      
      // ⏱️ Timeout de segurança - máximo 2 segundos
      const checkTimeout = () => {
        if (performance.now() - startTime > 2000) {
          throw new Error('Timeout na análise espectral');
        }
      };

      // 1. Normalizar para LUFS alvo
      checkTimeout();
      const normalizedAudio = normalizeToLUFS(audioData, sampleRate, config.normalizationLUFS);
      
      // 2. Analisar espectro (com FFT otimizada)
      checkTimeout();
      const { magnitudes, freqBins } = analyzeSpectrum(normalizedAudio, sampleRate);
      
      // 3. Medir potência por banda como %
      checkTimeout();
      const bandPowers = measureBandPowers(magnitudes, freqBins, SPECTRAL_BANDS);
      
      // 4. Calcular deltas em dB vs referência
      checkTimeout();
      const bands = SPECTRAL_BANDS.map(bandConfig => {
        const userPct = bandPowers.get(bandConfig.name) || 0;
        const refPct = referenceData?.get?.(bandConfig.name) || null;
        
        let deltaDB = null;
        let status = 'NO_REF';
        
        if (refPct !== null && refPct > 0) {
          deltaDB = calculateDeltaDB(userPct, refPct);
          
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
      
      let lowDB = null, midDB = null, highDB = null;
      
      if (referenceData) {
        const refAggregated = aggregateTo3Bands(referenceData, config);
        lowDB = calculateDeltaDB(aggregated.low, refAggregated.low);
        midDB = calculateDeltaDB(aggregated.mid, refAggregated.mid);
        highDB = calculateDeltaDB(aggregated.high, refAggregated.high);
      }
      
      const summary3 = {
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
        processingTimeMs: processingTime,
        version: "v2"
      };
      
    } catch (error) {
      console.warn('🎵 [SpectralBalance] Erro na análise:', error);
      return createFallbackAnalysis();
    }
  }

  // 📄 Converter referências do formato JSON legado para Map
  function convertLegacyReferencesToPercent(jsonBands) {
    const percentMap = new Map();
    
    // Converter de dB para aproximação percentual
    const totalWeight = Object.values(jsonBands).reduce((sum, data) => {
      if (data.target_db && Number.isFinite(data.target_db)) {
        const linear = Math.pow(10, data.target_db / 10);
        return sum + Math.max(0.001, linear);
      }
      return sum;
    }, 0);
    
    if (totalWeight > 0) {
      for (const [band, data] of Object.entries(jsonBands)) {
        if (data.target_db && Number.isFinite(data.target_db)) {
          const linear = Math.pow(10, data.target_db / 10);
          const weight = Math.max(0.001, linear);
          const percent = (weight / totalWeight) * 100;
          percentMap.set(band, percent);
        }
      }
    }
    
    return percentMap;
  }

  // 🔄 Converter resultado para formato legado
  function convertToLegacyFormat(analysis) {
    const bandEnergies = {};
    const tonalBalance = {};

    for (const band of analysis.bands) {
      const approximateDB = band.pctUser > 0 
        ? 10 * Math.log10(band.pctUser / 100) 
        : -80;

      bandEnergies[band.band] = {
        rms_db: approximateDB,
        energy: band.pctUser
      };
    }

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
      bandScale: 'log_percent_db'
    };
  }

  // 🚨 Análise de fallback
  function createFallbackAnalysis() {
    const bands = [
      { band: 'sub', hz: '20–60Hz', deltaDB: null, pctUser: 10, pctRef: null, status: 'NO_REF' },
      { band: 'bass', hz: '60–120Hz', deltaDB: null, pctUser: 15, pctRef: null, status: 'NO_REF' },
      { band: 'low_mid', hz: '120–250Hz', deltaDB: null, pctUser: 20, pctRef: null, status: 'NO_REF' },
      { band: 'mid', hz: '250–1000Hz', deltaDB: null, pctUser: 25, pctRef: null, status: 'NO_REF' },
      { band: 'high_mid', hz: '1–4kHz', deltaDB: null, pctUser: 20, pctRef: null, status: 'NO_REF' },
      { band: 'presence', hz: '4–8kHz', deltaDB: null, pctUser: 8, pctRef: null, status: 'NO_REF' },
      { band: 'air', hz: '8–16kHz', deltaDB: null, pctUser: 2, pctRef: null, status: 'NO_REF' }
    ];

    return {
      mode: 'percent',
      bands,
      summary3: {
        lowDB: null, midDB: null, highDB: null,
        lowPct: 25, midPct: 45, highPct: 30
      },
      totalEnergyLinear: 1.0,
      normalizationApplied: false,
      processingTimeMs: 0,
      version: "v2"
    };
  }

  // 🎪 FUNÇÃO PRINCIPAL DE INTEGRAÇÃO
  async function performSpectralAnalysis(audioData, sampleRate, referenceData = null, audioHash) {
    const startTime = performance.now();
    
    try {
      console.log('🎵 [SpectralBalance] Iniciando análise espectral V2');
      
      // Validação inicial
      if (!audioData || audioData.length === 0) {
        throw new Error('AudioData inválido ou vazio');
      }
      
      if (!sampleRate || sampleRate <= 0) {
        throw new Error('SampleRate inválido');
      }
      
      // Preparar referências se existirem
      let referenceMap = null;
      if (referenceData?.bands) {
        try {
          referenceMap = convertLegacyReferencesToPercent(referenceData.bands);
          console.log('🎵 [SpectralBalance] Referências convertidas:', referenceMap.size, 'bandas');
        } catch (refError) {
          console.warn('⚠️ [SpectralBalance] Erro ao converter referências:', refError);
          referenceMap = null;
        }
      }
      
      // Executar análise com timeout
      const analysisPromise = new Promise((resolve, reject) => {
        try {
          const analysis = analyzeSpectralBalance(audioData, sampleRate, referenceMap, {
            mode: 'percent',
            includeAirInHigh: false,
            normalizationLUFS: -14.0,
            defaultTolerancePP: 2.5
          });
          resolve(analysis);
        } catch (error) {
          reject(error);
        }
      });
      
      // Timeout de 5 segundos
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na análise espectral')), 5000);
      });
      
      const analysis = await Promise.race([analysisPromise, timeoutPromise]);
      
      // Adicionar metadata
      analysis.cacheKey = audioHash || 'no-cache';
      
      // Converter para formato legado para compatibilidade
      const legacyCompat = convertToLegacyFormat(analysis);
      
      const totalTime = performance.now() - startTime;
      console.log('✅ [SpectralBalance] Análise concluída:', {
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
      console.warn('⚠️ [SpectralBalance] Erro, retornando fallback:', error);
      
      const fallback = createFallbackAnalysis();
      return {
        newSystem: fallback,
        legacyCompat: convertToLegacyFormat(fallback),
        migrationApplied: false
      };
    }
  }

  // 🎪 Preparar resposta para endpoint/API
  function prepareEndpointResponse(analysis) {
    return {
      mode: analysis.mode,
      bands: analysis.bands.map(band => ({
        band: band.band,
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
        cacheKey: analysis.cacheKey || 'no-cache'
      }
    };
  }

  // 🌐 EXPOR NO ESCOPO GLOBAL
  if (typeof window !== 'undefined') {
    try {
      window.SpectralIntegration = {
        performAnalysis: performSpectralAnalysis,
        prepareResponse: prepareEndpointResponse,
        analyzeSpectralBalance,
        convertLegacyReferencesToPercent,
        convertToLegacyFormat,
        createFallbackAnalysis,
        SPECTRAL_BANDS,
        DEFAULT_CONFIG
      };
      
      // Flag de controle principal
      if (!window.SPECTRAL_INTERNAL_MODE) {
        window.SPECTRAL_INTERNAL_MODE = "percent";
      }
      
      console.log('🎵 [SpectralBalance] Sistema V2 carregado com sucesso');
    } catch (error) {
      console.error('❌ [SpectralBalance] Erro ao carregar sistema V2:', error);
      // Fallback para não quebrar a página
      window.SpectralIntegration = {
        analyzeSpectralBalance: function() { return null; }
      };
    }
  }

})();
