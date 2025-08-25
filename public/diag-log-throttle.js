/**
 * Sistema de logs de diagnóstico com throttling inteligente
 * Evita flood de logs mantendo a UI fluida em modo diagnóstico
 * 
 * Uso: diagLog(stage, message, context)
 * - stage: identificador da etapa/componente
 * - message: mensagem a ser logada
 * - context: objeto com dados adicionais (opcional)
 */

class DiagnosticLogger {
    constructor() {
        this.throttleMap = new Map(); // Map<stage, { lastLog: timestamp, count: number }>
        this.minInterval = 150; // Throttle mínimo de 150ms por etapa
        this.enabled = false;
        this.maxLogsPerSecond = 7; // Máximo 7 logs por segundo globalmente
        this.globalQueue = [];
        
        // Verificar se modo diagnóstico está ativo
        this._checkDiagnosticMode();
        
        // Processar queue de logs a cada 150ms (≈6.6/s)
        setInterval(() => this._processQueue(), 150);
    }
    
    _checkDiagnosticMode() {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            this.enabled = urlParams.get('diag') === '1' || window.DIAGNOSTIC_MODE === true;
        }
        
        if (this.enabled) {
            console.log('🔬 DiagnosticLogger ATIVO - throttle 150ms por etapa, max 7/s global');
        }
    }
    
    /**
     * Log com throttling por etapa
     * @param {string} stage - Identificador da etapa (ex: 'SCORING', 'SPECTRAL', 'LUFS')
     * @param {string} message - Mensagem a ser logada
     * @param {object} context - Contexto adicional (opcional)
     */
    log(stage, message, context = null) {
        if (!this.enabled) return;
        
        const now = Date.now();
        const stageKey = stage.toUpperCase();
        
        // Verificar throttle por etapa
        const stageInfo = this.throttleMap.get(stageKey) || { lastLog: 0, count: 0 };
        
        if (now - stageInfo.lastLog < this.minInterval) {
            // Throttled - contar mas não logar ainda
            stageInfo.count++;
            this.throttleMap.set(stageKey, stageInfo);
            return;
        }
        
        // Adicionar à queue global
        const logEntry = {
            timestamp: now,
            stage: stageKey,
            message,
            context,
            pendingCount: stageInfo.count
        };
        
        this.globalQueue.push(logEntry);
        
        // Atualizar estado da etapa
        this.throttleMap.set(stageKey, { lastLog: now, count: 0 });
    }
    
    _processQueue() {
        if (!this.enabled || this.globalQueue.length === 0) return;
        
        // Processar no máximo maxLogsPerSecond logs por iteração
        const batchSize = Math.min(this.globalQueue.length, Math.ceil(this.maxLogsPerSecond / 6.6));
        const batch = this.globalQueue.splice(0, batchSize);
        
        batch.forEach(entry => {
            let logMessage = `🔍 [${entry.stage}] ${entry.message}`;
            
            // Mostrar contagem de logs suprimidos se houver
            if (entry.pendingCount > 0) {
                logMessage += ` (+${entry.pendingCount} suprimidos)`;
            }
            
            // Log com context se fornecido
            if (entry.context) {
                console.log(logMessage, entry.context);
            } else {
                console.log(logMessage);
            }
        });
        
        // Se ainda há logs na queue, mencionar
        if (this.globalQueue.length > 0) {
            console.log(`🔍 [QUEUE] ${this.globalQueue.length} logs aguardando...`);
        }
    }
    
    /**
     * Força flush de todos os logs pendentes (para debugging)
     */
    flush() {
        if (!this.enabled) return;
        
        console.log('🔍 [FLUSH] Processando todos os logs pendentes...');
        this._processQueue();
        
        // Mostrar estatísticas de throttling
        const stats = Array.from(this.throttleMap.entries()).map(([stage, info]) => ({
            stage,
            suppressedCount: info.count,
            lastLogAgo: Date.now() - info.lastLog
        }));
        
        if (stats.length > 0) {
            console.log('🔍 [STATS] Estatísticas de throttling:', stats);
        }
    }
    
    /**
     * Limpa throttle de uma etapa específica (para forçar próximo log)
     * @param {string} stage - Etapa a limpar
     */
    clearThrottle(stage) {
        this.throttleMap.delete(stage.toUpperCase());
    }
    
    /**
     * Habilita/desabilita logging dinamicamente
     * @param {boolean} enabled - Estado do logging
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (enabled) {
            console.log('🔬 DiagnosticLogger HABILITADO');
        } else {
            console.log('🔬 DiagnosticLogger DESABILITADO');
        }
    }
}

// Instância global protegida por namespace
if (!window.AnalyzerDiag) {
    window.AnalyzerDiag = {};
}

if (!window.AnalyzerDiag.logger) {
    window.AnalyzerDiag.logger = new DiagnosticLogger();
}

/**
 * Função global para log de diagnóstico com throttling
 * @param {string} stage - Etapa/componente
 * @param {string} message - Mensagem
 * @param {object} context - Contexto opcional
 */
if (!window.diagLog) {
    function diagLog(stage, message, context) {
        window.AnalyzerDiag.logger.log(stage, message, context);
    }
    
    // Funções utilitárias expostas globalmente com proteção
    window.diagLog = diagLog;
    window.diagFlush = () => window.AnalyzerDiag.logger.flush();
    window.diagClear = (stage) => window.AnalyzerDiag.logger.clearThrottle(stage);
    window.diagSetEnabled = (enabled) => window.AnalyzerDiag.logger.setEnabled(enabled);
}

// Export para modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { diagLog, diagLogger };
}
