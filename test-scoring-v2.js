/**
 * 🧪 TESTE DIRETO DO SCORING V2 NO BROWSER
 * ========================================
 * 
 * Script para validar se o Scoring V2 está funcionando corretamente
 */

console.log('🧪 INICIANDO TESTE DO SCORING V2...');

// Função principal de teste
async function testScoringV2() {
    try {
        console.log('📋 1. Verificando se módulos estão carregados...');
        
        // Testar carregamento do módulo de integração
        const integrationModule = await import('/lib/audio/features/scoring-integration-browser.js?v=' + Date.now());
        
        if (!integrationModule || !integrationModule.computeMixScore) {
            throw new Error('Módulo de integração não carregado');
        }
        
        console.log('✅ Módulo de integração carregado com sucesso');
        
        // Testar carregamento do módulo V2
        const v2Module = await import('/lib/audio/features/scoring-v2-browser.js?v=' + Date.now());
        
        if (!v2Module || !v2Module.calculateScoringV2) {
            throw new Error('Módulo V2 não carregado');
        }
        
        console.log('✅ Módulo Scoring V2 carregado com sucesso');
        
        console.log('📋 2. Testando dados de exemplo...');
        
        // Dados de teste simulando uma análise real
        const testData = {
            lufsIntegrated: -12.5,    // Valor típico de funk mandela
            truePeakDbtp: -0.8,       // Peak controlado
            dynamicRange: 6.2,        // DR típico
            lra: 4.5,                 // Loudness range
            stereoCorrelation: 0.75,  // Correlação boa
            dcOffset: 0.0001,         // DC offset baixo
            clippingPercent: 0,       // Sem clipping
            
            // Bandas de frequência simuladas
            bandEnergies: {
                sub_bass: { rms_db: -8.2 },
                bass: { rms_db: -6.8 },
                low_mid: { rms_db: -7.5 },
                mid: { rms_db: -9.1 },
                high_mid: { rms_db: -12.3 },
                treble: { rms_db: -15.6 }
            }
        };
        
        const testReference = {
            genre: 'funk_mandela'
        };
        
        console.log('📋 3. Habilitando modo de teste V2...');
        
        // Habilitar teste V2
        window.SCORING_V2_TEST = true;
        
        console.log('📋 4. Executando scoring V1 (baseline)...');
        
        // Primeiro testar V1 (sem flag de teste)
        window.SCORING_V2_TEST = false;
        const v1Result = await integrationModule.computeMixScore(testData, testReference);
        
        console.log('📊 Resultado V1:', {
            score: v1Result.scorePct + '%',
            method: v1Result.method,
            classification: v1Result.classification
        });
        
        console.log('📋 5. Executando scoring V2 (melhorado)...');
        
        // Agora testar V2
        window.SCORING_V2_TEST = true;
        const v2Result = await integrationModule.computeMixScore(testData, testReference);
        
        console.log('📊 Resultado V2:', {
            score: v2Result.scorePct + '%',
            method: v2Result.method,
            classification: v2Result.classification,
            genre: v2Result.genre,
            version: v2Result.scoringVersion
        });
        
        console.log('📋 6. Comparando resultados...');
        
        const improvement = v2Result.scorePct - v1Result.scorePct;
        const improvementPct = v1Result.scorePct > 0 ? (improvement / v1Result.scorePct * 100) : 0;
        
        console.log('🎯 COMPARAÇÃO V1 vs V2:');
        console.log(`   V1 Score: ${v1Result.scorePct}%`);
        console.log(`   V2 Score: ${v2Result.scorePct}%`);
        console.log(`   Melhoria: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)} pontos`);
        console.log(`   Melhoria %: ${improvementPct > 0 ? '+' : ''}${improvementPct.toFixed(1)}%`);
        
        // Verificar se V2 está realmente sendo usado
        if (v2Result.method.includes('v2')) {
            console.log('✅ SUCESSO: Scoring V2 está funcionando!');
            
            if (improvement > 0) {
                console.log('🎊 EXCELENTE: V2 melhorou o score como esperado!');
            } else if (improvement === 0) {
                console.log('⚠️ NEUTRO: V2 manteve o mesmo score (pode ser correto)');
            } else {
                console.log('⚠️ ATENÇÃO: V2 reduziu o score (pode indicar problema)');
            }
        } else {
            console.log('❌ PROBLEMA: V2 não está sendo usado, caiu no fallback V1');
        }
        
        console.log('📋 7. Testando detalhes técnicos...');
        
        if (v2Result.details) {
            console.log('🔍 Detalhes V2:', {
                categoryScores: v2Result.details.categoryScores,
                appliedGates: v2Result.details.appliedGates?.length || 0,
                processingTime: v2Result.processingTime + 'ms'
            });
        }
        
        console.log('🎊 TESTE CONCLUÍDO COM SUCESSO!');
        
        return {
            success: true,
            v1Result,
            v2Result,
            improvement,
            improvementPct,
            isV2Working: v2Result.method.includes('v2')
        };
        
    } catch (error) {
        console.error('❌ ERRO NO TESTE:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Executar teste automaticamente
testScoringV2().then(result => {
    console.log('🏁 RESULTADO FINAL DO TESTE:', result);
    
    if (result.success && result.isV2Working) {
        console.log('🎉 PARABÉNS! O Scoring V2 está funcionando perfeitamente!');
        console.log('💡 Para usar em análises reais, execute: window.SCORING_V2_TEST = true');
    } else if (result.success && !result.isV2Working) {
        console.log('⚠️ Sistema funcionando, mas V2 não está ativo. Verifique os logs acima.');
    } else {
        console.log('❌ Há problemas no sistema. Verifique os erros acima.');
    }
}).catch(error => {
    console.error('💥 FALHA CRÍTICA NO TESTE:', error);
});

// Disponibilizar função globalmente para uso manual
window.testScoringV2 = testScoringV2;

console.log('💡 Teste iniciado! Aguarde os resultados...');
console.log('💡 Para re-executar: window.testScoringV2()');
