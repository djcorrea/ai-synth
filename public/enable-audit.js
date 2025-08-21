// 🔍 ATIVADOR DE AUDITORIA - FASE 1
// Este arquivo ativa os logs de auditoria para detectar inconsistências

// Habilitar logs detalhados de auditoria
window.DEBUG_ANALYZER = true;
window.ENABLE_AUDIT_LOGS = true;

console.log('🔍 AUDITORIA ATIVADA - Logs de consistência habilitados');

// Função helper para consultar resultados da auditoria
window.getAuditResults = function() {
  const results = window.__AUDIT_RESULTS__ || [];
  
  console.group('📊 RESULTADOS DA AUDITORIA');
  console.log(`Total de análises auditadas: ${results.length}`);
  
  const allIssues = results.flatMap(r => r.issues);
  const allWarnings = results.flatMap(r => r.warnings);
  
  if (allIssues.length > 0) {
    console.group('🚨 PROBLEMAS CRÍTICOS ENCONTRADOS');
    allIssues.forEach(issue => {
      console.error(`${issue.type}: ${issue.description}`, issue.data);
    });
    console.groupEnd();
  }
  
  if (allWarnings.length > 0) {
    console.group('⚠️ AVISOS ENCONTRADOS');
    allWarnings.forEach(warning => {
      console.warn(`${warning.type}: ${warning.description}`, warning.data);
    });
    console.groupEnd();
  }
  
  if (allIssues.length === 0 && allWarnings.length === 0) {
    console.log('✅ Nenhum problema detectado nas análises');
  }
  
  console.groupEnd();
  
  return {
    totalAnalyses: results.length,
    criticalIssues: allIssues.length,
    warnings: allWarnings.length,
    results: results
  };
};

// Função para limpar cache de auditoria
window.clearAuditResults = function() {
  window.__AUDIT_RESULTS__ = [];
  console.log('🗑️ Cache de auditoria limpo');
};

console.log('📋 Comandos disponíveis:');
console.log('- window.getAuditResults() - Ver resultados da auditoria');
console.log('- window.clearAuditResults() - Limpar cache de auditoria');
