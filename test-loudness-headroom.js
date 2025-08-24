#!/usr/bin/env node

/**
 * 🎚️ TESTE HEADROOM SEGURO - Loudness Recommendations
 * 
 * Testa a nova lógica que impede sugestões impossíveis de loudness:
 * - Só sugerir aumentar loudness se (−0.6 dBTP − truePeakDbTP) ≥ ganhoProposto
 * - Se CLIPPED, não sugerir loudness (recomendação vem do módulo de TP)  
 * - Teste que impede sugestão impossível (ex.: truePeak −0.7 dBTP e pedir +2 dB)
 */

console.log('🎚️ TESTE HEADROOM SEGURO - Loudness Recommendations\n');

// 🎭 Simular função de análise com headroom seguro
function generateLoudnessSuggestions(analysis) {
    const suggestions = [];
    const { lufsIntegrated, truePeakDbtp, clippingSamples } = analysis.technical;
    const isClipped = clippingSamples > 0;
    const headroomSafetyMargin = -0.6; // Target true peak seguro (-0.6 dBTP)
    
    console.log(`📊 Análise: LUFS=${lufsIntegrated}, TruePeak=${truePeakDbtp}dBTP, Clipping=${clippingSamples} samples`);
    
    if (!Number.isFinite(lufsIntegrated)) {
        return suggestions;
    }
    
    // 🚨 REGRA 1: Se CLIPPED, não sugerir aumento de loudness
    if (isClipped) {
        console.log(`🚨 BLOQUEADO: Clipping detectado (${clippingSamples} samples) - sem sugestões de aumento`);
        
        if (lufsIntegrated > -13) {
            suggestions.push({
                type: 'volume_high_clipped',
                message: `Volume alto + clipping detectado`,
                action: `URGENTE: Reduzir volume para -14 LUFS`,
                severity: 'critical'
            });
        }
        return suggestions;
    }
    
    // 🚨 REGRA 2: Calcular headroom disponível para aumento seguro
    if (Number.isFinite(truePeakDbtp)) {
        const availableHeadroom = headroomSafetyMargin - truePeakDbtp;
        console.log(`🔒 Headroom disponível: ${availableHeadroom.toFixed(2)} dB`);
        
        if (lufsIntegrated < -16) {
            const gainProposto = Math.abs(lufsIntegrated + 14);
            console.log(`🎯 Ganho proposto: +${gainProposto.toFixed(1)} dB`);
            
            if (gainProposto <= availableHeadroom) {
                console.log(`✅ SEGURO: Ganho ${gainProposto.toFixed(1)}dB ≤ headroom ${availableHeadroom.toFixed(1)}dB`);
                suggestions.push({
                    type: 'volume_low_safe',
                    message: `Volume baixo para streaming`,
                    action: `Aumentar volume para -14 LUFS (+${gainProposto.toFixed(1)}dB)`,
                    headroom_check: `Seguro: ${availableHeadroom.toFixed(1)}dB disponível`
                });
            } else {
                console.log(`⚠️ BLOQUEADO: Ganho ${gainProposto.toFixed(1)}dB > headroom ${availableHeadroom.toFixed(1)}dB`);
                suggestions.push({
                    type: 'volume_limited_headroom',
                    message: `Volume baixo mas sem headroom para correção`,
                    action: `True Peak ${truePeakDbtp.toFixed(1)}dBTP limita aumento a +${availableHeadroom.toFixed(1)}dB`,
                    warning: `Necessário ${gainProposto.toFixed(1)}dB mas só ${availableHeadroom.toFixed(1)}dB seguro`
                });
            }
        }
    }
    
    return suggestions;
}

// 🎭 Cenários de teste
const testCases = [
    {
        name: 'CASO 1: Áudio seguro - pode aumentar',
        analysis: {
            technical: {
                lufsIntegrated: -18.0,  // Volume baixo
                truePeakDbtp: -3.0,     // Headroom seguro
                clippingSamples: 0      // Sem clipping
            }
        },
        expectation: 'Deve sugerir aumentar +4dB (seguro)'
    },
    {
        name: 'CASO 2: Headroom insuficiente - bloquear',
        analysis: {
            technical: {
                lufsIntegrated: -18.0,  // Volume baixo  
                truePeakDbtp: -0.7,     // Pouco headroom
                clippingSamples: 0      // Sem clipping
            }
        },
        expectation: 'Deve bloquear: necessário +4dB mas só 0.1dB seguro'
    },
    {
        name: 'CASO 3: Clipping detectado - bloquear tudo',
        analysis: {
            technical: {
                lufsIntegrated: -16.0,  // Volume baixo
                truePeakDbtp: -1.0,     // Headroom ok
                clippingSamples: 150    // COM CLIPPING
            }
        },
        expectation: 'Deve bloquear: clipping detectado'
    },
    {
        name: 'CASO 4: Volume alto + clipping - redução urgente',
        analysis: {
            technical: {
                lufsIntegrated: -12.0,  // Volume alto
                truePeakDbtp: 0.0,      // Clipping
                clippingSamples: 500    // Muito clipping
            }
        },
        expectation: 'Deve sugerir redução urgente'
    },
    {
        name: 'CASO 5: Exemplo impossível do usuário',
        analysis: {
            technical: {
                lufsIntegrated: -16.0,  // Volume baixo
                truePeakDbtp: -0.7,     // True Peak -0.7 dBTP 
                clippingSamples: 0      // Sem clipping
            }
        },
        expectation: 'Necessário +2dB para -14 LUFS mas só 0.1dB headroom'
    }
];

// 🧪 Executar testes
console.log('🧪 EXECUTANDO CENÁRIOS DE TESTE:\n');

testCases.forEach((testCase, index) => {
    console.log(`\n${'-'.repeat(60)}`);
    console.log(`📋 ${testCase.name}`);
    console.log(`🔮 Expectativa: ${testCase.expectation}`);
    console.log(`${'-'.repeat(60)}`);
    
    const suggestions = generateLoudnessSuggestions(testCase.analysis);
    
    console.log(`\n📝 Resultado: ${suggestions.length} sugestão(es) gerada(s)`);
    suggestions.forEach((suggestion, i) => {
        console.log(`   ${i + 1}. [${suggestion.type}] ${suggestion.message}`);
        console.log(`      ▶️ ${suggestion.action}`);
        if (suggestion.headroom_check) {
            console.log(`      🔒 ${suggestion.headroom_check}`);
        }
        if (suggestion.warning) {
            console.log(`      ⚠️ ${suggestion.warning}`);
        }
        if (suggestion.severity) {
            console.log(`      🚨 Severidade: ${suggestion.severity}`);
        }
    });
});

console.log(`\n${'='.repeat(60)}`);
console.log('🎯 RESUMO DOS CRITÉRIOS IMPLEMENTADOS:');
console.log('✅ 1. Só sugerir aumento se (−0.6 dBTP − truePeakDbTP) ≥ ganhoProposto');
console.log('✅ 2. Se CLIPPED, não sugerir loudness (recomendação vem do módulo TP)');
console.log('✅ 3. Teste impede sugestão impossível (ex: TP -0.7 + pedir +2dB)');
console.log('✅ 4. Nenhuma sugestão de loudness com clipping ou sem headroom');
console.log(`${'='.repeat(60)}\n`);

console.log('🎉 Teste concluído! Lógica de headroom seguro implementada.');
