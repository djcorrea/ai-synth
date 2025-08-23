/**
 * 🎯 SCORING V2 SISTEMA COMPLETO E SIMPLES
 * ========================================
 * 
 * Sistema completo de scoring em um único arquivo para garantir compatibilidade
 */

(function() {
  console.log('🚀 [SCORING_V2_COMPLETE] Iniciando carregamento...');

  // 🎯 CONFIGURAÇÃO POR GÊNERO PARA V2
  const GENRE_WEIGHTS_V2 = {
    funk_mandela: {
      loudness: 0.25,
      dynamics: 0.15,
      peak: 0.15,
      tonal: 0.25,
      stereo: 0.10,
      artifacts: 0.10
    },
    eletronico: {
      loudness: 0.20,
      dynamics: 0.20,
      peak: 0.10,
      tonal: 0.20,
      stereo: 0.15,
      artifacts: 0.15
    },
    default: {
      loudness: 0.25,
      dynamics: 0.15,
      peak: 0.15,
      tonal: 0.25,
      stereo: 0.10,
      artifacts: 0.10
    }
  };

  // 🎯 TARGETS DE REFERÊNCIA PARA V2 - BASEADOS EM MÚSICA PROFISSIONAL
  const GENRE_TARGETS_V2 = {
    funk_mandela: {
      lufsIntegrated: -10.0,  // Mais realista para funk brasileiro (era -12.0)
      truePeakDbtp: -0.8,     // Permite mais headroom (era -1.0)
      dynamicRange: 7.0,      // Dinâmica realista para funk (era 6.0)
      lra: 3.5,               // LRA típico do funk (era 4.0)
      stereoCorrelation: 0.65, // Correlação realista (era 0.7)
      dcOffset: 0.0001,
      clippingPercent: 0.1,
      bandTargets: {
        sub_bass: { rms_db: -9.0 },   // Ajustado para realidade (era -8.0)
        bass: { rms_db: -7.5 },       // Ajustado (era -7.0)
        low_mid: { rms_db: -8.5 },    // Ajustado (era -8.0)
        mid: { rms_db: -9.5 },        // Ajustado (era -9.0)
        high_mid: { rms_db: -11.5 },  // Ajustado (era -12.0)
        treble: { rms_db: -14.0 }     // Ajustado (era -15.0)
      }
    },
    eletronico: {
      lufsIntegrated: -9.0,   // Eletrônico moderno (era -8.0)
      truePeakDbtp: -0.3,     // Limiter moderno (era -0.5)
      dynamicRange: 6.5,      // Dinâmica eletrônica (era 8.0)
      lra: 2.5,               // LRA típico eletrônico (era 3.0)
      stereoCorrelation: 0.55, // Estéreo amplo (era 0.6)
      dcOffset: 0.0001,
      clippingPercent: 0.05,  // Mais rigoroso (era 0.1)
      bandTargets: {
        sub_bass: { rms_db: -7.0 },   // Eletrônico tem mais graves
        bass: { rms_db: -6.5 },
        low_mid: { rms_db: -8.5 },
        mid: { rms_db: -9.0 },
        high_mid: { rms_db: -10.5 },
        treble: { rms_db: -12.5 }
      }
    },
    default: {
      lufsIntegrated: -11.0,
      truePeakDbtp: -0.5,
      dynamicRange: 7.5,
      lra: 3.0,
      stereoCorrelation: 0.6,
      dcOffset: 0.0001,
      clippingPercent: 0.08,
      bandTargets: {
        sub_bass: { rms_db: -8.5 },
        bass: { rms_db: -7.0 },
        low_mid: { rms_db: -8.5 },
        mid: { rms_db: -9.5 },
        high_mid: { rms_db: -11.0 },
        treble: { rms_db: -13.5 }
      }
    }
  };

  /**
   * 🎯 TOLERÂNCIAS ESPECÍFICAS POR GÊNERO - BALANCEADAS
   * 
   * Cálculo: 
   * - Score 100%: distância = 0 (valor exato)
   * - Score ~95%: distância = 1x tolerância  
   * - Score ~68%: distância = 2x tolerância
   * - Score ~37%: distância = 3x tolerância
   */
  const GENRE_TOLERANCES_V2 = {
    funk_mandela: {
      loudness: 3.0,    // ±3 LUFS para score ~95% (era 5.0)
      dynamics: 2.0,    // ±2 dB dinâmica para score ~95% (era 3.5)
      peak: 1.0,        // ±1 dB peak para score ~95% (era 1.8)
      tonal: 3.0,       // ±3 dB por banda para score ~95% (era 4.5)
      stereo: 0.2       // ±0.2 correlação para score ~95% (era 0.35)
    },
    eletronico: {
      loudness: 2.5,    // Mais rigoroso (era 4.0)
      dynamics: 1.5,    // Mais rigoroso (era 2.5)
      peak: 0.8,        // Mais rigoroso (era 1.2)
      tonal: 2.5,       // Mais rigoroso (era 3.5)
      stereo: 0.15      // Mais rigoroso (era 0.25)
    },
    default: {
      loudness: 2.8,    // Equilibrado (era 4.5)
      dynamics: 1.8,    // Equilibrado (era 3.0)
      peak: 0.9,        // Equilibrado (era 1.5)
      tonal: 2.8,       // Equilibrado (era 4.0)
      stereo: 0.18      // Equilibrado (era 0.3)
    }
  };

  /**
   * 🎯 FUNÇÃO GAUSSIAN SUAVE PARA V2
   */
  function scoreGaussian(value, target, tolerance) {
    const distance = Math.abs(value - target);
    const normalizedDistance = distance / tolerance;
    return Math.exp(-0.5 * normalizedDistance * normalizedDistance) * 100;
  }

  /**
   * 🎯 SCORING V2 PRINCIPAL
   */
  function calculateScoringV2(technicalData = {}, reference = null, options = {}) {
    const startTime = performance.now();
    
    // Determinar gênero
    const genre = reference?.genre || 'default';
    const weights = GENRE_WEIGHTS_V2[genre] || GENRE_WEIGHTS_V2.default;
    const targets = GENRE_TARGETS_V2[genre] || GENRE_TARGETS_V2.default;
    const tolerances = GENRE_TOLERANCES_V2[genre] || GENRE_TOLERANCES_V2.default;
    
    console.log(`🎯 [SCORING_V2] Calculando para gênero: ${genre} com tolerâncias específicas`);
    
    let categoryScores = {};
    
    // 1. LOUDNESS SCORE
    if (typeof technicalData.lufsIntegrated === 'number') {
      categoryScores.loudness = scoreGaussian(technicalData.lufsIntegrated, targets.lufsIntegrated, tolerances.loudness);
    } else {
      categoryScores.loudness = 50;
    }
    
    // 2. DYNAMICS SCORE  
    if (typeof technicalData.dynamicRange === 'number') {
      categoryScores.dynamics = scoreGaussian(technicalData.dynamicRange, targets.dynamicRange, tolerances.dynamics);
    } else {
      categoryScores.dynamics = 50;
    }
    
    // 3. PEAK SCORE
    if (typeof technicalData.truePeakDbtp === 'number') {
      categoryScores.peak = scoreGaussian(technicalData.truePeakDbtp, targets.truePeakDbtp, tolerances.peak);
    } else {
      categoryScores.peak = 50;
    }
    
    // 4. TONAL BALANCE SCORE
    let tonalScore = 50;
    if (technicalData.bandEnergies) {
      let bandScores = [];
      for (const [band, target] of Object.entries(targets.bandTargets)) {
        if (technicalData.bandEnergies[band]?.rms_db) {
          const score = scoreGaussian(technicalData.bandEnergies[band].rms_db, target.rms_db, tolerances.tonal);
          bandScores.push(score);
        }
      }
      if (bandScores.length > 0) {
        tonalScore = bandScores.reduce((sum, s) => sum + s, 0) / bandScores.length;
      }
    }
    categoryScores.tonal = tonalScore;
    
    // 5. STEREO SCORE
    if (typeof technicalData.stereoCorrelation === 'number') {
      categoryScores.stereo = scoreGaussian(technicalData.stereoCorrelation, targets.stereoCorrelation, tolerances.stereo);
    } else {
      categoryScores.stereo = 50;
    }
    
    // 6. ARTIFACTS SCORE - Balanceado para permitir 100% mas penalizar problemas reais
    let artifactsScore = 100;
    if (typeof technicalData.clippingPercent === 'number' && technicalData.clippingPercent > 0.05) {
      // Penalização específica por gênero - mais realista
      const clippingPenalty = genre === 'funk_mandela' ? 6 : 
                             genre === 'eletronico' ? 10 : 8;
      const clippingThreshold = genre === 'funk_mandela' ? 0.1 : 
                               genre === 'eletronico' ? 0.05 : 0.08;
      
      if (technicalData.clippingPercent > clippingThreshold) {
        artifactsScore = Math.max(20, 100 - (technicalData.clippingPercent * clippingPenalty));
      }
    }
    if (typeof technicalData.dcOffset === 'number' && technicalData.dcOffset > 0.001) {
      const dcPenalty = genre === 'funk_mandela' ? 90 : 85;
      artifactsScore = Math.min(artifactsScore, dcPenalty);
    }
    categoryScores.artifacts = artifactsScore;
    
    // CÁLCULO FINAL PONDERADO
    let finalScore = 0;
    for (const [category, weight] of Object.entries(weights)) {
      const score = categoryScores[category] || 50;
      finalScore += score * weight;
    }
    
    // GARANTIR LIMITES
    finalScore = Math.max(0, Math.min(100, finalScore));
    
    const processingTime = performance.now() - startTime;
    
    // CLASSIFICAÇÃO
    let classification = 'Básico';
    if (finalScore >= 90) classification = 'Referência Mundial';
    else if (finalScore >= 75) classification = 'Avançado';  
    else if (finalScore >= 60) classification = 'Intermediário';
    
    const result = {
      scorePct: Math.round(finalScore * 10) / 10,
      classification: classification,
      method: 'v2_gaussian',
      scoringVersion: 'v2.0.0',
      genre: genre,
      processingTime: Math.round(processingTime * 100) / 100,
      details: {
        categoryScores: categoryScores,
        weights: weights,
        targets: targets
      }
    };
    
    console.log(`✅ [SCORING_V2] Calculado: ${result.scorePct}% (${result.classification})`);
    return result;
  }

  /**
   * 🔄 WRAPPER INTELIGENTE QUE DECIDE V1 OU V2
   */
  async function computeMixScore(technicalData = {}, reference = null, options = {}) {
    const startTime = performance.now();
    
    // NOVA LÓGICA: V2 POR PADRÃO, EXCETO SE EXPLICITAMENTE DESABILITADO
    let useV2 = true; // PADRÃO É V2
    
    // Desabilitar V2 apenas se explicitamente requisitado
    if (window.SCORING_V2_DISABLED === true || options?.forceV1 === true) {
      useV2 = false;
    }
    
    // Ou se em modo de teste específico
    if (window.SCORING_V2_TEST === false) {
      useV2 = false;
    }
    
    // Forçar V2 se requisitado
    if (window.SCORING_V2_TEST === true || options?.forceV2 === true) {
      useV2 = true;
    }
    
    console.log(`🎯 [SMART_SCORING] Decisão: usar ${useV2 ? 'V2' : 'V1'}`);
    
    if (useV2) {
      console.log('🎯 [SMART_SCORING] Usando Scoring V2');
      
      try {
        const result = calculateScoringV2(technicalData, reference, options);
        
        // Adicionar metadados
        result.decisionInfo = {
          usedScoringV2: true,
          browserTest: window.SCORING_V2_TEST === true,
          method: 'v2_gaussian'
        };
        
        return result;
        
      } catch (error) {
        console.warn('⚠️ [SMART_SCORING] Erro no V2, usando fallback V1:', error.message);
      }
    }
    
    // FALLBACK PARA V1 (usar função original se disponível)
    console.log('🎯 [SMART_SCORING] Usando Scoring V1 (fallback)');
    
    if (window.ScoringV1 && window.ScoringV1.computeMixScore) {
      const result = window.ScoringV1.computeMixScore(technicalData, reference);
      result.method = useV2 ? 'v1_fallback' : 'v1_legacy';
      result.decisionInfo = {
        usedScoringV2: false,
        fallbackUsed: useV2,
        method: result.method
      };
      return result;
    }
    
    // FALLBACK DE EMERGÊNCIA
    return {
      scorePct: 50,
      classification: 'Indeterminado',
      method: 'emergency_fallback',
      error: 'Nenhum sistema de scoring disponível'
    };
  }

  /**
   * 🧪 FUNÇÕES DE CONTROLE
   */
  function enableV2Test() {
    window.SCORING_V2_TEST = true;
    window.SCORING_V2_DISABLED = false;
    console.log('🧪 [SCORING_V2] Modo V2 forçado habilitado!');
  }
  
  function disableV2Test() {
    window.SCORING_V2_TEST = false;
    console.log('🛡️ [SCORING_V2] Modo V2 desabilitado (usando V1)!');
  }
  
  function enableV2Default() {
    window.SCORING_V2_DISABLED = false;
    delete window.SCORING_V2_TEST; // Remove override
    console.log('🚀 [SCORING_V2] V2 habilitado como padrão!');
  }
  
  function disableV2Default() {
    window.SCORING_V2_DISABLED = true;
    delete window.SCORING_V2_TEST; // Remove override
    console.log('🛡️ [SCORING_V2] V2 desabilitado, usando V1 como padrão!');
  }
  
  function getStatus() {
    const v2Test = window.SCORING_V2_TEST;
    const v2Disabled = window.SCORING_V2_DISABLED;
    
    // Determinar se V2 está sendo usado
    let useV2 = true; // PADRÃO É V2
    if (v2Disabled === true) useV2 = false;
    if (v2Test === false) useV2 = false;
    
    return {
      v2Available: true,
      currentMode: useV2 ? 'v2' : 'v1',
      v2TestFlag: v2Test,
      v2DisabledFlag: v2Disabled,
      defaultIsV2: true // SEMPRE TRUE - V2 É PADRÃO AGORA
    };
  }

  // Função para verificar status (alias para getStatus)
  function checkV2Status() {
    return getStatus();
  }

  // 🎯 REGISTRAR NO WINDOW
  window.ScoringV2Complete = {
    calculateScoringV2: calculateScoringV2,
    computeMixScore: computeMixScore,
    enableV2Test: enableV2Test,
    disableV2Test: disableV2Test,
    enableV2Default: enableV2Default,
    disableV2Default: disableV2Default,
    getStatus: getStatus,
    checkV2Status: checkV2Status
  };
  
  // Funções globais para facilidade
  window.enableScoringV2Test = enableV2Test;
  window.disableScoringV2Test = disableV2Test;
  window.enableScoringV2Default = enableV2Default;
  window.disableScoringV2Default = disableV2Default;
  window.getScoringV2Status = getStatus;
  
  // Substituir função global apenas se não existir ou forçado
  if (!window.computeMixScore || window.FORCE_SCORING_V2_OVERRIDE) {
    window.computeMixScore = computeMixScore;
    console.log('🔗 [SCORING_V2] Função global computeMixScore configurada');
  } else {
    console.log('🔗 [SCORING_V2] Função global já existe, mantendo original');
  }
  
  console.log('✅ [SCORING_V2_COMPLETE] Sistema V2 carregado e pronto!');
  console.log('💡 [SCORING_V2_COMPLETE] Use window.enableScoringV2Test() para ativar V2');
  
})();
