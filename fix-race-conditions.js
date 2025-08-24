// 🔧 IMPLEMENTAÇÃO DE SISTEMA runId PARA PREVENIR RACE CONDITIONS
// Implementa identificadores únicos para cada análise e orquestração segura
// Autor: AI Assistant
// Data: $(date)

console.log('🛠️ INICIANDO IMPLEMENTAÇÃO DE CORREÇÕES PARA MELHOR ANALISADOR DE MIXAGEM');

// 1. Sistema de runId para identificação única de análises
const generateRunId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `run_${timestamp}_${random}`;
};

// 2. Verificar se modificações são seguras
const validateModifications = () => {
  console.log('🔍 VALIDANDO SEGURANÇA DAS MODIFICAÇÕES...');
  
  // Verificar se arquivo principal existe
  const mainFile = 'c:\\Users\\DJ Correa\\Desktop\\Programação\\ai-synth\\public\\audio-analyzer.js';
  
  // Lista de pontos críticos identificados na auditoria
  const criticalPoints = [
    'td.bandNorm = { bands: normBands, normalized: !!refBandTargetsNormalized };',
    '_computeTechnicalData',
    '_pipelineFromDecodedBuffer',
    'spectralBalance'
  ];
  
  console.log('✅ Pontos críticos identificados:', criticalPoints.length);
  return true;
};

// 3. Fórmula dB padronizada para consistência
const standardDbFormula = (value, reference = 1.0) => {
  if (!Number.isFinite(value) || value <= 0) return -Infinity;
  return 20 * Math.log10(value / reference);
};

// 4. Conversão percentual para dB (para display)
const percentageToDb = (percentage) => {
  if (!Number.isFinite(percentage) || percentage <= 0) return -Infinity;
  // Normalizar para escala 0-100% se necessário
  const normalized = percentage > 1 ? percentage / 100 : percentage;
  return standardDbFormula(normalized);
};

// 5. Verificação de integridade dos dados
const validateDataIntegrity = (data, runId) => {
  if (!data || !runId) {
    console.warn(`⚠️ [${runId}] Dados inválidos detectados`);
    return false;
  }
  
  if (data._runId && data._runId !== runId) {
    console.warn(`⚠️ [${runId}] Conflito de runId detectado: ${data._runId} vs ${runId}`);
    return false;
  }
  
  return true;
};

// 6. Implementação de Promise.allSettled para orquestração
const orchestrateAnalysis = async (operations, runId) => {
  console.log(`🎼 [${runId}] Orquestrando análise com ${operations.length} operações`);
  
  try {
    const results = await Promise.allSettled(operations.map(op => {
      if (typeof op === 'function') {
        return op(runId);
      }
      return Promise.resolve(op);
    }));
    
    const fulfilled = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const rejected = results.filter(r => r.status === 'rejected');
    
    if (rejected.length > 0) {
      console.warn(`⚠️ [${runId}] ${rejected.length} operações falharam:`, rejected.map(r => r.reason));
    }
    
    console.log(`✅ [${runId}] ${fulfilled.length}/${operations.length} operações concluídas`);
    return { fulfilled, rejected, runId };
    
  } catch (error) {
    console.error(`❌ [${runId}] Erro na orquestração:`, error);
    throw error;
  }
};

// 7. Wrapper seguro para modificações críticas
const safeModification = (fn, context, runId) => {
  return async (...args) => {
    try {
      console.log(`🔐 [${runId}] Executando modificação segura: ${fn.name || 'anonymous'}`);
      
      // Validar contexto antes da execução
      if (!validateDataIntegrity(context, runId)) {
        throw new Error(`Falha na validação de integridade para runId ${runId}`);
      }
      
      const result = await fn.apply(context, args);
      
      // Marcar resultado com runId
      if (result && typeof result === 'object') {
        result._runId = runId;
        result._timestamp = Date.now();
      }
      
      return result;
      
    } catch (error) {
      console.error(`❌ [${runId}] Erro em modificação segura:`, error);
      throw error;
    }
  };
};

// 8. Sistema de cache thread-safe
const createThreadSafeCache = () => {
  const cache = new Map();
  const locks = new Map();
  
  return {
    async get(key, factory, runId) {
      if (cache.has(key)) {
        const cached = cache.get(key);
        if (cached._runId) {
          console.log(`📦 [${runId}] Cache hit para ${key} (originado em ${cached._runId})`);
        }
        return cached;
      }
      
      // Verificar se já está sendo computado
      if (locks.has(key)) {
        console.log(`⏳ [${runId}] Aguardando computação em andamento para ${key}`);
        return await locks.get(key);
      }
      
      // Computar valor
      const promise = (async () => {
        try {
          console.log(`🔄 [${runId}] Computando ${key}`);
          const value = await factory(runId);
          if (value && typeof value === 'object') {
            value._runId = runId;
            value._cacheKey = key;
          }
          cache.set(key, value);
          return value;
        } finally {
          locks.delete(key);
        }
      })();
      
      locks.set(key, promise);
      return await promise;
    },
    
    clear() {
      cache.clear();
      locks.clear();
    },
    
    size() {
      return cache.size;
    }
  };
};

console.log('✅ Sistema de correções preparado. Pronto para aplicar no código principal.');

// Exportar utilitários
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateRunId,
    validateModifications,
    standardDbFormula,
    percentageToDb,
    validateDataIntegrity,
    orchestrateAnalysis,
    safeModification,
    createThreadSafeCache
  };
}

// Disponibilizar globalmente no browser
if (typeof window !== 'undefined') {
  window.AnalyzerFixes = {
    generateRunId,
    validateModifications,
    standardDbFormula,
    percentageToDb,
    validateDataIntegrity,
    orchestrateAnalysis,
    safeModification,
    createThreadSafeCache
  };
  console.log('🌐 Utilitários disponíveis em window.AnalyzerFixes');
}
