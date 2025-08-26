// 🔬 DIAGNÓSTICO ESPECÍFICO DO SCORING
// Testa cada componente individualmente

console.log('🔬 DIAGNÓSTICO ESPECÍFICO INICIADO');

async function diagnosticarScoring() {
  try {
    console.log('\n📊 1. CARREGANDO MÓDULOS...');
    const scoringModule = await import('/lib/audio/features/scoring.js?v=' + Date.now());
    console.log('✅ Scoring module carregado');
    
    console.log('\n📊 2. CARREGANDO DADOS DE REFERÊNCIA...');
    const response = await fetch('/public/refs/out/funk_mandela.json?v=' + Date.now());
    const rawData = await response.json();
    console.log('✅ Dados brutos carregados');
    
    // Verificar estrutura
    console.log('📋 Estrutura dos dados:', Object.keys(rawData));
    if (rawData.funk_mandela) {
      console.log('📋 Estrutura funk_mandela:', Object.keys(rawData.funk_mandela));
      if (rawData.funk_mandela.spectralBalance) {
        console.log('📋 Estrutura spectralBalance:', Object.keys(rawData.funk_mandela.spectralBalance));
        if (rawData.funk_mandela.spectralBalance.bands) {
          const bandCount = Object.keys(rawData.funk_mandela.spectralBalance.bands).length;
          console.log(`📊 Total de bandas encontradas: ${bandCount}`);
        }
      }
    }
    
    console.log('\n📊 3. PREPARANDO DADOS DE TESTE...');
    
    // Teste com dados mínimos primeiro
    const testDataMinimo = {
      sampleRate: 44100,
      spectrum: [0.5, 0.4, 0.3, 0.2, 0.1],
      rms: 0.3
    };
    
    console.log('📊 Dados de teste criados:', testDataMinimo);
    
    console.log('\n📊 4. TESTANDO SCORING DIRETO...');
    
    // Teste 1: Dados originais
    console.log('🧪 Teste 1: Dados originais');
    const resultado1 = scoringModule.computeMixScore(testDataMinimo, rawData.funk_mandela);
    console.log('Resultado 1:', JSON.stringify(resultado1, null, 2));
    
    // Teste 2: Com adaptador
    if (window.adaptReferenceData) {
      console.log('\n🧪 Teste 2: Com adaptador');
      const dadosAdaptados = window.adaptReferenceData(rawData);
      console.log('Dados adaptados structure:', Object.keys(dadosAdaptados || {}));
      
      const resultado2 = scoringModule.computeMixScore(testDataMinimo, dadosAdaptados);
      console.log('Resultado 2:', JSON.stringify(resultado2, null, 2));
    }
    
    // Teste 3: Dados simulados simplificados
    console.log('\n🧪 Teste 3: Dados simulados');
    const refSimulada = {
      bands: {
        'test_band_1': { target_db: -10, tol_db: 2 },
        'test_band_2': { target_db: -15, tol_db: 3 }
      },
      targets: {
        bands: {
          sub: 15,
          bass: 20,
          mid: 25,
          high: 20,
          presence: 15,
          air: 5
        }
      }
    };
    
    const resultado3 = scoringModule.computeMixScore(testDataMinimo, refSimulada);
    console.log('Resultado 3:', JSON.stringify(resultado3, null, 2));
    
    console.log('\n📊 5. ANÁLISE DOS RESULTADOS...');
    
    const resultados = [resultado1, resultado2, resultado3].filter(r => r);
    
    for (let i = 0; i < resultados.length; i++) {
      const r = resultados[i];
      console.log(`\nResultado ${i + 1}:`);
      console.log(`  - advancedScorePct: ${r.advancedScorePct} (${typeof r.advancedScorePct})`);
      console.log(`  - scorePct: ${r.scorePct} (${typeof r.scorePct})`);
      console.log(`  - score: ${r.score} (${typeof r.score})`);
      console.log(`  - Campos: ${Object.keys(r).join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
  window.diagnosticarScoring = diagnosticarScoring;
  console.log('✅ Diagnóstico carregado. Execute diagnosticarScoring() para iniciar.');
}
