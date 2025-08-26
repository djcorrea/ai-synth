// 🚨 INVESTIGAÇÃO CRÍTICA - DESCOBRIR O PROBLEMA REAL
// EXECUTAR ESTE SCRIPT DIRETAMENTE NO CONSOLE DO NAVEGADOR

console.log('🔬 [INVESTIGAÇÃO CRÍTICA] Iniciando análise completa...');

/**
 * 🎯 TESTE 1: VERIFICAR SE SISTEMA ESTÁ FUNCIONANDO
 */
function teste1_verificarSistema() {
  console.log('\n🔍 [TESTE 1] Verificando sistema básico...');
  
  const resultados = {
    audioAnalyzer: !!window.audioAnalyzer,
    scoringModule: !!window.scoringModule,
    refData: !!window.PROD_AI_REF_DATA,
    refGenre: window.PROD_AI_REF_GENRE,
    servidor: window.location.href
  };
  
  console.log('📊 [TESTE 1] Resultados:', resultados);
  
  if (!resultados.audioAnalyzer) {
    console.error('❌ [TESTE 1] audioAnalyzer não encontrado! Sistema não inicializado.');
    return false;
  }
  
  if (!resultados.scoringModule) {
    console.error('❌ [TESTE 1] scoringModule não encontrado! Scoring não disponível.');
    return false;
  }
  
  if (!resultados.refData) {
    console.error('❌ [TESTE 1] PROD_AI_REF_DATA não encontrado! Referências não carregadas.');
    return false;
  }
  
  console.log('✅ [TESTE 1] Sistema básico funcional');
  return true;
}

/**
 * 🎯 TESTE 2: VERIFICAR REFERÊNCIA COM BANDAS
 */
function teste2_verificarReferencia() {
  console.log('\n🔍 [TESTE 2] Verificando referência ativa...');
  
  const refData = window.PROD_AI_REF_DATA;
  const activeGenre = window.PROD_AI_REF_GENRE || 'default';
  
  console.log('🎵 [TESTE 2] Gênero ativo:', activeGenre);
  console.log('🎵 [TESTE 2] Gêneros disponíveis:', Object.keys(refData));
  
  const genreRef = refData[activeGenre];
  if (!genreRef) {
    console.error('❌ [TESTE 2] Gênero ativo não encontrado na referência!');
    console.log('🔧 [TESTE 2] Usando primeiro gênero disponível...');
    const firstGenre = Object.keys(refData)[0];
    window.PROD_AI_REF_GENRE = firstGenre;
    console.log('🔧 [TESTE 2] Definido novo gênero:', firstGenre);
    return refData[firstGenre];
  }
  
  console.log('📊 [TESTE 2] Referência do gênero:', genreRef);
  
  if (!genreRef.bands) {
    console.error('❌ [TESTE 2] Referência não tem propriedade "bands"!');
    return null;
  }
  
  const bandas = Object.keys(genreRef.bands);
  console.log('🎵 [TESTE 2] Bandas na referência:', bandas);
  console.log('🎵 [TESTE 2] Número de bandas:', bandas.length);
  
  // Verificar se bandas têm target_db
  const bandasComTarget = bandas.filter(banda => {
    const bandData = genreRef.bands[banda];
    return bandData && Number.isFinite(bandData.target_db);
  });
  
  console.log('🎯 [TESTE 2] Bandas com target_db:', bandasComTarget);
  console.log('🎯 [TESTE 2] Número de bandas válidas:', bandasComTarget.length);
  
  if (bandasComTarget.length === 0) {
    console.error('❌ [TESTE 2] NENHUMA banda tem target_db válido!');
    return null;
  }
  
  console.log('✅ [TESTE 2] Referência válida com', bandasComTarget.length, 'bandas');
  return genreRef;
}

/**
 * 🎯 TESTE 3: SIMULAR DADOS COM BANDAS
 */
function teste3_simularDados() {
  console.log('\n🔍 [TESTE 3] Simulando dados com bandas...');
  
  const dadosComBandas = {
    lufsIntegrated: -12.5,
    truePeakDbtp: -2.1,
    dynamicRange: 7.8,
    lra: 6.5,
    stereoCorrelation: 0.42,
    bandEnergies: {
      sub: { rms_db: -8.2, energy: 0.15, energyPct: 12.5 },
      low_bass: { rms_db: -6.8, energy: 0.22, energyPct: 18.3 },
      upper_bass: { rms_db: -9.1, energy: 0.12, energyPct: 10.1 },
      low_mid: { rms_db: -5.9, energy: 0.28, energyPct: 23.4 },
      mid: { rms_db: -7.5, energy: 0.18, energyPct: 15.0 },
      high_mid: { rms_db: -12.3, energy: 0.06, energyPct: 5.0 },
      brilho: { rms_db: -18.7, energy: 0.02, energyPct: 1.7 },
      presenca: { rms_db: -22.1, energy: 0.01, energyPct: 0.8 }
    }
  };
  
  const dadosSemBandas = {
    lufsIntegrated: -12.5,
    truePeakDbtp: -2.1,
    dynamicRange: 7.8,
    lra: 6.5,
    stereoCorrelation: 0.42
    // bandEnergies: undefined
  };
  
  console.log('📊 [TESTE 3] Dados COM bandas criados:', Object.keys(dadosComBandas.bandEnergies));
  console.log('📊 [TESTE 3] Dados SEM bandas criados');
  
  return { dadosComBandas, dadosSemBandas };
}

/**
 * 🎯 TESTE 4: EXECUTAR SCORING E COMPARAR
 */
function teste4_executarScoring(dadosComBandas, dadosSemBandas, referencia) {
  console.log('\n🔍 [TESTE 4] Executando scoring para comparação...');
  
  try {
    // Scoring COM bandas
    console.log('🧪 [TESTE 4] Executando scoring COM bandas...');
    const scoreComBandas = window.scoringModule.computeMixScore(dadosComBandas, referencia);
    console.log('📊 [TESTE 4] Score COM bandas:', scoreComBandas);
    
    // Scoring SEM bandas
    console.log('🧪 [TESTE 4] Executando scoring SEM bandas...');
    const scoreSemBandas = window.scoringModule.computeMixScore(dadosSemBandas, referencia);
    console.log('📊 [TESTE 4] Score SEM bandas:', scoreSemBandas);
    
    // Comparação
    const scoreComBandasVal = scoreComBandas ? scoreComBandas.scorePct : 0;
    const scoreSemBandasVal = scoreSemBandas ? scoreSemBandas.scorePct : 0;
    const diferenca = scoreComBandasVal - scoreSemBandasVal;
    
    console.log('\n📈 [TESTE 4] COMPARAÇÃO FINAL:');
    console.log('   Score COM bandas:', scoreComBandasVal + '%');
    console.log('   Score SEM bandas:', scoreSemBandasVal + '%');
    console.log('   Diferença:', diferenca.toFixed(2) + ' pontos');
    
    if (Math.abs(diferenca) < 1) {
      console.error('🚨 [TESTE 4] PROBLEMA IDENTIFICADO: Diferença < 1 ponto!');
      console.error('   Isso indica que o scoring NÃO está considerando bandas espectrais!');
      return { problema: 'scoring_ignora_bandas', diferenca };
    } else {
      console.log('✅ [TESTE 4] Scoring considera bandas corretamente (diferença significativa)');
      return { problema: null, diferenca };
    }
    
  } catch (error) {
    console.error('❌ [TESTE 4] Erro no scoring:', error);
    return { problema: 'erro_scoring', erro: error.message };
  }
}

/**
 * 🎯 TESTE 5: VERIFICAR ÚLTIMA ANÁLISE REAL
 */
function teste5_verificarUltimaAnalise() {
  console.log('\n🔍 [TESTE 5] Verificando última análise real...');
  
  if (!window.audioAnalyzer || !window.audioAnalyzer.lastAnalysis) {
    console.warn('⚠️ [TESTE 5] Nenhuma análise encontrada. Execute uma análise primeiro.');
    return null;
  }
  
  const analise = window.audioAnalyzer.lastAnalysis;
  const td = analise.technicalData;
  
  console.log('📊 [TESTE 5] Última análise encontrada');
  console.log('📊 [TESTE 5] technicalData keys:', Object.keys(td));
  console.log('📊 [TESTE 5] bandEnergies existe:', !!td.bandEnergies);
  
  if (td.bandEnergies) {
    console.log('📊 [TESTE 5] Bandas na análise:', Object.keys(td.bandEnergies));
    
    // Sample das bandas
    const sampleBandas = Object.entries(td.bandEnergies).slice(0, 3).map(([banda, dados]) => ({
      banda,
      rms_db: dados.rms_db,
      energy: dados.energy,
      energyPct: dados.energyPct
    }));
    console.log('📊 [TESTE 5] Sample das bandas:', sampleBandas);
    
    return td;
  } else {
    console.error('❌ [TESTE 5] PROBLEMA: Análise não tem bandEnergies!');
    return null;
  }
}

/**
 * 🎯 TESTE 6: EXECUTAR SCORING NA ANÁLISE REAL
 */
function teste6_scoringAnaliseReal(technicalData, referencia) {
  console.log('\n🔍 [TESTE 6] Executando scoring na análise real...');
  
  if (!technicalData) {
    console.warn('⚠️ [TESTE 6] Nenhum technicalData fornecido');
    return null;
  }
  
  try {
    const score = window.scoringModule.computeMixScore(technicalData, referencia);
    console.log('📊 [TESTE 6] Score da análise real:', score);
    
    if (!score || score.scorePct === undefined) {
      console.error('❌ [TESTE 6] Score inválido retornado');
      return null;
    }
    
    console.log('✅ [TESTE 6] Score calculado:', score.scorePct + '%');
    console.log('📋 [TESTE 6] Método usado:', score.scoringMethod || score.scoreMode);
    
    return score;
    
  } catch (error) {
    console.error('❌ [TESTE 6] Erro no scoring da análise real:', error);
    return null;
  }
}

/**
 * 🚀 FUNÇÃO PRINCIPAL - EXECUTAR TODOS OS TESTES
 */
function investigacaoCompleta() {
  console.log('🚀 [INVESTIGAÇÃO] Iniciando investigação completa...');
  console.log('='.repeat(60));
  
  const resultados = {
    timestamp: new Date().toISOString(),
    problemas: [],
    conclusao: null
  };
  
  // TESTE 1: Sistema básico
  if (!teste1_verificarSistema()) {
    resultados.problemas.push('Sistema não inicializado');
    resultados.conclusao = 'ERRO CRÍTICO: Sistema básico não funcional';
    return resultados;
  }
  
  // TESTE 2: Referência
  const referencia = teste2_verificarReferencia();
  if (!referencia) {
    resultados.problemas.push('Referência inválida ou sem bandas');
    resultados.conclusao = 'PROBLEMA: Referência não tem dados de bandas válidos';
    return resultados;
  }
  
  // TESTE 3: Dados simulados
  const { dadosComBandas, dadosSemBandas } = teste3_simularDados();
  
  // TESTE 4: Scoring simulado
  const resultadoScoring = teste4_executarScoring(dadosComBandas, dadosSemBandas, referencia);
  if (resultadoScoring.problema) {
    resultados.problemas.push(resultadoScoring.problema);
    if (resultadoScoring.problema === 'scoring_ignora_bandas') {
      resultados.conclusao = 'PROBLEMA IDENTIFICADO: Scoring ignora bandas espectrais!';
      return resultados;
    }
  }
  
  // TESTE 5: Análise real
  const analysisTD = teste5_verificarUltimaAnalise();
  if (!analysisTD) {
    resultados.problemas.push('Análise real sem bandEnergies');
  }
  
  // TESTE 6: Scoring na análise real
  if (analysisTD) {
    const scoreReal = teste6_scoringAnaliseReal(analysisTD, referencia);
    if (!scoreReal) {
      resultados.problemas.push('Scoring falha na análise real');
    }
  }
  
  // CONCLUSÃO FINAL
  if (resultados.problemas.length === 0) {
    resultados.conclusao = 'MISTÉRIO: Sistema parece funcional, problema pode estar em outro lugar';
  } else {
    resultados.conclusao = 'PROBLEMAS ENCONTRADOS: ' + resultados.problemas.join(', ');
  }
  
  console.log('\n🎯 [INVESTIGAÇÃO] RESULTADO FINAL:');
  console.log('='.repeat(60));
  console.log('📅 Timestamp:', resultados.timestamp);
  console.log('🚨 Problemas encontrados:', resultados.problemas.length);
  console.log('📋 Lista de problemas:', resultados.problemas);
  console.log('🏁 Conclusão:', resultados.conclusao);
  console.log('='.repeat(60));
  
  return resultados;
}

// 🚀 EXECUTAR AUTOMATICAMENTE
console.log('🔬 [INICIO] Executando investigação automática...');
const resultado = investigacaoCompleta();

// 🎯 SALVAR RESULTADO GLOBAL PARA ANÁLISE
window.__INVESTIGACAO_RESULTADO = resultado;

console.log('💾 [INFO] Resultado salvo em window.__INVESTIGACAO_RESULTADO');
console.log('🔧 [INFO] Para re-executar: investigacaoCompleta()');

// 🌟 DISPONIBILIZAR FUNÇÕES GLOBALMENTE
window.investigacaoCompleta = investigacaoCompleta;
window.teste1_verificarSistema = teste1_verificarSistema;
window.teste2_verificarReferencia = teste2_verificarReferencia;
window.teste3_simularDados = teste3_simularDados;
window.teste4_executarScoring = teste4_executarScoring;
window.teste5_verificarUltimaAnalise = teste5_verificarUltimaAnalise;
window.teste6_scoringAnaliseReal = teste6_scoringAnaliseReal;
