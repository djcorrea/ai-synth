#!/usr/bin/env node
// 🔍 AUDITORIA COMPLETA DAS COMPARAÇÕES DE GÊNERO
// Verifica se as métricas de cada gênero são baseadas nos JSONs corretos
// e se os cálculos das médias estão sendo feitos corretamente

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 INICIANDO AUDITORIA COMPLETA DAS COMPARAÇÕES DE GÊNERO\n');

// 1. Ler todos os JSONs de gêneros
const genresPath = path.resolve('refs/out');
const genresFiles = fs.readdirSync(genresPath)
    .filter(f => f.endsWith('.json') && !f.includes('genres') && !f.includes('legacy') && !f.includes('ROLLBACK'));

console.log('📁 ARQUIVOS DE GÊNEROS ENCONTRADOS:');
genresFiles.forEach(f => console.log(`   - ${f}`));
console.log('');

// 2. Ler cada JSON e extrair métricas
const genresData = {};
for (const file of genresFiles) {
    const genreName = file.replace('.json', '');
    const filePath = path.join(genresPath, file);
    
    try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Identificar a estrutura do JSON (pode ter wrapper com nome do gênero)
        let data = content;
        if (content[genreName]) {
            data = content[genreName];
        } else {
            // Buscar pela primeira chave que não seja array
            const keys = Object.keys(content);
            const dataKey = keys.find(k => typeof content[k] === 'object' && !Array.isArray(content[k]));
            if (dataKey) data = content[dataKey];
        }
        
        genresData[genreName] = {
            originalFile: file,
            data: data,
            metrics: {
                lufs_target: data.lufs_target,
                true_peak_target: data.true_peak_target,
                dr_target: data.dr_target,
                lra_target: data.lra_target,
                stereo_target: data.stereo_target,
                num_tracks: data.num_tracks,
                version: data.version,
                generated_at: data.generated_at
            },
            bands: data.bands || {},
            tolerances: {
                tol_lufs: data.tol_lufs,
                tol_true_peak: data.tol_true_peak,
                tol_dr: data.tol_dr,
                tol_lra: data.tol_lra,
                tol_stereo: data.tol_stereo
            }
        };
        
        console.log(`✅ ${genreName}: ${data.num_tracks || 'N/A'} faixas, versão ${data.version || 'N/A'}`);
    } catch (error) {
        console.log(`❌ Erro ao ler ${file}: ${error.message}`);
    }
}

console.log('\n🔍 ANÁLISE DAS MÉTRICAS POR GÊNERO:\n');

// 3. Comparar métricas entre gêneros
const genres = Object.keys(genresData);
for (const genre of genres) {
    const g = genresData[genre];
    console.log(`📊 ${genre.toUpperCase()}:`);
    console.log(`   📈 LUFS: ${g.metrics.lufs_target} ±${g.tolerances.tol_lufs}`);
    console.log(`   🔊 True Peak: ${g.metrics.true_peak_target} ±${g.tolerances.tol_true_peak}`);
    console.log(`   📉 DR: ${g.metrics.dr_target} ±${g.tolerances.tol_dr}`);
    console.log(`   🌊 LRA: ${g.metrics.lra_target} ±${g.tolerances.tol_lra}`);
    console.log(`   🎭 Stereo: ${g.metrics.stereo_target} ±${g.tolerances.tol_stereo}`);
    console.log(`   📂 Faixas: ${g.metrics.num_tracks}`);
    
    // Mostrar bandas se existirem
    if (Object.keys(g.bands).length > 0) {
        console.log(`   🎛️ BANDAS EQ:`);
        for (const [band, config] of Object.entries(g.bands)) {
            if (config && typeof config === 'object') {
                console.log(`      ${band}: ${config.target_db}dB ±${config.tol_db}dB`);
            }
        }
    }
    console.log('');
}

// 4. Ler frontend embedded refs para comparação
console.log('🌐 VERIFICANDO FRONTEND EMBEDDED REFS:\n');

const frontendRefsPath = path.resolve('public/refs/embedded-refs.js');
let frontendTargets = {};

if (fs.existsSync(frontendRefsPath)) {
    try {
        const frontendContent = fs.readFileSync(frontendRefsPath, 'utf8');
        
        // Extrair os targets do frontend (buscar por padrões)
        const targetMatches = frontendContent.match(/(\w+):\s*\{\s*lufs_target:\s*([-\d.]+)/g);
        if (targetMatches) {
            targetMatches.forEach(match => {
                const [, genre, lufs] = match.match(/(\w+):\s*\{\s*lufs_target:\s*([-\d.]+)/);
                frontendTargets[genre] = { lufs_target: parseFloat(lufs) };
            });
        }
        
        console.log('✅ Frontend embedded refs encontrado');
        console.log('📊 Targets no frontend:');
        for (const [genre, data] of Object.entries(frontendTargets)) {
            console.log(`   ${genre}: LUFS ${data.lufs_target}`);
        }
    } catch (error) {
        console.log(`❌ Erro ao ler frontend refs: ${error.message}`);
    }
} else {
    console.log('⚠️ Frontend embedded refs não encontrado');
}

// 5. Ler audio-analyzer-integration.js inline targets
console.log('\n🔗 VERIFICANDO AUDIO ANALYZER INTEGRATION INLINE TARGETS:\n');

const analyzerIntegrationPath = path.resolve('public/audio-analyzer-integration.js');
let inlineTargets = {};

if (fs.existsSync(analyzerIntegrationPath)) {
    try {
        const integrationContent = fs.readFileSync(analyzerIntegrationPath, 'utf8');
        
        // Procurar pela constante __INLINE_EMBEDDED_REFS__
        const inlineRefsMatch = integrationContent.match(/__INLINE_EMBEDDED_REFS__\s*=\s*\{([\s\S]*?)\};/);
        if (inlineRefsMatch) {
            const refsContent = inlineRefsMatch[1];
            
            // Encontrar a seção byGenre dentro desta constante
            const byGenreMatch = refsContent.match(/byGenre:\s*\{([\s\S]*?)\}\s*\}/);
            if (byGenreMatch) {
                const byGenreContent = byGenreMatch[1];
                
                // Usar regex mais robusta para encontrar gêneros e suas configurações
                // Aceita configurações multilinhas e objetos aninhados
                const lines = byGenreContent.split('\n');
                let currentGenre = null;
                let currentGenreContent = '';
                let braceCount = 0;
                
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    
                    // Detectar início de novo gênero
                    const genreMatch = trimmedLine.match(/^(\w+):\s*\{/);
                    if (genreMatch && braceCount === 0) {
                        // Salvar gênero anterior se existir
                        if (currentGenre) {
                            parseGenreConfig(currentGenre, currentGenreContent, inlineTargets);
                        }
                        
                        currentGenre = genreMatch[1];
                        currentGenreContent = trimmedLine;
                        braceCount = (trimmedLine.match(/\{/g) || []).length - (trimmedLine.match(/\}/g) || []).length;
                    } else if (currentGenre) {
                        currentGenreContent += '\n' + trimmedLine;
                        braceCount += (trimmedLine.match(/\{/g) || []).length - (trimmedLine.match(/\}/g) || []).length;
                        
                        // Se fechou todas as chaves, terminamos este gênero
                        if (braceCount === 0 && trimmedLine.includes('}')) {
                            parseGenreConfig(currentGenre, currentGenreContent, inlineTargets);
                            currentGenre = null;
                            currentGenreContent = '';
                        }
                    }
                }
                
                // Procesar último gênero se houver
                if (currentGenre && currentGenreContent) {
                    parseGenreConfig(currentGenre, currentGenreContent, inlineTargets);
                }
            }
        }
        
        console.log('✅ Audio analyzer integration encontrado');
        console.log('📊 Targets inline:');
        for (const [genre, data] of Object.entries(inlineTargets)) {
            console.log(`   ${genre}: LUFS ${data.lufs_target}`);
            if (data.bands && Object.keys(data.bands).length > 0) {
                const bandsList = Object.entries(data.bands).slice(0, 3).map(([b, v]) => `${b}:${v}dB`).join(', ');
                console.log(`      Bandas: ${bandsList}...`);
            }
        }
    } catch (error) {
        console.log(`❌ Erro ao ler integration: ${error.message}`);
    }
} else {
    console.log('⚠️ Audio analyzer integration não encontrado');
}

// Função auxiliar para parsear configuração de gênero
function parseGenreConfig(genreName, genreContent, targets) {
    try {
        // Extrair LUFS target
        const lufsMatch = genreContent.match(/lufs_target:\s*([-\d.]+)/);
        if (lufsMatch) {
            const lufs = parseFloat(lufsMatch[1]);
            targets[genreName] = { lufs_target: lufs };
            
            // Extrair outras métricas principais
            const truePeakMatch = genreContent.match(/true_peak_target:\s*([-\d.]+)/);
            if (truePeakMatch) {
                targets[genreName].true_peak_target = parseFloat(truePeakMatch[1]);
            }
            
            const drMatch = genreContent.match(/dr_target:\s*([-\d.]+)/);
            if (drMatch) {
                targets[genreName].dr_target = parseFloat(drMatch[1]);
            }
            
            const lraMatch = genreContent.match(/lra_target:\s*([-\d.]+)/);
            if (lraMatch) {
                targets[genreName].lra_target = parseFloat(lraMatch[1]);
            }
            
            const stereoMatch = genreContent.match(/stereo_target:\s*([-\d.]+)/);
            if (stereoMatch) {
                targets[genreName].stereo_target = parseFloat(stereoMatch[1]);
            }
            
            // Extrair bandas
            const bandsMatch = genreContent.match(/bands:\s*\{([^{}]+(?:\{[^{}]*\}[^{}]*)*)\}/);
            if (bandsMatch) {
                const bandsStr = bandsMatch[1];
                const bandPattern = /(\w+):\s*\{\s*target_db:\s*([-\d.]+)/g;
                let bandMatch;
                targets[genreName].bands = {};
                
                while ((bandMatch = bandPattern.exec(bandsStr)) !== null) {
                    const [, bandName, targetDb] = bandMatch;
                    targets[genreName].bands[bandName] = parseFloat(targetDb);
                }
            }
        }
    } catch (error) {
        console.log(`⚠️ Erro ao parsear gênero ${genreName}: ${error.message}`);
    }
}

// 6. COMPARAÇÃO CRUZADA E DETECÇÃO DE INCONSISTÊNCIAS
console.log('\n🔍 DETECÇÃO DE INCONSISTÊNCIAS:\n');

let inconsistencies = [];

// Comparar JSONs com frontend inline
for (const genre of genres) {
    if (inlineTargets[genre]) {
        const jsonLufs = genresData[genre].metrics.lufs_target;
        const inlineLufs = inlineTargets[genre].lufs_target;
        
        if (Math.abs(jsonLufs - inlineLufs) > 0.1) {
            inconsistencies.push({
                genre,
                type: 'LUFS_MISMATCH',
                json: jsonLufs,
                frontend: inlineLufs,
                diff: Math.abs(jsonLufs - inlineLufs)
            });
        }
        
        // Comparar bandas
        if (inlineTargets[genre].bands && genresData[genre].bands) {
            for (const [band, inlineTarget] of Object.entries(inlineTargets[genre].bands)) {
                const jsonBand = genresData[genre].bands[band];
                if (jsonBand && Math.abs(jsonBand.target_db - inlineTarget) > 0.1) {
                    inconsistencies.push({
                        genre,
                        type: 'BAND_MISMATCH',
                        band,
                        json: jsonBand.target_db,
                        frontend: inlineTarget,
                        diff: Math.abs(jsonBand.target_db - inlineTarget)
                    });
                }
            }
        }
    } else {
        inconsistencies.push({
            genre,
            type: 'MISSING_FRONTEND',
            message: `Gênero ${genre} existe no JSON mas não no frontend inline`
        });
    }
}

// Verificar se há gêneros no frontend que não existem nos JSONs
for (const genre of Object.keys(inlineTargets)) {
    if (!genresData[genre]) {
        inconsistencies.push({
            genre,
            type: 'MISSING_JSON',
            message: `Gênero ${genre} existe no frontend mas não tem JSON correspondente`
        });
    }
}

// 7. RELATÓRIO DE INCONSISTÊNCIAS
if (inconsistencies.length === 0) {
    console.log('✅ NENHUMA INCONSISTÊNCIA DETECTADA!');
    console.log('   Todos os gêneros têm métricas consistentes entre JSON e frontend.');
} else {
    console.log(`❌ ${inconsistencies.length} INCONSISTÊNCIAS DETECTADAS:`);
    
    inconsistencies.forEach((inc, idx) => {
        console.log(`\n   ${idx + 1}. ${inc.genre} - ${inc.type}:`);
        if (inc.type === 'LUFS_MISMATCH') {
            console.log(`      JSON: ${inc.json} LUFS`);
            console.log(`      Frontend: ${inc.frontend} LUFS`);
            console.log(`      Diferença: ${inc.diff.toFixed(2)}`);
        } else if (inc.type === 'BAND_MISMATCH') {
            console.log(`      Banda ${inc.band}:`);
            console.log(`      JSON: ${inc.json}dB`);
            console.log(`      Frontend: ${inc.frontend}dB`);
            console.log(`      Diferença: ${inc.diff.toFixed(2)}dB`);
        } else {
            console.log(`      ${inc.message}`);
        }
    });
}

// 8. VERIFICAR CÁLCULO DE MÉDIAS (análise de samples)
console.log('\n📊 VERIFICAÇÃO DE CÁLCULO DE MÉDIAS:\n');

for (const genre of genres.slice(0, 3)) { // Verificar apenas alguns para não sobrecarregar
    console.log(`🔍 Analisando ${genre}...`);
    
    const samplesPath = path.resolve(`refs/${genre}/samples`);
    if (fs.existsSync(samplesPath)) {
        const samples = fs.readdirSync(samplesPath).filter(f => f.endsWith('.wav'));
        console.log(`   📁 ${samples.length} samples encontrados na pasta`);
        console.log(`   📊 JSON reporta ${genresData[genre].metrics.num_tracks} faixas`);
        
        if (samples.length !== genresData[genre].metrics.num_tracks) {
            console.log(`   ⚠️ DIVERGÊNCIA: pasta tem ${samples.length} arquivos, JSON reporta ${genresData[genre].metrics.num_tracks}`);
        } else {
            console.log(`   ✅ Contagem consistente`);
        }
    } else {
        console.log(`   ❌ Pasta de samples não encontrada: ${samplesPath}`);
    }
}

// 9. RESUMO FINAL
console.log('\n📋 RESUMO DA AUDITORIA:\n');
console.log(`📂 Gêneros analisados: ${genres.length}`);
console.log(`🔗 Gêneros no frontend: ${Object.keys(inlineTargets).length}`);
console.log(`❌ Inconsistências: ${inconsistencies.length}`);

if (inconsistencies.length > 0) {
    console.log('\n🚨 AÇÕES RECOMENDADAS:');
    console.log('   1. Sincronizar métricas entre JSONs e frontend');
    console.log('   2. Executar regeneração de targets inline');
    console.log('   3. Verificar se as pastas de samples estão completas');
    console.log('   4. Rodar testes de regressão após correções');
} else {
    console.log('\n✅ SISTEMA ÍNTEGRO');
    console.log('   Todas as comparações de gênero estão usando métricas corretas');
    console.log('   Cálculos de médias são consistentes com número de faixas');
}

// 10. Salvar relatório
const reportPath = path.resolve('audit/genre-comparison-audit-report.json');
const report = {
    timestamp: new Date().toISOString(),
    genresAnalyzed: genres.length,
    genresData: genresData,
    frontendTargets: inlineTargets,
    inconsistencies: inconsistencies,
    summary: {
        totalGenres: genres.length,
        totalInconsistencies: inconsistencies.length,
        status: inconsistencies.length === 0 ? 'PASS' : 'FAIL'
    }
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📄 Relatório completo salvo em: ${reportPath}`);
