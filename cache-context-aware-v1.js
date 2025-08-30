/**
 * 🎯 CACHE CONTEXT-AWARE V1
 * Sistema de cache que automaticamente invalida entradas obsoletas quando:
 * - PROD_AI_REF_GENRE muda (mudança de gênero)
 * - EMBEDDED_REFS_VERSION muda (atualização de referências)
 * 
 * 🛡️ FEATURE FLAG: CACHE_CTX_AWARE_V1
 * - true: Sistema ativo com invalidação automática
 * - false: Sistema desabilitado (fallback para comportamento anterior)
 */

// 🏳️ FEATURE FLAG GLOBAL
window.CACHE_CTX_AWARE_V1 = true;

(function() {
    'use strict';
    
    // 🔒 PREVENÇÃO DE MÚLTIPLAS EXECUÇÕES
    if (window.__CACHE_CTX_AWARE_V1_LOADED) {
        console.log('⚠️ CACHE_CTX_AWARE_V1 já carregado, pulando inicialização');
        return;
    }
    window.__CACHE_CTX_AWARE_V1_LOADED = true;
    
    console.log('🚀 Inicializando CACHE_CTX_AWARE_V1...');
    
    // 📊 ESTATÍSTICAS DE INVALIDAÇÃO
    const cacheStats = {
        totalInvalidations: 0,
        genreChanges: 0,
        versionChanges: 0,
        entriesCleared: 0,
        lastInvalidation: null,
        performance: {
            avgInvalidationTime: 0,
            invalidationTimes: []
        }
    };
    
    /**
     * 🎯 ENHANCED CACHE INVALIDATION - Versão melhorada
     * Integra com sistema existente mas adiciona:
     * - Trigger em applyGenreSelection
     * - Trigger em mudanças de EMBEDDED_REFS_VERSION
     * - Estatísticas detalhadas
     * - Race condition protection
     */
    function enhancedInvalidateByChange(changeType, oldValue, newValue) {
        if (!window.CACHE_CTX_AWARE_V1) {
            console.log('🔕 CACHE_CTX_AWARE_V1 desabilitado, pulando invalidação');
            return { cleared: 0, reason: 'feature_flag_disabled' };
        }
        
        const startTime = performance.now();
        console.log(`🔄 CACHE_CTX_AWARE_V1: ${changeType} mudou de "${oldValue}" → "${newValue}"`);
        
        try {
            // 🔒 RACE CONDITION PROTECTION
            if (window.__CACHE_INVALIDATION_IN_PROGRESS) {
                console.log('⏳ Invalidação já em andamento, aguardando...');
                return { cleared: 0, reason: 'invalidation_in_progress' };
            }
            window.__CACHE_INVALIDATION_IN_PROGRESS = true;
            
            let cleared = 0;
            
            // 🗑️ INVALIDAR CACHE PRINCIPAL (MAP)
            if (window.__AUDIO_ANALYSIS_CACHE__) {
                const beforeSize = window.__AUDIO_ANALYSIS_CACHE__.size;
                
                if (changeType === 'genre') {
                    // Remover entradas do gênero antigo
                    for (const [key] of window.__AUDIO_ANALYSIS_CACHE__) {
                        if (key.startsWith(`${oldValue}:`)) {
                            window.__AUDIO_ANALYSIS_CACHE__.delete(key);
                            cleared++;
                        }
                    }
                } else if (changeType === 'refsVersion') {
                    // Remover entradas da versão antiga
                    for (const [key] of window.__AUDIO_ANALYSIS_CACHE__) {
                        if (key.includes(`:${oldValue}`)) {
                            window.__AUDIO_ANALYSIS_CACHE__.delete(key);
                            cleared++;
                        }
                    }
                }
                
                console.log(`📦 Cache MAP: ${beforeSize} → ${window.__AUDIO_ANALYSIS_CACHE__.size} (${cleared} removidas)`);
            }
            
            // 🗑️ INVALIDAR CACHE DE REFERÊNCIAS
            if (changeType === 'genre' && window.__refDataCache) {
                try {
                    delete window.__refDataCache[oldValue];
                    delete window.__refDataCache[newValue]; // Força reload
                    console.log(`🎵 Cache de referência invalidado para: ${oldValue}, ${newValue}`);
                } catch (e) {
                    console.warn('⚠️ Falha ao invalidar cache de referência:', e);
                }
            }
            
            // 🗑️ INVALIDAR LOCALSTORAGE ENTRIES
            try {
                const toRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('audio_analysis_')) {
                        const value = localStorage.getItem(key);
                        if (value && (
                            (changeType === 'genre' && value.includes(`"genre":"${oldValue}"`)) ||
                            (changeType === 'refsVersion' && value.includes(`"refsVersion":"${oldValue}"`))
                        )) {
                            toRemove.push(key);
                        }
                    }
                }
                toRemove.forEach(key => {
                    localStorage.removeItem(key);
                    cleared++;
                });
                if (toRemove.length > 0) {
                    console.log(`💾 LocalStorage: ${toRemove.length} entradas removidas`);
                }
            } catch (e) {
                console.warn('⚠️ Falha ao invalidar localStorage:', e);
            }
            
            // 📊 ATUALIZAR ESTATÍSTICAS
            cacheStats.totalInvalidations++;
            cacheStats.entriesCleared += cleared;
            cacheStats.lastInvalidation = new Date().toISOString();
            
            if (changeType === 'genre') cacheStats.genreChanges++;
            if (changeType === 'refsVersion') cacheStats.versionChanges++;
            
            const duration = performance.now() - startTime;
            cacheStats.performance.invalidationTimes.push(duration);
            
            // Manter apenas últimas 10 medições
            if (cacheStats.performance.invalidationTimes.length > 10) {
                cacheStats.performance.invalidationTimes.shift();
            }
            
            // Recalcular média
            cacheStats.performance.avgInvalidationTime = 
                cacheStats.performance.invalidationTimes.reduce((a, b) => a + b, 0) / 
                cacheStats.performance.invalidationTimes.length;
            
            console.log(`✅ CACHE_CTX_AWARE_V1: ${cleared} entradas invalidadas em ${duration.toFixed(2)}ms`);
            
            return { 
                cleared, 
                duration: duration.toFixed(2),
                changeType,
                oldValue,
                newValue,
                stats: { ...cacheStats }
            };
            
        } catch (error) {
            console.error('❌ CACHE_CTX_AWARE_V1: Erro na invalidação:', error);
            return { 
                cleared: 0, 
                error: error.message,
                changeType,
                oldValue,
                newValue
            };
        } finally {
            window.__CACHE_INVALIDATION_IN_PROGRESS = false;
        }
    }
    
    /**
     * 🎯 ENHANCED applyGenreSelection
     * Intercepta mudanças de gênero para trigger automático
     */
    function enhanceApplyGenreSelection() {
        const originalApplyGenreSelection = window.applyGenreSelection;
        
        if (!originalApplyGenreSelection) {
            console.warn('⚠️ applyGenreSelection não encontrada, cache context-aware limitado');
            return;
        }
        
        window.applyGenreSelection = function(genre) {
            const oldGenre = window.PROD_AI_REF_GENRE;
            
            // 🔄 TRIGGER INVALIDAÇÃO ANTES DA MUDANÇA
            if (oldGenre && oldGenre !== genre && window.CACHE_CTX_AWARE_V1) {
                console.log(`🎯 CACHE_CTX_AWARE_V1: Detectada mudança ${oldGenre} → ${genre}`);
                enhancedInvalidateByChange('genre', oldGenre, genre);
            }
            
            // 📞 CHAMAR FUNÇÃO ORIGINAL
            return originalApplyGenreSelection.call(this, genre);
        };
        
        console.log('✅ applyGenreSelection enhanced com CACHE_CTX_AWARE_V1');
    }
    
    /**
     * 🎯 ENHANCED CACHE CHANGE MONITOR
     * Substitui o monitor existente com versão aprimorada
     */
    function enhanceCacheChangeMonitor() {
        if (window._cacheChangeMonitor) {
            // Preservar estado atual se existir
            const currentState = {
                lastGenre: window._cacheChangeMonitor.lastGenre,
                lastRefsVersion: window._cacheChangeMonitor.lastRefsVersion
            };
            
            window._cacheChangeMonitor = {
                ...currentState,
                
                checkAndInvalidate() {
                    if (!window.CACHE_CTX_AWARE_V1) return;
                    
                    const currentGenre = window.PROD_AI_REF_GENRE;
                    const currentRefsVersion = window.EMBEDDED_REFS_VERSION;
                    
                    if (this.lastGenre && this.lastGenre !== currentGenre) {
                        enhancedInvalidateByChange('genre', this.lastGenre, currentGenre);
                    }
                    
                    if (this.lastRefsVersion && this.lastRefsVersion !== currentRefsVersion) {
                        enhancedInvalidateByChange('refsVersion', this.lastRefsVersion, currentRefsVersion);
                    }
                    
                    this.lastGenre = currentGenre;
                    this.lastRefsVersion = currentRefsVersion;
                }
            };
            
            console.log('✅ _cacheChangeMonitor enhanced com CACHE_CTX_AWARE_V1');
        }
    }
    
    /**
     * 🎯 API PÚBLICA - Estatísticas e Controle
     */
    window.CACHE_CTX_AWARE_V1_API = {
        getStats: () => ({ ...cacheStats }),
        
        clearStats: () => {
            Object.assign(cacheStats, {
                totalInvalidations: 0,
                genreChanges: 0,
                versionChanges: 0,
                entriesCleared: 0,
                lastInvalidation: null,
                performance: {
                    avgInvalidationTime: 0,
                    invalidationTimes: []
                }
            });
            console.log('📊 Estatísticas CACHE_CTX_AWARE_V1 resetadas');
        },
        
        enable: () => {
            window.CACHE_CTX_AWARE_V1 = true;
            console.log('✅ CACHE_CTX_AWARE_V1 habilitado');
        },
        
        disable: () => {
            window.CACHE_CTX_AWARE_V1 = false;
            console.log('🔕 CACHE_CTX_AWARE_V1 desabilitado');
        },
        
        forceInvalidation: (changeType, oldValue, newValue) => {
            return enhancedInvalidateByChange(changeType, oldValue, newValue);
        },
        
        getCurrentContext: () => ({
            genre: window.PROD_AI_REF_GENRE,
            refsVersion: window.EMBEDDED_REFS_VERSION,
            cacheSize: window.__AUDIO_ANALYSIS_CACHE__?.size || 0,
            refsCacheSize: window.__refDataCache ? Object.keys(window.__refDataCache).length : 0
        })
    };
    
    /**
     * 🚀 INICIALIZAÇÃO PRINCIPAL
     */
    function initializeCacheContextAware() {
        console.log('🔧 Configurando CACHE_CTX_AWARE_V1...');
        
        // 1. Melhorar applyGenreSelection
        enhanceApplyGenreSelection();
        
        // 2. Melhorar cache change monitor
        enhanceCacheChangeMonitor();
        
        // 3. Sobrescrever invalidateCacheByChange se existir
        if (window.invalidateCacheByChange) {
            const originalInvalidate = window.invalidateCacheByChange;
            window.invalidateCacheByChange = function(changeType, oldValue, newValue) {
                if (window.CACHE_CTX_AWARE_V1) {
                    return enhancedInvalidateByChange(changeType, oldValue, newValue);
                } else {
                    return originalInvalidate.call(this, changeType, oldValue, newValue);
                }
            };
            console.log('✅ invalidateCacheByChange enhanced');
        }
        
        // 4. Log de inicialização
        console.log('🎯 CACHE_CTX_AWARE_V1 inicializado com sucesso!');
        console.log('📊 Estado atual:', window.CACHE_CTX_AWARE_V1_API.getCurrentContext());
        console.log('🎛️ API disponível em: window.CACHE_CTX_AWARE_V1_API');
        
        // 5. Configurar detecção de mudanças automática
        if (window._cacheChangeMonitor) {
            // Trigger inicial para sincronizar estado
            window._cacheChangeMonitor.checkAndInvalidate();
        }
    }
    
    // 🚀 EXECUÇÃO: Aguardar DOM ou executar imediatamente
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCacheContextAware);
    } else {
        initializeCacheContextAware();
    }
    
})();

/**
 * 🧪 TESTES RÁPIDOS
 * Para verificar funcionamento básico no console
 */
function testCacheContextAware() {
    console.log('🧪 Testando CACHE_CTX_AWARE_V1...');
    
    const api = window.CACHE_CTX_AWARE_V1_API;
    if (!api) {
        console.error('❌ API não disponível');
        return;
    }
    
    console.log('📊 Estado inicial:', api.getCurrentContext());
    console.log('📈 Estatísticas:', api.getStats());
    
    // Teste de invalidação forçada
    const result = api.forceInvalidation('genre', 'rock', 'pop');
    console.log('🔄 Teste de invalidação:', result);
    
    console.log('✅ Teste concluído - verifique logs acima');
}

// Disponibilizar teste globalmente
window.testCacheContextAware = testCacheContextAware;

console.log('📦 CACHE_CTX_AWARE_V1 carregado - Execute testCacheContextAware() para testar');
