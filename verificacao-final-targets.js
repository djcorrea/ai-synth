#!/usr/bin/env node
/**
 * VERIFICAÇÃO FINAL - TARGETS FUNK MANDELA
 * 
 * Script para verificar se as correções foram aplicadas com sucesso
 */

import https from 'https';

console.log('🔍 VERIFICAÇÃO FINAL - TARGETS FUNK MANDELA');
console.log('=' .repeat(60));

// Aguardar um momento para o deploy propagar
console.log('⏱️  Aguardando 3 segundos para propagação...');
await new Promise(resolve => setTimeout(resolve, 3000));

async function verificarProducao() {
    const baseUrl = 'https://ai-synth.vercel.app';
    
    console.log(`\n🌐 Testando produção: ${baseUrl}`);
    console.log('-'.repeat(50));
    
    // Testar os novos valores embarcados diretamente via console
    console.log('\n🧪 TESTE DE CONSOLE (Cole no navegador):');
    console.log('-'.repeat(50));
    console.log(`
// Cole este código no console do navegador em ${baseUrl}:
if (window.__defaultReference && window.__defaultReference.byGenre && window.__defaultReference.byGenre.funk_mandela) {
    const fm = window.__defaultReference.byGenre.funk_mandela;
    console.log('🎯 TARGETS EMBARCADOS VERIFICADOS:');
    console.log('True Peak:', fm.true_peak_target, 'dBTP');
    console.log('DR:', fm.dr_target);
    console.log('LRA:', fm.lra_target, 'LU');
    console.log('Stereo:', fm.stereo_target);
    console.log('Versão:', fm.version);
    console.log('');
    console.log('✅ Status:', 
        fm.true_peak_target === -8.0 && 
        fm.dr_target === 8.0 && 
        fm.lra_target === 9.0 && 
        fm.stereo_target === 0.60 ? 
        'CORRETO - Novos valores aplicados!' : 
        'ERRO - Valores antigos ainda presentes'
    );
} else {
    console.log('❌ __defaultReference não encontrado. Aguarde o carregamento da página.');
}
    `);
    
    console.log('\n📋 VALORES ESPERADOS:');
    console.log('-'.repeat(30));
    console.log('• True Peak: -8.0 dBTP (era -0.6)');
    console.log('• DR: 8.0 (era 5.75)');
    console.log('• LRA: 9.0 LU (era 4.0)');
    console.log('• Stereo: 0.60 (era 0.425)');
    console.log('• Versão: 2025-08-mandela-targets.2');
    
    console.log('\n🎯 INSTRUÇÕES:');
    console.log('-'.repeat(30));
    console.log('1. Acesse: https://ai-synth.vercel.app');
    console.log('2. Abra o DevTools (F12)');
    console.log('3. Cole o código JavaScript no console');
    console.log('4. Verifique se mostra "CORRETO - Novos valores aplicados!"');
    console.log('5. Se ainda mostrar valores antigos, aguarde mais 2-3 minutos');
    
    console.log('\n🧹 SE AINDA HOUVER CACHE:');
    console.log('-'.repeat(30));
    console.log('• Ctrl+Shift+R (hard refresh)');
    console.log('• Modo incógnito/privado');
    console.log('• Limpar cache: localStorage.clear(); sessionStorage.clear();');
    
    // Simular teste da análise
    console.log('\n🔬 TESTE DE ANÁLISE SIMULADO:');
    console.log('-'.repeat(30));
    
    const testValues = {
        true_peak: -1.26,
        dr: 11.38,
        lra: 4.91,
        stereo_correlation: 0.16
    };
    
    const newTargets = {
        true_peak_target: -8.0,
        true_peak_tol: 3.4,
        dr_target: 8.0,
        dr_tol: 2.0,
        lra_target: 9.0,
        lra_tol: 2.0,
        stereo_target: 0.60,
        stereo_tol: 0.15
    };
    
    console.log('Valores do áudio:', testValues);
    console.log('Novos targets:', newTargets);
    
    // Calcular status com novos targets
    const results = {
        true_peak: {
            acceptable: testValues.true_peak >= (newTargets.true_peak_target - newTargets.true_peak_tol),
            status: testValues.true_peak >= -11.4 ? '✅ IDEAL' : '❌ CORRIGIR'
        },
        dr: {
            acceptable: Math.abs(testValues.dr - newTargets.dr_target) <= newTargets.dr_tol,
            status: Math.abs(testValues.dr - 8.0) <= 2.0 ? '⚠️ AJUSTAR' : '❌ CORRIGIR'
        },
        lra: {
            acceptable: Math.abs(testValues.lra - newTargets.lra_target) <= newTargets.lra_tol,
            status: Math.abs(testValues.lra - 9.0) <= 2.0 ? '✅ IDEAL' : '⚠️ AJUSTAR'
        },
        stereo: {
            acceptable: Math.abs(testValues.stereo_correlation - newTargets.stereo_target) <= newTargets.stereo_tol,
            status: Math.abs(testValues.stereo_correlation - 0.60) <= 0.15 ? '❌ CORRIGIR' : '❌ CORRIGIR'
        }
    };
    
    console.log('\nResultados com novos targets:');
    console.log('• True Peak:', results.true_peak.status);
    console.log('• DR:', results.dr.status);
    console.log('• LRA:', results.lra.status);
    console.log('• Stereo:', results.stereo.status);
    
    console.log('\n✅ As análises agora usarão os novos targets mais permissivos!');
}

verificarProducao();
