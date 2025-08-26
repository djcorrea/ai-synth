// 🔍 AUDITORIA COMPLETA DO SISTEMA DE ANÁLISE DE MÚSICA
// Data: 25 de agosto de 2025
// Objetivo: Avaliar todo o pipeline de análise e scoring

console.log('🎵 INICIANDO AUDITORIA COMPLETA DO SISTEMA');
console.log('==========================================');

// FASE 1: VERIFICAR ARQUIVOS CORE DO SISTEMA
console.log('\n📂 FASE 1: VERIFICANDO ARQUIVOS ESSENCIAIS');

const coreFiles = [
  '/lib/audio/features/scoring.js',
  '/lib/audio/features/spectrum.js', 
  '/lib/audio/features/loudness.js',
  '/lib/audio/features/truepeak.js',
  '/public/audio-analyzer.js',
  '/public/refs/embedded-refs-new.js',
  '/public/refs/out/funk_mandela.json'
];

let filesStatus = {};

async function checkCoreFiles() {
  console.log('Verificando arquivos essenciais...');
  
  for (const file of coreFiles) {
    try {
      const response = await fetch(file + '?v=' + Date.now());
      filesStatus[file] = {
        exists: response.ok,
        status: response.status,
        size: response.headers.get('content-length') || 'unknown'
      };
      console.log(`✅ ${file}: OK (${response.status})`);
    } catch (error) {
      filesStatus[file] = {
        exists: false,
        error: error.message
      };
      console.log(`❌ ${file}: ERRO - ${error.message}`);
    }
  }
}

// FASE 2: TESTAR PIPELINE DE ANÁLISE
console.log('\n🔬 FASE 2: TESTANDO PIPELINE DE ANÁLISE');

async function testAnalysisPipeline() {
  try {
    // Carregar módulos essenciais
    const scoringModule = await import('/lib/audio/features/scoring.js?v=' + Date.now());
    const spectrumModule = await import('/lib/audio/features/spectrum.js?v=' + Date.now());
    const loudnessModule = await import('/lib/audio/features/loudness.js?v=' + Date.now());
    
    console.log('✅ Módulos carregados com sucesso');
    
    // Verificar se funções principais existem
    const requiredFunctions = {
      'computeMixScore': scoringModule.computeMixScore,
      'computeSpectrum': spectrumModule.computeSpectrum,
      'computeLoudness': loudnessModule.computeLoudness
    };
    
    for (const [name, func] of Object.entries(requiredFunctions)) {
      if (typeof func === 'function') {
        console.log(`✅ ${name}: Função disponível`);
      } else {
        console.log(`❌ ${name}: Função não encontrada ou inválida`);
      }
    }
    
    return { scoringModule, spectrumModule, loudnessModule };
  } catch (error) {
    console.log(`❌ Erro ao carregar módulos: ${error.message}`);
    return null;
  }
}

// FASE 3: VERIFICAR DADOS DE REFERÊNCIA
console.log('\n📊 FASE 3: VERIFICANDO DADOS DE REFERÊNCIA');

async function checkReferenceData() {
  try {
    const refsResponse = await fetch('/public/refs/out/funk_mandela.json?v=' + Date.now());
    if (!refsResponse.ok) {
      throw new Error(`HTTP ${refsResponse.status}`);
    }
    
    const refDataWrapper = await refsResponse.json();
    console.log('✅ Dados de referência carregados');
    
    // ✅ CORREÇÃO: Extrair dados do wrapper funk_mandela
    const refData = refDataWrapper.funk_mandela || refDataWrapper;
    
    // Verificar estrutura dos dados
    const requiredFields = ['bands', 'targets', 'tolerances'];
    let dataStructureOK = true;
    
    for (const field of requiredFields) {
      if (refData[field]) {
        console.log(`✅ Campo '${field}': Presente`);
      } else {
        console.log(`❌ Campo '${field}': Ausente`);
        dataStructureOK = false;
      }
    }
    
    // Verificar algumas bandas específicas
    if (refData.bands) {
      const sampleBands = Object.keys(refData.bands).slice(0, 5);
      console.log(`📋 Bandas de exemplo: ${sampleBands.join(', ')}`);
      
      // Verificar estrutura de banda
      const firstBand = refData.bands[sampleBands[0]];
      if (firstBand && firstBand.target_db !== undefined && firstBand.tol_db !== undefined) {
        console.log(`✅ Estrutura de banda válida: target_db=${firstBand.target_db}, tol_db=${firstBand.tol_db}`);
      } else {
        console.log(`❌ Estrutura de banda inválida`);
        dataStructureOK = false;
      }
    }
    
    return { refData, dataStructureOK };
  } catch (error) {
    console.log(`❌ Erro ao carregar dados de referência: ${error.message}`);
    return { refData: null, dataStructureOK: false };
  }
}

// FASE 4: TESTE DE ANÁLISE REAL
console.log('\n🎯 FASE 4: TESTE DE ANÁLISE COM DADOS SIMULADOS');

async function testRealAnalysis(modules, refData) {
  if (!modules || !refData) {
    console.log('❌ Não é possível realizar teste - módulos ou dados faltando');
    return null;
  }
  
  try {
    // ✅ CORREÇÃO: Usar adaptador para garantir compatibilidade
    const adaptedRefData = window.adaptReferenceData ? window.adaptReferenceData(refData) : refData;
    
    // Criar dados de teste simulando um áudio real
    const mockAudioData = {
      sampleRate: 44100,
      spectrum: new Array(1024).fill(0).map((_, i) => {
        // Simular espectro realista com mais energia em baixas frequências
        const freq = (i / 1024) * 22050;
        if (freq < 100) return 0.8 + Math.random() * 0.2;
        if (freq < 1000) return 0.6 + Math.random() * 0.3;
        if (freq < 5000) return 0.4 + Math.random() * 0.4;
        return 0.1 + Math.random() * 0.2;
      }),
      rms: 0.3,
      peak: 0.8,
      duration: 180000 // 3 minutos
    };
    
    console.log('📊 Dados de teste criados');
    
    // Testar cálculo de score
    const scoreResult = modules.scoringModule.computeMixScore(mockAudioData, adaptedRefData);
    
    console.log('🔍 Resultado bruto do scoring:', scoreResult);
    
    if (scoreResult && (typeof scoreResult.advancedScorePct === 'number' || typeof scoreResult.scorePct === 'number')) {
      const finalScore = scoreResult.advancedScorePct || scoreResult.scorePct || scoreResult.score;
      console.log(`✅ Score calculado: ${finalScore}%`);
      console.log(`📊 Versão do sistema: ${scoreResult.version || 'N/A'}`);
      
      // Verificar se o score está em range válido
      if (finalScore >= 0 && finalScore <= 100) {
        console.log('✅ Score em range válido (0-100%)');
      } else {
        console.log(`❌ Score fora do range válido: ${finalScore}%`);
      }
      
      return scoreResult;
    } else {
      console.log('❌ Score não calculado corretamente');
      console.log('🔍 Campos disponíveis:', Object.keys(scoreResult || {}));
      return null;
    }
  } catch (error) {
    console.log(`❌ Erro durante análise: ${error.message}`);
    return null;
  }
}

// FASE 5: VERIFICAR CONSISTÊNCIA DE MÚLTIPLOS TESTES
console.log('\n🔄 FASE 5: TESTE DE CONSISTÊNCIA');

async function testConsistency(modules, refData) {
  if (!modules || !refData) {
    console.log('❌ Não é possível realizar teste de consistência');
    return false;
  }
  
  const scores = [];
  
  for (let i = 0; i < 3; i++) {
    try {
      // Criar dados idênticos para cada teste
      const identicalData = {
        sampleRate: 44100,
        spectrum: new Array(512).fill(0.5), // Dados idênticos
        rms: 0.3,
        peak: 0.7,
        duration: 120000
      };
      
      const result = modules.scoringModule.computeMixScore(identicalData, refData);
      if (result && (typeof result.advancedScorePct === 'number' || typeof result.scorePct === 'number')) {
        const finalScore = result.advancedScorePct || result.scorePct || result.score;
        scores.push(finalScore);
      }
    } catch (error) {
      console.log(`❌ Erro no teste ${i + 1}: ${error.message}`);
    }
  }
  
  if (scores.length === 3) {
    const allSame = scores.every(score => Math.abs(score - scores[0]) < 0.01);
    if (allSame) {
      console.log(`✅ Consistência OK - todos os scores: ${scores[0]}%`);
      return true;
    } else {
      console.log(`❌ Inconsistência detectada - scores: ${scores.join(', ')}%`);
      return false;
    }
  } else {
    console.log(`❌ Nem todos os testes funcionaram (${scores.length}/3)`);
    return false;
  }
}

// EXECUTAR AUDITORIA
async function runFullAudit() {
  console.log('\n🚀 EXECUTANDO AUDITORIA COMPLETA...');
  
  await checkCoreFiles();
  const modules = await testAnalysisPipeline();
  const { refData, dataStructureOK } = await checkReferenceData();
  const analysisResult = await testRealAnalysis(modules, refData);
  const consistencyOK = await testConsistency(modules, refData);
  
  // RELATÓRIO FINAL
  console.log('\n📋 RELATÓRIO FINAL DA AUDITORIA');
  console.log('================================');
  
  let totalScore = 0;
  let maxScore = 0;
  
  // Pontuação por categoria
  const categories = {
    'Arquivos Core': { max: 20, score: 0 },
    'Pipeline de Análise': { max: 20, score: 0 },
    'Dados de Referência': { max: 20, score: 0 },
    'Cálculo de Score': { max: 20, score: 0 },
    'Consistência': { max: 20, score: 0 }
  };
  
  // Avaliar Arquivos Core
  const coreFilesOK = Object.values(filesStatus).every(status => status.exists);
  categories['Arquivos Core'].score = coreFilesOK ? 20 : 10;
  
  // Avaliar Pipeline
  categories['Pipeline de Análise'].score = modules ? 20 : 0;
  
  // Avaliar Dados de Referência
  categories['Dados de Referência'].score = dataStructureOK ? 20 : 0;
  
  // Avaliar Cálculo de Score
  categories['Cálculo de Score'].score = analysisResult ? 20 : 0;
  
  // Avaliar Consistência
  categories['Consistência'].score = consistencyOK ? 20 : 0;
  
  // Calcular score total
  for (const [category, data] of Object.entries(categories)) {
    totalScore += data.score;
    maxScore += data.max;
    console.log(`${category}: ${data.score}/${data.max} pontos`);
  }
  
  const finalScore = Math.round((totalScore / maxScore) * 100);
  
  console.log(`\n🎯 SCORE FINAL DO SISTEMA: ${finalScore}/100`);
  
  // Avaliação qualitativa
  let qualitativeAssessment = '';
  if (finalScore >= 90) {
    qualitativeAssessment = '🟢 EXCELENTE - Sistema pronto para produção';
  } else if (finalScore >= 70) {
    qualitativeAssessment = '🟡 BOM - Sistema funcional com melhorias possíveis';
  } else if (finalScore >= 50) {
    qualitativeAssessment = '🟠 REGULAR - Sistema funciona mas precisa de ajustes';
  } else {
    qualitativeAssessment = '🔴 CRÍTICO - Sistema precisa de correções urgentes';
  }
  
  console.log(`\n${qualitativeAssessment}`);
  
  return {
    finalScore,
    categories,
    qualitativeAssessment,
    filesStatus,
    modules,
    refData,
    analysisResult,
    consistencyOK
  };
}

// Executar quando a página carregar
if (typeof window !== 'undefined') {
  window.runFullAudit = runFullAudit;
  console.log('\n✅ Auditoria carregada. Execute runFullAudit() para iniciar.');
} else {
  // Executar diretamente se não estiver no browser
  runFullAudit().then(result => {
    console.log('\n🏁 AUDITORIA CONCLUÍDA');
    console.log('Resultado disponível na variável result');
  });
}
