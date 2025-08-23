/**
 * 🚀 AUTO CARREGADOR DE SCORING V2
 * ===============================
 * 
 * Carrega automaticamente os módulos de scoring quando a página é carregada
 */

(function() {
  let loadingInProgress = false;
  let loadingPromise = null;

  /**
   * 🔄 CARREGAR MÓDULOS AUTOMATICAMENTE
   */
  async function autoLoadScoring() {
    if (loadingInProgress) {
      return loadingPromise;
    }

    console.log('🚀 [AUTO_LOADER] Iniciando carregamento automático dos módulos de scoring...');
    loadingInProgress = true;
    
    loadingPromise = new Promise(async (resolve, reject) => {
      try {
        // Primeiro carregar o carregador
        if (!window.ScoringLoader) {
          await loadScript('/scoring-loader.js');
          
          // Aguardar um pouco para garantir que carregou
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!window.ScoringLoader) {
          throw new Error('ScoringLoader não carregou corretamente');
        }

        // Agora carregar todos os módulos
        const result = await window.ScoringLoader.loadAllModules();
        
        if (result.success) {
          console.log('✅ [AUTO_LOADER] Módulos carregados automaticamente com sucesso!');
          
          // Verificar se tudo está funcionando
          const status = window.ScoringLoader.getStatus();
          if (status.integrationAvailable) {
            console.log('✅ [AUTO_LOADER] Sistema de scoring pronto para uso!');
            
            // Executar teste rápido silencioso
            try {
              const testSuccess = await window.ScoringLoader.quickTest();
              if (testSuccess) {
                console.log('🎉 [AUTO_LOADER] Teste automático passou! Sistema V2 funcionando!');
              } else {
                console.warn('⚠️ [AUTO_LOADER] Teste automático falhou, mas sistema básico está funcionando');
              }
            } catch (testError) {
              console.warn('⚠️ [AUTO_LOADER] Erro no teste automático, mas sistema carregado:', testError.message);
            }
            
            resolve(true);
          } else {
            throw new Error('Integração não disponível após carregamento');
          }
        } else {
          throw new Error(result.error || 'Falha no carregamento dos módulos');
        }
        
      } catch (error) {
        console.error('❌ [AUTO_LOADER] Erro no carregamento automático:', error);
        console.log('🛡️ [AUTO_LOADER] Sistema continuará com scoring V1 legado');
        reject(error);
      } finally {
        loadingInProgress = false;
      }
    });

    return loadingPromise;
  }

  /**
   * 📦 CARREGAR SCRIPT UTILITÁRIO
   */
  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url + '?v=' + Date.now();
      script.type = 'text/javascript';
      
      script.onload = () => {
        console.log(`✅ [AUTO_LOADER] Script carregado: ${url}`);
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error(`Erro ao carregar ${url}`));
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * 🎯 GARANTIR CARREGAMENTO ANTES DE USAR
   */
  async function ensureScoring() {
    if (window.ScoringIntegration) {
      return true;
    }

    try {
      await autoLoadScoring();
      return true;
    } catch (error) {
      console.warn('⚠️ [AUTO_LOADER] Carregamento falhou, usando fallback');
      return false;
    }
  }

  // Expor função global para garantir carregamento
  window.ensureScoring = ensureScoring;

  // Tentar carregar automaticamente após a página carregar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(autoLoadScoring, 500); // Pequeno delay para garantir que tudo está pronto
    });
  } else {
    // Página já carregada
    setTimeout(autoLoadScoring, 100);
  }

  console.log('🎯 [AUTO_LOADER] Auto-carregador configurado');
})();
