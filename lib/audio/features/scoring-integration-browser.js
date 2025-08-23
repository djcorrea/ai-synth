/**
 * 🔄 SCORING V2 INTEGRATION WRAPPER - BROWSER COMPATIBLE
 * ======================================================
 * 
 * Wrapper seguro para integração do Scoring V2 com fallback automático
 * VERSÃO COMPATÍVEL COM BROWSER (sem ES6 imports)
 */

// 🎯 FUNÇÃO PRINCIPAL - WRAPPER INTELIGENTE PARA BROWSER
export async function computeMixScore(technicalData = {}, reference = null, options = {}) {
  const startTime = performance.now();
  
  // Context para decisão de scoring
  const context = {
    userId: options.userId,
    sessionId: options.sessionId,
    testGroup: options.testGroup || 'production',
    forceV2: options.forceV2 || false,
    auditMode: options.auditMode || false,
    // 🧪 TESTE DIRETO DO BROWSER
    browserTest: (typeof window !== 'undefined' && window.SCORING_V2_TEST === true)
  };

  let useScoringV2 = false;
  let scoreResult = null;
  let method = 'v1_legacy';
  let fallbackUsed = false;
  let error = null;

  console.log('🎯 [SCORING_INTEGRATION] Iniciando scoring...', { context });

  try {
    // 🎯 DECISÃO INTELIGENTE: V1 ou V2?
    useScoringV2 = shouldUseScoringV2(context);
    
    if (useScoringV2) {
      // 🚀 TENTATIVA DO SCORING V2
      console.log('🎯 [SCORING_V2] Tentando usar Scoring V2');
      
      try {
        // Carregar scoring V2 dinamicamente
        const scoringV2Module = await import('./scoring-v2-browser.js?v=' + Date.now()).catch(() => null);
        
        if (scoringV2Module && scoringV2Module.calculateScoringV2) {
          scoreResult = scoringV2Module.calculateScoringV2(technicalData, reference, {
            method: 'gaussian',
            enableQualityGates: true,
            enableDeduplication: true,
            debug: true
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
      
      try {
        // Carregar scoring V1 dinamicamente
        const scoringV1Module = await import('./scoring.js?v=' + Date.now()).catch(() => null);
        
        if (scoringV1Module && scoringV1Module.computeMixScore) {
          scoreResult = scoringV1Module.computeMixScore(technicalData, reference);
          method = fallbackUsed ? 'v1_fallback' : 'v1_legacy';
          
          // Garantir compatibilidade de formato
          if (scoreResult && typeof scoreResult.scorePct === 'number') {
            console.log(`✅ [SCORING_V1] Score V1 calculado: ${scoreResult.scorePct}%`);
          } else {
            throw new Error('Resultado V1 também inválido: ' + JSON.stringify(scoreResult));
          }
        } else {
          throw new Error('Módulo Scoring V1 não carregado');
        }
      } catch (v1Error) {
        throw new Error('Falha crítica no carregamento de V1: ' + v1Error.message);
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
      browserTest: context.browserTest,
      featureFlagsUsed: {
        SCORING_V2_ENABLED: isFeatureEnabled('SCORING_V2_ENABLED', context),
        QUALITY_GATES_ENABLED: true,
        METRIC_DEDUPLICATION: true
      },
      context: context
    },
    
    // Debug info
    debugInfo: {
      inputMetrics: Object.keys(technicalData || {}),
      referenceUsed: !!reference,
      error: error?.message,
      timestamp: new Date().toISOString()
    }
  };

  // 📈 LOGGING E MONITORAMENTO
  logScoringMetrics(finalResult, processingTime);

  return finalResult;
}

/**
 * 🎛️ DECISÃO DE SCORING V2 PARA BROWSER
 */
function shouldUseScoringV2(context) {
  // 🧪 TESTE DIRETO DO BROWSER
  if (context.browserTest) {
    console.log('🧪 [BROWSER_TEST] Forçando Scoring V2 por window.SCORING_V2_TEST');
    return true;
  }

  // Verificar se V2 está forçado
  if (context.forceV2) {
    console.log('🚀 [FORCED_V2] Scoring V2 forçado via options');
    return true;
  }

  // Para teste interno
  if (context.testGroup === 'internal') {
    console.log('🔧 [INTERNAL_TEST] Usando V2 para teste interno');
    return true;
  }

  // Por padrão, usar V1 (seguro)
  console.log('🛡️ [DEFAULT_V1] Usando V1 por padrão (seguro)');
  return false;
}

/**
 * 🎛️ VERIFICAÇÃO DE FEATURE FLAGS SIMPLIFICADA
 */
function isFeatureEnabled(flagName, context) {
  // Browser test override
  if (typeof window !== 'undefined' && window.SCORING_V2_TEST === true) {
    return flagName.includes('SCORING_V2') || flagName.includes('QUALITY') || flagName.includes('METRIC');
  }

  // Default safes
  const defaults = {
    'SCORING_V2_ENABLED': false,
    'QUALITY_GATES_ENABLED': true,
    'METRIC_DEDUPLICATION': true
  };

  return defaults[flagName] || false;
}

/**
 * 📈 LOGGING E MÉTRICAS SIMPLIFICADO
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

    // Salvar no window para debug
    if (typeof window !== 'undefined') {
      window.__LAST_SCORING_METRICS = metrics;
      window.__LAST_SCORING_RESULT = result;
      
      // Debug adicional
      if (window.SCORING_V2_TEST === true) {
        console.log('🧪 [DEBUG] Resultado completo do teste V2:', result);
      }
    }

  } catch (logError) {
    console.warn('⚠️ Erro ao logar métricas:', logError.message);
  }
}

/**
 * 🧪 FUNÇÕES DE TESTE PARA BROWSER
 */

// Função para forçar V2 no browser
export function enableScoringV2Test() {
  if (typeof window !== 'undefined') {
    window.SCORING_V2_TEST = true;
    console.log('🧪 [TEST_MODE] Scoring V2 habilitado para testes');
    console.log('➡️ Faça uma análise de áudio para ver o resultado');
  }
}

// Função para desabilitar teste
export function disableScoringV2Test() {
  if (typeof window !== 'undefined') {
    window.SCORING_V2_TEST = false;
    console.log('🛡️ [SAFE_MODE] Voltando para Scoring V1');
  }
}

// Função de status
export function getScoringStatus() {
  const isV2Enabled = typeof window !== 'undefined' && window.SCORING_V2_TEST === true;
  
  return {
    v2TestEnabled: isV2Enabled,
    version: isV2Enabled ? 'v2.0.0-test' : 'v1.0.0-stable',
    lastResult: typeof window !== 'undefined' ? window.__LAST_SCORING_RESULT : null,
    lastMetrics: typeof window !== 'undefined' ? window.__LAST_SCORING_METRICS : null
  };
}

// Export para compatibilidade
export default computeMixScore;

// 🎯 SETUP AUTOMÁTICO PARA BROWSER
if (typeof window !== 'undefined') {
  // Função global para teste fácil
  window.enableScoringV2Test = enableScoringV2Test;
  window.disableScoringV2Test = disableScoringV2Test;
  window.getScoringStatus = getScoringStatus;
  
  console.log('🎯 [SCORING_INTEGRATION] Módulo carregado! Use window.enableScoringV2Test() para testar');
}
