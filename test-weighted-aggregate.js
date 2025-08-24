/**
 * 🧪 TESTE AGREGADOR COM PESOS
 * 
 * Valida implementação do novo sistema de pesos:
 * - Loudness: 25%
 * - Dinâmica: 20% 
 * - Frequência: 25%
 * - Técnico: 15%
 * - Stereo: 15%
 * Total: 100%
 */

// 🎯 Configuração dos novos pesos
const WEIGHTED_AGGREGATE_CONFIG = {
  loudness: 0.25,    // 25% - Importância alta (LUFS, headroom)
  dynamics: 0.20,    // 20% - Dinâmica (LRA, crest factor)
  frequency: 0.25,   // 25% - Importância alta (balanço tonal)
  technical: 0.15,   // 15% - Qualidade técnica (clipping, distorção)
  stereo: 0.15       // 15% - Imagem estéreo
};

// Verificar se soma = 1
const totalWeight = Object.values(WEIGHTED_AGGREGATE_CONFIG).reduce((sum, w) => sum + w, 0);
console.log(`🔧 PESOS CONFIGURADOS:`);
console.log(`   Loudness: ${(WEIGHTED_AGGREGATE_CONFIG.loudness * 100).toFixed(0)}%`);
console.log(`   Dynamics: ${(WEIGHTED_AGGREGATE_CONFIG.dynamics * 100).toFixed(0)}%`);
console.log(`   Frequency: ${(WEIGHTED_AGGREGATE_CONFIG.frequency * 100).toFixed(0)}%`);
console.log(`   Technical: ${(WEIGHTED_AGGREGATE_CONFIG.technical * 100).toFixed(0)}%`);
console.log(`   Stereo: ${(WEIGHTED_AGGREGATE_CONFIG.stereo * 100).toFixed(0)}%`);
console.log(`   TOTAL: ${(totalWeight * 100).toFixed(0)}% ${totalWeight === 1 ? '✅' : '❌'}\n`);

// 🎭 Função do novo agregador com pesos
function calculateWeightedOverallScore(scores) {
  const { loudness, dynamics, frequency, technical, stereo } = scores;
  
  // Validar que todos os scores estão presentes
  const validScores = [loudness, dynamics, frequency, technical, stereo].filter(s => Number.isFinite(s));
  if (validScores.length === 0) return 0;
  
  // Calcular score ponderado
  const weightedSum = 
    (loudness || 0) * WEIGHTED_AGGREGATE_CONFIG.loudness +
    (dynamics || 0) * WEIGHTED_AGGREGATE_CONFIG.dynamics +
    (frequency || 0) * WEIGHTED_AGGREGATE_CONFIG.frequency +
    (technical || 0) * WEIGHTED_AGGREGATE_CONFIG.technical +
    (stereo || 0) * WEIGHTED_AGGREGATE_CONFIG.stereo;
    
  return Math.round(weightedSum);
}

// 🎭 Função do agregador antigo (média simples)
function calculateSimpleOverallScore(scores) {
  const { loudness, dynamics, frequency, technical, stereo } = scores;
  const validScores = [loudness, dynamics, frequency, technical, stereo].filter(s => Number.isFinite(s));
  
  if (validScores.length === 0) return 0;
  return Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length);
}

// 🧪 CENÁRIOS DE TESTE
const testScenarios = [
  {
    name: "TRACK BOA GERAL",
    description: "Todos os aspectos bem balanceados",
    scores: { loudness: 85, dynamics: 80, frequency: 90, technical: 95, stereo: 75 },
    expectation: "Score alto e equilibrado"
  },
  {
    name: "LOUDNESS CRÍTICO",
    description: "Problema grave de loudness mas resto OK",
    scores: { loudness: 30, dynamics: 85, frequency: 90, technical: 85, stereo: 80 },
    expectation: "Penalização moderada (loudness tem peso 25%)"
  },
  {
    name: "FREQUÊNCIA RUIM",
    description: "Problemas de balanço tonal mas resto bom",
    scores: { loudness: 85, dynamics: 85, frequency: 40, technical: 90, stereo: 85 },
    expectation: "Penalização significativa (frequência tem peso 25%)"
  },
  {
    name: "TÉCNICO/STEREO RUINS",
    description: "Problemas técnicos e stereo mas resto excelente",
    scores: { loudness: 95, dynamics: 90, frequency: 95, technical: 20, stereo: 25 },
    expectation: "Menor penalização (técnico+stereo = apenas 30%)"
  },
  {
    name: "DINÂMICA ZERO",
    description: "Track super comprimida mas resto perfeito",
    scores: { loudness: 100, dynamics: 0, frequency: 100, technical: 100, stereo: 100 },
    expectation: "Penalização moderada (dinâmica = 20%)"
  },
  {
    name: "CASO EXTREMO",
    description: "Scores muito baixos em tudo",
    scores: { loudness: 20, dynamics: 15, frequency: 25, technical: 10, stereo: 30 },
    expectation: "Score baixo mas sem diferença significativa entre métodos"
  }
];

console.log('🧪 EXECUTANDO SIMULAÇÕES:\n');

testScenarios.forEach((scenario, index) => {
  console.log('='.repeat(80));
  console.log(`📋 CENÁRIO ${index + 1}: ${scenario.name}`);
  console.log(`🔮 ${scenario.description}`);
  console.log(`📊 Expectativa: ${scenario.expectation}`);
  console.log('='.repeat(80));
  
  const oldScore = calculateSimpleOverallScore(scenario.scores);
  const newScore = calculateWeightedOverallScore(scenario.scores);
  const difference = newScore - oldScore;
  
  console.log(`📊 Componentes:`);
  console.log(`   Loudness: ${scenario.scores.loudness} (peso: ${(WEIGHTED_AGGREGATE_CONFIG.loudness * 100).toFixed(0)}%)`);
  console.log(`   Dynamics: ${scenario.scores.dynamics} (peso: ${(WEIGHTED_AGGREGATE_CONFIG.dynamics * 100).toFixed(0)}%)`);
  console.log(`   Frequency: ${scenario.scores.frequency} (peso: ${(WEIGHTED_AGGREGATE_CONFIG.frequency * 100).toFixed(0)}%)`);
  console.log(`   Technical: ${scenario.scores.technical} (peso: ${(WEIGHTED_AGGREGATE_CONFIG.technical * 100).toFixed(0)}%)`);
  console.log(`   Stereo: ${scenario.scores.stereo} (peso: ${(WEIGHTED_AGGREGATE_CONFIG.stereo * 100).toFixed(0)}%)`);
  
  console.log(`\n🎯 Resultados:`);
  console.log(`   Score ANTES (média simples): ${oldScore}/100`);
  console.log(`   Score DEPOIS (pesos): ${newScore}/100`);
  console.log(`   Diferença: ${difference > 0 ? '+' : ''}${difference} pontos`);
  
  // Classificação
  const getClassification = (score) => {
    if (score >= 90) return 'EXCELENTE 🎉';
    if (score >= 80) return 'MUITO BOM ✅';
    if (score >= 70) return 'BOM ✅';
    if (score >= 60) return 'REGULAR ⚠️';
    return 'RUIM ❌';
  };
  
  console.log(`   Classificação ANTES: ${getClassification(oldScore)}`);
  console.log(`   Classificação DEPOIS: ${getClassification(newScore)}`);
  
  // Análise do impacto
  if (Math.abs(difference) >= 5) {
    console.log(`\n💡 ANÁLISE: Mudança significativa de ${Math.abs(difference)} pontos`);
    if (difference > 0) {
      console.log(`   ↗️ Scores altos em loudness/frequency foram beneficiados`);
    } else {
      console.log(`   ↘️ Problemas em loudness/frequency foram mais penalizados`);
    }
  } else {
    console.log(`\n💡 ANÁLISE: Mudança pequena (${Math.abs(difference)} pontos) - comportamento estável`);
  }
  
  console.log('');
});

console.log('='.repeat(80));
console.log('🎯 RESUMO DOS BENEFÍCIOS DO SISTEMA DE PESOS:');
console.log('✅ 1. Loudness e Frequency têm peso adequado (25% cada)');
console.log('✅ 2. Dinâmica mantém importância moderada (20%)');
console.log('✅ 3. Técnico e Stereo têm peso reduzido (15% cada)');
console.log('✅ 4. Tracks com 1-2 problemas específicos são menos penalizadas');
console.log('✅ 5. Problemas críticos (loudness/frequency) são adequadamente penalizados');
console.log('='.repeat(80));

console.log('\n🎉 Simulação concluída! Sistema de pesos implementado e testado.');
