#!/usr/bin/env node
/**
 * DIAGNÓSTICO COMPLETO - TARGETS FUNK MANDELA
 * 
 * Análise profunda para descobrir por que os valores antigos ainda aparecem
 */

import fs from 'fs';
import https from 'https';
import http from 'http';

console.log('🔍 DIAGNÓSTICO COMPLETO - TARGETS FUNK MANDELA');
console.log('=' .repeat(70));

// 1. Verificar arquivos locais
console.log('\n📁 1. VERIFICAÇÃO DOS ARQUIVOS LOCAIS:');
console.log('-'.repeat(50));

const localPaths = [
    'c:/Users/DJ Correa/Desktop/Programação/ai-synth/refs/out/funk_mandela.json',
    'c:/Users/DJ Correa/Desktop/Programação/ai-synth/public/refs/out/funk_mandela.json'
];

for (const path of localPaths) {
    try {
        const content = fs.readFileSync(path, 'utf8');
        const data = JSON.parse(content);
        const truePeak = data.funk_mandela?.legacy_compatibility?.true_peak_target;
        const dr = data.funk_mandela?.legacy_compatibility?.dr_target;
        const lra = data.funk_mandela?.legacy_compatibility?.lra_target;
        const stereo = data.funk_mandela?.legacy_compatibility?.stereo_target;
        
        console.log(`📋 ${path}:`);
        console.log(`   True Peak: ${truePeak}`);
        console.log(`   DR: ${dr}`);
        console.log(`   LRA: ${lra}`);
        console.log(`   Stereo: ${stereo}`);
        console.log(`   Timestamp: ${new Date(fs.statSync(path).mtime).toISOString()}`);
    } catch (error) {
        console.log(`❌ ${path}: ERRO - ${error.message}`);
    }
}

// 2. Verificar status do Git
console.log('\n📦 2. STATUS DO GIT:');
console.log('-'.repeat(50));

import { execSync } from 'child_process';

try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8', cwd: 'c:/Users/DJ Correa/Desktop/Programação/ai-synth' });
    console.log(`Git Status: ${gitStatus.trim() || 'Limpo'}`);
    
    const lastCommit = execSync('git log -1 --oneline', { encoding: 'utf8', cwd: 'c:/Users/DJ Correa/Desktop/Programação/ai-synth' });
    console.log(`Último commit: ${lastCommit.trim()}`);
    
    const branch = execSync('git branch --show-current', { encoding: 'utf8', cwd: 'c:/Users/DJ Correa/Desktop/Programação/ai-synth' });
    console.log(`Branch atual: ${branch.trim()}`);
} catch (error) {
    console.log(`❌ Erro Git: ${error.message}`);
}

// 3. Testar URLs de produção
console.log('\n🌐 3. TESTE DAS URLs DE PRODUÇÃO:');
console.log('-'.repeat(50));

const testUrls = [
    'https://ai-synth.vercel.app/refs/out/funk_mandela.json',
    'https://ai-synth.vercel.app/public/refs/out/funk_mandela.json'
];

async function testUrl(url) {
    return new Promise((resolve) => {
        const client = url.startsWith('https:') ? https : http;
        
        const req = client.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const truePeak = json.funk_mandela?.legacy_compatibility?.true_peak_target;
                    resolve({
                        url,
                        status: res.statusCode,
                        truePeak,
                        size: data.length,
                        headers: res.headers
                    });
                } catch (error) {
                    resolve({
                        url,
                        status: res.statusCode,
                        error: 'JSON inválido',
                        data: data.substring(0, 200) + '...',
                        size: data.length
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            resolve({
                url,
                error: error.message
            });
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            resolve({
                url,
                error: 'Timeout'
            });
        });
    });
}

// Executar testes das URLs
for (const url of testUrls) {
    const result = await testUrl(url);
    console.log(`🔗 ${url}:`);
    if (result.error) {
        console.log(`   ❌ Erro: ${result.error}`);
        if (result.data) {
            console.log(`   📄 Conteúdo: ${result.data}`);
        }
    } else {
        console.log(`   ✅ Status: ${result.status}`);
        console.log(`   🎯 True Peak: ${result.truePeak}`);
        console.log(`   📊 Tamanho: ${result.size} bytes`);
        if (result.headers['cache-control']) {
            console.log(`   🕒 Cache: ${result.headers['cache-control']}`);
        }
    }
}

// 4. Verificar cache do navegador
console.log('\n🧹 4. INSTRUÇÕES PARA LIMPEZA DE CACHE:');
console.log('-'.repeat(50));
console.log('Para limpar cache do navegador:');
console.log('1. Pressione Ctrl+Shift+R (hard refresh)');
console.log('2. Abra DevTools (F12) → Network → Disable cache');
console.log('3. Console: localStorage.clear(); sessionStorage.clear();');
console.log('4. Cache API: caches.keys().then(names => names.forEach(name => caches.delete(name)));');

// 5. Verificar código do analisador
console.log('\n💻 5. VERIFICAÇÃO DO CÓDIGO DO ANALISADOR:');
console.log('-'.repeat(50));

const analyzerPath = 'c:/Users/DJ Correa/Desktop/Programação/ai-synth/public/audio-analyzer-integration.js';
try {
    const analyzerContent = fs.readFileSync(analyzerPath, 'utf8');
    
    // Procurar pela função loadReferenceData
    const loadRefMatch = analyzerContent.match(/async function loadReferenceData[\s\S]*?^}/m);
    if (loadRefMatch) {
        console.log('📋 Função loadReferenceData encontrada');
        
        // Verificar URLs sendo usadas
        const urlMatches = analyzerContent.match(/["'`][^"'`]*funk_mandela\.json[^"'`]*["'`]/g);
        if (urlMatches) {
            console.log('🔗 URLs encontradas no código:');
            urlMatches.forEach(url => console.log(`   ${url}`));
        }
        
        // Verificar cache busting
        const cacheBustMatch = analyzerContent.match(/Date\.now\(\)|timestamp|cache/i);
        console.log(`🕒 Cache busting: ${cacheBustMatch ? 'PRESENTE' : 'AUSENTE'}`);
        
        // Verificar fallback
        const fallbackMatch = analyzerContent.match(/fallback|catch|error/i);
        console.log(`🔄 Fallback logic: ${fallbackMatch ? 'PRESENTE' : 'AUSENTE'}`);
    } else {
        console.log('❌ Função loadReferenceData NÃO encontrada');
    }
} catch (error) {
    console.log(`❌ Erro ao ler analyzer: ${error.message}`);
}

// 6. Verificar valores embarcados
console.log('\n📦 6. VERIFICAÇÃO DE VALORES EMBARCADOS:');
console.log('-'.repeat(50));

try {
    const analyzerContent = fs.readFileSync(analyzerPath, 'utf8');
    
    // Procurar por valores hard-coded
    const hardcodedMatches = [
        analyzerContent.match(/-8\.5/g),
        analyzerContent.match(/5\.75/g),
        analyzerContent.match(/9\.9/g),
        analyzerContent.match(/0\.42/g)
    ];
    
    console.log('🔍 Valores hard-coded encontrados:');
    hardcodedMatches.forEach((matches, i) => {
        const values = ['-8.5', '5.75', '9.9', '0.42'];
        console.log(`   ${values[i]}: ${matches ? matches.length + ' ocorrências' : 'Não encontrado'}`);
    });
    
    // Procurar por objetos de configuração embarcados
    const configMatch = analyzerContent.match(/funk_mandela\s*:\s*{[\s\S]*?}/);
    if (configMatch) {
        console.log('⚠️  CONFIGURAÇÃO EMBARCADA ENCONTRADA:');
        console.log(configMatch[0].substring(0, 300) + '...');
    }
    
} catch (error) {
    console.log(`❌ Erro na verificação: ${error.message}`);
}

console.log('\n' + '='.repeat(70));
console.log('🎯 PRÓXIMOS PASSOS RECOMENDADOS:');
console.log('=' .repeat(70));
console.log('1. Verificar se há valores embarcados no código');
console.log('2. Confirmar que as URLs corretas estão sendo usadas');
console.log('3. Implementar cache busting efetivo');
console.log('4. Testar em modo incógnito/private');
console.log('5. Verificar deploy no Vercel');
