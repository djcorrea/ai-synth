// 🧪 TESTE DIRETO TT-DR NO CONSOLE VERCEL
// Execute este código diretamente no console para testar TT-DR

console.log('🔍 TESTANDO TT-DR NO VERCEL...\n');

// 1. Ativar flags TT-DR
window.USE_TT_DR = true;
window.SCORING_V2 = true;
window.AUDIT_MODE = true;

console.log('✅ FLAGS ATIVADAS:');
console.log('   USE_TT_DR:', window.USE_TT_DR);
console.log('   SCORING_V2:', window.SCORING_V2);
console.log('   AUDIT_MODE:', window.AUDIT_MODE);

// 2. Verificar se audioAnalyzer existe
if (window.audioAnalyzer) {
  console.log('✅ audioAnalyzer disponível');
  
  // 3. Criar sinal de teste sintético
  const sampleRate = 48000;
  const duration = 2; // 2 segundos
  const samples = sampleRate * duration;
  
  // Simular AudioBuffer
  const mockAudioBuffer = {
    sampleRate: sampleRate,
    length: samples,
    numberOfChannels: 2,
    getChannelData: function(channel) {
      const data = new Float32Array(samples);
      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate;
        // Sinal com dinâmica variável
        const envelope = 0.3 + 0.7 * Math.sin(2 * Math.PI * 0.5 * t);
        const signal = envelope * (
          0.4 * Math.sin(2 * Math.PI * 100 * t) +   // Grave
          0.3 * Math.sin(2 * Math.PI * 440 * t) +   // Médio  
          0.1 * Math.sin(2 * Math.PI * 2000 * t)    // Agudo
        );
        data[i] = signal;
      }
      return data;
    }
  };
  
  console.log('\n🧪 EXECUTANDO ANÁLISE...');
  
  try {
    // 4. Executar análise
    const analysis = window.audioAnalyzer.analyzeAudioBuffer(mockAudioBuffer);
    
    console.log('\n📊 RESULTADOS:');
    console.log('   TT-DR:', analysis.technicalData.tt_dr || 'não calculado');
    console.log('   DR-STAT:', analysis.technicalData.dr_stat || 'não calculado');
    console.log('   Crest Factor:', analysis.technicalData.crestFactor || 'não calculado');
    console.log('   Dynamic Range (legacy):', analysis.technicalData.dynamicRange || 'não calculado');
    
    // 5. Verificar metadados TT-DR
    if (analysis.technicalData._ttdr_metadata) {
      const meta = analysis.technicalData._ttdr_metadata;
      console.log('\n🏆 METADADOS TT-DR:');
      console.log('   Algoritmo:', meta.algorithm);
      console.log('   Versão:', meta.version);
      console.log('   Janelas RMS:', meta.rms_windows);
      console.log('   P95 RMS:', meta.p95_rms?.toFixed(2), 'dB');
      console.log('   P10 RMS:', meta.p10_rms?.toFixed(2), 'dB');
    }
    
    // 6. Teste de scoring
    if (window.computeMixScore) {
      console.log('\n⚡ TESTANDO SCORING...');
      try {
        const score = window.computeMixScore(analysis.technicalData);
        console.log('   Score calculado:', score.overall?.toFixed(1) || 'erro');
        
        // Verificar se usa TT-DR no scoring
        const metricsUsed = score.breakdown?.map(b => b.metric) || [];
        const usesTTDR = metricsUsed.includes('tt_dr');
        const usesDRStat = metricsUsed.includes('dr_stat'); 
        const usesDRLegacy = metricsUsed.includes('dr');
        
        console.log('   Usa TT-DR:', usesTTDR ? '✅' : '❌');
        console.log('   Usa DR-STAT:', usesDRStat ? '✅' : '❌');
        console.log('   Usa DR Legacy:', usesDRLegacy ? '✅' : '❌');
        
      } catch (scoreError) {
        console.log('   ❌ Erro no scoring:', scoreError.message);
      }
    }
    
    // 7. Resultado final
    const ttdrWorking = analysis.technicalData.tt_dr || analysis.technicalData.dr_stat;
    const crestWorking = analysis.technicalData.crestFactor;
    
    console.log('\n🏁 RESULTADO FINAL:');
    if (ttdrWorking && crestWorking) {
      console.log('✅ TT-DR FUNCIONANDO!');
      console.log(`   TT-DR: ${ttdrWorking.toFixed(2)} dB`);
      console.log(`   Crest: ${crestWorking.toFixed(2)} dB`);
      console.log(`   Diferença: ${Math.abs(ttdrWorking - crestWorking).toFixed(2)} dB`);
    } else if (crestWorking) {
      console.log('⚠️ TT-DR não ativo, usando Crest Factor');
      console.log(`   Crest Factor: ${crestWorking.toFixed(2)} dB`);
    } else {
      console.log('❌ Nenhuma métrica de dinâmica funcionando');
    }
    
  } catch (analysisError) {
    console.log('❌ Erro na análise:', analysisError.message);
  }
  
} else {
  console.log('❌ audioAnalyzer não encontrado');
  console.log('   Certifique-se de estar na página principal do app');
}

// 8. Função de diagnóstico disponível
window.testarTTDRRapido = function() {
  console.log('\n🔄 EXECUTANDO TESTE RÁPIDO...');
  // Repetir teste acima
  if (window.audioAnalyzer) {
    const mockBuffer = {
      sampleRate: 48000,
      length: 48000,
      numberOfChannels: 2,
      getChannelData: () => {
        const data = new Float32Array(48000);
        for (let i = 0; i < 48000; i++) {
          data[i] = 0.1 * Math.sin(2 * Math.PI * 440 * i / 48000);
        }
        return data;
      }
    };
    
    const result = window.audioAnalyzer.analyzeAudioBuffer(mockBuffer);
    console.log('TT-DR:', result.technicalData.tt_dr || 'não calculado');
    console.log('Crest:', result.technicalData.crestFactor || 'não calculado');
    return result.technicalData;
  }
  return null;
};

console.log('\n📞 TESTE DISPONÍVEL:');
console.log('   Execute: testarTTDRRapido() para repetir o teste');
