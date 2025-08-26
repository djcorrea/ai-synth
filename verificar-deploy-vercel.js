// 🌐 VERIFICAÇÃO COMPLETA DO DEPLOY VERCEL
// Script para verificar se todas as correções foram aplicadas na produção

console.log('🌐 [VERCEL-CHECK] Iniciando verificação do deploy...');

/**
 * Verificar se arquivos críticos existem na produção
 */
async function verificarArquivosEssenciais() {
  console.log('📁 [VERCEL-CHECK] Verificando arquivos essenciais...');
  
  const arquivosEssenciais = [
    'sistema-completo-teste.html',
    'investigacao-critica.html',
    'diagnostico-score-critico.html',
    'public/diagnostico-score-problema.js',
    'investigacao-critica-score.js',
    'lib/audio/features/scoring.js',
    'public/refs/embedded-refs-new.js',
    'public/audio-analyzer.js'
  ];
  
  const resultados = {};
  
  for (const arquivo of arquivosEssenciais) {
    try {
      const response = await fetch(arquivo + '?t=' + Date.now());
      resultados[arquivo] = {
        exists: response.ok,
        status: response.status,
        size: response.headers.get('content-length') || 'unknown'
      };
      
      console.log(`${response.ok ? '✅' : '❌'} ${arquivo} - Status: ${response.status}`);
    } catch (error) {
      resultados[arquivo] = {
        exists: false,
        error: error.message
      };
      console.log(`❌ ${arquivo} - Erro: ${error.message}`);
    }
  }
  
  return resultados;
}

/**
 * Testar carregamento dos módulos principais
 */
async function testarCarregamentoModulos() {
  console.log('🔧 [VERCEL-CHECK] Testando carregamento de módulos...');
  
  const testes = {
    scoringModule: false,
    audioAnalyzer: false,
    refData: false,
    sistemaCompleto: false
  };
  
  // Testar scoring como ES6 module
  try {
    const { computeMixScore } = await import('./lib/audio/features/scoring.js');
    testes.scoringModule = typeof computeMixScore === 'function';
    console.log(`${testes.scoringModule ? '✅' : '❌'} scoring.js carregado como ES6 module`);
  } catch (error) {
    console.log(`❌ scoring.js falhou: ${error.message}`);
  }
  
  // Testar se PROD_AI_REF_DATA vai ser carregado
  try {
    const response = await fetch('public/refs/embedded-refs-new.js');
    const content = await response.text();
    testes.refData = content.includes('PROD_AI_REF_DATA') && content.includes('legacy_compatibility');
    console.log(`${testes.refData ? '✅' : '❌'} embedded-refs-new.js tem estrutura correta`);
  } catch (error) {
    console.log(`❌ embedded-refs-new.js falhou: ${error.message}`);
  }
  
  // Testar se AudioAnalyzer existe
  try {
    const response = await fetch('public/audio-analyzer.js');
    const content = await response.text();
    testes.audioAnalyzer = content.includes('class AudioAnalyzer') && content.includes('calculateSpectralBalance');
    console.log(`${testes.audioAnalyzer ? '✅' : '❌'} audio-analyzer.js tem estrutura correta`);
  } catch (error) {
    console.log(`❌ audio-analyzer.js falhou: ${error.message}`);
  }
  
  // Testar sistema completo
  try {
    const response = await fetch('sistema-completo-teste.html');
    const content = await response.text();
    testes.sistemaCompleto = content.includes('ES6 module') && content.includes('PROD_AI_REF_DATA_ACTIVE');
    console.log(`${testes.sistemaCompleto ? '✅' : '❌'} sistema-completo-teste.html tem correções aplicadas`);
  } catch (error) {
    console.log(`❌ sistema-completo-teste.html falhou: ${error.message}`);
  }
  
  return testes;
}

/**
 * Verificar variáveis globais essenciais
 */
function verificarVariaveisGlobais() {
  console.log('🌐 [VERCEL-CHECK] Verificando variáveis globais...');
  
  const variaveisEssenciais = {
    USE_TT_DR: window.USE_TT_DR,
    SCORING_V2: window.SCORING_V2,
    AUDIT_MODE: window.AUDIT_MODE,
    PROD_AI_REF_GENRE: window.PROD_AI_REF_GENRE,
    PROD_AI_REF_DATA_ACTIVE: window.PROD_AI_REF_DATA_ACTIVE
  };
  
  Object.entries(variaveisEssenciais).forEach(([nome, valor]) => {
    const definida = valor !== undefined;
    console.log(`${definida ? '✅' : '❌'} ${nome}: ${valor}`);
  });
  
  return variaveisEssenciais;
}

/**
 * Executar verificação completa
 */
async function verificacaoCompleta() {
  console.log('🚀 [VERCEL-CHECK] INICIANDO VERIFICAÇÃO COMPLETA DO DEPLOY');
  console.log('='.repeat(60));
  
  const resultado = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    arquivos: {},
    modulos: {},
    variaveis: {},
    conclusao: ''
  };
  
  try {
    // 1. Verificar arquivos
    resultado.arquivos = await verificarArquivosEssenciais();
    
    // 2. Testar módulos
    resultado.modulos = await testarCarregamentoModulos();
    
    // 3. Verificar variáveis globais
    resultado.variaveis = verificarVariaveisGlobais();
    
    // 4. Análise final
    const arquivosOk = Object.values(resultado.arquivos).every(a => a.exists);
    const modulosOk = Object.values(resultado.modulos).every(m => m);
    const variaveisOk = resultado.variaveis.USE_TT_DR && resultado.variaveis.SCORING_V2;
    
    if (arquivosOk && modulosOk && variaveisOk) {
      resultado.conclusao = '✅ DEPLOY VERCEL COMPLETAMENTE FUNCIONAL!';
      console.log('\n🎉 ' + resultado.conclusao);
      console.log('🎯 Todas as correções foram aplicadas com sucesso na produção');
      console.log('🎵 Sistema de análise de mixagem operacional 100%');
    } else {
      resultado.conclusao = '⚠️ DEPLOY PARCIALMENTE FUNCIONAL - alguns problemas encontrados';
      console.log('\n⚠️ ' + resultado.conclusao);
      
      if (!arquivosOk) console.log('❌ Alguns arquivos não foram encontrados');
      if (!modulosOk) console.log('❌ Alguns módulos têm problemas de carregamento');
      if (!variaveisOk) console.log('❌ Algumas variáveis globais não estão definidas');
    }
    
    return resultado;
    
  } catch (error) {
    resultado.conclusao = '❌ ERRO NA VERIFICAÇÃO: ' + error.message;
    console.error('\n💥 ' + resultado.conclusao);
    return resultado;
  }
}

// Exportar para uso global
window.verificarDeployVercel = verificacaoCompleta;
window.verificarArquivosEssenciais = verificarArquivosEssenciais;
window.testarCarregamentoModulos = testarCarregamentoModulos;
window.verificarVariaveisGlobais = verificarVariaveisGlobais;

console.log('🔧 [VERCEL-CHECK] Funções de verificação carregadas:');
console.log('   - window.verificarDeployVercel() // Verificação completa');
console.log('   - window.verificarArquivosEssenciais() // Só arquivos');
console.log('   - window.testarCarregamentoModulos() // Só módulos');
console.log('   - window.verificarVariaveisGlobais() // Só variáveis');

// Auto-executar se solicitado
if (window.location.search.includes('auto=true')) {
  console.log('🚀 [VERCEL-CHECK] Auto-execução ativada...');
  setTimeout(verificacaoCompleta, 2000);
}
