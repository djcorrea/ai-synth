/**
 * 🚨 DIAGNÓSTICO CRÍTICO: Score não mudou NADA
 * 
 * Se o score está exatamente igual, pode indicar:
 * 1. Implementações não estão ativas
 * 2. Fallback para sistema antigo
 * 3. Flags não configuradas
 */

console.log('🚨 DIAGNÓSTICO CRÍTICO: Por que score não mudou NADA?');
console.log('═══════════════════════════════════════════════════════════');

// Verificar se as implementações estão ativas
function diagnosticarImplementacoes() {
  
  console.log('\n🔍 TESTE 1: Verificando flags globais');
  console.log('─────────────────────────────────────────');
  
  // Simular verificação de flags
  const flags = {
    SCORING_V2: typeof window !== 'undefined' ? window.SCORING_V2 : 'undefined',
    USE_TT_DR: typeof window !== 'undefined' ? window.USE_TT_DR : 'undefined', 
    USE_EQUAL_WEIGHT_V3: typeof window !== 'undefined' ? window.USE_EQUAL_WEIGHT_V3 : 'undefined',
    AUDIT_MODE: typeof window !== 'undefined' ? window.AUDIT_MODE : 'undefined'
  };
  
  console.log('Flags detectadas:', flags);
  
  if (flags.SCORING_V2 === 'undefined') {
    console.log('⚠️ PROBLEMA: SCORING_V2 não definido');
  }
  
  if (flags.USE_TT_DR === 'undefined') {
    console.log('⚠️ PROBLEMA: USE_TT_DR não definido');
  }
  
  console.log('\n🔍 TESTE 2: Simulando análise de áudio');
  console.log('─────────────────────────────────────────');
  
  // Simular dados de áudio típico
  const audioData = {
    // Métricas que deveriam estar presentes
    lufsIntegrated: -8.3,
    truePeakDbtp: -0.8,
    lra: 6.5,
    stereoCorrelation: 0.28,
    
    // TT-DR vs Crest Factor - DIFERENÇAS CRÍTICAS
    tt_dr: 8.5,           // ← Deveria ser usado com SCORING_V2
    dynamicRange: 11.2,   // ← Crest Factor legacy
    crest_factor_db: 11.2,
    
    // Outras métricas
    spectralCentroid: 4950,
    spectralFlatness: 0.32
  };
  
  console.log('Dados simulados:', audioData);
  
  console.log('\n🔍 TESTE 3: Lógica de seleção de DR');
  console.log('─────────────────────────────────────');
  
  // Reproduzir lógica do scoring.js
  const SCORING_V2 = true; // Deveria estar ativo
  const useTTDR = SCORING_V2 || false;
  
  let drUsado = null;
  let drValor = null;
  
  if (useTTDR && Number.isFinite(audioData.tt_dr)) {
    drUsado = 'TT-DR oficial';
    drValor = audioData.tt_dr;
  } else if (useTTDR && Number.isFinite(audioData.dr_stat)) {
    drUsado = 'dr_stat (fallback)';
    drValor = audioData.dr_stat;
  } else {
    drUsado = 'Crest Factor (legacy)';
    drValor = audioData.dynamicRange;
  }
  
  console.log(`DR Selecionado: ${drUsado}`);
  console.log(`Valor usado: ${drValor} dB`);
  
  // Calcular score para ambos
  const target = 10.0;
  const tolerance = 5.0;
  
  const score_ttdr = calcularScore(audioData.tt_dr, target, tolerance);
  const score_crest = calcularScore(audioData.dynamicRange, target, tolerance);
  
  console.log(`\nScore com TT-DR: ${score_ttdr.toFixed(1)}%`);
  console.log(`Score com Crest: ${score_crest.toFixed(1)}%`);
  console.log(`Diferença: ${Math.abs(score_ttdr - score_crest).toFixed(1)}% pontos`);
  
  console.log('\n🔍 TESTE 4: Equal Weight V3 vs Legacy');
  console.log('─────────────────────────────────────────');
  
  // Simular sistema de pesos
  const metrics = [
    { name: 'LUFS', score: 85.2, pesoLegacy: 0.25, pesoV3: 0.20 },
    { name: 'Dynamic Range', score: 67.3, pesoLegacy: 0.25, pesoV3: 0.20 },
    { name: 'True Peak', score: 97.6, pesoLegacy: 0.20, pesoV3: 0.20 },
    { name: 'Stereo', score: 92.5, pesoLegacy: 0.15, pesoV3: 0.20 },
    { name: 'Spectral', score: 88.4, pesoLegacy: 0.15, pesoV3: 0.20 }
  ];
  
  const scoreLegacy = metrics.reduce((sum, m) => sum + (m.score * m.pesoLegacy), 0);
  const scoreV3 = metrics.reduce((sum, m) => sum + (m.score * m.pesoV3), 0);
  
  console.log(`Score Legacy: ${scoreLegacy.toFixed(1)}%`);
  console.log(`Score V3: ${scoreV3.toFixed(1)}%`);
  console.log(`Diferença: ${Math.abs(scoreV3 - scoreLegacy).toFixed(1)}% pontos`);
  
  // DIAGNÓSTICOS CRÍTICOS
  console.log('\n🚨 DIAGNÓSTICOS CRÍTICOS');
  console.log('═══════════════════════════════════════');
  
  const problemas = [];
  
  if (Math.abs(score_ttdr - score_crest) < 0.1) {
    problemas.push('TT-DR pode não estar sendo usado');
  }
  
  if (Math.abs(scoreV3 - scoreLegacy) < 0.1) {
    problemas.push('Equal Weight V3 pode não estar ativo');
  }
  
  if (problemas.length === 0) {
    console.log('✅ Implementações parecem estar funcionando');
    console.log('⚠️ Score similar pode ser coincidência do áudio específico');
  } else {
    console.log('❌ PROBLEMAS DETECTADOS:');
    problemas.forEach(p => console.log(`   • ${p}`));
  }
  
  return {
    problemas,
    diferencaTTDR: Math.abs(score_ttdr - score_crest),
    diferencaV3: Math.abs(scoreV3 - scoreLegacy)
  };
}

function calcularScore(valor, target, tolerance) {
  const diff = Math.abs(valor - target);
  const ratio = diff / tolerance;
  
  if (ratio <= 1) return 100;
  if (ratio <= 2) return 100 - (ratio - 1) * 25;
  if (ratio <= 3) return 75 - (ratio - 2) * 20;
  return Math.max(30, 55 - (ratio - 3) * 15);
}

// Executar diagnóstico
const resultado = diagnosticarImplementacoes();

console.log('\n📋 RESUMO DO DIAGNÓSTICO');
console.log('═══════════════════════════════════════');
console.log(`Diferença TT-DR vs Crest: ${resultado.diferencaTTDR.toFixed(1)}% pontos`);
console.log(`Diferença V3 vs Legacy: ${resultado.diferencaV3.toFixed(1)}% pontos`);

if (resultado.problemas.length > 0) {
  console.log('\n🚨 AÇÃO NECESSÁRIA:');
  console.log('1. Verificar console do browser para flags ativas');
  console.log('2. Confirmar se SCORING_V2=true está definido');
  console.log('3. Checar se TT-DR está sendo calculado');
  console.log('4. Verificar se Equal Weight V3 está ativo');
  console.log('\n📞 COMANDOS DE VERIFICAÇÃO:');
  console.log('No console do browser digite:');
  console.log('window.SCORING_V2');
  console.log('window.USE_TT_DR'); 
  console.log('window.USE_EQUAL_WEIGHT_V3');
} else {
  console.log('\n✅ Sistema aparenta estar funcionando corretamente');
  console.log('Score igual pode ser normal para este áudio específico');
}
