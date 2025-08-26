// 🔍 VALIDADOR DE SISTEMA - Verifica se todas as correções foram aplicadas
// Executa verificações detalhadas antes da auditoria oficial

console.log('🔧 SISTEMA DE VALIDAÇÃO CARREGADO');

/**
 * ✅ Verificar se os exports estão corretos
 */
async function validateExports() {
  console.log('\n🔍 VALIDANDO EXPORTS DOS MÓDULOS...');
  
  try {
    // Testar spectrum.js
    const spectrumModule = await import('/lib/audio/features/spectrum.js?v=' + Date.now());
    const hasComputeSpectrum = typeof spectrumModule.computeSpectrum === 'function';
    console.log(`✅ computeSpectrum: ${hasComputeSpectrum ? 'DISPONÍVEL' : 'AUSENTE'}`);
    
    // Testar loudness.js  
    const loudnessModule = await import('/lib/audio/features/loudness.js?v=' + Date.now());
    const hasComputeLoudness = typeof loudnessModule.computeLoudness === 'function';
    console.log(`✅ computeLoudness: ${hasComputeLoudness ? 'DISPONÍVEL' : 'AUSENTE'}`);
    
    // Testar scoring.js
    const scoringModule = await import('/lib/audio/features/scoring.js?v=' + Date.now());
    const hasComputeMixScore = typeof scoringModule.computeMixScore === 'function';
    console.log(`✅ computeMixScore: ${hasComputeMixScore ? 'DISPONÍVEL' : 'AUSENTE'}`);
    
    return {
      spectrum: hasComputeSpectrum,
      loudness: hasComputeLoudness,
      scoring: hasComputeMixScore,
      allOK: hasComputeSpectrum && hasComputeLoudness && hasComputeMixScore
    };
    
  } catch (error) {
    console.error('❌ Erro ao validar exports:', error.message);
    return { allOK: false, error: error.message };
  }
}

/**
 * 📊 Verificar estrutura dos dados de referência
 */
async function validateReferenceStructure() {
  console.log('\n📊 VALIDANDO ESTRUTURA DOS DADOS...');
  
  try {
    const response = await fetch('/public/refs/out/funk_mandela.json?v=' + Date.now());
    const rawData = await response.json();
    
    console.log('📦 Estrutura original:', Object.keys(rawData));
    
    // Verificar se funk_mandela existe
    const hasFunkMandela = !!rawData.funk_mandela;
    console.log(`✅ funk_mandela wrapper: ${hasFunkMandela ? 'PRESENTE' : 'AUSENTE'}`);
    
    if (hasFunkMandela) {
      const data = rawData.funk_mandela;
      console.log('📋 Campos em funk_mandela:', Object.keys(data));
      
      const hasBands = !!data.bands;
      const hasTargets = !!data.targets;
      const hasStats = !!data.stats;
      
      console.log(`✅ bands: ${hasBands ? 'PRESENTE' : 'AUSENTE'}`);
      console.log(`✅ targets: ${hasTargets ? 'PRESENTE' : 'AUSENTE'}`);
      console.log(`✅ stats: ${hasStats ? 'PRESENTE' : 'AUSENTE'}`);
      
      return {
        hasWrapper: true,
        hasBands,
        hasTargets,
        hasStats,
        allOK: hasBands && hasTargets
      };
    }
    
    return { hasWrapper: false, allOK: false };
    
  } catch (error) {
    console.error('❌ Erro ao validar dados:', error.message);
    return { allOK: false, error: error.message };
  }
}

/**
 * 🎯 Testar scoring com dados reais
 */
async function validateScoring() {
  console.log('\n🎯 VALIDANDO SISTEMA DE SCORING...');
  
  try {
    // Carregar módulos
    const scoringModule = await import('/lib/audio/features/scoring.js?v=' + Date.now());
    const response = await fetch('/public/refs/out/funk_mandela.json?v=' + Date.now());
    const rawRefData = await response.json();
    
    // Usar adaptador se disponível
    const refData = window.adaptReferenceData ? 
      window.adaptReferenceData(rawRefData) : 
      rawRefData.funk_mandela || rawRefData;
    
    // Dados de teste simples
    const testData = {
      sampleRate: 44100,
      spectrum: new Array(256).fill(0.5),
      rms: 0.3,
      peak: 0.7
    };
    
    console.log('🧪 Executando teste de scoring...');
    const result = scoringModule.computeMixScore(testData, refData);
    
    console.log('📊 Resultado:', result);
    
    const hasValidScore = result && (
      typeof result.advancedScorePct === 'number' ||
      typeof result.scorePct === 'number' ||
      typeof result.score === 'number'
    );
    
    if (hasValidScore) {
      const score = result.advancedScorePct || result.scorePct || result.score;
      console.log(`✅ Score calculado: ${score}%`);
      return { allOK: true, score, result };
    } else {
      console.log('❌ Score não calculado');
      return { allOK: false, result };
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar scoring:', error.message);
    return { allOK: false, error: error.message };
  }
}

/**
 * 🔬 Executar validação completa
 */
async function runCompleteValidation() {
  console.log('🚀 INICIANDO VALIDAÇÃO COMPLETA DO SISTEMA...');
  console.log('===============================================');
  
  const exports = await validateExports();
  const structure = await validateReferenceStructure();
  const scoring = await validateScoring();
  
  console.log('\n📋 RELATÓRIO DE VALIDAÇÃO:');
  console.log('===========================');
  
  console.log(`🔧 Exports dos módulos: ${exports.allOK ? '✅ OK' : '❌ FALHA'}`);
  console.log(`📊 Estrutura dos dados: ${structure.allOK ? '✅ OK' : '❌ FALHA'}`);
  console.log(`🎯 Sistema de scoring: ${scoring.allOK ? '✅ OK' : '❌ FALHA'}`);
  
  const overallOK = exports.allOK && structure.allOK && scoring.allOK;
  
  console.log(`\n🎯 RESULTADO GERAL: ${overallOK ? '✅ SISTEMA PRONTO' : '❌ REQUER ATENÇÃO'}`);
  
  if (overallOK) {
    console.log('🎉 Todas as correções foram aplicadas com sucesso!');
    console.log('💡 A auditoria oficial agora deve passar com score alto.');
  } else {
    console.log('⚠️ Alguns problemas ainda precisam ser resolvidos.');
  }
  
  return {
    exports,
    structure,
    scoring,
    overallOK
  };
}

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
  window.validateExports = validateExports;
  window.validateReferenceStructure = validateReferenceStructure;
  window.validateScoring = validateScoring;
  window.runCompleteValidation = runCompleteValidation;
  
  console.log('✅ Sistema de validação pronto. Execute runCompleteValidation() para testar.');
}
