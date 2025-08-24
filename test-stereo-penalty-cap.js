#!/usr/bin/env node

/**
 * 🎧 TESTE TETO DE PENALIDADE DE ESTÉREO
 * 
 * Demonstra que:
 * 1. Aplica teto de penalidade de estéreo (max 20 pontos de penalidade)
 * 2. Mantém alertas visuais se correlação <0.10, mas sem "matar" o score geral
 * 3. Tracks boas mas com estéreo ruim não ficam com score geral "reprovado"
 */

console.log('🎧 TESTE TETO DE PENALIDADE DE ESTÉREO\n');

// 🎭 Simular função de score de estéreo com teto
function calculateStereoScore(correlation) {
  if (!Number.isFinite(correlation)) return 50;
  
  // 🛡️ IMPLEMENTAÇÃO TETO DE PENALIDADE DE ESTÉREO
  const STEREO_PENALTY_CAP = 20; // Máximo de penalidade em pontos
  const BASELINE_SCORE = 90; // Score máximo possível
  const MIN_STEREO_SCORE = BASELINE_SCORE - STEREO_PENALTY_CAP; // 70 pontos mínimo
  
  let rawScore;
  if (correlation < -0.3) {
    rawScore = 10; // Problemas sérios - ANTES
  } else if (correlation < 0) {
    rawScore = 40; // Problemas leves - ANTES  
  } else if (correlation < 0.5) {
    rawScore = 70; // OK
  } else {
    rawScore = 90; // Bom
  }
  
  // 🚨 APLICAR TETO: não permitir score menor que MIN_STEREO_SCORE (70)
  const cappedScore = Math.max(MIN_STEREO_SCORE, rawScore);
  
  // 🔍 Log para auditoria (apenas se score foi limitado)
  if (cappedScore > rawScore) {
    console.log(`[STEREO-CAP] 🛡️ Score limitado: ${rawScore} → ${cappedScore} (correlação: ${correlation.toFixed(3)})`);
  }
  
  return cappedScore;
}

// 🎭 Simular cálculo de score geral
function calculateOverallScore(loudnessScore, dynamicsScore, stereoScore, clippingScore) {
  const weights = { loudness: 0.3, dynamics: 0.25, stereo: 0.2, clipping: 0.25 };
  
  const weightedSum = 
    loudnessScore * weights.loudness +
    dynamicsScore * weights.dynamics +
    stereoScore * weights.stereo +
    clippingScore * weights.clipping;
    
  return Math.round(weightedSum);
}

// 🎭 Simular alertas visuais para correlação baixa
function generateStereoAlerts(correlation) {
  const alerts = [];
  
  if (!Number.isFinite(correlation)) return alerts;
  
  // 🚨 ALERTA VISUAL CRÍTICO: Correlação < 0.10
  if (correlation < 0.10) {
    alerts.push({
      type: 'stereo_correlation_critical',
      message: `⚠️ ALERTA: Correlação estéreo muito baixa (${correlation.toFixed(3)})`,
      action: `Verificar problemas de fase e cancelamentos`,
      severity: 'critical',
      visual_alert: true
    });
  }
  // 🚨 ALERTA VISUAL MODERADO: Correlação < 0.30
  else if (correlation < 0.30) {
    alerts.push({
      type: 'stereo_correlation_warning',
      message: `⚠️ Correlação estéreo baixa (${correlation.toFixed(3)})`,
      action: `Verificar compatibilidade mono e ajustar width`,
      severity: 'moderate',
      visual_alert: true
    });
  }
  
  return alerts;
}

// 🧪 Cenários de teste
const testCases = [
  {
    name: 'TRACK BOA com estéreo ruim (correlação -0.4)',
    audio: {
      loudnessScore: 85,    // Bom loudness
      dynamicsScore: 80,    // Boa dinâmica
      correlation: -0.4,    // Estéreo problemático
      clippingScore: 90     // Sem clipping
    },
    expectation: 'Score geral deve permanecer aprovado (>70) apesar do estéreo ruim'
  },
  {
    name: 'TRACK EXCELENTE com estéreo crítico (correlação 0.05)',
    audio: {
      loudnessScore: 95,    // Excelente loudness
      dynamicsScore: 90,    // Excelente dinâmica  
      correlation: 0.05,    // Estéreo crítico
      clippingScore: 95     // Excelente headroom
    },
    expectation: 'Score geral alto + alerta visual crítico'
  },
  {
    name: 'TRACK MÉDIA com estéreo perfeito (correlação 0.6)',
    audio: {
      loudnessScore: 75,    // Loudness OK
      dynamicsScore: 70,    // Dinâmica OK
      correlation: 0.6,     // Estéreo bom
      clippingScore: 80     // Clipping OK
    },
    expectation: 'Score geral médio sem penalidades extras'
  },
  {
    name: 'TRACK RUIM GERAL mas estéreo terrível (correlação -0.5)',
    audio: {
      loudnessScore: 50,    // Loudness ruim
      dynamicsScore: 45,    // Dinâmica ruim
      correlation: -0.5,    // Estéreo terrível
      clippingScore: 40     // Clipping ruim
    },
    expectation: 'Teto de estéreo evita que score despence ainda mais'
  }
];

// 🧪 Executar testes
console.log('🧪 EXECUTANDO SIMULAÇÕES:\n');

testCases.forEach((testCase, index) => {
  console.log(`${'-'.repeat(80)}`);
  console.log(`📋 ${testCase.name}`);
  console.log(`🔮 Expectativa: ${testCase.expectation}`);
  console.log(`${'-'.repeat(80)}`);
  
  const audio = testCase.audio;
  
  // Calcular score de estéreo (com e sem teto)
  const stereoScoreOld = audio.correlation < -0.3 ? 10 : (audio.correlation < 0 ? 40 : (audio.correlation < 0.5 ? 70 : 90));
  const stereoScoreNew = calculateStereoScore(audio.correlation);
  
  // Calcular scores gerais
  const overallScoreOld = calculateOverallScore(audio.loudnessScore, audio.dynamicsScore, stereoScoreOld, audio.clippingScore);
  const overallScoreNew = calculateOverallScore(audio.loudnessScore, audio.dynamicsScore, stereoScoreNew, audio.clippingScore);
  
  // Gerar alertas
  const alerts = generateStereoAlerts(audio.correlation);
  
  console.log(`📊 Componentes do Score:`);
  console.log(`   Loudness: ${audio.loudnessScore} (peso: 30%)`);
  console.log(`   Dynamics: ${audio.dynamicsScore} (peso: 25%)`);
  console.log(`   Stereo ANTES: ${stereoScoreOld} (peso: 20%)`);
  console.log(`   Stereo DEPOIS: ${stereoScoreNew} (peso: 20%)`);
  console.log(`   Clipping: ${audio.clippingScore} (peso: 25%)`);
  
  console.log(`\n🎯 Resultados:`);
  console.log(`   Score Geral ANTES: ${overallScoreOld}/100`);
  console.log(`   Score Geral DEPOIS: ${overallScoreNew}/100`);
  console.log(`   Diferença: ${overallScoreNew > overallScoreOld ? '+' : ''}${overallScoreNew - overallScoreOld} pontos`);
  
  // Classificação
  const classifyScore = (score) => {
    if (score >= 85) return 'EXCELENTE 🎉';
    if (score >= 70) return 'APROVADO ✅';
    if (score >= 50) return 'REGULAR ⚠️';
    return 'REPROVADO ❌';
  };
  
  console.log(`   Classificação ANTES: ${classifyScore(overallScoreOld)}`);
  console.log(`   Classificação DEPOIS: ${classifyScore(overallScoreNew)}`);
  
  // Alertas visuais
  if (alerts.length > 0) {
    console.log(`\n🚨 Alertas Visuais Gerados:`);
    alerts.forEach((alert, i) => {
      console.log(`   ${i + 1}. [${alert.severity.toUpperCase()}] ${alert.message}`);
      console.log(`      ▶️ ${alert.action}`);
    });
  } else {
    console.log(`\n✅ Nenhum alerta de estéreo necessário`);
  }
  
  console.log(``);
});

console.log(`${'='.repeat(80)}`);
console.log('🎯 RESUMO DOS BENEFÍCIOS DO TETO DE PENALIDADE:');
console.log('✅ 1. Tracks boas com estéreo ruim mantêm score aprovado');
console.log('✅ 2. Alertas visuais preservados para correlação <0.10'); 
console.log('✅ 3. Score geral não "despenca" desproporcionalmente');
console.log('✅ 4. Máximo 20 pontos de penalidade no sub-score Stereo');
console.log('✅ 5. Sistema mais balanceado e menos punitivo');
console.log(`${'='.repeat(80)}\n`);

console.log('🎉 Simulação concluída! Teto de penalidade de estéreo funcionando.');
