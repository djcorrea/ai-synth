// 🔍 AUDITORIA COMPLETA: Carregamento de Referências
// Este script testa todos os pontos de carregamento de refs

console.log('🔍 INICIANDO AUDITORIA DE REFERÊNCIAS');

// Configurar debug global para capturar todos os logs
window.__DEBUG_ANALYZER__ = true;
window.DEBUG_SCORE = true;

// Interceptar fetch para monitorar todas as chamadas
const originalFetch = window.fetch;
const fetchLogs = [];

window.fetch = function(...args) {
    const url = args[0];
    const options = args[1] || {};
    
    if (url.includes('/refs/') || url.includes('refs')) {
        console.log('🌐 [FETCH_AUDIT] Interceptando:', url, options);
        
        const startTime = Date.now();
        return originalFetch.apply(this, args).then(response => {
            const endTime = Date.now();
            const logEntry = {
                url,
                status: response.status,
                ok: response.ok,
                duration: endTime - startTime,
                timestamp: new Date().toISOString()
            };
            fetchLogs.push(logEntry);
            console.log('🌐 [FETCH_AUDIT] Resultado:', logEntry);
            return response;
        }).catch(error => {
            const endTime = Date.now();
            const logEntry = {
                url,
                status: 'ERROR',
                ok: false,
                error: error.message,
                duration: endTime - startTime,
                timestamp: new Date().toISOString()
            };
            fetchLogs.push(logEntry);
            console.log('🌐 [FETCH_AUDIT] Erro:', logEntry);
            throw error;
        });
    }
    
    return originalFetch.apply(this, args);
};

// Função para testar carregamento de referências
async function auditarCarregamentoRefs() {
    console.log('\n📋 INICIANDO AUDITORIA DETALHADA');
    
    const generos = ['funk_mandela', 'trance', 'eletronico'];
    const results = [];
    
    for (const genero of generos) {
        console.log(`\n🎵 TESTANDO GÊNERO: ${genero}`);
        
        // Limpar cache
        if (window.__refDataCache) {
            delete window.__refDataCache[genero];
        }
        
        const testResults = {
            genero,
            external_attempts: [],
            embedded_fallback: null,
            final_source: null,
            final_data: null
        };
        
        // 1. Testar URLs diretas
        const urlsToTest = [
            `/refs/out/${genero}.json`,
            `refs/out/${genero}.json`,
            `../refs/out/${genero}.json`,
            `/public/refs/out/${genero}.json`
        ];
        
        for (const url of urlsToTest) {
            const fullUrl = `${url}?v=${Date.now()}`;
            try {
                console.log(`🌐 Testando URL: ${fullUrl}`);
                const response = await fetch(fullUrl, { 
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' }
                });
                
                const result = {
                    url: fullUrl,
                    status: response.status,
                    ok: response.ok,
                    content_type: response.headers.get('content-type')
                };
                
                if (response.ok) {
                    try {
                        const data = await response.json();
                        result.has_data = true;
                        result.data_keys = Object.keys(data);
                        console.log(`✅ URL funcionou: ${fullUrl}`, result);
                    } catch (e) {
                        result.json_error = e.message;
                        console.log(`❌ JSON inválido: ${fullUrl}`, result);
                    }
                } else {
                    console.log(`❌ URL falhou: ${fullUrl}`, result);
                }
                
                testResults.external_attempts.push(result);
                
            } catch (error) {
                const result = {
                    url: fullUrl,
                    status: 'NETWORK_ERROR',
                    error: error.message
                };
                console.log(`❌ Erro de rede: ${fullUrl}`, result);
                testResults.external_attempts.push(result);
            }
        }
        
        // 2. Testar fallback embedded
        try {
            console.log(`🔄 Testando fallback embedded para ${genero}...`);
            
            // Verificar se embedded refs estão carregadas
            const hasWindowRefs = window.__EMBEDDED_REFS__ && window.__EMBEDDED_REFS__.byGenre;
            const hasInlineRefs = window.__INLINE_EMBEDDED_REFS__ && window.__INLINE_EMBEDDED_REFS__.byGenre;
            
            testResults.embedded_fallback = {
                window_refs_available: !!hasWindowRefs,
                inline_refs_available: !!hasInlineRefs,
                window_genres: hasWindowRefs ? Object.keys(window.__EMBEDDED_REFS__.byGenre) : [],
                inline_genres: hasInlineRefs ? Object.keys(window.__INLINE_EMBEDDED_REFS__.byGenre) : []
            };
            
            if (hasWindowRefs && window.__EMBEDDED_REFS__.byGenre[genero]) {
                testResults.embedded_fallback.window_data = window.__EMBEDDED_REFS__.byGenre[genero];
                testResults.final_source = 'window.__EMBEDDED_REFS__';
                testResults.final_data = window.__EMBEDDED_REFS__.byGenre[genero];
            } else if (hasInlineRefs && window.__INLINE_EMBEDDED_REFS__.byGenre[genero]) {
                testResults.embedded_fallback.inline_data = window.__INLINE_EMBEDDED_REFS__.byGenre[genero];
                testResults.final_source = '__INLINE_EMBEDDED_REFS__';
                testResults.final_data = window.__INLINE_EMBEDDED_REFS__.byGenre[genero];
            }
            
        } catch (error) {
            testResults.embedded_fallback = { error: error.message };
        }
        
        results.push(testResults);
    }
    
    return results;
}

// Função para gerar relatório
function gerarRelatorio(results) {
    console.log('\n📊 RELATÓRIO DE AUDITORIA DE REFERÊNCIAS');
    console.log('='.repeat(80));
    
    // Tabela principal
    console.log('\n🎯 TABELA: CHAMADA → URL → STATUS → FONTE USADA');
    console.log('-'.repeat(100));
    
    results.forEach(result => {
        console.log(`\n🎵 GÊNERO: ${result.genero.toUpperCase()}`);
        
        // URLs testadas
        result.external_attempts.forEach((attempt, index) => {
            const status = attempt.ok ? '✅ SUCCESS' : `❌ ${attempt.status}`;
            const fonte = attempt.ok ? 'external' : 'failed';
            console.log(`  ${index + 1}. ${attempt.url} → ${status} → ${fonte}`);
        });
        
        // Fallback usado
        if (result.final_source) {
            console.log(`  FALLBACK: ${result.final_source} → ✅ SUCCESS → embedded`);
        } else {
            console.log(`  FALLBACK: NENHUM → ❌ FAILED → none`);
        }
        
        console.log(`  FONTE FINAL: ${result.final_source || 'NONE'}`);
    });
    
    // Arquivos presentes vs tentados
    console.log('\n📂 ARQUIVOS PRESENTES vs TENTADOS');
    console.log('-'.repeat(50));
    
    const arquivosPresentes = [
        'eletrofunk.json', 'eletronico.json', 'funk_automotivo.json',
        'funk_bruxaria.json', 'funk_consciente.json', 'funk_mandela.json',
        'funk_mandela_backup_spectral.json', 'funk_mandela_legacy.json',
        'genres.json', 'restore-result.json', 'ROLLBACK_FUNK_MANDELA_PREV.json',
        'trance.json', 'trap.json'
    ];
    
    const arquivosTentados = ['funk_mandela.json', 'trance.json', 'eletronico.json'];
    
    console.log('PRESENTES:', arquivosPresentes);
    console.log('TENTADOS:', arquivosTentados);
    console.log('MISSING:', arquivosTentados.filter(f => !arquivosPresentes.includes(f)));
    console.log('EXTRA:', arquivosPresentes.filter(f => !arquivosTentados.includes(f)));
    
    // Logs de fetch interceptados
    console.log('\n🌐 LOGS DE FETCH INTERCEPTADOS');
    console.log('-'.repeat(50));
    fetchLogs.forEach((log, index) => {
        const status = log.ok ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${log.url} (${log.status}) ${log.duration}ms`);
    });
    
    return {
        summary: {
            total_genres: results.length,
            successful_external: results.reduce((acc, r) => acc + r.external_attempts.filter(a => a.ok).length, 0),
            failed_external: results.reduce((acc, r) => acc + r.external_attempts.filter(a => !a.ok).length, 0),
            embedded_fallbacks: results.filter(r => r.final_source && r.final_source.includes('EMBEDDED')).length
        },
        details: results,
        fetchLogs
    };
}

// Executar auditoria
window.executarAuditoria = async function() {
    console.clear();
    console.log('🔍 EXECUTANDO AUDITORIA COMPLETA...');
    
    try {
        const results = await auditarCarregamentoRefs();
        const relatorio = gerarRelatorio(results);
        
        console.log('\n✅ AUDITORIA CONCLUÍDA');
        console.log('Para detalhes completos, verifique window.auditoriaResults');
        
        window.auditoriaResults = relatorio;
        return relatorio;
        
    } catch (error) {
        console.error('❌ Erro na auditoria:', error);
        return { error: error.message };
    }
};

console.log('✅ Auditoria configurada. Execute: executarAuditoria()');
