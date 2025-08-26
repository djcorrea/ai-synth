// 🚨 CORREÇÃO CRÍTICA PARA EQUAL WEIGHT V3
// O problema é que _computeEqualWeightV3 não está recebendo os dados na estrutura correta

function corrigirEqualWeightV3() {
  console.log('🔧 APLICANDO CORREÇÃO PARA EQUAL WEIGHT V3');
  
  // 1. Força o carregamento do scoring.js
  fetch('/lib/audio/features/scoring.js?v=' + Date.now())
    .then(response => response.text())
    .then(scoreCode => {
      console.log('✅ scoring.js recarregado');
      
      // 2. Patchear a função para debug
      const originalCode = scoreCode;
      
      // Interceptar _computeEqualWeightV3 para debug
      const patchedCode = originalCode.replace(
        'function _computeEqualWeightV3(analysisData) {',
        `function _computeEqualWeightV3(analysisData) {
          console.log('[EQUAL_WEIGHT_V3_PATCH] 📊 Dados recebidos:', analysisData);
          console.log('[EQUAL_WEIGHT_V3_PATCH] 📋 Metrics keys:', Object.keys(analysisData?.metrics || {}));
          console.log('[EQUAL_WEIGHT_V3_PATCH] 📋 Reference keys:', Object.keys(analysisData?.reference || {}));
          
          // Verificar se é null ou undefined
          if (!analysisData) {
            console.error('[EQUAL_WEIGHT_V3_PATCH] ❌ analysisData é null/undefined!');
            return { score: 50, classification: 'Básico', method: 'equal_weight_v3_fallback' };
          }
          
          if (!analysisData.metrics) {
            console.error('[EQUAL_WEIGHT_V3_PATCH] ❌ analysisData.metrics é null/undefined!');
            return { score: 50, classification: 'Básico', method: 'equal_weight_v3_fallback' };
          }`
      );
      
      // 3. Executa o código corrigido
      eval(patchedCode);
      console.log('✅ _computeEqualWeightV3 patcheado com debug');
      
      // 4. Força atualização das funções globais
      if (typeof computeMixScore === 'function') {
        window.computeMixScore = computeMixScore;
        console.log('✅ computeMixScore atualizado globalmente');
      }
      
      if (typeof _computeEqualWeightV3 === 'function') {
        window._computeEqualWeightV3 = _computeEqualWeightV3;
        console.log('✅ _computeEqualWeightV3 atualizado globalmente');
      }
      
      console.log('🎯 CORREÇÃO APLICADA! Teste uma análise agora...');
    })
    .catch(err => {
      console.error('❌ Erro ao corrigir Equal Weight V3:', err);
    });
}

// Aplicar correção
corrigirEqualWeightV3();
