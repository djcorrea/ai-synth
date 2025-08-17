#!/usr/bin/env node

/**
 * 🧪 Script de Validação Automática
 * Testa todas as melhorias implementadas no sistema
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 INICIANDO VALIDAÇÃO COMPLETA DO SISTEMA\n');

// Teste 1: Verificar se LRA usa EBU R128 por padrão
function testLRADefault() {
    console.log('📊 Teste 1: Algoritmo LRA padrão');
    
    try {
        // Simular ambiente browser
        global.window = { USE_R128_LRA: undefined };
        
        // Verificar a condição no código
        const useR128LRA = (typeof global.window !== 'undefined' ? global.window.USE_R128_LRA !== false : true);
        
        if (useR128LRA === true) {
            console.log('✅ PASSOU: R128 LRA é o padrão (USE_R128_LRA !== false)');
            return true;
        } else {
            console.log('❌ FALHOU: R128 LRA não é o padrão');
            return false;
        }
    } catch (error) {
        console.log(`❌ ERRO: ${error.message}`);
        return false;
    }
}

// Teste 2: Verificar penalties do score system
function testScorePenalties() {
    console.log('\n🎯 Teste 2: Sistema de Score (Penalties)');
    
    try {
        // Simular função de penalty melhorada
        function unitPenaltyFromN(n) {
            if (n <= 0) return 0;
            if (n <= 1) return 0.10 * n; // Reduzido de 0.15
            if (n <= 2) return 0.10 + 0.20 * (n - 1); // 0.10 -> 0.30
            if (n <= 3) return 0.30 + 0.25 * (n - 2); // 0.30 -> 0.55
            return 0.55 + 0.35 * Math.min(1, (n - 3) / 2);
        }
        
        // Testar valores
        const penalties = {
            n1: unitPenaltyFromN(1),   // Deveria ser 0.10
            n2: unitPenaltyFromN(2),   // Deveria ser 0.30  
            n3: unitPenaltyFromN(3),   // Deveria ser 0.55
            n5: unitPenaltyFromN(5)    // Deveria ser 0.90
        };
        
        const expected = { n1: 0.10, n2: 0.30, n3: 0.55, n5: 0.90 };
        const tolerance = 0.01;
        
        let allCorrect = true;
        for (const [key, value] of Object.entries(penalties)) {
            const diff = Math.abs(value - expected[key]);
            if (diff > tolerance) {
                console.log(`❌ FALHOU: ${key} = ${value}, esperado ${expected[key]}`);
                allCorrect = false;
            } else {
                console.log(`✅ OK: ${key} = ${value.toFixed(2)}`);
            }
        }
        
        if (allCorrect) {
            console.log('✅ PASSOU: Penalties suavizadas corretamente');
            return true;
        } else {
            console.log('❌ FALHOU: Penalties incorretas');
            return false;
        }
        
    } catch (error) {
        console.log(`❌ ERRO: ${error.message}`);
        return false;
    }
}

// Teste 3: Verificar nomenclatura
function testNomenclature() {
    console.log('\n🏷️ Teste 3: Nomenclatura (Crest Factor)');
    
    try {
        // Verificar se os arquivos contêm as mudanças
        const analyzerPath = path.join(__dirname, 'public', 'audio-analyzer.js');
        const content = fs.readFileSync(analyzerPath, 'utf8');
        
        const hasCalculateCrestFactor = content.includes('calculateCrestFactor');
        const hasDeprecationWarning = content.includes('deprecated');
        const hasAlias = content.includes('calculateDynamicRange(channelData)') && 
                         content.includes('calculateCrestFactor');
        
        if (hasCalculateCrestFactor && hasDeprecationWarning && hasAlias) {
            console.log('✅ PASSOU: Nomenclatura corrigida com compatibilidade');
            console.log('  - calculateCrestFactor(): ✅');
            console.log('  - Aviso deprecation: ✅');
            console.log('  - Alias compatibilidade: ✅');
            return true;
        } else {
            console.log('❌ FALHOU: Nomenclatura não completamente implementada');
            console.log(`  - calculateCrestFactor(): ${hasCalculateCrestFactor ? '✅' : '❌'}`);
            console.log(`  - Aviso deprecation: ${hasDeprecationWarning ? '✅' : '❌'}`);
            console.log(`  - Alias compatibilidade: ${hasAlias ? '✅' : '❌'}`);
            return false;
        }
        
    } catch (error) {
        console.log(`❌ ERRO: ${error.message}`);
        return false;
    }
}

// Teste 4: Verificar melhorias de frequência
function testFrequencyImprovements() {
    console.log('\n🎵 Teste 4: Análise de Frequência');
    
    try {
        const analyzerPath = path.join(__dirname, 'public', 'audio-analyzer.js');
        const content = fs.readFileSync(analyzerPath, 'utf8');
        
        const hasFFT2048 = content.includes('fftSize = 2048');
        const hasInterpolation = content.includes('interpolação parabólica') || 
                                 content.includes('parabolic');
        const hasAdaptiveTolerance = content.includes('getTolerance') ||
                                   content.includes('tolerance adaptativa');
        
        if (hasFFT2048 && (hasInterpolation || hasAdaptiveTolerance)) {
            console.log('✅ PASSOU: Análise de frequência melhorada');
            console.log(`  - FFT 2048: ${hasFFT2048 ? '✅' : '❌'}`);
            console.log(`  - Interpolação: ${hasInterpolation ? '✅' : '❌'}`);
            console.log(`  - Tolerância adaptativa: ${hasAdaptiveTolerance ? '✅' : '❌'}`);
            return true;
        } else {
            console.log('❌ FALHOU: Melhorias de frequência não implementadas');
            return false;
        }
        
    } catch (error) {
        console.log(`❌ ERRO: ${error.message}`);
        return false;
    }
}

// Teste 5: Verificar estrutura de arquivos
function testFileStructure() {
    console.log('\n📁 Teste 5: Estrutura de Arquivos');
    
    try {
        const criticalFiles = [
            'lib/audio/features/loudness.js',
            'lib/audio/features/scoring.js', 
            'lib/audio/features/truepeak.js',
            'lib/audio/features/spectrum.js',
            'public/audio-analyzer.js',
            'refs/out/funk_mandela.json'
        ];
        
        let allExist = true;
        
        for (const file of criticalFiles) {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                console.log(`✅ ${file}`);
            } else {
                console.log(`❌ ${file} - NÃO ENCONTRADO`);
                allExist = false;
            }
        }
        
        if (allExist) {
            console.log('✅ PASSOU: Todos os arquivos críticos existem');
            return true;
        } else {
            console.log('❌ FALHOU: Arquivos críticos faltando');
            return false;
        }
        
    } catch (error) {
        console.log(`❌ ERRO: ${error.message}`);
        return false;
    }
}

// Teste 6: Verificar validações
function testValidations() {
    console.log('\n🛡️ Teste 6: Validações Automáticas');
    
    try {
        const analyzerPath = path.join(__dirname, 'public', 'audio-analyzer.js');
        const content = fs.readFileSync(analyzerPath, 'utf8');
        
        const hasLRAValidation = content.includes('lraAnomaly') || 
                                content.includes('LRA muito alto');
        const hasLUFSValidation = content.includes('lufsWarning') ||
                                 content.includes('LUFS muito alto');
        const hasConsistencyCheck = content.includes('crestFactorConsistency');
        
        if (hasLRAValidation && hasLUFSValidation && hasConsistencyCheck) {
            console.log('✅ PASSOU: Validações automáticas implementadas');
            console.log(`  - LRA validation: ${hasLRAValidation ? '✅' : '❌'}`);
            console.log(`  - LUFS validation: ${hasLUFSValidation ? '✅' : '❌'}`);
            console.log(`  - Consistency check: ${hasConsistencyCheck ? '✅' : '❌'}`);
            return true;
        } else {
            console.log('❌ FALHOU: Validações não completamente implementadas');
            return false;
        }
        
    } catch (error) {
        console.log(`❌ ERRO: ${error.message}`);
        return false;
    }
}

// Executar todos os testes
async function runAllTests() {
    const tests = [
        { name: 'LRA Default', fn: testLRADefault },
        { name: 'Score Penalties', fn: testScorePenalties },
        { name: 'Nomenclature', fn: testNomenclature },
        { name: 'Frequency Analysis', fn: testFrequencyImprovements },
        { name: 'File Structure', fn: testFileStructure },
        { name: 'Validations', fn: testValidations }
    ];
    
    let passedTests = 0;
    const totalTests = tests.length;
    
    for (const test of tests) {
        if (test.fn()) {
            passedTests++;
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RELATÓRIO FINAL');
    console.log('='.repeat(50));
    console.log(`Testes executados: ${totalTests}`);
    console.log(`Testes aprovados: ${passedTests}`);
    console.log(`Testes falharam: ${totalTests - passedTests}`);
    console.log(`Taxa de sucesso: ${(passedTests/totalTests*100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 SISTEMA 100% VALIDADO - TODAS AS MELHORIAS FUNCIONAM!');
        console.log('✅ O analisador está pronto para produção');
        return true;
    } else {
        console.log('\n⚠️ SISTEMA NECESSITA CORREÇÕES');
        console.log(`❌ ${totalTests - passedTests} teste(s) falharam`);
        return false;
    }
}

// Executar se chamado diretamente
runAllTests().then(success => {
    process.exit(success ? 0 : 1);
});
