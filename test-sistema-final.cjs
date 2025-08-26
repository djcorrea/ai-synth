#!/usr/bin/env node

/**
 * 🧪 TESTE FINAL DO SISTEMA DE SCORING
 * Verifica se Equal Weight V3 está funcionando corretamente
 */

const scoringModule = require('./lib/audio/features/scoring.js');

console.log('🎯 TESTE FINAL DO SISTEMA DE SCORING');
console.log('=====================================');

// Dados de teste realísticos
const testData = {
  lufsIntegrated: -14.2,
  truePeakDbtp: -1.5,
  dynamicRange: 9.8,
  lra: 7.2,
  stereoCorrelation: 0.25,
  stereoWidth: 0.6,
  balanceLR: 0.05,
  spectralCentroid: 2400,
  spectralFlatness: 0.22,
  spectralRolloff85: 8200,
  dcOffset: 0.01,
  clippingPct: 0,
  bandEnergies: {
    sub: { rms_db: -6.5 },
    low_bass: { rms_db: -8.2 },
    upper_bass: { rms_db: -12.1 },
    low_mid: { rms_db: -8.6 },
    mid: { rms_db: -6.1 },
    high_mid: { rms_db: -11.0 },
    brilho: { rms_db: -14.9 },
    presenca: { rms_db: -19.0 }
  }
};

// Referência de teste (funk_mandela)
const testRef = {
  lufs_target: -14,
  tol_lufs: 0.5,
  true_peak_target: -1,
  tol_true_peak: 1.0,
  dr_target: 10,
  tol_dr: 1.2,
  lra_target: 7,
  tol_lra: 2.9,
  stereo_target: 0.22,
  tol_stereo: 0.1,
  bands: {
    sub: { target_db: -6.7, tol_db: 1.9 },
    low_bass: { target_db: -8.0, tol_db: 2.8 },
    upper_bass: { target_db: -12.0, tol_db: 1.6 },
    low_mid: { target_db: -8.4, tol_db: 2.3 },
    mid: { target_db: -6.3, tol_db: 1.4 },
    high_mid: { target_db: -11.2, tol_db: 2.1 },
    brilho: { target_db: -14.8, tol_db: 1.7 },
    presenca: { target_db: -19.2, tol_db: 3.0 }
  }
};

try {
  console.log('📊 Testando sistema de scoring...');
  
  // Testar computeMixScore
  const result = scoringModule.computeMixScore(testData, testRef);
  
  console.log('\n✅ RESULTADO DO TESTE:');
  console.log('======================');
  console.log(`📊 Score Final: ${result.scorePct}%`);
  console.log(`🎯 Método: ${result.method}`);
  console.log(`🏷️ Classificação: ${result.classification}`);
  console.log(`📈 Score Mode: ${result.scoreMode}`);
  
  // Verificar se é Equal Weight V3
  if (result.method === 'equal_weight_v3') {
    console.log('\n🎉 SUCESSO! Sistema Equal Weight V3 está funcionando!');
    
    if (result.equalWeightDetails) {
      console.log(`📊 Total de métricas: ${result.equalWeightDetails.totalMetrics}`);
      console.log(`⚖️ Peso por métrica: ${result.equalWeightDetails.equalWeight}%`);
      
      console.log('\n📋 Detalhes por métrica:');
      result.equalWeightDetails.metricDetails?.forEach(metric => {
        const status = metric.deviationRatio <= 1 ? '🟢' : 
                      metric.deviationRatio <= 2 ? '🟡' : '🔴';
        console.log(`  ${status} ${metric.key}: ${metric.metricScore}% (desvio: ${metric.deviationRatio.toFixed(2)}x)`);
      });
    }
  } else {
    console.log(`\n⚠️ AVISO: Sistema usando ${result.method} ao invés de equal_weight_v3`);
    if (result._equalWeightError) {
      console.log(`❌ Erro: ${result._equalWeightError}`);
    }
  }
  
  console.log('\n📋 INFORMAÇÕES ADICIONAIS:');
  console.log(`📊 Score avançado: ${result.advancedScorePct}%`);
  console.log(`📈 Métricas processadas: ${result.perMetric?.length || 0}`);
  
  if (result.penaltiesSummary) {
    console.log(`🎯 Penalty final: ${result.penaltiesSummary.P_final}`);
  }
  
  console.log('\n🎯 TESTE CONCLUÍDO COM SUCESSO!');
  
} catch (error) {
  console.error('\n❌ ERRO NO TESTE:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
