// 🔍 INVESTIGAÇÃO PROFUNDA: Sub-scores vs Cores das Bandas
// DATA: 03/01/2025
// PROBLEMA: Sub-score de frequência = 80% mas quase todas as bandas vermelhas

console.log('🔍 INICIANDO INVESTIGAÇÃO DOS SUB-SCORES E CORES');

// 🎯 Simular dados reais do problema
const dadosProblemaReal = {
  technicalData: {
    bandEnergies: {
      sub: { rms_db: -21.46 },
      low_bass: { rms_db: -28.36 },
      upper_bass: { rms_db: -23.14 },
      low_mid: { rms_db: -20.82 },
      mid: { rms_db: -20.45 },
      high_mid: { rms_db: -19.90 },
      brilho: { rms_db: -22.17 },
      presenca: { rms_db: -23.13 }
    },
    spectralCentroid: 2800, // Valor hipotético
    lufsIntegrated: -16.5,
    dynamicRange: 8.2,
    truePeakDbtp: -2.1,
    stereoCorrelation: 0.45,
    crestFactor: 9.8,
    clippingSamples: 0,
    dcOffset: 0.001
  },
  reference: {
    lufs_target: -14,
    dr_target: 10,
    bands: {
      sub: { target_db: -14.0, tol_db: 3.0 },
      low_bass: { target_db: -14.0, tol_db: 3.0 },
      upper_bass: { target_db: -14.0, tol_db: 3.0 },
      low_mid: { target_db: -14.0, tol_db: 3.0 },
      mid: { target_db: -14.0, tol_db: 3.0 },
      high_mid: { target_db: -14.0, tol_db: 3.0 },
      brilho: { target_db: -14.0, tol_db: 3.0 },
      presenca: { target_db: -14.0, tol_db: 3.0 }
    }
  }
};

// 🧮 FUNÇÃO 1: Recalcular score de frequência corrigido
function calcularScoreFrequenciaPorBandas(bandEnergies, reference) {
  if (!bandEnergies || typeof bandEnergies !== 'object') {
    console.warn('[FREQUENCY_SCORE] bandEnergies inválido, usando fallback');
    return 50;
  }
  
  const bandsReference = reference?.bands || {};
  const defaultTargets = {
    sub: -14.0, low_bass: -14.0, upper_bass: -14.0, low_mid: -14.0,
    mid: -14.0, high_mid: -14.0, brilho: -14.0, presenca: -14.0
  };
  
  const defaultTolerances = {
    sub: 3.0, low_bass: 3.0, upper_bass: 3.0, low_mid: 3.0,
    mid: 3.0, high_mid: 3.0, brilho: 3.0, presenca: 3.0
  };
  
  const bandScores = [];
  let totalWeight = 0;
  
  for (const [bandName, bandData] of Object.entries(bandEnergies)) {
    if (!bandData || !Number.isFinite(bandData.rms_db)) continue;
    
    const measuredValue = bandData.rms_db;
    const target = bandsReference[bandName]?.target_db || defaultTargets[bandName] || -14.0;
    const tolerance = bandsReference[bandName]?.tol_db || defaultTolerances[bandName] || 3.0;
    
    const deviation = Math.abs(measuredValue - target);
    const deviationRatio = tolerance > 0 ? deviation / tolerance : 0;
    
    let bandScore = 100;
    if (deviationRatio > 0) {
      if (deviationRatio <= 1.0) {
        bandScore = 100 - (deviationRatio * 10);
      } else if (deviationRatio <= 2.0) {
        bandScore = 90 - ((deviationRatio - 1.0) * 20);
      } else if (deviationRatio <= 3.0) {
        bandScore = 70 - ((deviationRatio - 2.0) * 20);
      } else {
        bandScore = Math.max(30, 50 - ((deviationRatio - 3.0) * 10));
      }
    }
    
    bandScores.push({ 
      band: bandName, 
      measured: measuredValue,
      target: target,
      deviation: deviation,
      deviationRatio: deviationRatio,
      score: bandScore, 
      weight: 1.0 
    });
    totalWeight += 1.0;
  }
  
  if (bandScores.length === 0) return 50;
  
  const weightedSum = bandScores.reduce((sum, band) => sum + (band.score * band.weight), 0);
  const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 50;
  
  return {
    finalScore: Math.max(0, Math.min(100, Math.round(finalScore))),
    bandScores: bandScores
  };
}

// 🧮 FUNÇÃO 2: Calcular score por centroide (método antigo)
function calcularScorePorCentroide(centroid) {
  const freqIdealLow = 1800;
  const freqIdealHigh = 3200;
  
  let scoreFreq;
  if (!Number.isFinite(centroid)) {
    scoreFreq = 50;
  } else if (centroid < freqIdealLow) {
    scoreFreq = 100 - Math.min(60, (freqIdealLow - centroid) / freqIdealLow * 100);
  } else if (centroid > freqIdealHigh) {
    scoreFreq = 100 - Math.min(60, (centroid - freqIdealHigh) / freqIdealHigh * 100);
  } else {
    scoreFreq = 100;
  }
  
  return Math.max(0, Math.min(100, Math.round(scoreFreq)));
}

// 🎨 FUNÇÃO 3: Simular lógica de cores (hipotética)
function determinarCorBanda(measuredValue, target, tolerance) {
  const deviation = Math.abs(measuredValue - target);
  const deviationRatio = tolerance > 0 ? deviation / tolerance : 0;
  
  if (deviationRatio <= 1.0) {
    return 'verde'; // Dentro da tolerância
  } else if (deviationRatio <= 2.0) {
    return 'amarelo'; // Atenção
  } else {
    return 'vermelho'; // Problemático
  }
}

// 🔍 FUNÇÃO 4: Investigar discrepância
function investigarDiscrepancia() {
  console.log('\n🔍 INVESTIGANDO DISCREPÂNCIA ENTRE CORES E SUB-SCORE');
  
  const { technicalData, reference } = dadosProblemaReal;
  
  // Calcular score corrigido
  const resultadoCorrigido = calcularScoreFrequenciaPorBandas(technicalData.bandEnergies, reference);
  
  // Calcular score antigo (centroide)
  const scoreAntigo = calcularScorePorCentroide(technicalData.spectralCentroid);
  
  // Analisar cores de cada banda
  const analiseCore = {};
  let bandasVermelhas = 0;
  let bandasAmarelas = 0;
  let bandasVerdes = 0;
  
  for (const [bandName, bandData] of Object.entries(technicalData.bandEnergies)) {
    const target = reference.bands[bandName]?.target_db || -14.0;
    const tolerance = reference.bands[bandName]?.tol_db || 3.0;
    const cor = determinarCorBanda(bandData.rms_db, target, tolerance);
    
    analiseCore[bandName] = {
      measured: bandData.rms_db,
      target: target,
      tolerance: tolerance,
      deviation: Math.abs(bandData.rms_db - target),
      cor: cor
    };
    
    if (cor === 'vermelho') bandasVermelhas++;
    else if (cor === 'amarelo') bandasAmarelas++;
    else bandasVerdes++;
  }
  
  console.log('📊 ANÁLISE DETALHADA:');
  console.log('Bandas e suas cores:', analiseCore);
  console.log(`🔴 Vermelhas: ${bandasVermelhas}`);
  console.log(`🟡 Amarelas: ${bandasAmarelas}`);
  console.log(`🟢 Verdes: ${bandasVerdes}`);
  
  console.log('\n📊 SCORES COMPARATIVOS:');
  console.log(`❌ Score antigo (centroide): ${scoreAntigo}%`);
  console.log(`✅ Score corrigido (bandas): ${resultadoCorrigido.finalScore}%`);
  console.log(`🎯 Score reportado pelo usuário: 80%`);
  
  // Analisar qual método está sendo usado
  console.log('\n🔍 ANÁLISE DO PROBLEMA:');
  
  if (Math.abs(scoreAntigo - 80) < 5) {
    console.log('🚨 PROBLEMA IDENTIFICADO: Sistema ainda está usando método do centroide!');
    console.log('📝 EXPLICAÇÃO: Score por centroide ignora problemas das bandas individuais');
    console.log('🔧 SOLUÇÃO: Verificar se a correção foi aplicada corretamente');
  } else if (Math.abs(resultadoCorrigido.finalScore - 80) < 5) {
    console.log('✅ Sistema usando método corrigido, mas há outro problema');
    console.log('🔍 POSSÍVEL CAUSA: Lógica de cores diferente da lógica de scoring');
  } else {
    console.log('❓ PROBLEMA DESCONHECIDO: Nenhum dos métodos resulta em 80%');
    console.log('🔍 INVESTIGAR: Pode haver terceiro sistema de cálculo');
  }
  
  return {
    analiseCore,
    scoreAntigo,
    scoreCorrigido: resultadoCorrigido.finalScore,
    bandScores: resultadoCorrigido.bandScores,
    contadorCores: { vermelhas: bandasVermelhas, amarelas: bandasAmarelas, verdes: bandasVerdes }
  };
}

// 🧮 FUNÇÃO 5: Testar diferentes tolerâncias
function testarDiferentesTolerancias() {
  console.log('\n🧪 TESTANDO DIFERENTES TOLERÂNCIAS');
  
  const toleranciasParaTestar = [1.0, 2.0, 3.0, 4.0, 5.0];
  const { technicalData } = dadosProblemaReal;
  
  for (const tol of toleranciasParaTestar) {
    const refTeste = {
      bands: Object.keys(technicalData.bandEnergies).reduce((acc, band) => {
        acc[band] = { target_db: -14.0, tol_db: tol };
        return acc;
      }, {})
    };
    
    const resultado = calcularScoreFrequenciaPorBandas(technicalData.bandEnergies, refTeste);
    
    // Contar cores
    let vermelhas = 0;
    for (const [bandName, bandData] of Object.entries(technicalData.bandEnergies)) {
      const cor = determinarCorBanda(bandData.rms_db, -14.0, tol);
      if (cor === 'vermelho') vermelhas++;
    }
    
    console.log(`Tolerância ${tol}dB: Score = ${resultado.finalScore}%, Vermelhas = ${vermelhas}/8`);
  }
}

// 🚀 EXECUTAR INVESTIGAÇÃO COMPLETA
function executarInvestigacaoCompleta() {
  console.log('🚀 EXECUTANDO INVESTIGAÇÃO COMPLETA DOS SUB-SCORES\n');
  
  const resultado = investigarDiscrepancia();
  testarDiferentesTolerancias();
  
  console.log('\n📋 RESUMO EXECUTIVO:');
  console.log(`🔴 Bandas problemáticas: ${resultado.contadorCores.vermelhas}/8`);
  console.log(`📊 Score relatado: 80%`);
  console.log(`🔧 Score corrigido: ${resultado.scoreCorrigido}%`);
  console.log(`📊 Score antigo: ${resultado.scoreAntigo}%`);
  
  if (Math.abs(resultado.scoreAntigo - 80) < 5) {
    console.log('\n🚨 CONCLUSÃO: Sistema ainda usando método do centroide!');
    console.log('❌ A correção não foi aplicada ou há conflito de implementações');
  } else {
    console.log('\n🔍 CONCLUSÃO: Verificar se há outros sistemas de cálculo');
  }
  
  return resultado;
}

// Executar investigação
const resultadoInvestigacao = executarInvestigacaoCompleta();

// Salvar no window para debug
if (typeof window !== 'undefined') {
  window.SUBSCORE_INVESTIGATION = resultadoInvestigacao;
  console.log('\n💾 Resultados salvos em window.SUBSCORE_INVESTIGATION');
}

console.log('\n✅ INVESTIGAÇÃO CONCLUÍDA');
