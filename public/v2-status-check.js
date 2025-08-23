/**
 * 🔍 VERIFICADOR V2 PRINCIPAL
 * ===========================
 * 
 * Script para verificar se o V2 está funcionando no site principal
 */

console.log('🔍 [V2_CHECK] Iniciando verificação do V2 no site principal...');

function checkV2Status() {
  // Verificar se V2 está carregado
  if (window.ScoringV2Complete) {
    console.log('✅ [V2_CHECK] ScoringV2Complete carregado');
    
    // Verificar status
    const status = window.ScoringV2Complete.getStatus();
    console.log('📊 [V2_CHECK] Status:', status);
    
    if (status.currentMode === 'v2') {
      console.log('🎉 [V2_CHECK] V2 ATIVO NO SITE PRINCIPAL!');
      return true;
    } else {
      console.warn('⚠️ [V2_CHECK] V2 não está ativo');
      return false;
    }
  } else {
    console.error('❌ [V2_CHECK] ScoringV2Complete não carregado');
    return false;
  }
}

// Verificar auto-ativador
if (window.autoEnableV2) {
  console.log('✅ [V2_CHECK] Auto-ativador disponível');
} else {
  console.warn('⚠️ [V2_CHECK] Auto-ativador não encontrado');
}

// Verificar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    console.log('🚀 [V2_CHECK] Verificando após carregamento...');
    const success = checkV2Status();
    
    if (success) {
      console.log('🎯 [V2_CHECK] SITE PRINCIPAL PRONTO COM V2!');
    } else {
      console.error('💥 [V2_CHECK] PROBLEMA NO SITE PRINCIPAL!');
    }
  }, 2000);
});

// Disponibilizar função globalmente
window.checkV2StatusMain = checkV2Status;
