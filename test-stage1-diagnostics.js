// 🧪 TESTE STAGE 1: PREPARAÇÃO - runId + logs + modo diagnóstico
// Verificação do sistema de rastreabilidade implementado

console.log('🧪 INICIANDO TESTE DO STAGE 1...');

// 1. Testar ativação do modo diagnóstico
console.log('\n1️⃣ TESTANDO MODO DIAGNÓSTICO...');

// Verificar se o helper existe
if (typeof enableGlobalDiagnosticMode === 'function') {
  console.log('✅ Helper de diagnóstico encontrado');
  
  // Ativar modo diagnóstico
  enableGlobalDiagnosticMode();
  console.log('✅ Modo diagnóstico ativado');
  
  // Verificar se AudioAnalyzer responde
  if (window.audioAnalyzer && window.audioAnalyzer._diagnosticMode) {
    console.log('✅ AudioAnalyzer em modo diagnóstico');
  } else {
    console.log('❌ AudioAnalyzer não respondeu ao modo diagnóstico');
  }
} else {
  console.log('❌ Helper de diagnóstico não encontrado');
}

// 2. Testar geração de runId
console.log('\n2️⃣ TESTANDO GERAÇÃO DE runId...');

if (window.audioAnalyzer && typeof window.audioAnalyzer._generateRunId === 'function') {
  const runId1 = window.audioAnalyzer._generateRunId();
  const runId2 = window.audioAnalyzer._generateRunId();
  
  console.log('✅ RunId 1:', runId1);
  console.log('✅ RunId 2:', runId2);
  
  if (runId1 !== runId2) {
    console.log('✅ RunIds são únicos');
  } else {
    console.log('❌ RunIds não são únicos');
  }
} else {
  console.log('❌ Método _generateRunId não encontrado');
}

// 3. Testar sistema de logs de pipeline
console.log('\n3️⃣ TESTANDO LOGS DE PIPELINE...');

if (window.audioAnalyzer && typeof window.audioAnalyzer._logPipelineStage === 'function') {
  const testRunId = 'TEST_' + Date.now();
  
  // Simular pipeline
  window.audioAnalyzer._logPipelineStage(testRunId, 'PIPELINE_START', { test: true });
  window.audioAnalyzer._logPipelineStage(testRunId, 'INPUT_VALIDATED', { duration: 1200 });
  window.audioAnalyzer._logPipelineStage(testRunId, 'FEATURES_START', { channels: 2 });
  
  console.log('✅ Logs de pipeline registrados para:', testRunId);
  
  // Verificar se os dados estão armazenados
  if (window.audioAnalyzer._activeAnalyses.has(testRunId)) {
    const data = window.audioAnalyzer._activeAnalyses.get(testRunId);
    console.log('✅ Dados armazenados:', data.pipelineLogs.length, 'logs');
  } else {
    console.log('❌ Dados não foram armazenados');
  }
} else {
  console.log('❌ Método _logPipelineStage não encontrado');
}

// 4. Testar bypass de cache
console.log('\n4️⃣ TESTANDO BYPASS DE CACHE...');

if (window.audioAnalyzer && typeof window.audioAnalyzer._shouldBypassCache === 'function') {
  const shouldBypass = window.audioAnalyzer._shouldBypassCache();
  console.log('✅ Bypass de cache:', shouldBypass ? 'ATIVO' : 'INATIVO');
  
  if (window.audioAnalyzer._diagnosticMode && shouldBypass) {
    console.log('✅ Cache bypass funciona corretamente em modo diagnóstico');
  } else if (!window.audioAnalyzer._diagnosticMode && !shouldBypass) {
    console.log('✅ Cache normal funciona corretamente fora do modo diagnóstico');
  } else {
    console.log('⚠️ Comportamento de cache inconsistente');
  }
} else {
  console.log('❌ Método _shouldBypassCache não encontrado');
}

// 5. Testar geração de relatório
console.log('\n5️⃣ TESTANDO GERAÇÃO DE RELATÓRIO...');

if (window.audioAnalyzer && typeof window.audioAnalyzer._generatePipelineReport === 'function') {
  const testRunId = 'TEST_' + Date.now();
  
  // Criar alguns logs
  window.audioAnalyzer._logPipelineStage(testRunId, 'TEST_START', { test: 'início' });
  setTimeout(() => {
    window.audioAnalyzer._logPipelineStage(testRunId, 'TEST_COMPLETE', { test: 'fim' });
    
    // Gerar relatório
    const report = window.audioAnalyzer._generatePipelineReport(testRunId);
    if (report) {
      console.log('✅ Relatório gerado:', report);
    } else {
      console.log('❌ Relatório não foi gerado');
    }
  }, 100);
} else {
  console.log('❌ Método _generatePipelineReport não encontrado');
}

// 6. Verificar integração com análise real
console.log('\n6️⃣ VERIFICANDO INTEGRAÇÃO...');

if (window.audioAnalyzer && typeof window.audioAnalyzer.analyzeAudioBlob === 'function') {
  console.log('✅ Método analyzeAudioBlob disponível');
  console.log('📝 Para teste completo, execute análise de áudio real');
  console.log('   Os logs de pipeline devem aparecer automaticamente');
} else {
  console.log('❌ Método analyzeAudioBlob não encontrado');
}

console.log('\n🎯 STAGE 1 DIAGNOSIS COMPLETO!');
console.log('📊 Sistema de rastreabilidade implementado');
console.log('🔧 Pronto para Stage 2: TT-DR Implementation');
