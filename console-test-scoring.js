console.log('🔥 TESTE DIRETO DO NOVO SISTEMA');

// Carregar o módulo e testar
(async () => {
  try {
    console.log('📥 Importando módulo...');
    const scoringModule = await import(`./lib/audio/features/scoring.js?v=${Date.now()}`);
    console.log('✅ Módulo carregado:', Object.keys(scoringModule));
    
    // Dados simples de teste
    const testData = {
      lufs_integrated: -12.0,
      dr_stat: 8.0,
      true_peak_dbtp: -0.5
    };
    
    const testRef = {
      lufs_target: -14,
      tol_lufs: 3.0,
      dr_target: 10,
      tol_dr: 5.0
    };
    
    console.log('🔄 Executando computeMixScore...');
    const result = scoringModule.computeMixScore(testData, testRef);
    
    console.log('📊 RESULTADO:', result);
    console.log('🎯 Método usado:', result.method);
    console.log('📈 Score:', result.scorePct + '%');
    
    if (result.method === 'equal_weight_v3') {
      console.log('🎉 SUCESSO! Novo sistema funcionando!');
    } else {
      console.log('❌ FALHA! Sistema antigo ainda ativo:', result.method);
    }
    
  } catch (error) {
    console.error('❌ ERRO:', error);
  }
})();
