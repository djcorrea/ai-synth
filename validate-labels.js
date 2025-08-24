/**
 * 🔍 QUICK VALIDATION SCRIPT - Label Corrections
 * 
 * Script para validação rápida das correções de rótulos implementadas
 */

import fs from 'fs';

console.log('🔍 INICIANDO VALIDAÇÃO RÁPIDA DE RÓTULOS...\n');

try {
    const integrationFile = fs.readFileSync('public/audio-analyzer-integration.js', 'utf8');
    
    // Checagens de rótulos corretos (devem estar presentes)
    const correctLabels = [
        'Loudness Integrado (LUFS)',
        'Faixa de Loudness – LRA (LU)',
        'Pico Real (dBTP)',
        'Fator de Crista',
        'Pico de Amostra L (dBFS)',
        'Pico de Amostra R (dBFS)',
        'Peak (máximo)'
    ];
    
    // Checagens de rótulos proibidos (NÃO devem estar presentes)
    const forbiddenLabels = [
        'Volume Integrado (padrão streaming)',
        'True Peak',
        'Crest Factor',
        'Sample Peak (L)',
        'Sample Peak (R)',
        'Dinâmica (LUFS)',
        /LRA[^(].*dB/g  // LRA seguido de dB (deve ser LU)
    ];
    
    let correctFound = 0;
    let forbiddenFound = 0;
    
    console.log('✅ VERIFICANDO RÓTULOS CORRETOS:');
    correctLabels.forEach(label => {
        if (integrationFile.includes(label)) {
            console.log(`   ✅ Encontrado: "${label}"`);
            correctFound++;
        } else {
            console.log(`   ❌ FALTANDO: "${label}"`);
        }
    });
    
    console.log('\n🚫 VERIFICANDO RÓTULOS PROIBIDOS:');
    forbiddenLabels.forEach(label => {
        if (typeof label === 'string') {
            if (integrationFile.includes(label)) {
                console.log(`   ❌ ENCONTRADO (PROIBIDO): "${label}"`);
                forbiddenFound++;
            } else {
                console.log(`   ✅ Não encontrado: "${label}"`);
            }
        } else {
            // RegExp
            const matches = integrationFile.match(label);
            if (matches && matches.length > 0) {
                console.log(`   ❌ ENCONTRADO (PROIBIDO): Padrão LRA+dB: ${matches.length} ocorrências`);
                forbiddenFound++;
            } else {
                console.log(`   ✅ Não encontrado: Padrão LRA+dB`);
            }
        }
    });
    
    // Verificação específica de unidades
    console.log('\n📏 VERIFICANDO UNIDADES:');
    
    // LRA deve ter LU, não dB
    const lraWithLU = (integrationFile.match(/LRA.*LU/g) || []).length;
    const lraWithDB = (integrationFile.match(/LRA.*[^d]dB(?!TP)/g) || []).length;
    
    console.log(`   LRA com LU: ${lraWithLU} ocorrências`);
    console.log(`   LRA com dB: ${lraWithDB} ocorrências ${lraWithDB > 0 ? '❌' : '✅'}`);
    
    // dBFS para sample peaks
    const dbfsCount = (integrationFile.match(/dBFS/g) || []).length;
    console.log(`   dBFS presente: ${dbfsCount} ocorrências ${dbfsCount >= 2 ? '✅' : '❌'}`);
    
    // dBTP para true peak
    const dbtpCount = (integrationFile.match(/dBTP/g) || []).length;
    console.log(`   dBTP presente: ${dbtpCount} ocorrências ${dbtpCount >= 1 ? '✅' : '❌'}`);
    
    // Resumo final
    console.log('\n📊 RESUMO DA VALIDAÇÃO:');
    console.log(`   Rótulos corretos: ${correctFound}/${correctLabels.length}`);
    console.log(`   Rótulos proibidos: ${forbiddenFound} (deve ser 0)`);
    console.log(`   Unidades corretas: ${lraWithDB === 0 && dbfsCount >= 2 && dbtpCount >= 1 ? 'SIM' : 'NÃO'}`);
    
    const success = correctFound === correctLabels.length && forbiddenFound === 0 && lraWithDB === 0;
    
    console.log(`\n🎯 RESULTADO: ${success ? '✅ APROVADO' : '❌ FALHOU'}`);
    
    if (success) {
        console.log('   Todas as correções foram implementadas corretamente!');
        console.log('   A interface está pronta para produção.');
    } else {
        console.log('   Algumas correções ainda precisam ser aplicadas.');
        console.log('   Verifique os itens marcados como ❌ acima.');
    }
    
} catch (error) {
    console.error('❌ Erro durante validação:', error.message);
}

console.log('\n🔍 VALIDAÇÃO CONCLUÍDA');
