/**
 * 🚀 CARREGADOR SEQUENCIAL DE SCORING MODULES
 * ==========================================
 * 
 * Carrega os módulos de scoring em ordem correta sem ES6 imports
 */

window.ScoringLoader = (function() {
  let loadingState = {
    v1Loaded: false,
    v2Loaded: false,
    integrationLoaded: false,
    error: null
  };

  /**
   * 📦 CARREGAR SCRIPT DINAMICAMENTE
   */
  function loadScript(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url + '?v=' + Date.now(); // Cache bust
      script.type = 'text/javascript';
      
      // Timeout handler
      const timeoutId = setTimeout(() => {
        script.remove();
        reject(new Error(`Timeout ao carregar ${url}`));
      }, timeout);
      
      script.onload = () => {
        clearTimeout(timeoutId);
        console.log(`✅ Script carregado: ${url}`);
        resolve();
      };
      
      script.onerror = () => {
        clearTimeout(timeoutId);
        script.remove();
        reject(new Error(`Erro ao carregar ${url}`));
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * 🔄 CARREGAR TODOS OS MÓDULOS
   */
  async function loadAllModules() {
    try {
      console.log('🚀 [SCORING_LOADER] Iniciando carregamento dos módulos...');
      
      // 1. Carregar Scoring V1 primeiro (base)
      console.log('📦 [1/3] Carregando Scoring V1...');
      await loadScript('/lib/audio/features/scoring.js');
      
      if (window.ScoringV1) {
        loadingState.v1Loaded = true;
        console.log('✅ [1/3] Scoring V1 carregado com sucesso');
      } else {
        throw new Error('Scoring V1 não disponível após carregamento');
      }
      
      // 2. Carregar Scoring V2
      console.log('📦 [2/3] Carregando Scoring V2...');
      await loadScript('/lib/audio/features/scoring-v2-browser.js');
      
      if (window.ScoringV2) {
        loadingState.v2Loaded = true;
        console.log('✅ [2/3] Scoring V2 carregado com sucesso');
      } else {
        throw new Error('Scoring V2 não disponível após carregamento');
      }
      
      // 3. Carregar Integration Wrapper
      console.log('📦 [3/3] Carregando Integration Wrapper...');
      await loadScript('/lib/audio/features/scoring-integration-global.js');
      
      if (window.ScoringIntegration) {
        loadingState.integrationLoaded = true;
        console.log('✅ [3/3] Integration Wrapper carregado com sucesso');
      } else {
        throw new Error('Integration Wrapper não disponível após carregamento');
      }
      
      console.log('🎊 [SCORING_LOADER] Todos os módulos carregados com sucesso!');
      
      // Setup global para compatibilidade
      if (!window.computeMixScore) {
        window.computeMixScore = window.ScoringIntegration.computeMixScore;
        console.log('🔗 [SCORING_LOADER] Função global computeMixScore configurada');
      }
      
      return {
        success: true,
        modules: {
          v1: window.ScoringV1,
          v2: window.ScoringV2,
          integration: window.ScoringIntegration
        },
        state: loadingState
      };
      
    } catch (error) {
      console.error('❌ [SCORING_LOADER] Erro no carregamento:', error);
      loadingState.error = error.message;
      
      return {
        success: false,
        error: error.message,
        state: loadingState
      };
    }
  }

  /**
   * 🔍 VERIFICAR STATUS
   */
  function getStatus() {
    return {
      ...loadingState,
      v1Available: !!window.ScoringV1,
      v2Available: !!window.ScoringV2,
      integrationAvailable: !!window.ScoringIntegration,
      globalFunctionAvailable: !!window.computeMixScore
    };
  }

  /**
   * 🧪 TESTE RÁPIDO
   */
  async function quickTest() {
    console.log('🧪 [SCORING_LOADER] Executando teste rápido...');
    
    const status = getStatus();
    console.log('📊 Status atual:', status);
    
    if (!status.integrationAvailable) {
      console.error('❌ Integration não disponível para teste');
      return false;
    }
    
    try {
      // Dados de teste mínimos
      const testData = {
        lufsIntegrated: -12.0,
        truePeakDbtp: -1.0,
        dynamicRange: 6.0,
        bandEnergies: {
          bass: { rms_db: -8.0 },
          mid: { rms_db: -10.0 },
          treble: { rms_db: -15.0 }
        }
      };
      
      const testReference = { genre: 'funk_mandela' };
      
      // Teste V1
      window.SCORING_V2_TEST = false;
      const v1Result = await window.ScoringIntegration.computeMixScore(testData, testReference);
      console.log(`📊 Teste V1: ${v1Result.scorePct}% (${v1Result.method})`);
      
      // Teste V2
      window.SCORING_V2_TEST = true;
      const v2Result = await window.ScoringIntegration.computeMixScore(testData, testReference);
      console.log(`📊 Teste V2: ${v2Result.scorePct}% (${v2Result.method})`);
      
      const improvement = v2Result.scorePct - v1Result.scorePct;
      console.log(`📈 Melhoria: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)} pontos`);
      
      if (v2Result.method.includes('v2')) {
        console.log('✅ [SCORING_LOADER] Teste bem-sucedido! V2 está funcionando');
        return true;
      } else {
        console.log('⚠️ [SCORING_LOADER] V2 não está sendo usado no teste');
        return false;
      }
      
    } catch (testError) {
      console.error('❌ [SCORING_LOADER] Erro no teste:', testError);
      return false;
    }
  }

  // API pública
  return {
    loadAllModules: loadAllModules,
    getStatus: getStatus,
    quickTest: quickTest
  };
})();

// Setup automático ao carregar
console.log('🎯 [SCORING_LOADER] Carregador disponível! Use window.ScoringLoader.loadAllModules()');
