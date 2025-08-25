/**
 * 🚨 SCRIPT DE EMERGÊNCIA: Forçar ativação das implementações
 * 
 * Se o score não mudou NADA, as implementações podem não estar ativas.
 * Este script força a ativação de todas as flags.
 */

console.log('🚨 ATIVAÇÃO FORÇADA DE TODAS AS IMPLEMENTAÇÕES');
console.log('═══════════════════════════════════════════════════════');

// Definir todas as flags globais
if (typeof window !== 'undefined') {
  console.log('🏆 Ativando TT-DR oficial...');
  window.SCORING_V2 = true;
  window.USE_TT_DR = true;
  
  console.log('⚖️ Ativando Equal Weight V3...');
  window.USE_EQUAL_WEIGHT_V3 = true;
  
  console.log('🛡️ Ativando Safety Gates...');
  window.AUDIT_MODE = true;
  
  console.log('🔧 Ativando modo de debug...');
  window.DEBUG_SCORING = true;
  
  console.log('\n✅ TODAS AS FLAGS ATIVADAS:');
  console.log(`   SCORING_V2: ${window.SCORING_V2}`);
  console.log(`   USE_TT_DR: ${window.USE_TT_DR}`);
  console.log(`   USE_EQUAL_WEIGHT_V3: ${window.USE_EQUAL_WEIGHT_V3}`);
  console.log(`   AUDIT_MODE: ${window.AUDIT_MODE}`);
  console.log(`   DEBUG_SCORING: ${window.DEBUG_SCORING}`);
  
  console.log('\n🎯 AGORA TESTE NOVAMENTE UM ÁUDIO!');
  console.log('O score deve mudar com as implementações ativas.');
  
} else {
  console.log('❌ Este script deve ser executado no browser');
  console.log('Copie e cole no console do navegador:');
  console.log('');
  console.log('window.SCORING_V2 = true;');
  console.log('window.USE_TT_DR = true;');
  console.log('window.USE_EQUAL_WEIGHT_V3 = true;');
  console.log('window.AUDIT_MODE = true;');
  console.log('window.DEBUG_SCORING = true;');
  console.log('console.log("✅ FLAGS ATIVADAS - Teste um áudio agora!");');
}

// Função para verificar se as implementações estão funcionando
function verificarImplementacoes() {
  if (typeof window === 'undefined') {
    console.log('Execute no browser para verificação completa');
    return;
  }
  
  console.log('\n🔍 VERIFICAÇÃO DAS IMPLEMENTAÇÕES:');
  console.log('─────────────────────────────────────');
  
  // Verificar se TT-DR está disponível
  try {
    if (window.computeTTDynamicRange) {
      console.log('✅ TT-DR function disponível');
    } else {
      console.log('❌ TT-DR function não encontrada');
    }
  } catch (e) {
    console.log('⚠️ Erro ao verificar TT-DR:', e.message);
  }
  
  // Verificar se Equal Weight V3 está disponível
  try {
    if (window._computeEqualWeightV3) {
      console.log('✅ Equal Weight V3 function disponível');
    } else {
      console.log('❌ Equal Weight V3 function não encontrada');
    }
  } catch (e) {
    console.log('⚠️ Erro ao verificar Equal Weight V3:', e.message);
  }
  
  // Verificar se Safety Gates está disponível
  try {
    if (window.SafetyGates) {
      console.log('✅ Safety Gates class disponível');
    } else {
      console.log('❌ Safety Gates class não encontrada');
    }
  } catch (e) {
    console.log('⚠️ Erro ao verificar Safety Gates:', e.message);
  }
}

verificarImplementacoes();
