// 🔬 DIAGNOSTIC MODE HELPER
// Utilitários para controlar e monitorar o modo diagnóstico do AudioAnalyzer

/**
 * 🔬 Ativar modo diagnóstico globalmente
 * @param {boolean} enabled - Se deve ativar o modo diagnóstico
 */
function enableGlobalDiagnosticMode(enabled = true) {
  if (typeof window !== 'undefined' && window.audioAnalyzer) {
    window.audioAnalyzer.enableDiagnosticMode(enabled);
    
    // Flag global para outros sistemas
    window.AUDIO_DIAGNOSTIC_MODE = enabled;
    
    console.log(`🔬 MODO DIAGNÓSTICO GLOBAL: ${enabled ? 'ATIVADO' : 'DESATIVADO'}`);
    
    if (enabled) {
      console.log('📋 Recursos habilitados:');
      console.log('  • Logs detalhados por etapa do pipeline');
      console.log('  • Cache bypass (força recomputação)');
      console.log('  • Dados completos nos logs');
      console.log('  • Relatórios de timing detalhados');
    }
  } else {
    console.warn('⚠️ AudioAnalyzer não encontrado - modo diagnóstico não pode ser ativado');
  }
}

/**
 * 📊 Obter relatório de pipeline da última análise
 * @param {string} runId - ID da análise (opcional)
 */
function getPipelineReport(runId = null) {
  if (typeof window !== 'undefined' && window.audioAnalyzer) {
    const analyzer = window.audioAnalyzer;
    
    if (!runId) {
      // Pegar o runId mais recente
      const allLogs = Array.from(analyzer._pipelineLogs.keys());
      runId = allLogs[allLogs.length - 1];
    }
    
    if (runId) {
      return analyzer._generatePipelineReport(runId);
    } else {
      console.warn('⚠️ Nenhuma análise encontrada para gerar relatório');
      return null;
    }
  }
  
  console.warn('⚠️ AudioAnalyzer não encontrado');
  return null;
}

/**
 * 🗑️ Limpar logs de pipeline antigos
 * @param {number} keepLast - Quantas análises manter (padrão: 5)
 */
function clearOldPipelineLogs(keepLast = 5) {
  if (typeof window !== 'undefined' && window.audioAnalyzer) {
    const analyzer = window.audioAnalyzer;
    const allRunIds = Array.from(analyzer._pipelineLogs.keys());
    
    if (allRunIds.length > keepLast) {
      const toRemove = allRunIds.slice(0, -keepLast);
      
      toRemove.forEach(runId => {
        analyzer._pipelineLogs.delete(runId);
        analyzer._stageTimings.delete(runId);
      });
      
      console.log(`🗑️ Removidos logs de ${toRemove.length} análises antigas`);
      console.log(`📊 Mantidos logs de ${keepLast} análises mais recentes`);
    } else {
      console.log(`📊 Apenas ${allRunIds.length} análise(s) em cache - nada para remover`);
    }
  }
}

/**
 * 📈 Estatísticas de desempenho das análises
 */
function getPerformanceStats() {
  if (typeof window !== 'undefined' && window.audioAnalyzer) {
    const analyzer = window.audioAnalyzer;
    const allRunIds = Array.from(analyzer._pipelineLogs.keys());
    
    if (allRunIds.length === 0) {
      console.log('📊 Nenhuma análise registrada ainda');
      return null;
    }
    
    const stats = {
      totalAnalyses: allRunIds.length,
      reports: []
    };
    
    allRunIds.forEach(runId => {
      const report = analyzer._generatePipelineReport(runId);
      if (report) {
        stats.reports.push({
          runId,
          totalTime: report.pipeline.totalTime,
          stages: report.pipeline.stages,
          diagnosticMode: report.diagnosticMode
        });
      }
    });
    
    // Calcular médias
    const times = stats.reports.map(r => parseInt(r.totalTime.replace('ms', '')));
    stats.averageTime = times.length > 0 ? 
      `${Math.round(times.reduce((a, b) => a + b, 0) / times.length)}ms` : 'N/A';
    
    console.log('📈 ESTATÍSTICAS DE DESEMPENHO:', stats);
    return stats;
  }
  
  return null;
}

/**
 * 🎯 Forçar análise com diagnóstico para teste
 * @param {File} audioFile - Arquivo de áudio para testar
 */
async function runDiagnosticTest(audioFile) {
  if (!audioFile) {
    console.error('❌ Arquivo de áudio necessário para teste diagnóstico');
    return;
  }
  
  if (typeof window !== 'undefined' && window.audioAnalyzer) {
    console.log('🔬 INICIANDO TESTE DIAGNÓSTICO');
    
    // Ativar modo diagnóstico
    const wasEnabled = window.audioAnalyzer._diagnosticMode;
    enableGlobalDiagnosticMode(true);
    
    try {
      // Executar análise
      const result = await window.audioAnalyzer.analyzeFile(audioFile);
      
      // Gerar relatório
      const report = getPipelineReport();
      
      console.log('✅ TESTE DIAGNÓSTICO CONCLUÍDO');
      console.log('📊 Resultado:', result);
      console.log('📋 Relatório:', report);
      
      return { result, report };
      
    } catch (error) {
      console.error('❌ ERRO NO TESTE DIAGNÓSTICO:', error);
      throw error;
    } finally {
      // Restaurar modo anterior
      enableGlobalDiagnosticMode(wasEnabled);
    }
  }
  
  throw new Error('AudioAnalyzer não encontrado');
}

// 🌐 Expor funções globalmente para debug no console
if (typeof window !== 'undefined') {
  window.DiagnosticMode = {
    enable: enableGlobalDiagnosticMode,
    getReport: getPipelineReport,
    clearLogs: clearOldPipelineLogs,
    getStats: getPerformanceStats,
    runTest: runDiagnosticTest
  };
  
  console.log('🔬 Diagnostic Mode Helper carregado');
  console.log('💡 Use window.DiagnosticMode.enable(true) para ativar');
  console.log('💡 Use window.DiagnosticMode.getReport() para ver relatórios');
}

export {
  enableGlobalDiagnosticMode,
  getPipelineReport,
  clearOldPipelineLogs,
  getPerformanceStats,
  runDiagnosticTest
};
