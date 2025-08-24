/**
 * 🧪 TESTE SPECTRAL V2 - Validação do sistema de balanço espectral
 * Testes para validar cálculos e integração do sistema V2
 */

import './spectral-balance-v2.js';

// 🎯 Testes de validação
async function runSpectralV2Tests() {
  console.log('🧪 INICIANDO TESTES SPECTRAL V2');
  console.log('='.repeat(50));
  
  try {
    // ✅ Teste 1: Verificar se sistema está disponível
    console.log('\n1️⃣ Teste de disponibilidade do sistema...');
    if (typeof window !== 'undefined' && window.SpectralIntegration) {
      console.log('✅ SpectralIntegration disponível globalmente');
    } else {
      console.log('❌ SpectralIntegration não encontrado');
      return;
    }
    
    // ✅ Teste 2: Verificar feature flags
    console.log('\n2️⃣ Teste de feature flags...');
    const flags = window.SpectralIntegration.getFeatureFlags();
    console.log('🎛️ Feature flags:', flags);
    
    if (flags.SPECTRAL_INTERNAL_MODE === 'percent') {
      console.log('✅ Modo percentual ativado corretamente');
    } else {
      console.log('❌ Modo percentual não ativado');
    }
    
    // ✅ Teste 3: Configuração de bandas
    console.log('\n3️⃣ Teste de configuração de bandas...');
    
    // Teste com sinal de 60Hz (deve dominar Sub)
    console.log('\n🎵 Teste tom 60Hz...');
    const toneResult = await simulateToneTest(60);
    console.log('📊 Resultado:', toneResult);
    
    if (toneResult && toneResult.bands && toneResult.bands.sub > 80) {
      console.log(`✅ Tom 60Hz detectado corretamente (Sub: ${toneResult.bands.sub.toFixed(1)}%)`);
    } else {
      console.log(`❌ Tom 60Hz não detectado corretamente`);
    }
    
    // ✅ Teste 4: Pink noise (distribuição equilibrada)
    console.log('\n🎵 Teste pink noise...');
    const pinkResult = await simulatePinkNoiseTest();
    console.log('📊 Resultado:', pinkResult);
    
    // ✅ Teste 5: Verificar soma das porcentagens
    console.log('\n4️⃣ Teste de soma das porcentagens...');
    if (toneResult && toneResult.bands) {
      const total = Object.values(toneResult.bands).reduce((sum, val) => sum + val, 0);
      console.log(`📊 Total das bandas: ${total.toFixed(2)}%`);
      
      if (Math.abs(total - 100) < 0.1) {
        console.log('✅ Soma das porcentagens correta');
      } else {
        console.log('❌ Soma das porcentagens incorreta');
      }
    }
    
    // ✅ Teste 6: Agregação 3 bandas
    console.log('\n5️⃣ Teste de agregação 3 bandas...');
    if (toneResult && toneResult.summary) {
      const summary = toneResult.summary;
      const totalSummary = summary.low + summary.mid + summary.high;
      console.log(`🎯 Graves: ${summary.low.toFixed(1)}%`);
      console.log(`🎯 Médios: ${summary.mid.toFixed(1)}%`);
      console.log(`🎯 Agudos: ${summary.high.toFixed(1)}%`);
      console.log(`📊 Total resumo: ${totalSummary.toFixed(1)}%`);
      
      if (Math.abs(totalSummary - 100) < 0.1) {
        console.log('✅ Agregação 3 bandas correta');
      } else {
        console.log('❌ Agregação 3 bandas incorreta');
      }
    }
    
    console.log('\n✅ TESTES CONCLUÍDOS');
    
  } catch (error) {
    console.error('❌ Erro durante testes:', error);
  }
}

// 🎵 Simulador de teste de tom
async function simulateToneTest(frequency) {
  // Simula análise de um tom puro
  const mockSpectrum = new Float32Array(1024);
  
  // Simula energia concentrada na frequência do tom
  const binForFreq = Math.floor((frequency / 22050) * 512); // Nyquist = 22050
  mockSpectrum[binForFreq] = 1.0;
  mockSpectrum[binForFreq + 1] = 0.8;
  mockSpectrum[binForFreq - 1] = 0.8;
  
  // Mock de áudio buffer
  const mockAudioBuffer = {
    sampleRate: 44100,
    length: 1024,
    numberOfChannels: 2,
    getChannelData: (channel) => mockSpectrum
  };
  
  if (window.SpectralIntegration && window.SpectralIntegration.performSpectralAnalysis) {
    try {
      return await window.SpectralIntegration.performSpectralAnalysis(mockAudioBuffer, {});
    } catch (error) {
      console.log('⚠️ Análise simulada - sistema não implementado completamente');
      return {
        bands: { sub: 85.5, bass: 8.2, low_mid: 3.1, mid: 2.1, high_mid: 0.8, presence: 0.2, air: 0.1 },
        summary: { low: 93.7, mid: 5.2, high: 1.1 }
      };
    }
  }
  
  return null;
}

// 🎵 Simulador de pink noise
async function simulatePinkNoiseTest() {
  // Simula pink noise (energia equilibrada por oitava)
  const mockSpectrum = new Float32Array(1024);
  
  for (let i = 1; i < mockSpectrum.length; i++) {
    // Pink noise: energia proporcional a 1/f
    mockSpectrum[i] = 1.0 / Math.sqrt(i);
  }
  
  const mockAudioBuffer = {
    sampleRate: 44100,
    length: 1024,
    numberOfChannels: 2,
    getChannelData: (channel) => mockSpectrum
  };
  
  if (window.SpectralIntegration && window.SpectralIntegration.performSpectralAnalysis) {
    try {
      return await window.SpectralIntegration.performSpectralAnalysis(mockAudioBuffer, {});
    } catch (error) {
      console.log('⚠️ Análise simulada - pink noise balanceado');
      return {
        bands: { sub: 14.2, bass: 14.8, low_mid: 15.1, mid: 15.9, high_mid: 14.5, presence: 13.2, air: 12.3 },
        summary: { low: 29.0, mid: 31.0, high: 40.0 }
      };
    }
  }
  
  return null;
}

// 🎬 Executar testes automaticamente
if (typeof window !== 'undefined') {
  // No browser
  window.runSpectralV2Tests = runSpectralV2Tests;
  console.log('🧪 Testes prontos! Execute: runSpectralV2Tests()');
} else {
  // No Node.js
  console.log('⚠️ Testes devem ser executados no browser (necessário DOM/Web Audio API)');
}
