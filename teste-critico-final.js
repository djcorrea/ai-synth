// 🎯 TESTE CRÍTICO FINAL - COLE NO CONSOLE DA VERCEL
console.log('🚨 INICIANDO TESTE CRÍTICO FINAL');

// 1. Força TODAS as flags
window.SCORING_V2 = true;
window.USE_TT_DR = true; 
window.USE_EQUAL_WEIGHT_V3 = true;
window.AUDIT_MODE = true;
window.FORCE_SCORING_V2 = true;
window.COLOR_RATIO_V2 = false;

// 2. Carrega scoring.js atualizado
fetch('/lib/audio/features/scoring.js?v=' + Date.now())
  .then(response => response.text())
  .then(code => {
    console.log('✅ scoring.js carregado (', code.length, 'bytes)');
    
    // Executa código
    eval(code);
    
    // 3. Teste simples do computeMixScore
    const testData = {
      peak: 0,
      rms: -6.5,
      tt_dr: 7.6,
      lufsIntegrated: -4.0,
      truePeakDbtp: -1.8,
      stereoCorrelation: 0.2
    };
    
    const testRef = {
      lufs_target: -14,
      true_peak_target: -1,
      dr_target: 10
    };
    
    console.log('🧪 TESTE 1: computeMixScore simples');
    try {
      const result1 = computeMixScore(testData, testRef);
      console.log('✅ Resultado 1:', result1);
      
      if (result1 && Number.isFinite(result1.scorePct)) {
        console.log('🎯 SCORE VÁLIDO:', result1.scorePct);
      } else {
        console.error('❌ Score inválido!');
      }
    } catch (e) {
      console.error('❌ Erro no teste 1:', e);
    }
    
    // 4. Força reload do sistema
    if (typeof window.computeMixScore !== 'function') {
      window.computeMixScore = computeMixScore;
    }
    
    console.log('🎯 CORREÇÃO APLICADA! Teste uma análise agora!');
    console.log('📊 Busque por logs [SCORING_ENTRY] no console');
  })
  .catch(err => {
    console.error('❌ Erro ao carregar scoring.js:', err);
  });

console.log('🔧 SCRIPT CARREGADO - Aguarde execução...');
