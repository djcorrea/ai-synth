// 🎯 VALIDAÇÃO DE DEPLOY - CORREÇÃO SCORE
// Este arquivo valida se a correção foi deployada corretamente na Vercel

console.log('🔍 [DEPLOY-VALIDATION] Iniciando validação do deploy da correção...');

// Verificar se estamos em produção (Vercel)
const isProduction = window.location.hostname !== 'localhost' && 
                    window.location.hostname !== '127.0.0.1' &&
                    !window.location.hostname.includes('ngrok');

console.log('🌐 [DEPLOY-VALIDATION] Ambiente:', isProduction ? 'PRODUÇÃO (Vercel)' : 'DESENVOLVIMENTO');

// Validar se os arquivos foram carregados
const validarArquivos = () => {
  console.log('📁 [DEPLOY-VALIDATION] Verificando arquivos...');
  
  // Verificar se o script de correção foi carregado
  if (typeof window.aplicarCorrecaoOrdemExecucao === 'function') {
    console.log('✅ [DEPLOY-VALIDATION] solucao-definitiva-score.js carregado');
    return true;
  } else {
    console.error('❌ [DEPLOY-VALIDATION] solucao-definitiva-score.js NÃO carregado');
    return false;
  }
};

// Validar aplicação da correção
const validarCorrecao = () => {
  console.log('🎯 [DEPLOY-VALIDATION] Verificando aplicação da correção...');
  
  if (window.__SCORE_ORDER_FIX_APPLIED) {
    console.log('✅ [DEPLOY-VALIDATION] Correção aplicada com sucesso');
    console.log('📊 [DEPLOY-VALIDATION] Versão:', window.__SCORE_ORDER_FIX_VERSION);
    console.log('🕐 [DEPLOY-VALIDATION] Timestamp:', window.__SCORE_ORDER_FIX_TIMESTAMP);
    return true;
  } else {
    console.warn('⚠️ [DEPLOY-VALIDATION] Correção ainda não aplicada (aguardar inicialização)');
    return false;
  }
};

// Executar validação
setTimeout(() => {
  const arquivosOk = validarArquivos();
  
  if (arquivosOk) {
    // Aguardar mais um pouco para a correção ser aplicada
    setTimeout(() => {
      const correcaoOk = validarCorrecao();
      
      if (correcaoOk) {
        console.log('🎉 [DEPLOY-VALIDATION] DEPLOY VALIDADO COM SUCESSO!');
        
        if (isProduction) {
          console.log('🚀 [DEPLOY-VALIDATION] Correção ativa na PRODUÇÃO (Vercel)');
        }
        
        // Salvar info de validação
        window.__DEPLOY_VALIDATION = {
          success: true,
          timestamp: new Date().toISOString(),
          environment: isProduction ? 'production' : 'development',
          scoreFixVersion: window.__SCORE_ORDER_FIX_VERSION
        };
        
      } else {
        console.error('💥 [DEPLOY-VALIDATION] FALHA na aplicação da correção');
      }
    }, 3000);
  } else {
    console.error('💥 [DEPLOY-VALIDATION] FALHA no carregamento dos arquivos');
  }
}, 2000);

// Disponibilizar função de validação manual
window.validarDeployScore = () => {
  console.log('🔧 [MANUAL-VALIDATION] Executando validação manual...');
  
  const arquivos = validarArquivos();
  const correcao = validarCorrecao();
  
  const resultado = {
    arquivosCarregados: arquivos,
    correcaoAplicada: correcao,
    ambiente: isProduction ? 'production' : 'development',
    status: arquivos && correcao ? 'SUCCESS' : 'FAILED',
    timestamp: new Date().toISOString()
  };
  
  console.log('📋 [MANUAL-VALIDATION] Resultado:', resultado);
  return resultado;
};

console.log('🔧 [DEPLOY-VALIDATION] Use window.validarDeployScore() para validação manual');
