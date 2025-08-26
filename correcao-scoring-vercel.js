// 🔧 CORREÇÃO SCORING VERCEL - Garantir que unificação funcione em produção

console.log('🔧 INICIANDO CORREÇÃO DO SCORING PARA VERCEL...');

// 1. Verificar se o scoring.js unificado está acessível
async function testarScoringVercel() {
  console.log('\n🧪 TESTANDO SCORING NO VERCEL...');
  
  try {
    // Testar carregamento do scoring.js
    const scoringModule = await import('./lib/audio/features/scoring.js?v=' + Date.now());
    console.log('✅ Scoring.js carregado:', !!scoringModule);
    console.log('✅ computeMixScore disponível:', typeof scoringModule.computeMixScore === 'function');
    
    // Dados de teste simples
    const testData = {
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
      clippingPct: 0
    };
    
    const testRef = {
      lufs_target: -11.5,
      tol_lufs: 1.8,
      true_peak_target: -0.8,
      tol_true_peak: 1,
      dr_target: 7.2,
      tol_dr: 2,
      stereo_target: 0.38,
      tol_stereo: 0.15
    };
    
    console.log('🧪 Executando teste com dados mock...');
    const resultado = scoringModule.computeMixScore(testData, testRef);
    
    console.log('\n📊 RESULTADO DO TESTE:');
    console.log('Score:', resultado?.score || resultado?.scorePct);
    console.log('Method:', resultado?.method || resultado?.scoringMethod);
    console.log('Engine:', resultado?.engineVersion);
    console.log('Unified:', resultado?.unifiedScoring);
    
    return resultado;
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE VERCEL:', error);
    return null;
  }
}

// 2. Criar patch para o audio-analyzer.js
function criarPatchAudioAnalyzer() {
  console.log('\n🔨 CRIANDO PATCH PARA AUDIO-ANALYZER...');
  
  const patchCode = `
// 🔧 PATCH SCORING VERCEL - Forçar execução correta do scoring.js unificado

// Função melhorada para executar scoring com logging detalhado
async function executarScoringUnificado(technicalData, genreRef) {
  console.log('[SCORING_PATCH] 🚀 Executando scoring unificado...');
  console.log('[SCORING_PATCH] 📊 TechnicalData keys:', Object.keys(technicalData || {}));
  console.log('[SCORING_PATCH] 📋 GenreRef:', genreRef);
  
  try {
    // Cache bust agressivo para Vercel
    const cacheBust = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const scoringModule = await import('/lib/audio/features/scoring.js?v=' + cacheBust);
    
    console.log('[SCORING_PATCH] ✅ Módulo carregado:', !!scoringModule);
    
    if (!scoringModule || typeof scoringModule.computeMixScore !== 'function') {
      console.error('[SCORING_PATCH] ❌ computeMixScore não encontrado');
      return null;
    }
    
    console.log('[SCORING_PATCH] 🎯 Executando computeMixScore...');
    
    // Garantir que o console.log do scoring.js apareça
    const originalLog = console.log;
    console.log = function(...args) {
      if (args[0] && args[0].includes && (args[0].includes('[SCORING') || args[0].includes('[EQUAL_WEIGHT'))) {
        originalLog.apply(console, ['[PATCH_LOG]', ...args]);
      } else {
        originalLog.apply(console, args);
      }
    };
    
    const resultado = scoringModule.computeMixScore(technicalData, genreRef);
    
    // Restaurar console.log
    console.log = originalLog;
    
    console.log('[SCORING_PATCH] 📊 Resultado raw:', resultado);
    console.log('[SCORING_PATCH] 📊 Score:', resultado?.score || resultado?.scorePct);
    console.log('[SCORING_PATCH] 🔧 Method:', resultado?.method || resultado?.scoringMethod);
    console.log('[SCORING_PATCH] 🔢 Engine:', resultado?.engineVersion);
    console.log('[SCORING_PATCH] ✅ Unified:', resultado?.unifiedScoring);
    
    return resultado;
    
  } catch (error) {
    console.error('[SCORING_PATCH] ❌ Erro na execução:', error);
    console.error('[SCORING_PATCH] ❌ Stack:', error.stack);
    return null;
  }
}

// Override do sistema de scoring no audio-analyzer
if (typeof window !== 'undefined') {
  window.SCORING_PATCH_ENABLED = true;
  window.executarScoringUnificado = executarScoringUnificado;
  console.log('[SCORING_PATCH] ✅ Patch instalado no window');
}
`;
  
  console.log('📝 Patch gerado com sucesso');
  return patchCode;
}

// 3. Criar versão corrigida do audio-analyzer
async function corrigirAudioAnalyzer() {
  console.log('\n🔨 CORRIGINDO AUDIO-ANALYZER.JS...');
  
  try {
    // Ler o audio-analyzer atual
    const fs = require('fs').promises;
    const path = './public/audio-analyzer.js';
    
    let content = await fs.readFile(path, 'utf8');
    
    // Encontrar a seção onde o scoring é executado
    const searchPattern = "const finalScore = scorerMod.computeMixScore(tdFinal, genreSpecificRef);";
    
    if (content.includes(searchPattern)) {
      // Substituir por versão melhorada
      const replacement = `
            // 🔧 SCORING PATCH - Execução aprimorada para Vercel
            console.log('[SCORING_VERCEL] 🚀 Executando scoring unificado...');
            console.log('[SCORING_VERCEL] 📊 tdFinal keys:', Object.keys(tdFinal || {}));
            console.log('[SCORING_VERCEL] 📋 genreSpecificRef:', genreSpecificRef);
            
            let finalScore = null;
            try {
              // Cache bust agressivo
              const cacheBust = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
              console.log('[SCORING_VERCEL] 🔄 Cache bust:', cacheBust);
              
              // Forçar reload do módulo
              delete window.scoringModuleCache;
              const freshScoringModule = await import('/lib/audio/features/scoring.js?v=' + cacheBust);
              console.log('[SCORING_VERCEL] ✅ Fresh module loaded:', !!freshScoringModule);
              
              if (freshScoringModule && typeof freshScoringModule.computeMixScore === 'function') {
                console.log('[SCORING_VERCEL] 🎯 Chamando computeMixScore...');
                
                // Interceptar logs internos
                const originalConsoleLog = console.log;
                console.log = function(...args) {
                  originalConsoleLog.apply(console, ['[VERCEL_LOG]', ...args]);
                };
                
                finalScore = freshScoringModule.computeMixScore(tdFinal, genreSpecificRef);
                
                // Restaurar console
                console.log = originalConsoleLog;
                
                console.log('[SCORING_VERCEL] 📊 finalScore result:', finalScore);
                console.log('[SCORING_VERCEL] 📊 Score value:', finalScore?.score || finalScore?.scorePct);
                console.log('[SCORING_VERCEL] 🔧 Method:', finalScore?.method || finalScore?.scoringMethod);
                console.log('[SCORING_VERCEL] 🔢 Engine:', finalScore?.engineVersion);
                console.log('[SCORING_VERCEL] ✅ Unified:', finalScore?.unifiedScoring);
                
              } else {
                console.error('[SCORING_VERCEL] ❌ computeMixScore não disponível');
              }
              
            } catch (scoringError) {
              console.error('[SCORING_VERCEL] ❌ Erro no scoring:', scoringError);
              console.error('[SCORING_VERCEL] ❌ Stack:', scoringError.stack);
              finalScore = null;
            }
            `;
      
      content = content.replace(searchPattern, replacement);
      console.log('✅ Padrão encontrado e substituído');
      
      // Salvar versão corrigida
      await fs.writeFile(path, content, 'utf8');
      console.log('✅ Audio-analyzer.js corrigido e salvo');
      
      return true;
    } else {
      console.error('❌ Padrão não encontrado no arquivo');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro ao corrigir audio-analyzer:', error);
    return false;
  }
}

// 4. Executar correção completa
async function executarCorrecaoCompleta() {
  console.log('\n🎯 EXECUTANDO CORREÇÃO COMPLETA...');
  
  // Testar scoring atual
  const testeInicial = await testarScoringVercel();
  
  if (testeInicial && testeInicial.engineVersion === '3.0.0') {
    console.log('✅ Scoring já está funcionando corretamente!');
    return true;
  }
  
  // Aplicar correção no audio-analyzer
  const correcaoFeita = await corrigirAudioAnalyzer();
  
  if (correcaoFeita) {
    console.log('✅ Correção aplicada com sucesso!');
    console.log('🚀 Execute: git add . && git commit -m "fix: scoring unificado vercel" && git push');
    return true;
  } else {
    console.error('❌ Falha na correção');
    return false;
  }
}

// Executar se for Node.js
if (typeof window === 'undefined') {
  executarCorrecaoCompleta()
    .then(sucesso => {
      if (sucesso) {
        console.log('\n🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
      } else {
        console.log('\n❌ CORREÇÃO FALHOU!');
      }
    })
    .catch(error => {
      console.error('❌ ERRO NA CORREÇÃO:', error);
    });
} else {
  // Browser - apenas exportar funções
  window.correcaoScoringVercel = {
    testarScoringVercel,
    executarCorrecaoCompleta
  };
  console.log('✅ Correção carregada no browser');
}

module.exports = {
  testarScoringVercel,
  executarCorrecaoCompleta
};
