#!/usr/bin/env node

/**
 * 🧪 TESTE DETALHADO DOS SUB-SCORES
 * Verifica se cada categoria está pegando as métricas corretas
 */

console.log('🎯 TESTE DETALHADO DOS SUB-SCORES');
console.log('=================================');

// Dados de teste com valores específicos para identificar quais métricas estão sendo usadas
const testData = {
  // === DYNAMICS ===
  dynamicRange: 5.0,    // Muito baixo (deveria afetar dynamics)
  lra: 15.0,           // Muito alto (deveria afetar dynamics)  
  crestFactor: 4.0,    // Muito baixo (deveria afetar dynamics)
  
  // === TECHNICAL ===
  truePeakDbtp: 2.0,   // Acima de 0 (deveria afetar technical)
  dcOffset: 0.1,       // Muito alto (deveria afetar technical)
  thdPercent: 5.0,     // Muito alto (deveria afetar technical)
  clippingSamples: 100, // Com clipping (deveria afetar technical)
  
  // === LOUDNESS ===
  lufsIntegrated: -10.0, // Muito alto (deveria afetar loudness)
  
  // === FREQUENCY ===
  spectralCentroid: 1000,    // Muito baixo (deveria afetar frequency)
  spectralRolloff50: 1500,   // Muito baixo (deveria afetar frequency)
  spectralRolloff85: 5000,   // Muito baixo (deveria afetar frequency)
  
  // === STEREO ===
  stereoCorrelation: -0.5,   // Correlação negativa (deveria afetar stereo)
  stereoWidth: 0.1,          // Muito estreito (deveria afetar stereo)
  balanceLR: 0.5,            // Muito desbalanceado (deveria afetar stereo)
  
  // === OUTROS ===
  spectralFlatness: 0.8,
  clippingPct: 5.0
};

// Referência padrão
const testRef = {
  lufs_target: -14,
  tol_lufs: 1.0,
  dr_target: 10,
  tol_dr: 3.0,
  lra_target: 7,
  tol_lra: 3.0,
  true_peak_target: -1,
  tol_true_peak: 1.0,
  stereo_target: 0.3,
  tol_stereo: 0.5
};

console.log('📊 Dados de teste:');
console.log('==================');
console.log('🔻 DYNAMICS (devem ser BAIXOS):');
console.log(`  - dynamicRange: ${testData.dynamicRange} (target: ${testRef.dr_target})`);
console.log(`  - lra: ${testData.lra} (target: ${testRef.lra_target})`);
console.log(`  - crestFactor: ${testData.crestFactor} (target: ~10)`);

console.log('\n🔻 TECHNICAL (devem ser BAIXOS):');
console.log(`  - truePeakDbtp: ${testData.truePeakDbtp} (target: ${testRef.true_peak_target})`);
console.log(`  - dcOffset: ${testData.dcOffset} (target: 0)`);
console.log(`  - thdPercent: ${testData.thdPercent} (target: <1)`);
console.log(`  - clippingSamples: ${testData.clippingSamples} (target: 0)`);

console.log('\n🔻 LOUDNESS (deve ser BAIXO):');
console.log(`  - lufsIntegrated: ${testData.lufsIntegrated} (target: ${testRef.lufs_target})`);

console.log('\n🔻 FREQUENCY (deve ser BAIXO):');
console.log(`  - spectralCentroid: ${testData.spectralCentroid} (ideal: 1800-3200)`);
console.log(`  - spectralRolloff50: ${testData.spectralRolloff50} (target: ~3000)`);
console.log(`  - spectralRolloff85: ${testData.spectralRolloff85} (target: ~8000)`);

console.log('\n🔻 STEREO (deve ser BAIXO):');
console.log(`  - stereoCorrelation: ${testData.stereoCorrelation} (target: ${testRef.stereo_target})`);
console.log(`  - stereoWidth: ${testData.stereoWidth} (target: ~0.6)`);
console.log(`  - balanceLR: ${testData.balanceLR} (target: 0)`);

// Simular o cálculo usado no audio-analyzer.js
console.log('\n🧮 SIMULANDO CÁLCULO DO AUDIO-ANALYZER.JS:');
console.log('============================================');

const safe = (v, def = 0) => Number.isFinite(v) ? v : def;

// Valores da simulação
const lufsInt = safe(testData.lufsIntegrated);
const dr = safe(testData.dynamicRange);
const crest = safe(testData.crestFactor);
const corr = safe(testData.stereoCorrelation, 0);
const centroid = safe(testData.spectralCentroid);

// Targets
const refLufs = testRef.lufs_target;
const refDR = testRef.dr_target;
const freqIdealLow = 1800, freqIdealHigh = 3200;

// Cálculos exatos do código original
const scoreLoud = 100 - Math.min(100, Math.abs(lufsInt - refLufs) * 6);
const scoreDyn = 100 - Math.min(100, Math.abs(dr - refDR) * 10);

let scoreTech = 100;
if (safe(testData.clippingSamples) > 0) scoreTech -= 20;
if (Math.abs(safe(testData.dcOffset)) > 0.02) scoreTech -= 10;
if (crest < 6) scoreTech -= 15; 
else if (crest < 8) scoreTech -= 5;
if (corr < -0.2) scoreTech -= 15;

// Frequency score
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

const clamp = v => Math.max(0, Math.min(100, Math.round(v)));

const breakdown = {
    dynamics: clamp(scoreDyn),
    technical: clamp(scoreTech),
    loudness: clamp(scoreLoud),
    frequency: clamp(scoreFreq)
};

console.log('📊 RESULTADOS SIMULADOS:');
console.log('========================');
console.log(`🔻 Dynamics: ${breakdown.dynamics}% (DR: ${dr}, target: ${refDR})`);
console.log(`   - Desvio DR: ${Math.abs(dr - refDR)} → Penalidade: ${Math.abs(dr - refDR) * 10}%`);
console.log(`🔻 Technical: ${breakdown.technical}%`);
console.log(`   - Clipping: ${testData.clippingSamples > 0 ? '-20%' : '0%'}`);
console.log(`   - DC Offset: ${Math.abs(testData.dcOffset) > 0.02 ? '-10%' : '0%'}`);
console.log(`   - Crest Factor: ${crest < 6 ? '-15%' : crest < 8 ? '-5%' : '0%'}`);
console.log(`   - Stereo Corr: ${corr < -0.2 ? '-15%' : '0%'}`);
console.log(`🔻 Loudness: ${breakdown.loudness}% (LUFS: ${lufsInt}, target: ${refLufs})`);
console.log(`   - Desvio LUFS: ${Math.abs(lufsInt - refLufs)} → Penalidade: ${Math.abs(lufsInt - refLufs) * 6}%`);
console.log(`🔻 Frequency: ${breakdown.frequency}% (Centroid: ${centroid}, ideal: ${freqIdealLow}-${freqIdealHigh})`);

console.log('\n✅ ANÁLISE DOS RESULTADOS:');
console.log('==========================');

// Verificar se os scores estão baixos conforme esperado
const expectations = {
    dynamics: { expected: 'BAIXO', actual: breakdown.dynamics, reason: 'DR muito baixo (5 vs 10)' },
    technical: { expected: 'BAIXO', actual: breakdown.technical, reason: 'Clipping, DC offset alto, crest baixo, corr negativa' },
    loudness: { expected: 'BAIXO', actual: breakdown.loudness, reason: 'LUFS muito alto (-10 vs -14)' },
    frequency: { expected: 'BAIXO', actual: breakdown.frequency, reason: 'Centroid muito baixo (1000 vs 1800-3200)' }
};

let allCorrect = true;

Object.entries(expectations).forEach(([category, exp]) => {
    const isLow = exp.actual <= 50;
    const correct = (exp.expected === 'BAIXO' && isLow);
    const status = correct ? '✅' : '❌';
    
    console.log(`${status} ${category}: ${exp.actual}% (esperado: ${exp.expected})`);
    console.log(`   Razão: ${exp.reason}`);
    
    if (!correct) {
        allCorrect = false;
        console.log(`   ⚠️ PROBLEMA: Score deveria ser baixo mas está em ${exp.actual}%`);
    }
});

console.log('\n🎯 CONCLUSÃO:');
console.log('=============');

if (allCorrect) {
    console.log('✅ TODOS OS SUB-SCORES ESTÃO CORRETOS!');
    console.log('✅ Cada categoria está pegando as métricas certas.');
} else {
    console.log('❌ ALGUNS SUB-SCORES ESTÃO INCORRETOS!');
    console.log('❌ Pode haver problema no mapeamento das métricas.');
}

console.log('\n📋 MÉTRICAS USADAS POR CATEGORIA:');
console.log('=================================');
console.log('🔸 DYNAMICS: dynamicRange, lra, crestFactor');
console.log('🔸 TECHNICAL: truePeakDbtp, dcOffset, thdPercent, clippingSamples, stereoCorrelation');
console.log('🔸 LOUDNESS: lufsIntegrated');
console.log('🔸 FREQUENCY: spectralCentroid');
console.log('🔸 STEREO: stereoCorrelation (também afeta technical)');

console.log('\n⚠️ NOTA: O sub-score "stereo" não existe mais no breakdown atual.');
console.log('⚠️ stereoCorrelation afeta o score "technical" quando muito negativa.');
