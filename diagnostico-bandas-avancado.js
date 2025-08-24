#!/usr/bin/env node
/**
 * DIAGNÓSTICO AVANÇADO - BANDAS ESPECTRAIS FUNK MANDELA
 * 
 * Verifica todos os locais onde os valores das bandas podem estar sendo carregados
 */

import fs from 'fs';
import https from 'https';

console.log('🔍 DIAGNÓSTICO AVANÇADO - BANDAS ESPECTRAIS FUNK MANDELA');
console.log('=' .repeat(70));

// 1. Verificar valores atuais nos arquivos JSON locais
console.log('\n📁 1. VERIFICAÇÃO DOS ARQUIVOS JSON LOCAIS:');
console.log('-'.repeat(50));

const arquivosJson = [
    'c:/Users/DJ Correa/Desktop/Programação/ai-synth/refs/out/funk_mandela.json',
    'c:/Users/DJ Correa/Desktop/Programação/ai-synth/public/refs/out/funk_mandela.json'
];

for (const arquivo of arquivosJson) {
    try {
        const content = fs.readFileSync(arquivo, 'utf8');
        const data = JSON.parse(content);
        
        console.log(`\n📋 ${arquivo}:`);
        
        // Verificar seção tonalCurve
        if (data.funk_mandela?.flex?.tonalCurve?.bands) {
            console.log('   🎵 Seção tonalCurve.bands:');
            data.funk_mandela.flex.tonalCurve.bands.forEach(banda => {
                console.log(`     ${banda.name}: ${banda.target_db} dB (tol: ${banda.toleranceDb})`);
            });
        }
        
        // Verificar seção legacy_compatibility
        if (data.funk_mandela?.legacy_compatibility?.bands) {
            console.log('   📦 Seção legacy_compatibility.bands:');
            Object.entries(data.funk_mandela.legacy_compatibility.bands).forEach(([nome, banda]) => {
                console.log(`     ${nome}: ${banda.target_db} dB (tol: ${banda.tol_db})`);
            });
        }
        
        console.log(`   📅 Versão: ${data.funk_mandela?.version || 'N/A'}`);
        console.log(`   🕒 Last updated: ${data.funk_mandela?.last_updated || 'N/A'}`);
        
    } catch (error) {
        console.log(`❌ ${arquivo}: ERRO - ${error.message}`);
    }
}

// 2. Verificar valores embarcados no código JavaScript
console.log('\n💻 2. VERIFICAÇÃO DO CÓDIGO JAVASCRIPT:');
console.log('-'.repeat(50));

const analyzerPath = 'c:/Users/DJ Correa/Desktop/Programação/ai-synth/public/audio-analyzer-integration.js';
try {
    const analyzerContent = fs.readFileSync(analyzerPath, 'utf8');
    
    // Procurar pela seção bands embarcada
    const bandsMatch = analyzerContent.match(/bands:\s*\{[\s\S]*?\}/);
    if (bandsMatch) {
        console.log('🎵 Seção bands embarcada encontrada:');
        console.log(bandsMatch[0]);
        
        // Extrair valores específicos
        const bandTargets = {
            sub: analyzerContent.match(/sub:\{target_db:(-?\d+\.?\d*)/)?.[1],
            low_bass: analyzerContent.match(/low_bass:\{target_db:(-?\d+\.?\d*)/)?.[1],
            upper_bass: analyzerContent.match(/upper_bass:\{target_db:(-?\d+\.?\d*)/)?.[1],
            low_mid: analyzerContent.match(/low_mid:\{target_db:(-?\d+\.?\d*)/)?.[1],
            mid: analyzerContent.match(/mid:\{target_db:(-?\d+\.?\d*)/)?.[1],
            high_mid: analyzerContent.match(/high_mid:\{target_db:(-?\d+\.?\d*)/)?.[1],
            brilho: analyzerContent.match(/brilho:\{target_db:(-?\d+\.?\d*)/)?.[1],
            presenca: analyzerContent.match(/presenca:\{target_db:(-?\d+\.?\d*)/)?.[1]
        };
        
        console.log('\n📊 Valores extraídos do código embarcado:');
        Object.entries(bandTargets).forEach(([banda, valor]) => {
            console.log(`   ${banda}: ${valor} dB`);
        });
    } else {
        console.log('❌ Seção bands embarcada NÃO encontrada');
    }
    
} catch (error) {
    console.log(`❌ Erro ao ler analyzer: ${error.message}`);
}

// 3. Verificar URLs de produção
console.log('\n🌐 3. TESTE DAS URLs DE PRODUÇÃO:');
console.log('-'.repeat(50));

async function testarUrlProducao(url) {
    return new Promise((resolve) => {
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const bands = json.funk_mandela?.flex?.tonalCurve?.bands || [];
                    resolve({
                        url,
                        status: res.statusCode,
                        bands: bands.reduce((acc, banda) => {
                            acc[banda.name] = banda.target_db;
                            return acc;
                        }, {}),
                        version: json.funk_mandela?.version
                    });
                } catch (error) {
                    resolve({
                        url,
                        status: res.statusCode,
                        error: 'JSON inválido',
                        data: data.substring(0, 200)
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            resolve({ url, error: error.message });
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            resolve({ url, error: 'Timeout' });
        });
    });
}

const urlsProducao = [
    'https://ai-synth.vercel.app/refs/out/funk_mandela.json',
    'https://ai-synth.vercel.app/public/refs/out/funk_mandela.json'
];

for (const url of urlsProducao) {
    const result = await testarUrlProducao(url);
    console.log(`\n🔗 ${url}:`);
    if (result.error) {
        console.log(`   ❌ Erro: ${result.error}`);
        if (result.data) {
            console.log(`   📄 Conteúdo: ${result.data}...`);
        }
    } else {
        console.log(`   ✅ Status: ${result.status}`);
        console.log(`   📋 Versão: ${result.version}`);
        console.log(`   🎵 Bandas:`);
        Object.entries(result.bands).forEach(([banda, valor]) => {
            console.log(`     ${banda}: ${valor} dB`);
        });
    }
}

// 4. Comparação com valores esperados
console.log('\n📊 4. COMPARAÇÃO COM VALORES ESPERADOS:');
console.log('-'.repeat(50));

const valoresEsperados = {
    sub: -7.2,
    low_bass: -8.9,
    upper_bass: -12.8,
    low_mid: -9.2,
    mid: -6.8,
    high_mid: -12.3,
    brilho: -16.2,
    presenca: -19.1
};

console.log('📋 Valores que DEVERIAM estar aparecendo:');
Object.entries(valoresEsperados).forEach(([banda, valor]) => {
    console.log(`   ${banda}: ${valor} dB`);
});

// 5. Instruções para cache
console.log('\n🧹 5. INSTRUÇÕES PARA LIMPEZA DE CACHE:');
console.log('-'.repeat(50));
console.log('Para forçar atualização no navegador:');
console.log('1. Ctrl+Shift+R (hard refresh)');
console.log('2. Modo incógnito/privado');
console.log('3. DevTools → Application → Storage → Clear storage');
console.log('4. DevTools → Network → Disable cache');
console.log('5. Console: location.reload(true)');

// 6. Verificar se há outras seções que podem estar sobrescrevendo
console.log('\n🔍 6. PROCURAR OUTRAS FONTES DE DADOS:');
console.log('-'.repeat(50));

try {
    const analyzerContent = fs.readFileSync(analyzerPath, 'utf8');
    
    // Procurar por referências embarcadas alternativas
    const defaultRefMatch = analyzerContent.match(/__defaultReference|defaultReference|byGenre/);
    console.log(`🔍 __defaultReference encontrado: ${defaultRefMatch ? 'SIM' : 'NÃO'}`);
    
    // Procurar por valores hard-coded das bandas
    const hardcodedValues = [
        { value: '-8.0', matches: (analyzerContent.match(/-8\.0/g) || []).length },
        { value: '-12.0', matches: (analyzerContent.match(/-12\.0/g) || []).length },
        { value: '-6.3', matches: (analyzerContent.match(/-6\.3/g) || []).length },
        { value: '-11.2', matches: (analyzerContent.match(/-11\.2/g) || []).length },
        { value: '-14.8', matches: (analyzerContent.match(/-14\.8/g) || []).length },
        { value: '-19.2', matches: (analyzerContent.match(/-19\.2/g) || []).length }
    ];
    
    console.log('🔍 Valores antigos ainda presentes no código:');
    hardcodedValues.forEach(({ value, matches }) => {
        if (matches > 0) {
            console.log(`   ${value}: ${matches} ocorrências`);
        }
    });
    
} catch (error) {
    console.log(`❌ Erro na verificação: ${error.message}`);
}

console.log('\n' + '='.repeat(70));
console.log('🎯 DIAGNÓSTICO CONCLUÍDO');
console.log('=' .repeat(70));
