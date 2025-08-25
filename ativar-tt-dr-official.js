// 🚀 ATIVAÇÃO TT-DR OFICIAL - DYNAMIC RANGE CORRECTION
// Implementa TT Dynamic Range conforme padrão da indústria
// Substitui Crest Factor por TT-DR nos cálculos de scoring

console.log('🏆 ATIVANDO TT-DR OFICIAL...\n');

// 🎯 Configuração de flags para TT-DR
if (typeof window !== 'undefined') {
  // Ativar TT-DR oficialmente
  window.USE_TT_DR = true;
  window.SCORING_V2 = true;
  window.AUDIT_MODE = true; // Garantir acesso a funcionalidades avançadas
  
  console.log('✅ FLAGS TT-DR ATIVADAS:');
  console.log(`   window.USE_TT_DR = ${window.USE_TT_DR}`);
  console.log(`   window.SCORING_V2 = ${window.SCORING_V2}`);
  console.log(`   window.AUDIT_MODE = ${window.AUDIT_MODE}`);
  
  // Importar módulo dynamics para o contexto global
  import('./lib/audio/features/dynamics.js').then(dynamics => {
    window.dynamicsModule = dynamics;
    console.log('✅ Módulo dynamics carregado globalmente');
    
    // Teste rápido de funcionamento
    try {
      const testSignal = new Float32Array(48000); // 1 segundo @ 48kHz
      for (let i = 0; i < testSignal.length; i++) {
        testSignal[i] = 0.1 * Math.sin(2 * Math.PI * 440 * i / 48000); // Seno 440Hz
      }
      
      const ttResult = dynamics.computeTTDynamicRange(testSignal, testSignal, 48000);
      console.log(`✅ Teste TT-DR: ${ttResult.tt_dr?.toFixed(2) || 'null'} dB (algoritmo: ${ttResult.algorithm})`);
      
      const crestResult = dynamics.computeCrestFactor(testSignal, testSignal);
      console.log(`✅ Teste Crest Factor: ${crestResult.crest_factor_db?.toFixed(2) || 'null'} dB`);
      
      if (ttResult.tt_dr && crestResult.crest_factor_db) {
        const diff = Math.abs(ttResult.tt_dr - crestResult.crest_factor_db);
        console.log(`📊 Diferença TT-DR vs Crest: ${diff.toFixed(2)} dB ${diff > 0.5 ? '✅' : '⚠️'}`);
      }
      
    } catch (error) {
      console.warn('⚠️ Erro no teste TT-DR:', error.message);
    }
    
  }).catch(error => {
    console.error('❌ Erro ao carregar dynamics:', error);
  });
  
  // Override console para mostrar quando TT-DR for usado
  const originalLog = console.log;
  window._ttdrMessageCount = 0;
  
  // Interceptar análises para confirmar TT-DR
  if (window.audioAnalyzer) {
    const originalAnalyze = window.audioAnalyzer.analyzeAudioBuffer;
    window.audioAnalyzer.analyzeAudioBuffer = function(...args) {
      const result = originalAnalyze.apply(this, args);
      
      // Verificar se TT-DR foi calculado
      if (result && result.technicalData) {
        const hasTTDR = Number.isFinite(result.technicalData.tt_dr);
        const hasDRStat = Number.isFinite(result.technicalData.dr_stat);
        const hasCrest = Number.isFinite(result.technicalData.crestFactor);
        
        if (hasTTDR) {
          console.log(`🏆 TT-DR ATIVO: ${result.technicalData.tt_dr.toFixed(2)} dB (oficial)`);
        } else if (hasDRStat) {
          console.log(`📊 DR-STAT: ${result.technicalData.dr_stat.toFixed(2)} dB (percentil)`);
        } else if (hasCrest) {
          console.log(`🎚️ CREST FACTOR: ${result.technicalData.crestFactor.toFixed(2)} dB (legacy)`);
        }
        
        // Mostrar metadados TT-DR se disponíveis
        if (result.technicalData._ttdr_metadata) {
          const meta = result.technicalData._ttdr_metadata;
          console.log(`   📋 ${meta.algorithm} v${meta.version} | ${meta.rms_windows} janelas | P95: ${meta.p95_rms?.toFixed(1)}dB | P10: ${meta.p10_rms?.toFixed(1)}dB`);
        }
      }
      
      return result;
    };
  }
  
  console.log('\n🎯 INSTRUÇÃO DE USO:');
  console.log('1. Carregue um arquivo de áudio');
  console.log('2. Observe as mensagens de confirmação TT-DR');
  console.log('3. Compare valores TT-DR vs Crest Factor na interface');
  console.log('4. Verifique se scoring usa TT-DR (não Crest Factor)');
  
} else {
  console.log('❌ Contexto window não disponível - execute no navegador');
}

// 📋 FUNÇÃO DE DIAGNÓSTICO
window.diagnosticarTTDR = function() {
  console.log('\n🔍 DIAGNÓSTICO TT-DR:');
  console.log(`   USE_TT_DR: ${window.USE_TT_DR || 'false'}`);
  console.log(`   SCORING_V2: ${window.SCORING_V2 || 'false'}`);
  console.log(`   AUDIT_MODE: ${window.AUDIT_MODE || 'false'}`);
  console.log(`   dynamicsModule: ${window.dynamicsModule ? 'carregado' : 'não carregado'}`);
  console.log(`   audioAnalyzer: ${window.audioAnalyzer ? 'disponível' : 'não disponível'}`);
  
  if (window.dynamicsModule) {
    console.log('\n✅ FUNÇÕES DISPONÍVEIS:');
    console.log('   • window.dynamicsModule.computeTTDynamicRange()');
    console.log('   • window.dynamicsModule.computeCrestFactor()');
    console.log('   • window.dynamicsModule.computeDynamicStats() [compatibility]');
  }
  
  console.log('\n📞 TESTE MANUAL:');
  console.log('Execute: window.testarTTDR() para teste completo');
};

// 📞 FUNÇÃO DE TESTE MANUAL
window.testarTTDR = function() {
  if (!window.dynamicsModule) {
    console.error('❌ Módulo dynamics não carregado');
    return;
  }
  
  console.log('\n🧪 TESTE MANUAL TT-DR...');
  
  // Gerar sinal de teste
  const sampleRate = 48000;
  const duration = 2; // 2 segundos
  const samples = sampleRate * duration;
  const left = new Float32Array(samples);
  const right = new Float32Array(samples);
  
  // Sinal com dinâmica variável
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const envelope = 0.3 + 0.7 * Math.sin(2 * Math.PI * 0.5 * t); // Modulação lenta
    const signal = envelope * (
      0.4 * Math.sin(2 * Math.PI * 100 * t) +   // Grave
      0.3 * Math.sin(2 * Math.PI * 440 * t) +   // Médio
      0.1 * Math.sin(2 * Math.PI * 2000 * t)    // Agudo
    );
    left[i] = signal;
    right[i] = signal * 0.95; // Leve diferença estéreo
  }
  
  // Testar TT-DR
  const ttResult = window.dynamicsModule.computeTTDynamicRange(left, right, sampleRate);
  console.log(`🏆 TT-DR: ${ttResult.tt_dr?.toFixed(2) || 'null'} dB`);
  console.log(`   Algoritmo: ${ttResult.algorithm}`);
  console.log(`   Janelas: ${ttResult.rms_windows}`);
  console.log(`   P95/P10: ${ttResult.p95_rms?.toFixed(1)}/${ttResult.p10_rms?.toFixed(1)} dB`);
  console.log(`   Válido: ${ttResult.is_valid}`);
  
  // Testar Crest Factor
  const crestResult = window.dynamicsModule.computeCrestFactor(left, right);
  console.log(`🎚️ Crest Factor: ${crestResult.crest_factor_db?.toFixed(2) || 'null'} dB`);
  
  // Comparação
  if (ttResult.tt_dr && crestResult.crest_factor_db) {
    const diff = Math.abs(ttResult.tt_dr - crestResult.crest_factor_db);
    console.log(`📊 Diferença: ${diff.toFixed(2)} dB ${diff > 1.0 ? '✅ Significativa' : '⚠️ Pequena'}`);
  }
  
  return { ttResult, crestResult };
};

// 🏁 CONFIRMAÇÃO FINAL
console.log('\n🏁 TT-DR OFFICIAL ATIVO E PRONTO!');
console.log('📞 Use window.diagnosticarTTDR() para verificar status');
console.log('🧪 Use window.testarTTDR() para teste manual');
console.log('🎵 Carregue áudio para ver TT-DR em ação!');
