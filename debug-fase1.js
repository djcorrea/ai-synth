/**
 * 🧪 DEBUG INTERATIVO - TESTE FASE 1: Sistema runId Global
 * 
 * Script para testar diretamente no navegador todas as implementações da Fase 1
 * Compatível com localhost:3000 e Vercel
 */

(function() {
    'use strict';
    
    console.log('🧪 INICIANDO DEBUG INTERATIVO - FASE 1');
    console.log('═══════════════════════════════════════════════════════');
    
    // Detectar ambiente
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isVercel = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('.vercel.app');
    
    console.log(`🌍 Ambiente detectado: ${isLocalhost ? 'LOCALHOST' : isVercel ? 'VERCEL' : 'OUTRO'}`);
    console.log(`🔗 URL atual: ${window.location.href}`);
    
    // Função de teste principal
    function testarFase1() {
        const resultados = {
            featureFlag: false,
            runIdCustomizado: false,
            durationLogs: false,
            propagacaoInterna: false,
            backwardCompatibility: false,
            abortControllerVinculado: false
        };
        
        console.log('\n🧪 INICIANDO TESTES DA FASE 1...');
        
        // 1️⃣ Teste: Feature Flag RUNID_ENFORCED
        console.log('\n1️⃣ Testando RUNID_ENFORCED...');
        try {
            // Ativar debug para ambiente local
            window.DEBUG_RUNID = true;
            
            // Verificar se a constante existe
            if (typeof RUNID_ENFORCED !== 'undefined') {
                resultados.featureFlag = true;
                console.log('✅ RUNID_ENFORCED detectado:', RUNID_ENFORCED);
                
                // Para ambiente local, deve ser true
                if (isLocalhost && RUNID_ENFORCED) {
                    console.log('✅ Feature flag correta para localhost');
                } else if (!isLocalhost && !RUNID_ENFORCED) {
                    console.log('✅ Feature flag correta para produção');
                }
            } else {
                console.log('❌ RUNID_ENFORCED não encontrado');
            }
        } catch (e) {
            console.log('❌ Erro ao testar feature flag:', e.message);
        }
        
        // 2️⃣ Teste: Sistema runId customizado
        console.log('\n2️⃣ Testando runId customizado...');
        try {
            if (window.audioAnalyzer && typeof window.audioAnalyzer.analyzeAudioFile === 'function') {
                const analyzer = window.audioAnalyzer;
                
                // Criar mock de arquivo
                const mockFile = new Blob(['test audio data'], { type: 'audio/wav' });
                mockFile.name = 'test-fase1.wav';
                
                const customRunId = 'debug_test_' + Date.now();
                
                // Interceptar logs para verificar se runId customizado é usado
                const originalLog = console.log;
                let runIdDetectado = null;
                
                console.log = function(...args) {
                    const msg = args.join(' ');
                    if (msg.includes(customRunId)) {
                        runIdDetectado = customRunId;
                    }
                    originalLog.apply(console, args);
                };
                
                // Simular análise (vai falhar por ser mock, mas deve usar o runId)
                try {
                    analyzer.analyzeAudioFile(mockFile, { runId: customRunId }).catch(() => {
                        // Esperado falhar, só queremos testar o runId
                    });
                    
                    setTimeout(() => {
                        if (runIdDetectado === customRunId) {
                            resultados.runIdCustomizado = true;
                            console.log('✅ runId customizado detectado nos logs');
                        } else {
                            console.log('❌ runId customizado não detectado');
                        }
                        console.log = originalLog; // Restaurar
                    }, 100);
                } catch (e) {
                    console.log = originalLog;
                    console.log('⚠️ Erro esperado ao analisar mock file:', e.message.substring(0, 50) + '...');
                }
                
            } else {
                console.log('❌ audioAnalyzer não disponível');
            }
        } catch (e) {
            console.log('❌ Erro ao testar runId customizado:', e.message);
        }
        
        // 3️⃣ Teste: Estrutura interna do analyzer
        console.log('\n3️⃣ Testando estrutura interna...');
        try {
            if (window.audioAnalyzer) {
                const analyzer = window.audioAnalyzer;
                
                // Verificar se métodos têm assinaturas corretas
                const performMethod = analyzer.performFullAnalysis.toString();
                if (performMethod.includes('options = {}')) {
                    resultados.propagacaoInterna = true;
                    console.log('✅ performFullAnalysis aceita options com runId');
                } else {
                    console.log('❌ performFullAnalysis não atualizado');
                }
                
                // Verificar estrutura de AbortController
                if (analyzer._abortController && typeof analyzer._generateRunId === 'function') {
                    resultados.abortControllerVinculado = true;
                    console.log('✅ AbortController e gerador de runId presentes');
                } else {
                    console.log('❌ Estrutura de AbortController incompleta');
                }
                
                // Testar backward compatibility
                if (typeof analyzer._logPipelineStageCompat === 'function') {
                    resultados.backwardCompatibility = true;
                    console.log('✅ Métodos de compatibilidade presentes');
                } else {
                    console.log('❌ Métodos de compatibilidade ausentes');
                }
                
            } else {
                console.log('❌ audioAnalyzer não inicializado');
            }
        } catch (e) {
            console.log('❌ Erro ao testar estrutura interna:', e.message);
        }
        
        // 📊 Resumo dos resultados
        setTimeout(() => {
            console.log('\n📊 RESULTADOS FINAIS - FASE 1:');
            console.log('═══════════════════════════════════════════════════════');
            
            const testes = Object.keys(resultados);
            const sucessos = Object.values(resultados).filter(Boolean).length;
            const taxa = (sucessos / testes.length * 100).toFixed(1);
            
            testes.forEach(teste => {
                const passou = resultados[teste];
                const nome = teste.replace(/([A-Z])/g, ' $1').toLowerCase();
                console.log(`${passou ? '✅' : '❌'} ${nome}: ${passou ? 'PASS' : 'FAIL'}`);
            });
            
            console.log(`\n🎯 Taxa de sucesso: ${taxa}% (${sucessos}/${testes.length})`);
            
            if (taxa >= 80) {
                console.log('🟢 FASE 1 - APROVADA para produção');
            } else if (taxa >= 60) {
                console.log('🟡 FASE 1 - REVISAR itens pendentes');
            } else {
                console.log('🔴 FASE 1 - CORRIGIR problemas críticos');
            }
            
            // Salvar resultados globalmente
            window.DEBUG_FASE1_RESULTADOS = resultados;
            
            console.log('\n💡 PRÓXIMOS PASSOS:');
            console.log('1. Faça upload de um áudio real');
            console.log('2. Observe os logs [run_xxxxx]');
            console.log('3. Verifique se duration aparece em cada etapa');
            console.log('\n📱 Acesse: http://localhost:3000/public/index.html');
            
        }, 500);
        
        return resultados;
    }
    
    // Função para teste manual com arquivo real
    function testarComArquivoReal() {
        console.log('\n🎵 TESTE COM ARQUIVO REAL:');
        console.log('1. Clique no botão de upload');
        console.log('2. Selecione um arquivo de áudio');
        console.log('3. Observe os logs no console');
        console.log('4. Procure por mensagens com [run_xxxxx]');
        
        // Ativar debug para ver mais detalhes
        window.DEBUG_RUNID = true;
        window.DEBUG_ANALYZER = true;
    }
    
    // Função para verificar compatibilidade Vercel
    function verificarCompatibilidadeVercel() {
        console.log('\n🔧 VERIFICAÇÃO COMPATIBILIDADE VERCEL:');
        
        const features = {
            webAudioAPI: 'AudioContext' in window,
            fileAPI: 'FileReader' in window,
            fetch: 'fetch' in window,
            promises: 'Promise' in window,
            maps: 'Map' in window,
            audioAnalyzer: 'audioAnalyzer' in window
        };
        
        Object.entries(features).forEach(([feature, available]) => {
            console.log(`${available ? '✅' : '❌'} ${feature}: ${available}`);
        });
        
        const compativel = Object.values(features).every(Boolean);
        console.log(`\n${compativel ? '✅' : '❌'} Vercel compatibility: ${compativel ? 'OK' : 'PROBLEMAS'}`);
        
        return compativel;
    }
    
    // Aguardar carregamento completo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                testarFase1();
                verificarCompatibilidadeVercel();
            }, 1000);
        });
    } else {
        setTimeout(() => {
            testarFase1();
            verificarCompatibilidadeVercel();
        }, 1000);
    }
    
    // Exportar funções para uso manual
    window.debugFase1 = {
        testar: testarFase1,
        testarArquivo: testarComArquivoReal,
        verificarVercel: verificarCompatibilidadeVercel
    };
    
    console.log('\n🛠️ FUNÇÕES DISPONÍVEIS:');
    console.log('- debugFase1.testar() - Executar todos os testes');
    console.log('- debugFase1.testarArquivo() - Instruções para teste manual');
    console.log('- debugFase1.verificarVercel() - Verificar compatibilidade');
    
})();

// Auto-executar se script carregado diretamente
if (typeof window !== 'undefined' && window.DEBUG_RUNID !== false) {
    console.log('🚀 Debug Fase 1 carregado e pronto!');
}
