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

  // 🎯 TARGETS DE REFERÊNCIA PARA V2
  const GENRE_TARGETS_V2 = {
    funk_mandela: {
      lufsIntegrated: -12.0,
      truePeakDbtp: -1.0,
      dynamicRange: 6.0,
      lra: 4.0,
      stereoCorrelation: 0.7,
      dcOffset: 0.0001,
      clippingPercent: 0.1,
      bandTargets: {
        sub_bass: { rms_db: -8.0 },
        bass: { rms_db: -7.0 },
        low_mid: { rms_db: -8.0 },
        mid: { rms_db: -9.0 },
        high_mid: { rms_db: -12.0 },
        treble: { rms_db: -15.0 }
      }
    },
    eletronico: {
      lufsIntegrated: -8.0,
      truePeakDbtp: -0.5,
      dynamicRange: 8.0,
      lra: 3.0,
      stereoCorrelation: 0.6,
      dcOffset: 0.0001,
      clippingPercent: 0.1,
      bandTargets: {
        sub_bass: { rms_db: -6.0 },
        bass: { rms_db: -6.0 },
        low_mid: { rms_db: -8.0 },
        mid: { rms_db: -8.0 },
        high_mid: { rms_db: -10.0 },
        treble: { rms_db: -12.0 }
      }
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
    
    console.log(`🎯 [SCORING_V2] Calculando para gênero: ${genre}`);
    
    let categoryScores = {};
    
    // 1. LOUDNESS SCORE
    if (typeof technicalData.lufsIntegrated === 'number') {
      categoryScores.loudness = scoreGaussian(technicalData.lufsIntegrated, targets.lufsIntegrated, 3.0);
    } else {
      categoryScores.loudness = 50;
    }
    
    // 2. DYNAMICS SCORE  
    if (typeof technicalData.dynamicRange === 'number') {
      categoryScores.dynamics = scoreGaussian(technicalData.dynamicRange, targets.dynamicRange, 2.0);
    } else {
      categoryScores.dynamics = 50;
    }
    
    // 3. PEAK SCORE
    if (typeof technicalData.truePeakDbtp === 'number') {
      categoryScores.peak = scoreGaussian(technicalData.truePeakDbtp, targets.truePeakDbtp, 1.0);
    } else {
      categoryScores.peak = 50;
    }
    
    // 4. TONAL BALANCE SCORE
    let tonalScore = 50;
    if (technicalData.bandEnergies) {
      let bandScores = [];
      for (const [band, target] of Object.entries(targets.bandTargets)) {
        if (technicalData.bandEnergies[band]?.rms_db) {
          const score = scoreGaussian(technicalData.bandEnergies[band].rms_db, target.rms_db, 3.0);
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
      categoryScores.stereo = scoreGaussian(technicalData.stereoCorrelation, targets.stereoCorrelation, 0.2);
    } else {
      categoryScores.stereo = 50;
    }
    
    // 6. ARTIFACTS SCORE
    let artifactsScore = 100;
    if (typeof technicalData.clippingPercent === 'number' && technicalData.clippingPercent > 0.1) {
      artifactsScore = Math.max(20, 100 - (technicalData.clippingPercent * 10));
    }
    if (typeof technicalData.dcOffset === 'number' && technicalData.dcOffset > 0.001) {
      artifactsScore = Math.min(artifactsScore, 80);
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
    
    // Decidir se usa V2
    const useV2 = window.SCORING_V2_TEST === true || options?.forceV2 === true;
    
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
    console.log('🧪 [SCORING_V2] Modo V2 habilitado!');
  }
  
  function disableV2Test() {
    window.SCORING_V2_TEST = false;
    console.log('🛡️ [SCORING_V2] Modo V2 desabilitado!');
  }
  
  function getStatus() {
    return {
      v2Available: true,
      v2TestEnabled: window.SCORING_V2_TEST === true,
      version: window.SCORING_V2_TEST ? 'v2.0.0-active' : 'v1.0.0-active'
    };
  }

  // 🎯 REGISTRAR NO WINDOW
  window.ScoringV2Complete = {
    calculateScoringV2: calculateScoringV2,
    computeMixScore: computeMixScore,
    enableV2Test: enableV2Test,
    disableV2Test: disableV2Test,
    getStatus: getStatus
  };
  
  // Funções globais para facilidade
  window.enableScoringV2Test = enableV2Test;
  window.disableScoringV2Test = disableV2Test;
  window.getScoringV2Status = getStatus;
  
  // Substituir função global se não existir
  if (!window.computeMixScore) {
    window.computeMixScore = computeMixScore;
    console.log('🔗 [SCORING_V2] Função global computeMixScore configurada');
  }
  
  console.log('✅ [SCORING_V2_COMPLETE] Sistema V2 carregado e pronto!');
  console.log('💡 [SCORING_V2_COMPLETE] Use window.enableScoringV2Test() para ativar V2');
  
})();
