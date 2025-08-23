/**
 * 🎯 FEATURE FLAGS - SISTEMA DE SCORING V2
 * =====================================
 * 
 * Sistema de flags para implementação segura do scoring V2
 * com capacidade de rollback e testes A/B
 */

const FEATURE_FLAGS = {
  // Flag principal do scoring V2
  SCORING_V2_ENABLED: {
    enabled: false, // 🚨 Iniciar desabilitado para safety
    description: "Habilita sistema de scoring V2 com algoritmos suaves",
    rollbackSafe: true,
    testGroup: "internal", // internal, beta, production
    enabledFor: [], // Lista de users/IDs para teste específico
    createdAt: "2024-01-01T00:00:00Z",
    lastModified: "2024-01-01T00:00:00Z"
  },

  // Sub-features do scoring V2
  QUALITY_GATES_ENABLED: {
    enabled: true,
    description: "Aplica quality gates para limitar scores em problemas críticos",
    rollbackSafe: true,
    testGroup: "beta",
    dependsOn: ["SCORING_V2_ENABLED"]
  },

  METRIC_DEDUPLICATION: {
    enabled: true,
    description: "Remove métricas duplicadas identificadas na auditoria",
    rollbackSafe: true,
    testGroup: "beta",
    dependsOn: ["SCORING_V2_ENABLED"]
  },

  GAUSSIAN_SCORING: {
    enabled: true,
    description: "Usa função gaussiana para scoring suave",
    rollbackSafe: true,
    testGroup: "beta",
    alternativeFunction: "huber", // Fallback
    dependsOn: ["SCORING_V2_ENABLED"]
  },

  GENRE_SPECIFIC_WEIGHTS: {
    enabled: true,
    description: "Aplica pesos específicos por gênero musical",
    rollbackSafe: true,
    testGroup: "beta",
    dependsOn: ["SCORING_V2_ENABLED"]
  },

  // Flags de debugging e monitoramento
  SCORING_DEBUG_MODE: {
    enabled: false,
    description: "Adiciona logs detalhados do processo de scoring",
    rollbackSafe: true,
    testGroup: "internal"
  },

  SCORING_COMPARISON_MODE: {
    enabled: false,
    description: "Executa V1 e V2 em paralelo para comparação",
    rollbackSafe: true,
    testGroup: "internal",
    logResults: true,
    dependsOn: ["SCORING_V2_ENABLED"]
  },

  // UI/UX improvements
  ENHANCED_SCORING_UI: {
    enabled: false,
    description: "Interface melhorada com progress bars e explicações",
    rollbackSafe: true,
    testGroup: "beta",
    dependsOn: ["SCORING_V2_ENABLED"]
  },

  SCORING_EXPLANATIONS: {
    enabled: false,
    description: "Mostra explicações detalhadas dos scores",
    rollbackSafe: true,
    testGroup: "beta",
    dependsOn: ["SCORING_V2_ENABLED"]
  }
};

/**
 * Verifica se uma feature flag está habilitada
 */
function isFeatureEnabled(flagName, context = {}) {
  const flag = FEATURE_FLAGS[flagName];
  
  if (!flag) {
    console.warn(`❌ Feature flag '${flagName}' não encontrada`);
    return false;
  }

  // Verifica dependências
  if (flag.dependsOn) {
    for (const dependency of flag.dependsOn) {
      if (!isFeatureEnabled(dependency, context)) {
        console.log(`⚠️ Feature '${flagName}' desabilitada devido à dependência '${dependency}'`);
        return false;
      }
    }
  }

  // Verifica se está habilitada globalmente
  if (!flag.enabled) {
    return false;
  }

  // Verifica se usuário específico tem acesso
  if (flag.enabledFor && flag.enabledFor.length > 0) {
    const userId = context.userId || context.sessionId;
    if (!userId || !flag.enabledFor.includes(userId)) {
      return false;
    }
  }

  // Verifica grupo de teste
  if (flag.testGroup) {
    const userGroup = context.testGroup || "production";
    const allowedGroups = ["internal", "beta", "production"];
    const flagGroupIndex = allowedGroups.indexOf(flag.testGroup);
    const userGroupIndex = allowedGroups.indexOf(userGroup);
    
    if (userGroupIndex < flagGroupIndex) {
      return false;
    }
  }

  return true;
}

/**
 * Obtém configuração completa de uma feature
 */
function getFeatureConfig(flagName, context = {}) {
  const flag = FEATURE_FLAGS[flagName];
  
  if (!flag) {
    return null;
  }

  return {
    ...flag,
    isEnabled: isFeatureEnabled(flagName, context),
    context: context
  };
}

/**
 * Lista todas as features e seus status
 */
function getAllFeatureStatus(context = {}) {
  const status = {};
  
  for (const [flagName, flag] of Object.entries(FEATURE_FLAGS)) {
    status[flagName] = {
      enabled: isFeatureEnabled(flagName, context),
      description: flag.description,
      testGroup: flag.testGroup,
      rollbackSafe: flag.rollbackSafe
    };
  }
  
  return status;
}

/**
 * Habilita uma feature (para testes internos)
 */
function enableFeature(flagName, options = {}) {
  if (!FEATURE_FLAGS[flagName]) {
    throw new Error(`Feature flag '${flagName}' não encontrada`);
  }

  FEATURE_FLAGS[flagName].enabled = true;
  FEATURE_FLAGS[flagName].lastModified = new Date().toISOString();
  
  if (options.testGroup) {
    FEATURE_FLAGS[flagName].testGroup = options.testGroup;
  }
  
  if (options.enabledFor) {
    FEATURE_FLAGS[flagName].enabledFor = options.enabledFor;
  }

  console.log(`✅ Feature '${flagName}' habilitada`);
}

/**
 * Desabilita uma feature (rollback de emergência)
 */
function disableFeature(flagName, reason = "Manual disable") {
  if (!FEATURE_FLAGS[flagName]) {
    throw new Error(`Feature flag '${flagName}' não encontrada`);
  }

  FEATURE_FLAGS[flagName].enabled = false;
  FEATURE_FLAGS[flagName].lastModified = new Date().toISOString();
  FEATURE_FLAGS[flagName].disableReason = reason;

  console.log(`🚨 Feature '${flagName}' desabilitada: ${reason}`);
}

/**
 * Implementação específica para o scoring V2
 */
function shouldUseScoringV2(context = {}) {
  // Verifica flag principal
  if (!isFeatureEnabled('SCORING_V2_ENABLED', context)) {
    return false;
  }

  // Para testes internos, sempre usar V2
  if (context.testGroup === 'internal' || context.forceV2) {
    return true;
  }

  // Para beta, usar baseado em porcentagem
  if (context.testGroup === 'beta') {
    // 50% dos usuários beta
    const hash = context.userId ? hashCode(context.userId) : Math.random();
    return Math.abs(hash) % 100 < 50;
  }

  // Para produção, rollout gradual
  if (context.testGroup === 'production') {
    // 10% dos usuários produção inicialmente
    const hash = context.userId ? hashCode(context.userId) : Math.random();
    return Math.abs(hash) % 100 < 10;
  }

  return false;
}

/**
 * Hash simples para consistência de usuário
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FEATURE_FLAGS,
    isFeatureEnabled,
    getFeatureConfig,
    getAllFeatureStatus,
    enableFeature,
    disableFeature,
    shouldUseScoringV2
  };
}

// Para uso no browser
if (typeof window !== 'undefined') {
  window.FeatureFlags = {
    FEATURE_FLAGS,
    isFeatureEnabled,
    getFeatureConfig,
    getAllFeatureStatus,
    enableFeature,
    disableFeature,
    shouldUseScoringV2
  };
}
