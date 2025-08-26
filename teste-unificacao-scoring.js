// 🧪 TESTE DE UNIFICAÇÃO DO SCORING - CACHE BUSTING E VALIDAÇÃO
// Este script testa se o sistema unificado está funcionando corretamente

console.log('🚀 INICIANDO TESTE DE UNIFICAÇÃO DO SCORING');
console.log('─'.repeat(60));

// 🚫 DESABILITAR CACHE PARA TESTES
if (typeof window !== 'undefined') {
  window.DISABLE_SCORING_CACHE = true;
  window.CACHE_BUST_SCORING = true;
  console.log('✅ Cache de scoring desabilitado para testes');
}

// 📊 DADOS DE TESTE PADRÃO
const testTechnicalData = {
  lufsIntegrated: -14.5,
  truePeakDbtp: -1.2,
  dr: 8.5,
  lra: 6.8,
  crestFactor: 9.2,
  stereoCorrelation: 0.25,
  stereoWidth: 0.65,
  balanceLR: 0.02,
  spectralCentroid: 2800,
  spectralFlatness: 0.22,
  spectralRolloff85: 9200,
  dcOffset: 0.01,
  clippingSamples: 0,
  clippingPct: 0,
  runId: 'test-unificacao-' + Date.now()
};

// 🎭 REFERÊNCIAS DE TESTE POR GÊNERO
const testReferences = {
  funk_mandela: {
    lufs_target: -4.9,
    tol_lufs: 1.5,
    true_peak_target: -11.1,
    tol_true_peak: 1.3,
    dr_target: 7.3,
    tol_dr: 2.0,
    stereo_target: 0.55,
    tol_stereo: 0.16
  },
  trance: {
    lufs_target: -11.5,
    tol_lufs: 1.8,
    true_peak_target: -0.8,
    tol_true_peak: 1.0,
    dr_target: 7.2,
    tol_dr: 2.0,
    stereo_target: 0.38,
    tol_stereo: 0.15
  },
  eletronico: {
    lufs_target: -12.8,
    tol_lufs: 1.9,
    true_peak_target: -0.8,
    tol_true_peak: 1.0,
    dr_target: 7.2,
    tol_dr: 2.0,
    stereo_target: 0.42,
    tol_stereo: 0.14
  }
};

// 🧪 FUNÇÃO DE TESTE
async function testarUnificacaoScoring() {
  console.log('\n🔍 TESTANDO SISTEMA UNIFICADO...');
  
  const resultados = {};
  
  for (const [genero, referencia] of Object.entries(testReferences)) {
    console.log(`\n🎯 Testando gênero: ${genero}`);
    
    try {
      // Importar scoring module fresh - usar caminho correto
      const scoringModule = await import(`./lib/audio/features/scoring.js?v=${Date.now()}`);
      
      if (!scoringModule.computeMixScore) {
        throw new Error('computeMixScore não encontrado');
      }
      
      // Executar scoring
      const resultado = scoringModule.computeMixScore(testTechnicalData, referencia);
      
      resultados[genero] = {
        score: resultado.scorePct,
        method: resultado.method,
        classification: resultado.classification,
        engineVersion: resultado.engineVersion,
        unifiedScoring: resultado.unifiedScoring,
        timestamp: Date.now()
      };
      
      console.log(`  📊 Score: ${resultado.scorePct}%`);
      console.log(`  🔧 Method: ${resultado.method}`);
      console.log(`  🏷️ Classification: ${resultado.classification}`);
      console.log(`  🔢 Engine Version: ${resultado.engineVersion}`);
      console.log(`  ✅ Unified: ${resultado.unifiedScoring}`);
      
    } catch (error) {
      console.error(`  ❌ Erro no gênero ${genero}:`, error.message);
      resultados[genero] = { error: error.message };
    }
  }
  
  return resultados;
}

// 📋 FUNÇÃO DE VALIDAÇÃO
function validarUnificacao(resultados) {
  console.log('\n📋 VALIDANDO UNIFICAÇÃO...');
  console.log('─'.repeat(40));
  
  const generos = Object.keys(resultados);
  const validacoes = {
    engineVersion: true,
    methodConsistency: true,
    unifiedScoring: true,
    scoresDiferentes: true,
    semErros: true
  };
  
  // Verificar engine version
  generos.forEach(genero => {
    const resultado = resultados[genero];
    if (!resultado.engineVersion || resultado.engineVersion !== "3.0.0") {
      validacoes.engineVersion = false;
      console.log(`❌ Engine version incorreta para ${genero}: ${resultado.engineVersion}`);
    }
  });
  
  // Verificar method consistency
  generos.forEach(genero => {
    const resultado = resultados[genero];
    if (!resultado.method || resultado.method !== 'equal_weight_v3') {
      validacoes.methodConsistency = false;
      console.log(`❌ Method incorreto para ${genero}: ${resultado.method}`);
    }
  });
  
  // Verificar unified scoring
  generos.forEach(genero => {
    const resultado = resultados[genero];
    if (!resultado.unifiedScoring) {
      validacoes.unifiedScoring = false;
      console.log(`❌ Unified scoring não ativo para ${genero}`);
    }
  });
  
  // Verificar scores diferentes
  const scores = generos.map(g => resultados[g].score).filter(s => typeof s === 'number');
  const scoresUnicos = [...new Set(scores)];
  if (scoresUnicos.length < Math.min(scores.length, 2)) {
    validacoes.scoresDiferentes = false;
    console.log(`❌ Scores muito similares: ${scores.join(', ')}`);
  }
  
  // Verificar erros
  generos.forEach(genero => {
    if (resultados[genero].error) {
      validacoes.semErros = false;
      console.log(`❌ Erro em ${genero}: ${resultados[genero].error}`);
    }
  });
  
  // Resultado final
  const todasValidacoes = Object.values(validacoes).every(v => v);
  
  console.log('\n🎯 RESULTADO DA VALIDAÇÃO:');
  console.log(`  Engine Version 3.0.0: ${validacoes.engineVersion ? '✅' : '❌'}`);
  console.log(`  Method equal_weight_v3: ${validacoes.methodConsistency ? '✅' : '❌'}`);
  console.log(`  Unified Scoring: ${validacoes.unifiedScoring ? '✅' : '❌'}`);
  console.log(`  Scores Diferentes: ${validacoes.scoresDiferentes ? '✅' : '❌'}`);
  console.log(`  Sem Erros: ${validacoes.semErros ? '✅' : '❌'}`);
  console.log(`\n🏆 UNIFICAÇÃO: ${todasValidacoes ? '✅ SUCESSO!' : '❌ FALHOU'}`);
  
  return {
    sucesso: todasValidacoes,
    validacoes,
    resultados
  };
}

// 🚀 EXECUTAR TESTE AUTOMÁTICO
if (typeof window !== 'undefined') {
  // No browser
  window.testarUnificacaoScoring = testarUnificacaoScoring;
  window.validarUnificacao = validarUnificacao;
  
  // Auto-executar após carregamento
  setTimeout(async () => {
    console.log('🚀 Executando teste automático...');
    try {
      const resultados = await testarUnificacaoScoring();
      const validacao = validarUnificacao(resultados);
      
      // Salvar resultados globalmente para debug
      window.__TESTE_UNIFICACAO = {
        resultados,
        validacao,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Erro no teste automático:', error);
    }
  }, 2000);
  
} else {
  // No Node.js - executar teste
  console.log('🚀 EXECUTANDO TESTE AUTOMÁTICO EM NODE.JS...\n');
  
  testarUnificacaoScoring()
    .then(resultados => {
      console.log('\n📊 RESULTADOS DOS TESTES:');
      console.log('═══════════════════════════════════════════\n');
      
      Object.entries(resultados).forEach(([genero, resultado]) => {
        console.log(`🎵 ${genero.toUpperCase()}:`);
        if (resultado.error) {
          console.log(`   ❌ ERRO: ${resultado.error}`);
        } else {
          console.log(`   Score: ${resultado.score}%`);
          console.log(`   Method: ${resultado.method}`);
          console.log(`   Classification: ${resultado.classification}`);
          console.log(`   Engine: ${resultado.engineVersion}`);
          console.log(`   Unified: ${resultado.unifiedScoring}`);
        }
        console.log('');
      });
      
      console.log('\n🔍 VALIDAÇÃO DA UNIFICAÇÃO:');
      console.log('═══════════════════════════════════════════\n');
      
      const validacao = validarUnificacao(resultados);
      console.log(`🏆 RESULTADO FINAL: ${validacao.sucesso ? '✅ SUCESSO' : '❌ FALHOU'}\n`);
      
      const checks = [
        ['Engine Version 3.0.0', validacao.validacoes.engineVersion],
        ['Method equal_weight_v3', validacao.validacoes.methodConsistency],
        ['Unified Scoring', validacao.validacoes.unifiedScoring],
        ['Scores Diferentes', validacao.validacoes.scoresDiferentes],
        ['Sem Erros', validacao.validacoes.semErros]
      ];
      
      checks.forEach(([nome, passou]) => {
        console.log(`${passou ? '✅' : '❌'} ${nome}: ${passou ? 'PASSOU' : 'FALHOU'}`);
      });
      
      console.log('\n🎯 TESTE DE UNIFICAÇÃO CONCLUÍDO!');
      
    })
    .catch(error => {
      console.error('❌ ERRO NO TESTE:', error);
      console.error('Stack:', error.stack);
    });
}

console.log('✅ Script de teste carregado - usar window.testarUnificacaoScoring()');
