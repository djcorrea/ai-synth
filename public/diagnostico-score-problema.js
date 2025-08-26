// 🎯 DIAGNÓSTICO CRÍTICO - INVESTIGAR POR QUE SCORE NÃO MUDA
// 
// PROBLEMA REAL IDENTIFICADO:
// 1. Ordem de execução está CORRETA (scoring após bandas)
// 2. bandEnergies estão sendo adicionadas ao technicalData
// 3. Mas o score não muda - WHY?
//
// HIPÓTESES:
// A. bandEnergies não estão chegando ao scoring
// B. Scoring não está usando bandEnergies
// C. Referência não tem targets para bandas
// D. Cache está invalidando as bandas
// E. Race condition entre fases

/**
 * 🔬 FUNÇÃO DE DIAGNÓSTICO PROFUNDO
 * Verifica onde exatamente o problema está
 */
function diagnosticarScoreProblema() {
  console.log('🔬 [DIAGNÓSTICO] Iniciando análise profunda do problema do score...');
  
  const diagnostico = {
    timestamp: new Date().toISOString(),
    problema: 'Score não muda mesmo com bandas espectrais calculadas',
    hipoteses: [],
    evidencias: {},
    solucoes: []
  };
  
  try {
    // 1. VERIFICAR SE BANDAS ESTÃO NO TECHNICAL DATA
    if (typeof window !== 'undefined' && window.audioAnalyzer) {
      const analyzer = window.audioAnalyzer;
      
      // Verificar última análise
      if (analyzer.lastAnalysis && analyzer.lastAnalysis.technicalData) {
        const td = analyzer.lastAnalysis.technicalData;
        
        diagnostico.evidencias.bandasExistem = !!(td.bandEnergies);
        diagnostico.evidencias.numerosBandas = td.bandEnergies ? Object.keys(td.bandEnergies).length : 0;
        diagnostico.evidencias.bandasSample = td.bandEnergies ? 
          Object.entries(td.bandEnergies).slice(0, 3).map(([k,v]) => ({
            banda: k, 
            rms_db: v.rms_db, 
            energy: v.energy,
            energyPct: v.energyPct
          })) : null;
        
        console.log('📊 [DIAGNÓSTICO] Bandas no technicalData:', diagnostico.evidencias.bandasExistem);
        console.log('📊 [DIAGNÓSTICO] Número de bandas:', diagnostico.evidencias.numerosBandas);
        console.log('📊 [DIAGNÓSTICO] Sample das bandas:', diagnostico.evidencias.bandasSample);
        
        if (!diagnostico.evidencias.bandasExistem) {
          diagnostico.hipoteses.push('A. bandEnergies não estão sendo calculadas/salvadas');
        }
      } else {
        diagnostico.evidencias.analiseExiste = false;
        diagnostico.hipoteses.push('X. Nenhuma análise encontrada');
      }
    }
    
    // 2. VERIFICAR SE HÁ REFERÊNCIA COM TARGETS DE BANDAS
    if (typeof window !== 'undefined') {
      const ref = window.PROD_AI_REF_DATA_ACTIVE || window.PROD_AI_REF_DATA;
      diagnostico.evidencias.referenciaExiste = !!ref;
      
      if (ref) {
        const activeGenre = window.PROD_AI_REF_GENRE || 'default';
        const genreRef = ref[activeGenre];
        
        diagnostico.evidencias.genreAtivo = activeGenre;
        diagnostico.evidencias.referenciaGenre = !!genreRef;
        diagnostico.evidencias.bandasNaRef = !!(genreRef && genreRef.bands);
        diagnostico.evidencias.numeroTargetsBandas = genreRef && genreRef.bands ? 
          Object.keys(genreRef.bands).length : 0;
        
        console.log('🎯 [DIAGNÓSTICO] Referência existe:', diagnostico.evidencias.referenciaExiste);
        console.log('🎯 [DIAGNÓSTICO] Gênero ativo:', diagnostico.evidencias.genreAtivo);
        console.log('🎯 [DIAGNÓSTICO] Bandas na referência:', diagnostico.evidencias.bandasNaRef);
        console.log('🎯 [DIAGNÓSTICO] Número targets bandas:', diagnostico.evidencias.numeroTargetsBandas);
        
        if (!diagnostico.evidencias.bandasNaRef || diagnostico.evidencias.numeroTargetsBandas === 0) {
          diagnostico.hipoteses.push('C. Referência não tem targets para bandas');
        }
      } else {
        diagnostico.hipoteses.push('C. Nenhuma referência ativa encontrada');
      }
    }
    
    // 3. TESTAR SCORING MANUALMENTE
    console.log('🧪 [DIAGNÓSTICO] Testando scoring manual...');
    
    // Criar dados de teste COM bandas
    const testDataComBandas = {
      lufsIntegrated: -14.2,
      truePeakDbtp: -1.5,
      dynamicRange: 8.5,
      lra: 6.2,
      stereoCorrelation: 0.85,
      bandEnergies: {
        sub: { rms_db: -18.5, energy: 0.012, energyPct: 8.2 },
        low_bass: { rms_db: -12.3, energy: 0.045, energyPct: 15.1 },
        upper_bass: { rms_db: -10.1, energy: 0.058, energyPct: 18.7 },
        low_mid: { rms_db: -8.7, energy: 0.072, energyPct: 22.3 },
        mid: { rms_db: -9.2, energy: 0.065, energyPct: 19.8 },
        high_mid: { rms_db: -15.1, energy: 0.028, energyPct: 10.4 },
        brilho: { rms_db: -22.3, energy: 0.008, energyPct: 3.8 },
        presenca: { rms_db: -24.1, energy: 0.005, energyPct: 1.7 }
      }
    };
    
    // Criar dados de teste SEM bandas
    const testDataSemBandas = {
      lufsIntegrated: -14.2,
      truePeakDbtp: -1.5,
      dynamicRange: 8.5,
      lra: 6.2,
      stereoCorrelation: 0.85
      // bandEnergies: undefined
    };
    
    // Testar ambos se scoring estiver disponível
    if (typeof window !== 'undefined' && window.scoringModule) {
      try {
        const scoreComBandas = window.scoringModule.computeMixScore(testDataComBandas, ref);
        const scoreSemBandas = window.scoringModule.computeMixScore(testDataSemBandas, ref);
        
        diagnostico.evidencias.scoreComBandas = scoreComBandas ? scoreComBandas.scorePct : null;
        diagnostico.evidencias.scoreSemBandas = scoreSemBandas ? scoreSemBandas.scorePct : null;
        diagnostico.evidencias.diferencaScore = diagnostico.evidencias.scoreComBandas - diagnostico.evidencias.scoreSemBandas;
        
        console.log('📊 [DIAGNÓSTICO] Score COM bandas:', diagnostico.evidencias.scoreComBandas);
        console.log('📊 [DIAGNÓSTICO] Score SEM bandas:', diagnostico.evidencias.scoreSemBandas);
        console.log('📊 [DIAGNÓSTICO] Diferença:', diagnostico.evidencias.diferencaScore);
        
        if (Math.abs(diagnostico.evidencias.diferencaScore) < 1) {
          diagnostico.hipoteses.push('B. Scoring não está considerando bandEnergies');
        }
        
      } catch (error) {
        diagnostico.evidencias.erroTeste = error.message;
        console.error('❌ [DIAGNÓSTICO] Erro no teste manual:', error);
      }
    } else {
      diagnostico.hipoteses.push('B. Módulo de scoring não disponível para teste');
    }
    
    // 4. VERIFICAR LOGS DE SCORING
    console.log('📋 [DIAGNÓSTICO] Verificando logs recentes...');
    
    // Simular captura de logs (em produção seria feito diferente)
    diagnostico.evidencias.logsRecentes = 'Verificar console para logs [SCORE_DEBUG] e [COLOR_RATIO_V2_DEBUG]';
    
    // 5. HIPÓTESES FINAIS
    if (diagnostico.hipoteses.length === 0) {
      diagnostico.hipoteses.push('D. Cache invalidando bandas entre cálculo e scoring');
      diagnostico.hipoteses.push('E. Race condition temporal entre fases');
    }
    
    // 6. SOLUÇÕES BASEADAS NAS HIPÓTESES
    diagnostico.solucoes = diagnostico.hipoteses.map(h => {
      if (h.includes('bandEnergies não estão sendo calculadas')) {
        return 'Verificar função _enrichWithPhase2Metrics e logs de banda';
      } else if (h.includes('Scoring não está considerando')) {
        return 'Verificar função computeMixScore e como processa bandEnergies';
      } else if (h.includes('Referência não tem targets')) {
        return 'Verificar/corrigir dados de referência do gênero ativo';
      } else if (h.includes('Cache invalidando')) {
        return 'Implementar proteção de cache para bandEnergies';
      } else if (h.includes('Race condition')) {
        return 'Adicionar await/sync entre fase 2 e scoring';
      } else {
        return 'Investigar mais profundamente: ' + h;
      }
    });
    
    console.log('🎯 [DIAGNÓSTICO] Hipóteses identificadas:', diagnostico.hipoteses);
    console.log('💡 [DIAGNÓSTICO] Soluções propostas:', diagnostico.solucoes);
    
    return diagnostico;
    
  } catch (error) {
    console.error('💥 [DIAGNÓSTICO] Erro no diagnóstico:', error);
    diagnostico.erro = error.message;
    return diagnostico;
  }
}

/**
 * 🔧 FUNÇÃO DE TESTE EM TEMPO REAL
 * Executa durante uma análise para capturar o problema
 */
function monitorarScoreEmTempoReal() {
  console.log('👁️ [MONITOR] Iniciando monitoramento em tempo real...');
  
  // Hook no computeMixScore se disponível
  if (typeof window !== 'undefined' && window.scoringModule && window.scoringModule.computeMixScore) {
    const originalComputeMixScore = window.scoringModule.computeMixScore;
    
    window.scoringModule.computeMixScore = function(technicalData, reference) {
      console.log('🔍 [MONITOR] computeMixScore chamado!');
      console.log('📊 [MONITOR] technicalData keys:', Object.keys(technicalData || {}));
      console.log('📊 [MONITOR] bandEnergies existe:', !!(technicalData && technicalData.bandEnergies));
      console.log('📊 [MONITOR] bandEnergies keys:', technicalData && technicalData.bandEnergies ? 
        Object.keys(technicalData.bandEnergies) : 'N/A');
      console.log('🎯 [MONITOR] reference existe:', !!reference);
      console.log('🎯 [MONITOR] reference.bands existe:', !!(reference && reference.bands));
      
      const result = originalComputeMixScore.call(this, technicalData, reference);
      
      console.log('📈 [MONITOR] Score resultado:', result ? result.scorePct : 'null');
      console.log('📈 [MONITOR] Método usado:', result ? result.scoringMethod : 'N/A');
      
      return result;
    };
    
    console.log('✅ [MONITOR] Hook instalado em computeMixScore');
  } else {
    console.warn('⚠️ [MONITOR] Scoring module não disponível para hook');
  }
}

// 🔧 EXPORTAÇÃO PARA USO GLOBAL
if (typeof window !== 'undefined') {
  window.diagnosticarScoreProblema = diagnosticarScoreProblema;
  window.monitorarScoreEmTempoReal = monitorarScoreEmTempoReal;
  
  console.log('🔧 [INIT] Funções de diagnóstico disponíveis:');
  console.log('   - window.diagnosticarScoreProblema() // Diagnóstico completo');
  console.log('   - window.monitorarScoreEmTempoReal() // Monitor hooks');
}

// 📋 INFORMAÇÕES DO DIAGNÓSTICO
const SCORE_DIAGNOSTIC_INFO = {
  name: 'Diagnóstico Profundo - Score Não Muda',
  version: '1.0.0',
  description: 'Investiga por que o score não muda mesmo com bandas espectrais calculadas',
  problema: 'Score permanece igual independente das bandas espectrais',
  hipoteses: [
    'A. bandEnergies não chegam ao scoring',
    'B. Scoring não usa bandEnergies',
    'C. Referência sem targets',
    'D. Cache invalidando dados',
    'E. Race condition temporal'
  ],
  uso: 'Execute window.diagnosticarScoreProblema() após uma análise de áudio'
};

console.log('🔬 [INFO] Diagnóstico carregado:', SCORE_DIAGNOSTIC_INFO.name, 'v' + SCORE_DIAGNOSTIC_INFO.version);
console.log('🎯 [INFO] Execute window.diagnosticarScoreProblema() para investigar o problema');
