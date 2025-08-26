// 🚨 HOTFIX CRÍTICO - SCORE COMPUTEMIXSCORE
console.log('🚨 APLICANDO HOTFIX CRÍTICO');

// 1. Força todas as flags
window.SCORING_V2 = true;
window.USE_TT_DR = true; 
window.USE_EQUAL_WEIGHT_V3 = true;
window.AUDIT_MODE = true;
window.FORCE_SCORING_V2 = true;
window.COLOR_RATIO_V2 = false;

// 2. Intercepta o audio-analyzer.js e força score válido
(function() {
  console.log('🔧 Interceptando sistema de scoring...');
  
  // Hook no momento da chamada do scoring
  const originalLog = console.log;
  console.log = function(...args) {
    // Detecta quando o scoring.js é carregado
    if (args[0] && args[0].includes && args[0].includes('[SCORE_DEBUG] ✅ scoring.js válido, executando...')) {
      console.log('🎯 INTERCEPTANDO MOMENTO DO SCORING');
      
      // Força carregamento do scoring.js atualizado
      setTimeout(() => {
        fetch('/lib/audio/features/scoring.js?v=' + Date.now())
          .then(r => r.text())
          .then(code => {
            console.log('✅ scoring.js recarregado no momento certo');
            eval(code);
            
            // Sobrescreve a função global
            window.computeMixScore = computeMixScore;
            window._computeEqualWeightV3 = _computeEqualWeightV3;
            
            console.log('✅ Funções atualizadas globalmente');
          });
      }, 100);
    }
    
    // Intercepta o fallback
    if (args[0] && args[0].includes && args[0].includes('[SCORE_DEBUG] ⚠️ qualityOverall inválido')) {
      console.error('🚨 FALLBACK DETECTADO - TENTANDO CORREÇÃO IMEDIATA');
      
      // Tenta executar scoring manualmente
      setTimeout(() => {
        if (window.computeMixScore && window.__LAST_TECHNICAL_DATA) {
          console.log('🔧 Tentando re-executar scoring com dados salvos...');
          
          try {
            const result = window.computeMixScore(window.__LAST_TECHNICAL_DATA, window.__LAST_REFERENCE);
            console.log('✅ Re-execução resultado:', result);
            
            if (result && Number.isFinite(result.scorePct)) {
              console.log('🎯 SCORE CORRIGIDO:', result.scorePct);
              
              // Força atualização na interface
              const scoreElements = document.querySelectorAll('[data-score], .score, .quality-score');
              scoreElements.forEach(el => {
                if (el.textContent.includes('36.55') || el.textContent.includes('36,55')) {
                  el.textContent = el.textContent.replace(/36[.,]55/, result.scorePct.toFixed(1));
                  el.style.color = '#00ff00';
                  el.style.fontWeight = 'bold';
                }
              });
            }
          } catch (err) {
            console.error('❌ Erro na re-execução:', err);
          }
        }
      }, 500);
    }
    
    originalLog.apply(console, args);
  };
  
  // Salva dados técnicos para re-execução
  const originalComputeMixScore = window.computeMixScore;
  if (originalComputeMixScore) {
    window.computeMixScore = function(technicalData, reference) {
      window.__LAST_TECHNICAL_DATA = technicalData;
      window.__LAST_REFERENCE = reference;
      
      const result = originalComputeMixScore.call(this, technicalData, reference);
      console.log('📊 computeMixScore chamado:', { input: technicalData, output: result });
      
      return result;
    };
  }
  
  console.log('✅ Hotfix aplicado - próxima análise deve funcionar');
})();

console.log('🚀 HOTFIX ATIVO - Faça uma análise de áudio agora!');
