// 🔍 DEBUG ESPECÍFICO PARA EQUAL WEIGHT V3
console.log('🚀 INICIANDO DEBUG EQUAL WEIGHT V3');

// Forçar flags
window.SCORING_V2 = true;
window.USE_TT_DR = true; 
window.USE_EQUAL_WEIGHT_V3 = true;
window.AUDIT_MODE = true;
window.FORCE_SCORING_V2 = true;
window.COLOR_RATIO_V2 = false;

console.log('📋 Flags configuradas:', {
  SCORING_V2: window.SCORING_V2,
  USE_TT_DR: window.USE_TT_DR,
  USE_EQUAL_WEIGHT_V3: window.USE_EQUAL_WEIGHT_V3,
  AUDIT_MODE: window.AUDIT_MODE,
  FORCE_SCORING_V2: window.FORCE_SCORING_V2,
  COLOR_RATIO_V2: window.COLOR_RATIO_V2
});

// Hook para interceptar chamadas do Equal Weight V3
const originalConsoleLog = console.log;
console.log = function(...args) {
  if (args[0] && (args[0].includes('[EQUAL_WEIGHT_V3]') || args[0].includes('[SCORE_DEBUG]'))) {
    originalConsoleLog.apply(console, ['🔍 INTERCEPTED:', ...args]);
  } else {
    originalConsoleLog.apply(console, args);
  }
};

// Interceptar computeMixScore
if (typeof window.computeMixScore === 'function') {
  const originalComputeMixScore = window.computeMixScore;
  
  window.computeMixScore = function(technicalData, reference) {
    console.log('🎯 INTERCEPTANDO computeMixScore');
    console.log('📊 technicalData keys:', Object.keys(technicalData || {}));
    console.log('📊 technicalData sample:', technicalData);
    console.log('📋 reference:', reference);
    
    const result = originalComputeMixScore.call(this, technicalData, reference);
    
    console.log('✅ computeMixScore resultado:', result);
    console.log('📊 Score final:', result?.scorePct);
    console.log('🔧 Método usado:', result?.method);
    
    return result;
  };
  
  console.log('✅ computeMixScore interceptado');
} else {
  console.warn('❌ computeMixScore não encontrado');
}

// Interceptar _computeEqualWeightV3 se disponível
setTimeout(() => {
  if (typeof window._computeEqualWeightV3 === 'function') {
    const original_computeEqualWeightV3 = window._computeEqualWeightV3;
    
    window._computeEqualWeightV3 = function(analysisData) {
      console.log('🎯 INTERCEPTANDO _computeEqualWeightV3');
      console.log('📊 analysisData:', analysisData);
      
      const result = original_computeEqualWeightV3.call(this, analysisData);
      
      console.log('✅ _computeEqualWeightV3 resultado:', result);
      
      if (!result) {
        console.error('❌ _computeEqualWeightV3 retornou null/undefined!');
      } else if (!Number.isFinite(result.score)) {
        console.error('❌ _computeEqualWeightV3 score inválido:', result.score);
      } else {
        console.log('✅ _computeEqualWeightV3 válido - score:', result.score);
      }
      
      return result;
    };
    
    console.log('✅ _computeEqualWeightV3 interceptado');
  } else {
    console.warn('❌ _computeEqualWeightV3 não encontrado');
  }
}, 1000);

console.log('🔧 DEBUG configurado! Faça uma análise de áudio agora...');
