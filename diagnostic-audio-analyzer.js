// 🔍 DIAGNÓSTICO CRÍTICO - AudioAnalyzer Loading
console.log('🚨 DIAGNÓSTICO: Iniciando verificação AudioAnalyzer');

// Verificar se o script está sendo executado
console.log('🚨 DIAGNÓSTICO: Script de diagnóstico executando');

// Verificar ambiente
console.log('🚨 DIAGNÓSTICO: window existe?', typeof window !== 'undefined');
console.log('🚨 DIAGNÓSTICO: está no browser?', typeof document !== 'undefined');

// Verificar se AudioAnalyzer está sendo carregado
setTimeout(() => {
    console.log('🚨 DIAGNÓSTICO: AudioAnalyzer após 1s:', typeof window.AudioAnalyzer);
    console.log('🚨 DIAGNÓSTICO: audioAnalyzer após 1s:', typeof window.audioAnalyzer);
    
    if (typeof window.AudioAnalyzer === 'undefined') {
        console.error('🚨 DIAGNÓSTICO: AudioAnalyzer NÃO FOI CARREGADO!');
        
        // Verificar se há erros no console
        console.log('🚨 DIAGNÓSTICO: Verificando possíveis erros...');
        
        // Tentar carregar manualmente
        try {
            console.log('🚨 DIAGNÓSTICO: Tentando carregar script manualmente...');
            const script = document.createElement('script');
            script.src = '/public/audio-analyzer.js?diagnostic=true';
            script.onload = () => console.log('🚨 DIAGNÓSTICO: Script carregado manualmente');
            script.onerror = (e) => console.error('🚨 DIAGNÓSTICO: Erro ao carregar:', e);
            document.head.appendChild(script);
        } catch (e) {
            console.error('🚨 DIAGNÓSTICO: Erro na tentativa manual:', e);
        }
    } else {
        console.log('✅ DIAGNÓSTICO: AudioAnalyzer carregado com sucesso!');
    }
}, 1000);

setTimeout(() => {
    console.log('🚨 DIAGNÓSTICO: AudioAnalyzer após 3s:', typeof window.AudioAnalyzer);
    console.log('🚨 DIAGNÓSTICO: audioAnalyzer após 3s:', typeof window.audioAnalyzer);
}, 3000);
