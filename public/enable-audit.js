// 🔍 ATIVADOR DE AUDITORIA - FASES 1, 2 & 3
// Este arquivo ativa os logs de auditoria para detectar inconsistências

// Habilitar logs detalhados de auditoria e correções
window.DEBUG_ANALYZER = true;
window.ENABLE_AUDIT_LOGS = true;
window.ENABLE_PHASE2_CORRECTIONS = true;
window.ENABLE_PHASE3_LOGIC_ALIGNMENT = true; // NOVO: Fase 3

console.log('🔍 AUDITORIA FASES 1, 2 & 3 ATIVADAS - Logs e correções habilitadas');

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

// Função helper para consultar correções da Fase 2
window.getPhase2Corrections = function() {
  const corrections = window.__PHASE2_CORRECTIONS__ || [];
  
  console.group('🔧 CORREÇÕES FASE 2 APLICADAS');
  console.log(`Total de análises com correções: ${corrections.length}`);
  
  const allCorrections = corrections.flatMap(r => r.corrections);
  const correctionTypes = {};
  
  allCorrections.forEach(correction => {
    correctionTypes[correction.type] = (correctionTypes[correction.type] || 0) + 1;
  });
  
  if (allCorrections.length > 0) {
    console.group('📈 TIPOS DE CORREÇÕES');
    Object.entries(correctionTypes).forEach(([type, count]) => {
      console.log(`${type}: ${count} ocorrências`);
    });
    console.groupEnd();
    
    console.group('📋 DETALHES DAS CORREÇÕES');
    allCorrections.forEach(correction => {
      console.log(`✅ ${correction.type}: ${correction.description}`);
    });
    console.groupEnd();
  } else {
    console.log('ℹ️ Nenhuma correção aplicada ainda');
  }
  
  console.groupEnd();
  
  return {
    totalAnalyses: corrections.length,
    totalCorrections: allCorrections.length,
    correctionTypes: correctionTypes,
    corrections: corrections
  };
};

// Função para limpar cache de auditoria
window.clearAuditResults = function() {
  window.__AUDIT_RESULTS__ = [];
  window.__PHASE2_CORRECTIONS__ = [];
  window.__PHASE3_CORRECTIONS__ = []; // NOVO: Fase 3
  console.log('🗑️ Cache de auditoria e correções (Fases 1-3) limpo');
};

// 🎯 NOVO: Função para verificar correções da Fase 3
window.getPhase3Corrections = function() {
  const corrections = window.__PHASE3_CORRECTIONS__ || [];
  
  console.group('🎯 CORREÇÕES FASE 3 - ALINHAMENTO LÓGICO');
  console.log(`Total de análises com correções lógicas: ${corrections.length}`);
  
  const allCorrections = corrections.flatMap(r => r.corrections);
  const correctionTypes = {};
  
  allCorrections.forEach(correction => {
    correctionTypes[correction.type] = (correctionTypes[correction.type] || 0) + 1;
  });
  
  if (allCorrections.length > 0) {
    console.group('� TIPOS DE CORREÇÕES LÓGICAS');
    Object.entries(correctionTypes).forEach(([type, count]) => {
      console.log(`${type}: ${count} ocorrências`);
    });
    console.groupEnd();
    
    console.group('�📋 DETALHES DAS CORREÇÕES LÓGICAS');
    allCorrections.forEach(correction => {
      console.log(`🎯 ${correction.type}: ${correction.description}`);
      if (correction.type === 'PHASE3_ROLLBACK') {
        console.warn(`    ⚠️ Motivo do rollback: ${correction.reason}`);
      }
    });
    console.groupEnd();
  } else {
    console.log('ℹ️ Nenhuma correção lógica aplicada ainda');
  }
  
  console.groupEnd();
  
  return {
    totalAnalyses: corrections.length,
    totalCorrections: allCorrections.length,
    correctionTypes: correctionTypes,
    corrections: corrections
  };
};

// 🔍 NOVO: Auditoria completa (todas as fases)
window.getCompleteAudit = function() {
  console.group('🔍 AUDITORIA COMPLETA - Todas as Fases');
  
  console.log('📊 FASE 1 - Observação:');
  const phase1 = window.getAuditResults();
  
  console.log('\n🔧 FASE 2 - Correções Baixo Risco:');
  const phase2 = window.getPhase2Corrections();
  
  console.log('\n🎯 FASE 3 - Alinhamento Lógico:');
  const phase3 = window.getPhase3Corrections();
  
  console.log('\n📈 RESUMO GERAL:');
  console.log(`Análises auditadas: ${phase1.totalAnalyses}`);
  console.log(`Problemas críticos: ${phase1.criticalIssues}`);
  console.log(`Correções Fase 2: ${phase2.totalCorrections}`);
  console.log(`Correções Fase 3: ${phase3.totalCorrections}`);
  
  console.groupEnd();
  
  return { phase1, phase2, phase3 };
};

console.log('📋 Comandos disponíveis:');
console.log('- window.getAuditResults() - Ver resultados da auditoria (Fase 1)');
console.log('- window.getPhase2Corrections() - Ver correções aplicadas na Fase 2');
console.log('- window.getPhase3Corrections() - Ver correções aplicadas na Fase 3 (NOVO)');
console.log('- window.getCompleteAudit() - Ver auditoria completa de todas as fases (NOVO)');
console.log('- window.clearAuditResults() - Limpar cache de auditoria e correções');
