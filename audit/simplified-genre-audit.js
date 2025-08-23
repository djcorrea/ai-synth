#!/usr/bin/env node
// 🔍 AUDITORIA SIMPLIFICADA - VALIDAÇÃO DAS MÉTRICAS DOS GÊNEROS
// Compara JSONs vs Frontend e verifica consistência

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 AUDITORIA SIMPLIFICADA - COMPARAÇÃO ENTRE JSONs E FRONTEND\n');

// 1. Ler JSONs dos gêneros mencionados
const targetGenres = ['funk_mandela', 'eletronico', 'funk_automotivo', 'funk_bruxaria'];
const genreData = {};

console.log('📂 CARREGANDO DADOS DOS GÊNEROS:\n');

for (const genre of targetGenres) {
    const jsonPath = path.resolve(`refs/out/${genre}.json`);
    if (fs.existsSync(jsonPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            const genreKey = Object.keys(data).find(k => data[k].lufs_target !== undefined);
            genreData[genre] = genreKey ? data[genreKey] : data;
            
            console.log(`✅ ${genre}:`);
            console.log(`   LUFS: ${genreData[genre].lufs_target}`);
            console.log(`   True Peak: ${genreData[genre].true_peak_target}`);
            console.log(`   DR: ${genreData[genre].dr_target}`);
            console.log(`   Faixas: ${genreData[genre].num_tracks}`);
            
            if (genreData[genre].bands) {
                const bandsCount = Object.keys(genreData[genre].bands).length;
                console.log(`   Bandas: ${bandsCount} configuradas`);
            }
        } catch (error) {
            console.log(`❌ Erro ao carregar ${genre}: ${error.message}`);
        }
    } else {
        console.log(`❌ ${genre}: arquivo não encontrado`);
    }
    console.log('');
}

// 2. Extrair targets do frontend
console.log('🌐 EXTRAINDO TARGETS DO FRONTEND:\n');

const frontendPath = path.resolve('public/audio-analyzer-integration.js');
const frontendTargets = {};

if (fs.existsSync(frontendPath)) {
    const frontendContent = fs.readFileSync(frontendPath, 'utf8');
    
    for (const genre of targetGenres) {
        // Buscar por padrões específicos de cada gênero
        const patterns = [
            new RegExp(`${genre}:\\s*\\{[^{}]*lufs_target:\\s*([-\\d.]+)[^{}]*\\}`, 'g'),
            new RegExp(`${genre}:[^{}]*\\{[\\s\\S]*?lufs_target:\\s*([-\\d.]+)[\\s\\S]*?\\}`, 'g')
        ];
        
        let found = false;
        for (const pattern of patterns) {
            const match = pattern.exec(frontendContent);
            if (match) {
                frontendTargets[genre] = {
                    lufs_target: parseFloat(match[1])
                };
                
                // Tentar extrair outras métricas da mesma seção
                const sectionMatch = frontendContent.match(new RegExp(`${genre}:[\\s\\S]*?\\{([\\s\\S]*?)\\}(?:,|\\s*\\})`));
                if (sectionMatch) {
                    const section = sectionMatch[1];
                    
                    const truePeakMatch = section.match(/true_peak_target:\s*([-\d.]+)/);
                    if (truePeakMatch) frontendTargets[genre].true_peak_target = parseFloat(truePeakMatch[1]);
                    
                    const drMatch = section.match(/dr_target:\s*([-\d.]+)/);
                    if (drMatch) frontendTargets[genre].dr_target = parseFloat(drMatch[1]);
                    
                    // Extrair algumas bandas importantes
                    const bandsMatch = section.match(/bands:\s*\{([^{}]+(?:\{[^{}]*\}[^{}]*)*)\}/);
                    if (bandsMatch) {
                        frontendTargets[genre].bands = {};
                        const bandsStr = bandsMatch[1];
                        const bandMatches = bandsStr.matchAll(/(\w+):\s*\{\s*target_db:\s*([-\d.]+)/g);
                        for (const bandMatch of bandMatches) {
                            frontendTargets[genre].bands[bandMatch[1]] = parseFloat(bandMatch[2]);
                        }
                    }
                }
                
                found = true;
                break;
            }
        }
        
        if (found) {
            console.log(`✅ ${genre} encontrado no frontend`);
            console.log(`   LUFS: ${frontendTargets[genre].lufs_target}`);
            if (frontendTargets[genre].true_peak_target) {
                console.log(`   True Peak: ${frontendTargets[genre].true_peak_target}`);
            }
            if (frontendTargets[genre].bands) {
                const bandsCount = Object.keys(frontendTargets[genre].bands).length;
                console.log(`   Bandas: ${bandsCount} detectadas`);
            }
        } else {
            console.log(`❌ ${genre} não encontrado no frontend`);
        }
        console.log('');
    }
} else {
    console.log('❌ Arquivo frontend não encontrado');
}

// 3. COMPARAÇÃO DETALHADA
console.log('🔍 COMPARAÇÃO DETALHADA JSON vs FRONTEND:\n');

let totalIssues = 0;

for (const genre of targetGenres) {
    console.log(`📊 ${genre.toUpperCase()}:`);
    
    if (!genreData[genre]) {
        console.log('   ❌ JSON não carregado');
        totalIssues++;
        continue;
    }
    
    if (!frontendTargets[genre]) {
        console.log('   ❌ Não encontrado no frontend');
        totalIssues++;
        continue;
    }
    
    const json = genreData[genre];
    const frontend = frontendTargets[genre];
    
    // Comparar LUFS
    if (Math.abs(json.lufs_target - frontend.lufs_target) > 0.1) {
        console.log(`   ❌ LUFS diverge: JSON=${json.lufs_target}, Frontend=${frontend.lufs_target}`);
        totalIssues++;
    } else {
        console.log(`   ✅ LUFS consistente: ${json.lufs_target}`);
    }
    
    // Comparar True Peak se disponível
    if (frontend.true_peak_target) {
        if (Math.abs(json.true_peak_target - frontend.true_peak_target) > 0.1) {
            console.log(`   ❌ True Peak diverge: JSON=${json.true_peak_target}, Frontend=${frontend.true_peak_target}`);
            totalIssues++;
        } else {
            console.log(`   ✅ True Peak consistente: ${json.true_peak_target}`);
        }
    }
    
    // Comparar DR se disponível
    if (frontend.dr_target) {
        if (Math.abs(json.dr_target - frontend.dr_target) > 0.1) {
            console.log(`   ❌ DR diverge: JSON=${json.dr_target}, Frontend=${frontend.dr_target}`);
            totalIssues++;
        } else {
            console.log(`   ✅ DR consistente: ${json.dr_target}`);
        }
    }
    
    // Comparar bandas importantes
    if (json.bands && frontend.bands) {
        const commonBands = Object.keys(json.bands).filter(b => frontend.bands[b] !== undefined);
        console.log(`   🎛️ Bandas em comum: ${commonBands.length}`);
        
        for (const band of commonBands.slice(0, 3)) { // Verificar apenas algumas
            const jsonTarget = json.bands[band].target_db;
            const frontendTarget = frontend.bands[band];
            
            if (Math.abs(jsonTarget - frontendTarget) > 0.1) {
                console.log(`      ❌ ${band}: JSON=${jsonTarget}dB, Frontend=${frontendTarget}dB`);
                totalIssues++;
            } else {
                console.log(`      ✅ ${band}: ${jsonTarget}dB`);
            }
        }
    }
    
    console.log('');
}

// 4. VERIFICAÇÃO DE CÁLCULO DE MÉDIAS
console.log('📊 VERIFICAÇÃO DE CÁLCULO DE MÉDIAS (samples vs num_tracks):\n');

for (const genre of targetGenres) {
    if (!genreData[genre]) continue;
    
    const samplesPath = path.resolve(`refs/${genre}/samples`);
    if (fs.existsSync(samplesPath)) {
        const samples = fs.readdirSync(samplesPath).filter(f => f.endsWith('.wav'));
        const reported = genreData[genre].num_tracks;
        
        console.log(`📁 ${genre}:`);
        console.log(`   Samples na pasta: ${samples.length}`);
        console.log(`   Reportado no JSON: ${reported}`);
        
        if (samples.length !== reported) {
            console.log(`   ❌ DIVERGÊNCIA: diferença de ${Math.abs(samples.length - reported)} faixas`);
            totalIssues++;
        } else {
            console.log(`   ✅ Contagem consistente`);
        }
    } else {
        console.log(`📁 ${genre}: pasta de samples não encontrada`);
        totalIssues++;
    }
    console.log('');
}

// 5. RESUMO FINAL
console.log('═'.repeat(60));
console.log('📋 RESUMO DA AUDITORIA:');
console.log('═'.repeat(60));

console.log(`\n📊 Gêneros analisados: ${targetGenres.length}`);
console.log(`❌ Issues encontrados: ${totalIssues}`);

if (totalIssues === 0) {
    console.log('\n🎉 SISTEMA ÍNTEGRO!');
    console.log('✅ Todas as comparações de gênero estão usando métricas corretas');
    console.log('✅ JSONs e frontend estão sincronizados');
    console.log('✅ Cálculos de médias são consistentes');
} else {
    console.log('\n🚨 PROBLEMAS DETECTADOS:');
    
    if (totalIssues <= 3) {
        console.log('   Severidade: BAIXA - Issues menores de sincronização');
    } else if (totalIssues <= 8) {
        console.log('   Severidade: MÉDIA - Requer atenção');
    } else {
        console.log('   Severidade: ALTA - Requer intervenção imediata');
    }
    
    console.log('\n💡 AÇÕES RECOMENDADAS:');
    console.log('   1. Regenerar targets inline no frontend');
    console.log('   2. Verificar processo de build/deploy');
    console.log('   3. Executar testes de regressão');
    console.log('   4. Validar amostras vs métricas calculadas');
}

console.log('\n📄 Auditoria concluída.');
process.exit(totalIssues > 0 ? 1 : 0);
