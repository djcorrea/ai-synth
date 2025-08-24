#!/usr/bin/env node
/**
 * AUDITORIA DE TOLERÂNCIAS - FUNK MANDELA
 * 
 * Localiza todos os pontos onde tolerâncias são definidas para atualização
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 AUDITORIA DE TOLERÂNCIAS - FUNK MANDELA');
console.log('=' .repeat(70));

// Pontos a verificar
const arquivosParaVerificar = [
    'public/audio-analyzer-integration.js',
    'refs/out/funk_mandela.json',
    'public/refs/out/funk_mandela.json'
];

const toleranciasAlvo = {
    lufs_integrated: { target: -8, tolerance: 2.5, unit: 'LUFS' },
    true_peak_dbtp: { target: -8.0, tolerance: 3.40, unit: 'dBTP' },
    dynamic_range: { target: 8, tolerance: 3.0, unit: 'unidades' },
    stereo_correlation: { target: 0.60, tolerance: 0.25, unit: 'correlação' },
    bands: {
        sub: { target: -7.2, tolerance: 2.5, unit: 'dB' },
        low_bass: { target: -8.9, tolerance: 2.5, unit: 'dB' },
        upper_bass: { target: -12.8, tolerance: 2.5, unit: 'dB' },
        low_mid: { target: -9.2, tolerance: 2.0, unit: 'dB' },
        mid: { target: -6.8, tolerance: 1.5, unit: 'dB' },
        high_mid: { target: -12.3, tolerance: 1.5, unit: 'dB' },
        brilho: { target: -16.2, tolerance: 2.0, unit: 'dB' },
        presenca: { target: -19.1, tolerance: 2.5, unit: 'dB' }
    }
};

console.log('\n📋 TOLERÂNCIAS ALVO ESPECIFICADAS:');
console.log('-'.repeat(50));
console.log(`LUFS Integrado: ${toleranciasAlvo.lufs_integrated.target} ±${toleranciasAlvo.lufs_integrated.tolerance} ${toleranciasAlvo.lufs_integrated.unit}`);
console.log(`True Peak: ${toleranciasAlvo.true_peak_dbtp.target} ±${toleranciasAlvo.true_peak_dbtp.tolerance} ${toleranciasAlvo.true_peak_dbtp.unit}`);
console.log(`Dynamic Range: ${toleranciasAlvo.dynamic_range.target} ±${toleranciasAlvo.dynamic_range.tolerance} ${toleranciasAlvo.dynamic_range.unit}`);
console.log(`Stereo Correlation: ${toleranciasAlvo.stereo_correlation.target} ±${toleranciasAlvo.stereo_correlation.tolerance} ${toleranciasAlvo.stereo_correlation.unit}`);
console.log('\nBandas Espectrais:');
Object.entries(toleranciasAlvo.bands).forEach(([banda, config]) => {
    console.log(`  ${banda}: ${config.target} ±${config.tolerance} ${config.unit}`);
});

// Função para encontrar tolerâncias em arquivos
function encontrarTolerancia(conteudo, padroes) {
    const resultados = [];
    
    padroes.forEach(padrao => {
        const matches = conteudo.match(new RegExp(padrao, 'gi'));
        if (matches) {
            matches.forEach(match => {
                resultados.push(match);
            });
        }
    });
    
    return resultados;
}

// Padrões para buscar tolerâncias
const padroesBusca = [
    'tol_lufs[^\\w]*[:\\s]*[\\d\\.]+',
    'tol_true_peak[^\\w]*[:\\s]*[\\d\\.]+',
    'tol_dr[^\\w]*[:\\s]*[\\d\\.]+',
    'tol_stereo[^\\w]*[:\\s]*[\\d\\.]+',
    'tol_lra[^\\w]*[:\\s]*[\\d\\.]+',
    'tolerance[^\\w]*[:\\s]*[\\d\\.]+',
    'toleranceDb[^\\w]*[:\\s]*[\\d\\.]+',
    'tol_db[^\\w]*[:\\s]*[\\d\\.]+',
    'tolerance.*[:\\s]*[\\d\\.]+',
    'LUFS.*[±][\\d\\.]+',
    'dBTP.*[±][\\d\\.]+',
    'DR.*[±][\\d\\.]+',
    'LU.*[±][\\d\\.]+'
];

console.log('\n🔍 AUDITORIA DOS ARQUIVOS:');
console.log('-'.repeat(50));

for (const arquivo of arquivosParaVerificar) {
    console.log(`\n📂 ${arquivo}:`);
    
    try {
        const conteudo = fs.readFileSync(arquivo, 'utf8');
        const toleranciasEncontradas = encontrarTolerancia(conteudo, padroesBusca);
        
        if (toleranciasEncontradas.length > 0) {
            console.log('   📊 Tolerâncias encontradas:');
            toleranciasEncontradas.forEach(tol => {
                console.log(`     • ${tol}`);
            });
        } else {
            console.log('   ❌ Nenhuma tolerância encontrada');
        }
        
        // Verificar seções específicas funk_mandela
        if (conteudo.includes('funk_mandela')) {
            const funkMandelaMatches = conteudo.match(/funk_mandela[\s\S]*?(?=\w+:|$)/g);
            if (funkMandelaMatches) {
                console.log('   🎵 Seção funk_mandela encontrada');
                
                // Procurar por valores específicos dentro da seção
                funkMandelaMatches.forEach(secao => {
                    const toleranciasSecao = encontrarTolerancia(secao, padroesBusca);
                    toleranciasSecao.forEach(tol => {
                        console.log(`     🎯 funk_mandela: ${tol}`);
                    });
                });
            }
        }
        
    } catch (error) {
        console.log(`   ❌ Erro ao ler arquivo: ${error.message}`);
    }
}

// Verificar arquivos de teste
console.log('\n🧪 VERIFICANDO ARQUIVOS DE TESTE:');
console.log('-'.repeat(50));

try {
    const arquivosTeste = fs.readdirSync('.').filter(f => 
        f.includes('test') && (f.endsWith('.js') || f.endsWith('.ts'))
    );
    
    if (arquivosTeste.length > 0) {
        console.log('📋 Arquivos de teste encontrados:');
        arquivosTeste.forEach(arquivo => {
            console.log(`   • ${arquivo}`);
        });
    } else {
        console.log('❌ Nenhum arquivo de teste encontrado');
    }
} catch (error) {
    console.log('❌ Erro ao listar arquivos de teste');
}

console.log('\n' + '='.repeat(70));
console.log('📝 PRÓXIMOS PASSOS:');
console.log('1. Atualizar tolerâncias nos arquivos JSON');
console.log('2. Atualizar valores embarcados no JavaScript');
console.log('3. Verificar validações e comparações');
console.log('4. Atualizar mensagens e cores da UI');
console.log('5. Criar/atualizar testes de validação');
console.log('=' .repeat(70));
