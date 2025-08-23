/**
 * 🔄 SCORING V2 INTEGRATION WRAPPER
 * =================================
 * 
 * Wrapper seguro para integração do Scoring V2 com fallback automático
 * Permite rollout gradual sem quebrar sistema existente
 */

// Detectar ambiente para imports corretos
const IS_BROWSER = typeof window !== 'undefined';

// Função para carregar feature flags de forma segura
async function loadFeatureFlags() {
  try {
    if (IS_BROWSER) {
      const module = await import('../config/feature-flags.js');
      return module;
    } else {
      const module = await import('../config/feature-flags.js');
      return module;
    }
  } catch (error) {
    console.warn('⚠️ Feature flags não disponíveis, usando defaults');
    return {
      isFeatureEnabled: () => false,
      shouldUseScoringV2: () => false,
      FEATURE_FLAGS: {}
    };
  }
}

// Função para carregar scoring V2 de forma segura
async function loadScoringV2() {
  try {
    const module = await import('./scoring-v2.js');
    return module;
  } catch (error) {
    console.warn('⚠️ Scoring V2 não disponível');
    return null;
  }
}

// Função para carregar scoring V1 (legado) de forma segura
async function loadScoringV1() {
  try {
    const module = await import('./scoring.js');
    return module;
  } catch (error) {
    console.error('❌ Scoring V1 (legado) não disponível');
    throw new Error('Sistema de scoring não disponível');
  }
}

/**
 * 🎯 FUNÇÃO PRINCIPAL - WRAPPER INTELIGENTE
 * Decide automaticamente entre V1 e V2 baseado em feature flags
 * COM FALLBACK AUTOMÁTICO para garantir zero downtime
 */
export async function computeMixScore(technicalData = {}, reference = null, options = {}) {
  const startTime = performance.now();
  
  // Context para decisão de scoring
  const context = {
    userId: options.userId,
    sessionId: options.sessionId,
    testGroup: options.testGroup || 'production',
    forceV2: options.forceV2 || false,
    auditMode: options.auditMode || false
  };

  let useScoringV2 = false;
  let scoreResult = null;
  let method = 'v1_legacy';
  let fallbackUsed = false;
  let error = null;

  // Carregar módulos de forma segura
  const featureFlags = await loadFeatureFlags();
  const scoringV1 = await loadScoringV1();

  try {
    // 🎯 DECISÃO INTELIGENTE: V1 ou V2?
    useScoringV2 = featureFlags.shouldUseScoringV2 ? featureFlags.shouldUseScoringV2(context) : false;
    
    if (useScoringV2) {
      // 🚀 TENTATIVA DO SCORING V2
      console.log('🎯 [SCORING_V2] Usando Scoring V2');
      
      try {
        const scoringV2 = await loadScoringV2();
        
        if (scoringV2 && scoringV2.calculateScoringV2) {
          scoreResult = scoringV2.calculateScoringV2(technicalData, reference, {
            method: 'gaussian', // ou 'huber'
            enableQualityGates: featureFlags.isFeatureEnabled ? featureFlags.isFeatureEnabled('QUALITY_GATES_ENABLED', context) : true,
            enableDeduplication: featureFlags.isFeatureEnabled ? featureFlags.isFeatureEnabled('METRIC_DEDUPLICATION', context) : true,
            debug: featureFlags.isFeatureEnabled ? featureFlags.isFeatureEnabled('SCORING_DEBUG_MODE', context) : false
          });
          
          method = 'v2_gaussian';
          
          // ✅ VALIDAÇÃO DE SANIDADE
          if (!scoreResult || typeof scoreResult.scorePct !== 'number' || scoreResult.scorePct < 0) {
            throw new Error('Resultado V2 inválido: ' + JSON.stringify(scoreResult));
          }
          
          console.log(`✅ [SCORING_V2] Score V2 calculado: ${scoreResult.scorePct}%`);
        } else {
          throw new Error('Módulo Scoring V2 não carregado corretamente');
        }
        
      } catch (v2Error) {
        console.warn('⚠️ [SCORING_V2] Erro no V2, usando fallback V1:', v2Error.message);
        error = v2Error;
        fallbackUsed = true;
        useScoringV2 = false;
      }
    }

    // 🔄 FALLBACK PARA V1 (SEMPRE SEGURO)
    if (!useScoringV2 || fallbackUsed) {
      console.log('🎯 [SCORING_V1] Usando Scoring V1 (legado)');
      
      scoreResult = scoringV1.computeMixScore(technicalData, reference);
      method = fallbackUsed ? 'v1_fallback' : 'v1_legacy';
      
      // Garantir compatibilidade de formato
      if (scoreResult && typeof scoreResult.scorePct === 'number') {
        console.log(`✅ [SCORING_V1] Score V1 calculado: ${scoreResult.scorePct}%`);
      } else {
        throw new Error('Resultado V1 também inválido: ' + JSON.stringify(scoreResult));
      }
    }

  } catch (criticalError) {
    // 🚨 FALLBACK DE EMERGÊNCIA
    console.error('🚨 [SCORING_CRITICAL] Erro crítico, usando fallback mínimo:', criticalError);
    
    scoreResult = {
      scorePct: 50, // Score neutro
      classification: 'Indeterminado',
      method: 'emergency_fallback',
      error: criticalError.message,
      details: {
        categories: {},
        perMetric: [],
        emergencyMode: true
      }
    };
    method = 'emergency_fallback';
    error = criticalError;
  }

  const endTime = performance.now();
  const processingTime = endTime - startTime;

  // 📊 RESULTADO FINAL COM METADADOS
  const finalResult = {
    ...scoreResult,
    
    // Metadados de versionamento
    scoringVersion: useScoringV2 ? 'v2.0.0' : 'v1.0.0',
    method: method,
    processingTime: Math.round(processingTime * 100) / 100, // ms
    
    // Informações de decisão
    decisionInfo: {
      usedScoringV2: useScoringV2,
      fallbackUsed: fallbackUsed,
      featureFlagsUsed: {
        SCORING_V2_ENABLED: featureFlags.isFeatureEnabled ? featureFlags.isFeatureEnabled('SCORING_V2_ENABLED', context) : false,
        QUALITY_GATES_ENABLED: featureFlags.isFeatureEnabled ? featureFlags.isFeatureEnabled('QUALITY_GATES_ENABLED', context) : false,
        METRIC_DEDUPLICATION: featureFlags.isFeatureEnabled ? featureFlags.isFeatureEnabled('METRIC_DEDUPLICATION', context) : false
      },
      context: context
    },
    
    // Debug info (se habilitado)
    ...(featureFlags.isFeatureEnabled && featureFlags.isFeatureEnabled('SCORING_DEBUG_MODE', context) && {
      debugInfo: {
        inputMetrics: Object.keys(technicalData || {}),
        referenceUsed: !!reference,
        error: error?.message,
        timestamp: new Date().toISOString()
      }
    })
  };

  // 📈 LOGGING E MONITORAMENTO
  logScoringMetrics(finalResult, processingTime);

  // 🔄 MODO COMPARAÇÃO (se habilitado)
  if (featureFlags.isFeatureEnabled && featureFlags.isFeatureEnabled('SCORING_COMPARISON_MODE', context)) {
    finalResult.comparison = await runComparisonMode(technicalData, reference, context);
  }

  return finalResult;
}

/**
 * 🔄 MODO COMPARAÇÃO - EXECUTA V1 E V2 EM PARALELO
 * Para validação e análise estatística
 */
async function runComparisonMode(technicalData, reference, context) {
  try {
    console.log('🔬 [COMPARISON] Executando modo comparação V1 vs V2');
    
    const scoringV1 = await loadScoringV1();
    const scoringV2 = await loadScoringV2();
    
    const v1Result = scoringV1.computeMixScore(technicalData, reference);
    const v2Result = scoringV2 ? scoringV2.calculateScoringV2(technicalData, reference, {
      method: 'gaussian',
      enableQualityGates: true,
      enableDeduplication: true
    }) : null;

    const comparison = {
      v1Score: v1Result?.scorePct || 0,
      v2Score: v2Result?.scorePct || 0,
      improvement: (v2Result?.scorePct || 0) - (v1Result?.scorePct || 0),
      improvementPct: v1Result?.scorePct ? 
        (((v2Result?.scorePct || 0) - v1Result.scorePct) / v1Result.scorePct * 100) : 0,
      timestamp: new Date().toISOString()
    };

    // Log para análise posterior
    console.log('📊 [COMPARISON] Comparação V1 vs V2:', comparison);
    
    return comparison;
    
  } catch (compError) {
    console.warn('⚠️ [COMPARISON] Erro no modo comparação:', compError.message);
    return { error: compError.message };
  }
}

/**
 * 📈 LOGGING E MÉTRICAS
 * Para monitoramento e análise de performance
 */
function logScoringMetrics(result, processingTime) {
  try {
    // Métricas básicas
    const metrics = {
      score: result.scorePct,
      method: result.method,
      processingTime: processingTime,
      timestamp: new Date().toISOString(),
      fallbackUsed: result.decisionInfo?.fallbackUsed || false,
      version: result.scoringVersion
    };

    // Log estruturado
    console.log('📊 [SCORING_METRICS]', JSON.stringify(metrics));

    // Salvar no window para debug (desenvolvimento)
    if (typeof window !== 'undefined') {
      window.__LAST_SCORING_METRICS = metrics;
      window.__LAST_SCORING_RESULT = result;
    }

  } catch (logError) {
    console.warn('⚠️ Erro ao logar métricas:', logError.message);
  }
}

/**
 * 🎛️ FUNÇÕES DE CONTROLE PARA ADMINISTRAÇÃO
 */

// Função para forçar V2 (testes internos)
export async function forceScoringV2(technicalData, reference) {
  return await computeMixScore(technicalData, reference, { 
    forceV2: true, 
    testGroup: 'internal' 
  });
}

// Função para comparar V1 vs V2 explicitamente
export async function compareScoringVersions(technicalData, reference) {
  const scoringV1 = await loadScoringV1();
  const scoringV2 = await loadScoringV2();
  
  const v1Result = scoringV1.computeMixScore(technicalData, reference);
  const v2Result = scoringV2 ? scoringV2.calculateScoringV2(technicalData, reference, { method: 'gaussian' }) : null;
  
  return {
    v1: v1Result,
    v2: v2Result,
    comparison: {
      scoreDiff: (v2Result?.scorePct || 0) - (v1Result?.scorePct || 0),
      improvement: v2Result?.scorePct > v1Result?.scorePct,
      v1Safe: !!(v1Result?.scorePct >= 0),
      v2Safe: !!(v2Result?.scorePct >= 0)
    }
  };
}

// Função de status do sistema
export async function getScoringSystemStatus() {
  const featureFlags = await loadFeatureFlags();
  
  return {
    version: '2.0.0-integration',
    featureFlags: featureFlags.FEATURE_FLAGS ? Object.keys(featureFlags.FEATURE_FLAGS).reduce((acc, key) => {
      acc[key] = featureFlags.isFeatureEnabled ? featureFlags.isFeatureEnabled(key, { testGroup: 'internal' }) : false;
      return acc;
    }, {}) : {},
    integrationActive: true,
    lastUpdate: new Date().toISOString()
  };
}

/**
 * 🧪 FUNÇÕES DE TESTE E VALIDAÇÃO
 */

// Teste de integridade do sistema
export async function testScoringIntegrity() {
  console.log('🧪 [INTEGRATION_TEST] Iniciando teste de integridade...');
  
  const testData = {
    lufsIntegrated: -14,
    truePeakDbtp: -1.0,
    dynamicRange: 10,
    lra: 7,
    stereoCorrelation: 0.3,
    spectralCentroid: 2500
  };

  const testRef = {
    lufs_target: -14,
    true_peak_target: -1.0,
    dr_target: 10,
    lra_target: 7,
    stereo_target: 0.3
  };

  try {
    // Testar V1
    const scoringV1 = await loadScoringV1();
    const v1Result = scoringV1.computeMixScore(testData, testRef);
    const v1Safe = v1Result && typeof v1Result.scorePct === 'number' && v1Result.scorePct >= 0;
    
    // Testar V2
    const scoringV2 = await loadScoringV2();
    const v2Result = scoringV2 ? scoringV2.calculateScoringV2(testData, testRef, { method: 'gaussian' }) : null;
    const v2Safe = v2Result && typeof v2Result.scorePct === 'number' && v2Result.scorePct >= 0;
    
    // Testar wrapper
    const wrapperResult = await computeMixScore(testData, testRef, { testGroup: 'internal' });
    const wrapperSafe = wrapperResult && typeof wrapperResult.scorePct === 'number';
    
    const result = {
      v1Safe,
      v2Safe, 
      wrapperSafe,
      allSystemsGo: v1Safe && wrapperSafe, // V2 pode estar desabilitado
      scores: {
        v1: v1Result?.scorePct,
        v2: v2Result?.scorePct,
        wrapper: wrapperResult?.scorePct
      }
    };
    
    console.log('✅ [INTEGRATION_TEST] Resultado:', result);
    return result;
    
  } catch (error) {
    console.error('❌ [INTEGRATION_TEST] Falha:', error.message);
    return { error: error.message, allSystemsGo: false };
  }
}

// Export para compatibilidade
export async function computeMixScoreV1(technicalData, reference) {
  const scoringV1 = await loadScoringV1();
  return scoringV1.computeMixScore(technicalData, reference);
}

export default computeMixScore;
