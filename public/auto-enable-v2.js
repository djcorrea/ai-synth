/**
 * 🚀 AUTO ATIVAÇÃO DO SCORING V2
 * ==============================
 * 
 * Garante que o Scoring V2 seja ativado automaticamente
 */

(function() {
  console.log('🚀 [AUTO_V2] Inicializando ativação automática do Scoring V2...');
  
  // Função principal de ativação
  function autoEnableV2() {
    try {
      if (window.ScoringV2Complete) {
        console.log('✅ [AUTO_V2] ScoringV2Complete detectado');
        
        // Garantir que V2 seja padrão
        window.SCORING_V2_TEST = undefined; // Remove qualquer flag de teste
        window.SCORING_V2_DISABLED = undefined; // Remove qualquer flag de desabilitação
        
        // Verificar status
        const status = window.ScoringV2Complete.getStatus();
        console.log('📊 [AUTO_V2] Status:', status);
        
        if (status.currentMode === 'v2') {
          console.log('✅ [AUTO_V2] V2 já está ativo por padrão!');
        } else {
          console.log('� [AUTO_V2] Forçando ativação do V2...');
          // Forçar V2 usando a função de ativação
          if (window.ScoringV2Complete.enableV2Default) {
            window.ScoringV2Complete.enableV2Default();
          }
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ [AUTO_V2] Erro na ativação:', error);
      return false;
    }
  }
  
  // Disponibilizar globalmente para testes
  window.autoEnableV2 = autoEnableV2;
  
  // Tentar ativar imediatamente
  if (!autoEnableV2()) {
    // Se não funcionou, aguardar carregamento
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      if (autoEnableV2()) {
        clearInterval(checkInterval);
        console.log(`✅ [AUTO_V2] V2 ativado após ${attempts} tentativas`);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.warn('⚠️ [AUTO_V2] Timeout: ScoringV2Complete não carregou');
      }
    }, 200);
  }
  
  // Backup com DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(autoEnableV2, 100);
  });
  
  console.log('🎯 [AUTO_V2] Auto-ativador V2 configurado');
})();
