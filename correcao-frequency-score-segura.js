// 🔧 CORREÇÃO SEGURA: Implementação da função correta para score de frequência baseado em bandas
// DATA: 03/01/2025
// OBJETIVO: Substituir cálculo por centroide com análise real das bandas

console.log('🔧 INICIANDO IMPLEMENTAÇÃO SEGURA DA CORREÇÃO DE FREQUENCY SCORE');

// 🎯 FUNÇÃO NOVA: Calcular score baseado nas bandas reais
function calcularScoreFrequenciaPorBandas(bandEnergies, reference) {
  console.log('📊 Calculando score por bandas:', { bandEnergies, reference });
  
  // Validação segura dos inputs
  if (!bandEnergies || typeof bandEnergies !== 'object') {
    console.warn('⚠️ bandEnergies inválido, usando fallback');
    return 50; // Fallback seguro
  }
  
  // Extrair referência do Funk Mandela ou usar defaults seguros
  const bandsReference = reference?.bands || {};
  
  // Targets padrão baseados nos dados do Funk Mandela
  const defaultTargets = {
    sub: -14.0,
    low_bass: -14.0,
    upper_bass: -14.0,
    low_mid: -14.0,
    mid: -14.0,
    high_mid: -14.0,
    brilho: -14.0,
    presenca: -14.0
  };
  
  // Tolerâncias padrão (mais permissivas para evitar scores muito baixos)
  const defaultTolerances = {
    sub: 3.0,
    low_bass: 3.0,
    upper_bass: 3.0,
    low_mid: 3.0,
    mid: 3.0,
    high_mid: 3.0,
    brilho: 3.0,
    presenca: 3.0
  };
  
  const bandScores = [];
  let totalWeight = 0;
  
  // Processar cada banda individualmente
  for (const [bandName, bandData] of Object.entries(bandEnergies)) {
    if (!bandData || !Number.isFinite(bandData.rms_db)) {
      console.log(`⚠️ Banda ${bandName} sem dados válidos, ignorando`);
      continue;
    }
    
    const measuredValue = bandData.rms_db;
    const target = bandsReference[bandName]?.target_db || defaultTargets[bandName] || -14.0;
    const tolerance = bandsReference[bandName]?.tol_db || defaultTolerances[bandName] || 3.0;
    
    // Calcular desvio absoluto
    const deviation = Math.abs(measuredValue - target);
    const deviationRatio = tolerance > 0 ? deviation / tolerance : 0;
    
    // Curva de scoring mais suave para evitar scores muito baixos
    let bandScore = 100;
    
    if (deviationRatio > 0) {
      if (deviationRatio <= 1.0) {
        // Dentro da tolerância: score alto (90-100%)
        bandScore = 100 - (deviationRatio * 10); 
      } else if (deviationRatio <= 2.0) {
        // 1-2x tolerância: score médio-alto (70-90%)
        bandScore = 90 - ((deviationRatio - 1.0) * 20);
      } else if (deviationRatio <= 3.0) {
        // 2-3x tolerância: score médio (50-70%)
        bandScore = 70 - ((deviationRatio - 2.0) * 20);
      } else {
        // >3x tolerância: score baixo (30-50%)
        bandScore = Math.max(30, 50 - ((deviationRatio - 3.0) * 10));
      }
    }
    
    // Peso da banda (todas iguais por enquanto)
    const bandWeight = 1.0;
    
    bandScores.push({
      band: bandName,
      measured: measuredValue,
      target: target,
      tolerance: tolerance,
      deviation: deviation,
      deviationRatio: deviationRatio,
      score: bandScore,
      weight: bandWeight
    });
    
    totalWeight += bandWeight;
    
    console.log(`📊 ${bandName}: ${measuredValue.toFixed(2)}dB -> ${bandScore.toFixed(1)}% (dev: ${deviationRatio.toFixed(2)}x)`);
  }
  
  // Calcular score final ponderado
  if (bandScores.length === 0) {
    console.warn('⚠️ Nenhuma banda válida encontrada, usando fallback');
    return 50;
  }
  
  const weightedSum = bandScores.reduce((sum, band) => sum + (band.score * band.weight), 0);
  const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 50;
  
  // Clamp seguro
  const clampedScore = Math.max(0, Math.min(100, Math.round(finalScore)));
  
  console.log(`🎯 Score final de frequência: ${clampedScore}% (baseado em ${bandScores.length} bandas)`);
  
  // Salvar detalhes para debug
  if (typeof window !== 'undefined') {
    window.LAST_FREQUENCY_CALCULATION = {
      bandScores,
      finalScore,
      clampedScore,
      totalWeight,
      timestamp: new Date().toISOString()
    };
  }
  
  return clampedScore;
}

// 🧪 FUNÇÃO DE TESTE: Validar a nova implementação
function testarNovaImplementacao() {
  console.log('\n🧪 TESTANDO NOVA IMPLEMENTAÇÃO');
  
  // Dados de teste baseados no problema real
  const testBandEnergies = {
    sub: { rms_db: -21.46 },
    low_bass: { rms_db: -28.36 },
    upper_bass: { rms_db: -23.14 },
    low_mid: { rms_db: -20.82 },
    mid: { rms_db: -20.45 },
    high_mid: { rms_db: -19.90 },
    brilho: { rms_db: -22.17 },
    presenca: { rms_db: -23.13 }
  };
  
  const testReference = {
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
  };
  
  const novoScore = calcularScoreFrequenciaPorBandas(testBandEnergies, testReference);
  
  console.log('\n📊 COMPARAÇÃO:');
  console.log(`❌ Score antigo (buggy): 85%`);
  console.log(`✅ Score novo (correto): ${novoScore}%`);
  console.log(`🎯 Diferença: ${85 - novoScore} pontos de correção`);
  
  // Validar que o novo score faz sentido
  const esperado = novoScore < 60; // Deve ser baixo devido aos problemas
  console.log(`✅ Validação: Score baixo como esperado? ${esperado ? 'SIM' : 'NÃO'}`);
  
  return { novoScore, validacao: esperado };
}

// 🔄 FUNÇÃO WRAPPER: Para substituir a implementação antiga de forma segura
function calcularScoreFrequenciaSeguro(baseAnalysis, reference) {
  try {
    // Tentar usar a nova implementação
    const bandEnergies = baseAnalysis?.technicalData?.bandEnergies;
    
    if (bandEnergies && Object.keys(bandEnergies).length > 0) {
      console.log('✅ Usando nova implementação baseada em bandas');
      return calcularScoreFrequenciaPorBandas(bandEnergies, reference);
    } else {
      console.warn('⚠️ Fallback para centroide (bandas não disponíveis)');
      // Fallback para o método antigo apenas se bandas não estiverem disponíveis
      const centroid = baseAnalysis?.technicalData?.spectralCentroid;
      if (Number.isFinite(centroid)) {
        const freqIdealLow = 1500;
        const freqIdealHigh = 4000;
        if (centroid < freqIdealLow) {
          return 100 - Math.min(60, (freqIdealLow - centroid) / freqIdealLow * 100);
        } else if (centroid > freqIdealHigh) {
          return 100 - Math.min(60, (centroid - freqIdealHigh) / freqIdealHigh * 100);
        } else {
          return 100;
        }
      }
      return 50; // Fallback final
    }
  } catch (error) {
    console.error('❌ Erro no cálculo de frequência, usando fallback:', error);
    return 50; // Fallback seguro em caso de erro
  }
}

// Executar teste
const resultadoTeste = testarNovaImplementacao();

console.log('\n✅ IMPLEMENTAÇÃO PRONTA PARA INTEGRAÇÃO');
console.log('📋 Próximo passo: Substituir no audio-analyzer.js de forma segura');

// Disponibilizar no window para uso
if (typeof window !== 'undefined') {
  window.calcularScoreFrequenciaPorBandas = calcularScoreFrequenciaPorBandas;
  window.calcularScoreFrequenciaSeguro = calcularScoreFrequenciaSeguro;
  window.FREQUENCY_FIX_TEST = resultadoTeste;
  console.log('💾 Funções disponíveis em window.calcularScoreFrequencia*');
}

// Exportar para Node.js
if (typeof module !== 'undefined') {
  module.exports = {
    calcularScoreFrequenciaPorBandas,
    calcularScoreFrequenciaSeguro,
    testarNovaImplementacao
  };
}
