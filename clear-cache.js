// 🗑️ SCRIPT DE LIMPEZA DE CACHE - Para executar no console do navegador

console.log('🗑️ INICIANDO LIMPEZA COMPLETA DE CACHE');
console.log('═'.repeat(50));

// 1. Limpar variables globais relacionadas a referências
console.log('\n🧹 Limpando variáveis globais...');
if (typeof window !== 'undefined') {
    // Limpar cache de referências em memória
    window.__activeRefData = null;
    window.__activeRefGenre = null;
    window.__refDataCache = {};
    delete window.PROD_AI_REF_DATA;
    
    // Forçar bypass de cache na próxima carga
    window.REFS_BYPASS_CACHE = true;
    
    console.log('✅ Variáveis globais limpas');
}

// 2. Limpar localStorage
console.log('\n🗑️ Limpando localStorage...');
const localStorageKeys = [];
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
        key.includes('ref') || 
        key.includes('REF') || 
        key.includes('band') || 
        key.includes('BAND') ||
        key.includes('cache') ||
        key.includes('CACHE') ||
        key.includes('prodai') ||
        key.includes('PRODAI')
    )) {
        localStorageKeys.push(key);
    }
}

localStorageKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️ Removido localStorage: ${key}`);
});

if (localStorageKeys.length === 0) {
    console.log('ℹ️ Nenhum cache encontrado no localStorage');
}

// 3. Limpar sessionStorage
console.log('\n🗑️ Limpando sessionStorage...');
const sessionStorageKeys = [];
for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (
        key.includes('ref') || 
        key.includes('REF') || 
        key.includes('band') || 
        key.includes('BAND') ||
        key.includes('cache') ||
        key.includes('CACHE') ||
        key.includes('prodai') ||
        key.includes('PRODAI')
    )) {
        sessionStorageKeys.push(key);
    }
}

sessionStorageKeys.forEach(key => {
    sessionStorage.removeItem(key);
    console.log(`🗑️ Removido sessionStorage: ${key}`);
});

if (sessionStorageKeys.length === 0) {
    console.log('ℹ️ Nenhum cache encontrado no sessionStorage');
}

// 4. Adicionar versão de cache para forçar refresh
console.log('\n🔄 Adicionando marcador de versão...');
const cacheVersion = 'v1-bands-root-' + Date.now();
localStorage.setItem('PRODAI_CACHE_VERSION', cacheVersion);
console.log(`✅ Cache version: ${cacheVersion}`);

// 5. Instruções finais
console.log('\n🎯 LIMPEZA CONCLUÍDA!');
console.log('═'.repeat(50));
console.log('📋 PRÓXIMOS PASSOS:');
console.log('1. Recarregue a página (F5)');
console.log('2. Teste o upload de um áudio');
console.log('3. Verifique se as bandas aparecem na comparação');
console.log('');
console.log('🔍 PARA VERIFICAR:');
console.log('console.log(window.__activeRefData?.__schema) // deve mostrar "v1-bands-root"');
console.log('console.log(!!window.__activeRefData?.bands) // deve ser true');

// 6. Função de diagnóstico rápido
window.diagnosticBands = function() {
    console.log('🔍 DIAGNÓSTICO RÁPIDO:');
    console.log('Schema:', window.__activeRefData?.__schema);
    console.log('Has bands:', !!window.__activeRefData?.bands);
    console.log('Bands count:', Object.keys(window.__activeRefData?.bands || {}).length);
    console.log('Cache version:', localStorage.getItem('PRODAI_CACHE_VERSION'));
    console.log('Bypass cache:', window.REFS_BYPASS_CACHE);
};

console.log('');
console.log('💡 Use diagnosticBands() para verificar o estado');
