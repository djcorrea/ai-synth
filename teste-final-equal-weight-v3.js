// 🎯 TESTE FINAL - EQUAL WEIGHT V3 COM DEBUG COMPLETO
console.log('🚀 INICIANDO TESTE FINAL DO EQUAL WEIGHT V3');

// 1. Força TODAS as flags necessárias
window.SCORING_V2 = true;
window.USE_TT_DR = true; 
window.USE_EQUAL_WEIGHT_V3 = true;
window.AUDIT_MODE = true;
window.FORCE_SCORING_V2 = true;
window.COLOR_RATIO_V2 = false; // ⭐ FORÇA NOVO SISTEMA

console.log('✅ FLAGS CONFIGURADAS:', {
  SCORING_V2: window.SCORING_V2,
  USE_TT_DR: window.USE_TT_DR,
  USE_EQUAL_WEIGHT_V3: window.USE_EQUAL_WEIGHT_V3,
  AUDIT_MODE: window.AUDIT_MODE,
  FORCE_SCORING_V2: window.FORCE_SCORING_V2,
  COLOR_RATIO_V2: window.COLOR_RATIO_V2
});

// 2. Força recarregamento do scoring.js atualizado
setTimeout(() => {
  fetch('/lib/audio/features/scoring.js?v=' + Date.now())
    .then(response => response.text())
    .then(code => {
      console.log('✅ scoring.js recarregado com correções');
      eval(code);
      
      // Disponibilizar funções globalmente
      if (typeof computeMixScore === 'function') {
        window.computeMixScore = computeMixScore;
        console.log('✅ computeMixScore atualizado');
      }
      
      if (typeof _computeEqualWeightV3 === 'function') {
        window._computeEqualWeightV3 = _computeEqualWeightV3;
        console.log('✅ _computeEqualWeightV3 atualizado');
      }
      
      console.log('🎯 SISTEMA ATUALIZADO! Agora faça uma análise de áudio');
      console.log('📊 Observe os logs [EQUAL_WEIGHT_V3] no console');
      console.log('✅ O score deve mudar significativamente agora!');
    })
    .catch(err => {
      console.error('❌ Erro ao recarregar scoring.js:', err);
    });
}, 500);

// 3. Debug de mudanças no score
let lastScore = null;
const originalLog = console.log;
console.log = function(...args) {
  // Interceptar logs de score
  if (args[0] && args[0].includes && args[0].includes('[SCORE_DEBUG]') && args[0].includes('Score final definido')) {
    const currentScore = args[1];
    if (lastScore !== null && lastScore !== currentScore) {
      originalLog('🎉 SCORE MUDOU!', 'Anterior:', lastScore, '→ Novo:', currentScore);
    }
    lastScore = currentScore;
  }
  
  // Mostrar logs importantes
  if (args[0] && (
    args[0].includes('[EQUAL_WEIGHT_V3]') ||
    args[0].includes('[SCORE_DEBUG]') ||
    args[0].includes('[WEIGHTED_AGGREGATE]')
  )) {
    originalLog.apply(console, ['🔍', ...args]);
  } else {
    originalLog.apply(console, args);
  }
};

console.log('🔧 DEBUG CONFIGURADO - TESTE UMA ANÁLISE AGORA!');
