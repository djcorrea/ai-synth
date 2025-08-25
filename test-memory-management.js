// 🧠 TESTE MEMORY MANAGEMENT - Validação Fase 1
// Testa se os vazamentos de memória foram resolvidos

const TEST_CONFIG = {
  maxAnalyses: 20,        // Número de análises consecutivas
  memoryThreshold: 50,    // Máximo de crescimento de memória em MB
  gcInterval: 5           // Força GC a cada N análises
};

class MemoryTestRunner {
  constructor() {
    this.initialMemory = 0;
    this.peakMemory = 0;
    this.finalMemory = 0;
    this.analyses = [];
    this.audioAnalyzer = null;
  }

  async initialize() {
    console.log('🧪 Inicializando teste de Memory Management...');
    
    // Importar AudioAnalyzer
    try {
      const analyzerModule = await import('./public/audio-analyzer.js');
      this.audioAnalyzer = new analyzerModule.AudioAnalyzer();
      console.log('✅ AudioAnalyzer inicializado');
    } catch (err) {
      console.error('❌ Falha ao carregar AudioAnalyzer:', err);
      throw err;
    }

    // Força GC inicial e captura baseline
    if (window.gc) {
      window.gc();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.initialMemory = this.getMemoryUsage();
    console.log(`📊 Memória inicial: ${this.initialMemory.toFixed(2)} MB`);
  }

  getMemoryUsage() {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize / (1024 * 1024);
    }
    return 0;
  }

  async createTestAudioFile() {
    // Cria um arquivo de áudio sintético para teste
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const duration = 5; // 5 segundos
    const length = sampleRate * duration;
    
    const buffer = audioContext.createBuffer(2, length, sampleRate);
    
    // Gera sine wave de teste
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.5;
      }
    }

    // Converte para Blob para simular arquivo
    const arrayBuffer = this.audioBufferToArrayBuffer(buffer);
    const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
    blob.name = `test-audio-${Date.now()}.wav`;
    blob.size = arrayBuffer.byteLength;
    
    return blob;
  }

  audioBufferToArrayBuffer(audioBuffer) {
    // Converte AudioBuffer para ArrayBuffer (WAV básico)
    const length = audioBuffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 4);
    const view = new DataView(arrayBuffer);
    
    // Header WAV simplificado
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 4, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 2, true);
    view.setUint32(24, audioBuffer.sampleRate, true);
    view.setUint32(28, audioBuffer.sampleRate * 4, true);
    view.setUint16(32, 4, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 4, true);
    
    // Dados de áudio
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const left = audioBuffer.getChannelData(0)[i];
      const right = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1)[i] : left;
      
      view.setInt16(offset, left * 0x7FFF, true);
      view.setInt16(offset + 2, right * 0x7FFF, true);
      offset += 4;
    }
    
    return arrayBuffer;
  }

  async runSingleAnalysis(iteration) {
    const startMemory = this.getMemoryUsage();
    console.log(`\n🔄 Análise ${iteration + 1}/${TEST_CONFIG.maxAnalyses}`);
    console.log(`📊 Memória antes: ${startMemory.toFixed(2)} MB`);
    
    try {
      const testFile = await this.createTestAudioFile();
      const startTime = performance.now();
      
      const result = await this.audioAnalyzer.analyzeAudioFile(testFile);
      
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();
      
      const analysisData = {
        iteration: iteration + 1,
        startMemory,
        endMemory,
        memoryDelta: endMemory - startMemory,
        duration: endTime - startTime,
        success: !!result,
        timestamp: new Date().toISOString()
      };
      
      this.analyses.push(analysisData);
      
      console.log(`✅ Análise concluída em ${analysisData.duration.toFixed(0)}ms`);
      console.log(`📊 Memória depois: ${endMemory.toFixed(2)} MB (Δ: ${analysisData.memoryDelta.toFixed(2)} MB)`);
      
      // Atualiza pico de memória
      if (endMemory > this.peakMemory) {
        this.peakMemory = endMemory;
      }
      
      // Força GC periodicamente
      if ((iteration + 1) % TEST_CONFIG.gcInterval === 0) {
        console.log('🗑️ Forçando garbage collection...');
        if (window.gc) {
          window.gc();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const postGcMemory = this.getMemoryUsage();
        console.log(`📊 Memória pós-GC: ${postGcMemory.toFixed(2)} MB`);
      }
      
      return analysisData;
      
    } catch (error) {
      console.error(`❌ Falha na análise ${iteration + 1}:`, error);
      const errorData = {
        iteration: iteration + 1,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      this.analyses.push(errorData);
      return errorData;
    }
  }

  async runMemoryTest() {
    console.log(`\n🧪 Iniciando teste de memória com ${TEST_CONFIG.maxAnalyses} análises consecutivas...`);
    
    for (let i = 0; i < TEST_CONFIG.maxAnalyses; i++) {
      await this.runSingleAnalysis(i);
      
      // Pausa breve entre análises
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // GC final
    if (window.gc) {
      window.gc();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.finalMemory = this.getMemoryUsage();
    console.log(`\n📊 Memória final: ${this.finalMemory.toFixed(2)} MB`);
  }

  generateReport() {
    const totalMemoryGrowth = this.finalMemory - this.initialMemory;
    const avgMemoryPerAnalysis = totalMemoryGrowth / TEST_CONFIG.maxAnalyses;
    const successfulAnalyses = this.analyses.filter(a => a.success).length;
    const avgDuration = this.analyses.filter(a => a.duration).reduce((sum, a) => sum + a.duration, 0) / successfulAnalyses;
    
    const report = {
      summary: {
        totalAnalyses: TEST_CONFIG.maxAnalyses,
        successfulAnalyses,
        failedAnalyses: TEST_CONFIG.maxAnalyses - successfulAnalyses,
        initialMemoryMB: this.initialMemory,
        finalMemoryMB: this.finalMemory,
        peakMemoryMB: this.peakMemory,
        totalMemoryGrowthMB: totalMemoryGrowth,
        avgMemoryPerAnalysisMB: avgMemoryPerAnalysis,
        avgDurationMs: avgDuration,
        memoryLeakDetected: totalMemoryGrowth > TEST_CONFIG.memoryThreshold,
        testPassed: totalMemoryGrowth <= TEST_CONFIG.memoryThreshold && successfulAnalyses === TEST_CONFIG.maxAnalyses
      },
      details: this.analyses,
      recommendations: []
    };
    
    // Gerar recomendações
    if (report.summary.memoryLeakDetected) {
      report.recommendations.push('⚠️ VAZAMENTO DE MEMÓRIA DETECTADO: Crescimento total excede limite');
    }
    
    if (report.summary.avgMemoryPerAnalysisMB > 2) {
      report.recommendations.push('⚠️ Alto consumo de memória por análise (>2MB/análise)');
    }
    
    if (report.summary.failedAnalyses > 0) {
      report.recommendations.push(`⚠️ ${report.summary.failedAnalyses} análises falharam`);
    }
    
    if (report.summary.testPassed) {
      report.recommendations.push('✅ Memory Management funcionando corretamente');
    }
    
    return report;
  }

  printReport(report) {
    console.log('\n' + '='.repeat(60));
    console.log('📋 RELATÓRIO DE TESTE DE MEMORY MANAGEMENT');
    console.log('='.repeat(60));
    
    const { summary } = report;
    
    console.log(`\n📊 RESUMO:`);
    console.log(`   Análises totais: ${summary.totalAnalyses}`);
    console.log(`   Análises bem-sucedidas: ${summary.successfulAnalyses}`);
    console.log(`   Análises falharam: ${summary.failedAnalyses}`);
    console.log(`   Duração média: ${summary.avgDurationMs.toFixed(0)}ms`);
    
    console.log(`\n🧠 MEMÓRIA:`);
    console.log(`   Inicial: ${summary.initialMemoryMB.toFixed(2)} MB`);
    console.log(`   Final: ${summary.finalMemoryMB.toFixed(2)} MB`);
    console.log(`   Pico: ${summary.peakMemoryMB.toFixed(2)} MB`);
    console.log(`   Crescimento total: ${summary.totalMemoryGrowthMB.toFixed(2)} MB`);
    console.log(`   Média por análise: ${summary.avgMemoryPerAnalysisMB.toFixed(2)} MB`);
    
    console.log(`\n🎯 RESULTADO:`);
    if (summary.testPassed) {
      console.log('✅ TESTE PASSOU - Memory Management funcionando corretamente');
    } else {
      console.log('❌ TESTE FALHOU - Problemas de memória detectados');
    }
    
    console.log(`\n💡 RECOMENDAÇÕES:`);
    report.recommendations.forEach(rec => console.log(`   ${rec}`));
    
    console.log('\n' + '='.repeat(60));
  }
}

// 🚀 EXECUTAR TESTE
window.runMemoryTest = async function() {
  const tester = new MemoryTestRunner();
  
  try {
    await tester.initialize();
    await tester.runMemoryTest();
    
    const report = tester.generateReport();
    tester.printReport(report);
    
    // Expor relatório globalmente para análise
    window.__MEMORY_TEST_REPORT = report;
    
    return report;
    
  } catch (error) {
    console.error('❌ Falha no teste de memória:', error);
    throw error;
  }
};

console.log('🧪 Teste de Memory Management carregado. Execute: runMemoryTest()');
