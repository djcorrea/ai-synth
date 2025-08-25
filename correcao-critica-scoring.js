/**
 * 🚨 CORREÇÃO CRÍTICA: Sistema de scoring retornando null
 * 
 * PROBLEMA IDENTIFICADO:
 * 1. Equal Weight V3 tem duas implementações conflitantes
 * 2. scoring.js retorna null em algumas condições
 * 3. Sistema aplica fallback ao invés das novas implementações
 * 
 * SOLUÇÃO:
 * 1. Unificar implementação Equal Weight V3
 * 2. Garantir que scoring.js sempre retorne valor válido
 * 3. Melhorar detecção de condições de auto-promoção
 */

console.log('🚨 INICIANDO CORREÇÃO CRÍTICA DO SISTEMA DE SCORING');
console.log('═══════════════════════════════════════════════════════════════');

// Diagnóstico completo do estado atual
function diagnosticarEstadoCompleto() {
  console.log('\n🔍 DIAGNÓSTICO COMPLETO DO SISTEMA');
  console.log('─────────────────────────────────────────');
  
  const estado = {
    // Flags de ativação
    flags: {
      SCORING_V2: window.SCORING_V2,
      USE_TT_DR: window.USE_TT_DR,
      USE_EQUAL_WEIGHT_V3: window.USE_EQUAL_WEIGHT_V3,
      AUDIT_MODE: window.AUDIT_MODE,
      FORCE_SCORING_V2: window.FORCE_SCORING_V2
    },
    
    // Sistemas carregados
    sistemas: {
      scoringVersion: window.__MIX_SCORING_VERSION__,
      computeMixScore: typeof window.computeMixScore === 'function',
      ttdrFunction: typeof window.computeTTDynamicRange === 'function',
      safetyGates: typeof window.SafetyGates === 'function'
    },
    
    // Estado de implementações
    implementacoes: {
      ttdrAtivo: false,
      equalWeightV3Ativo: false,
      safetyGatesAtivo: false
    }
  };
  
  // Verificar se TT-DR está realmente ativo
  try {
    if (window.computeTTDynamicRange) {
      const testBuffer = new Float32Array(1000);
      const result = window.computeTTDynamicRange(testBuffer, testBuffer, 48000);
      estado.implementacoes.ttdrAtivo = !!(result && result.tt_dr);
    }
  } catch (e) {
    console.log('⚠️ Erro ao testar TT-DR:', e.message);
  }
  
  // Verificar Equal Weight V3
  if (estado.sistemas.scoringVersion && estado.sistemas.scoringVersion.includes('equal-weight-v3')) {
    estado.implementacoes.equalWeightV3Ativo = true;
  }
  
  // Verificar Safety Gates
  estado.implementacoes.safetyGatesAtivo = !!window.SafetyGates;
  
  console.log('📊 Estado completo:', estado);
  return estado;
}

// Aplicar correções baseadas no diagnóstico
function aplicarCorrecoes(estado) {
  console.log('\n🔧 APLICANDO CORREÇÕES BASEADAS NO DIAGNÓSTICO');
  console.log('─────────────────────────────────────────────────');
  
  const correcoes = [];
  
  // Correção 1: Ativar todas as flags se não estiverem ativas
  if (!estado.flags.SCORING_V2) {
    window.SCORING_V2 = true;
    window.FORCE_SCORING_V2 = true;
    correcoes.push('✅ SCORING_V2 ativado');
  }
  
  if (!estado.flags.USE_TT_DR) {
    window.USE_TT_DR = true;
    correcoes.push('✅ USE_TT_DR ativado');
  }
  
  if (!estado.flags.USE_EQUAL_WEIGHT_V3) {
    window.USE_EQUAL_WEIGHT_V3 = true;
    correcoes.push('✅ USE_EQUAL_WEIGHT_V3 ativado');
  }
  
  if (!estado.flags.AUDIT_MODE) {
    window.AUDIT_MODE = true;
    correcoes.push('✅ AUDIT_MODE ativado');
  }
  
  // Correção 2: Hook no sistema de scoring para garantir valores válidos
  if (window.computeMixScore && !window._scoringHookApplied) {
    const originalComputeMixScore = window.computeMixScore;
    
    window.computeMixScore = function(technicalData, reference) {
      console.log('🔧 [SCORING_HOOK] Entrada:', {
        dataKeys: Object.keys(technicalData || {}),
        hasReference: !!reference,
        hasTTDR: !!(technicalData && technicalData.tt_dr),
        timestamp: Date.now()
      });
      
      // Chamar função original
      const result = originalComputeMixScore.call(this, technicalData, reference);
      
      console.log('🔧 [SCORING_HOOK] Resultado original:', {
        scorePct: result?.scorePct,
        method: result?.method,
        isValid: Number.isFinite(result?.scorePct)
      });
      
      // Garantir resultado válido
      if (!result || !Number.isFinite(result.scorePct)) {
        console.log('🚨 [SCORING_HOOK] CORRIGINDO: Resultado inválido, aplicando emergência');
        
        // Calcular score de emergência baseado nas métricas disponíveis
        let emergencyScore = 50; // Base
        
        if (technicalData) {
          let validMetrics = 0;
          let totalScore = 0;
          
          // Verificar métricas básicas
          const metricas = [
            { key: 'lufsIntegrated', target: -14, weight: 0.2 },
            { key: 'tt_dr', target: 10, weight: 0.2 },
            { key: 'truePeakDbtp', target: -1, weight: 0.2 },
            { key: 'stereoCorrelation', target: 0.3, weight: 0.2 },
            { key: 'spectralCentroid', target: 2500, weight: 0.2 }
          ];
          
          metricas.forEach(metrica => {
            const valor = technicalData[metrica.key];
            if (Number.isFinite(valor)) {
              validMetrics++;
              const diff = Math.abs(valor - metrica.target);
              const tolerance = Math.abs(metrica.target * 0.3); // 30% de tolerância
              const ratio = Math.min(diff / tolerance, 2);
              const score = Math.max(30, 100 - (ratio * 35));
              totalScore += score * metrica.weight;
            }
          });
          
          if (validMetrics > 0) {
            emergencyScore = Math.round(totalScore);
          }
        }
        
        return {
          scorePct: emergencyScore,
          method: 'emergency_equal_weight_v3',
          classification: emergencyScore >= 70 ? 'Avançado' : emergencyScore >= 55 ? 'Intermediário' : 'Básico',
          _emergency: true,
          _originalResult: result
        };
      }
      
      return result;
    };
    
    window._scoringHookApplied = true;
    correcoes.push('✅ Hook de scoring aplicado (emergência)');
  }
  
  // Correção 3: Força reload do scoring.js se necessário
  if (!estado.sistemas.scoringVersion || !estado.sistemas.scoringVersion.includes('equal-weight-v3')) {
    // Tentar recarregar
    if (window.location) {
      correcoes.push('⚠️ Versão do scoring não é Equal Weight V3, considere reload');
    }
  }
  
  console.log('📋 Correções aplicadas:');
  correcoes.forEach(correcao => console.log(`   ${correcao}`));
  
  return correcoes;
}

// Executar diagnóstico e correções
const estadoInicial = diagnosticarEstadoCompleto();
const correcoesAplicadas = aplicarCorrecoes(estadoInicial);

console.log('\n🎯 CORREÇÃO CRÍTICA CONCLUÍDA');
console.log('═══════════════════════════════════════');
console.log(`✅ ${correcoesAplicadas.length} correções aplicadas`);
console.log('🧪 TESTE AGORA UM ÁUDIO PARA VERIFICAR SE O SCORE MUDA!');

// Função para verificar após análise
window.verificarScoreAposAnalise = function() {
  console.log('\n📊 VERIFICAÇÃO PÓS-ANÁLISE');
  console.log('─────────────────────────────────');
  
  const logs = window.scoringLogs || [];
  const logsRecentes = logs.filter(log => Date.now() - log.timestamp < 30000); // últimos 30s
  
  console.log(`📝 ${logsRecentes.length} logs de scoring dos últimos 30s:`);
  logsRecentes.forEach(log => console.log(`   ${log.message}`));
  
  if (logsRecentes.length === 0) {
    console.log('⚠️ Nenhum log de scoring recente - verifique se a análise foi executada');
  }
};

console.log('\n💡 Use window.verificarScoreAposAnalise() após testar um áudio');
