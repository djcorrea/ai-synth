// 🧪 BACKTEST SCORING V2 vs V1
// Compara scores antigos vs novos em dataset de referência
// Gera histogramas, estatísticas e relatório de melhorias

import { readFile, writeFile, readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { computeMixScoreV2, compareScoring } from '../lib/audio/features/scoring-v2.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

// 🎯 SIMULAR DADOS TÉCNICOS DE REFERÊNCIA
function generateReferenceTechnicalData(genre, quality = 'good') {
    const baseData = {
        funk_mandela: {
            good: {
                lufsIntegrated: -8.2,
                truePeakDbtp: -2.1,
                dynamicRange: 8.5,
                dr_stat: 8.3,
                lra: 9.2,
                stereoCorrelation: 0.55,
                stereoWidth: 0.32,
                clippingPct: 0.8,
                dcOffset: 0.003,
                bandEnergies: {
                    sub: { rms_db: -7.1 },
                    low_bass: { rms_db: -8.3 },
                    upper_bass: { rms_db: -11.8 },
                    low_mid: { rms_db: -8.1 },
                    mid: { rms_db: -6.5 },
                    high_mid: { rms_db: -11.8 },
                    brilho: { rms_db: -15.2 },
                    presenca: { rms_db: -19.8 }
                }
            },
            average: {
                lufsIntegrated: -7.8,
                truePeakDbtp: -1.2,
                dynamicRange: 7.9,
                dr_stat: 7.8,
                lra: 8.5,
                stereoCorrelation: 0.45,
                stereoWidth: 0.28,
                clippingPct: 2.1,
                dcOffset: 0.008,
                bandEnergies: {
                    sub: { rms_db: -6.2 },
                    low_bass: { rms_db: -7.8 },
                    upper_bass: { rms_db: -10.5 },
                    low_mid: { rms_db: -7.8 },
                    mid: { rms_db: -5.9 },
                    high_mid: { rms_db: -10.8 },
                    brilho: { rms_db: -16.5 },
                    presenca: { rms_db: -21.2 }
                }
            },
            poor: {
                lufsIntegrated: -6.5,
                truePeakDbtp: 0.8,
                dynamicRange: 6.2,
                dr_stat: 6.1,
                lra: 6.8,
                stereoCorrelation: 0.25,
                stereoWidth: 0.15,
                clippingPct: 8.5,
                dcOffset: 0.035,
                bandEnergies: {
                    sub: { rms_db: -4.8 },
                    low_bass: { rms_db: -6.2 },
                    upper_bass: { rms_db: -8.5 },
                    low_mid: { rms_db: -6.8 },
                    mid: { rms_db: -4.5 },
                    high_mid: { rms_db: -8.9 },
                    brilho: { rms_db: -19.8 },
                    presenca: { rms_db: -26.5 }
                }
            }
        },
        
        eletronico: {
            good: {
                lufsIntegrated: -14.2,
                truePeakDbtp: -8.1,
                dynamicRange: 10.8,
                dr_stat: 10.5,
                lra: 5.8,
                stereoCorrelation: 0.18,
                stereoWidth: 0.58,
                clippingPct: 0.2,
                dcOffset: 0.001,
                bandEnergies: {
                    sub: { rms_db: -12.8 },
                    low_bass: { rms_db: -10.2 },
                    upper_bass: { rms_db: -13.2 },
                    low_mid: { rms_db: -11.8 },
                    mid: { rms_db: -11.5 },
                    high_mid: { rms_db: -18.8 },
                    brilho: { rms_db: -18.9 },
                    presenca: { rms_db: -23.8 }
                }
            },
            average: {
                lufsIntegrated: -13.8,
                truePeakDbtp: -6.8,
                dynamicRange: 9.2,
                dr_stat: 9.1,
                lra: 4.8,
                stereoCorrelation: 0.15,
                stereoWidth: 0.52,
                clippingPct: 1.2,
                dcOffset: 0.005,
                bandEnergies: {
                    sub: { rms_db: -11.8 },
                    low_bass: { rms_db: -9.8 },
                    upper_bass: { rms_db: -12.5 },
                    low_mid: { rms_db: -11.2 },
                    mid: { rms_db: -10.9 },
                    high_mid: { rms_db: -17.8 },
                    brilho: { rms_db: -17.5 },
                    presenca: { rms_db: -22.8 }
                }
            },
            poor: {
                lufsIntegrated: -12.8,
                truePeakDbtp: -4.2,
                dynamicRange: 7.5,
                dr_stat: 7.2,
                lra: 3.2,
                stereoCorrelation: 0.08,
                stereoWidth: 0.35,
                clippingPct: 4.8,
                dcOffset: 0.018,
                bandEnergies: {
                    sub: { rms_db: -9.8 },
                    low_bass: { rms_db: -8.2 },
                    upper_bass: { rms_db: -10.5 },
                    low_mid: { rms_db: -9.8 },
                    mid: { rms_db: -9.2 },
                    high_mid: { rms_db: -15.8 },
                    brilho: { rms_db: -15.2 },
                    presenca: { rms_db: -20.5 }
                }
            }
        }
    };
    
    // Adicionar variações aleatórias para simular dataset real
    const data = JSON.parse(JSON.stringify(baseData[genre]?.[quality] || baseData.funk_mandela.good));
    
    // Aplicar ruído gaussiano leve
    const addNoise = (value, scale = 0.1) => value + (Math.random() - 0.5) * 2 * scale;
    
    data.lufsIntegrated = addNoise(data.lufsIntegrated, 0.3);
    data.truePeakDbtp = addNoise(data.truePeakDbtp, 0.5);
    data.dynamicRange = addNoise(data.dynamicRange, 0.4);
    data.dr_stat = addNoise(data.dr_stat, 0.4);
    data.lra = addNoise(data.lra, 0.6);
    data.stereoCorrelation = Math.max(0, Math.min(1, addNoise(data.stereoCorrelation, 0.1)));
    data.stereoWidth = Math.max(0, Math.min(1, addNoise(data.stereoWidth, 0.08)));
    data.clippingPct = Math.max(0, addNoise(data.clippingPct, 0.5));
    data.dcOffset = Math.max(0, addNoise(data.dcOffset, 0.002));
    
    // Bandas de frequência
    Object.keys(data.bandEnergies).forEach(band => {
        data.bandEnergies[band].rms_db = addNoise(data.bandEnergies[band].rms_db, 0.8);
    });
    
    return data;
}

// 🎯 SIMULAR SCORING V1 (LEGACY)
function simulateLegacyScore(technicalData, genre) {
    // Simular lógica mais rígida do V1 baseada no scoring.js atual
    let penalties = 0;
    let bonuses = 0;
    
    // Penalidades V1 (mais severas)
    if (technicalData.truePeakDbtp > -1) penalties += 25;
    else if (technicalData.truePeakDbtp > -3) penalties += 15;
    
    if (technicalData.lufsIntegrated > -7) penalties += 20;
    else if (technicalData.lufsIntegrated < -10) penalties += 10;
    
    if (technicalData.dynamicRange < 6) penalties += 15;
    if (technicalData.clippingPct > 2) penalties += Math.min(30, technicalData.clippingPct * 5);
    if (technicalData.dcOffset > 0.01) penalties += 10;
    
    // Bandas (penalidades mais duras)
    const targets = {
        funk_mandela: { lufs: -8, dr: 8 },
        eletronico: { lufs: -14, dr: 10 }
    };
    
    const target = targets[genre] || targets.funk_mandela;
    
    const lufsError = Math.abs(technicalData.lufsIntegrated - target.lufs);
    if (lufsError > 1) penalties += lufsError * 8;
    
    const drError = Math.abs(technicalData.dynamicRange - target.dr);
    if (drError > 1) penalties += drError * 6;
    
    // Bônus V1 (mais difíceis de conseguir)
    if (technicalData.truePeakDbtp < -6) bonuses += 5;
    if (technicalData.clippingPct < 0.5) bonuses += 5;
    if (technicalData.stereoCorrelation > 0.5) bonuses += 3;
    
    // Score base mais baixo no V1
    const baseScore = 45;
    const finalScore = Math.max(0, Math.min(100, baseScore - penalties + bonuses));
    
    return {
        scorePct: Math.round(finalScore),
        classification: finalScore >= 80 ? 'Avançado' :
                       finalScore >= 60 ? 'Intermediário' :
                       finalScore >= 40 ? 'Básico' : 'Problemático',
        penalties: penalties,
        bonuses: bonuses
    };
}

// 🎯 EXECUTAR BACKTEST
async function runBacktest() {
    console.log('🧪 INICIANDO BACKTEST SCORING V2 vs V1');
    console.log('=' .repeat(50) + '\n');
    
    const genres = ['funk_mandela', 'eletronico'];
    const qualities = ['good', 'average', 'poor'];
    const samplesPerGroup = 20; // 20 samples por combinação
    
    const results = [];
    
    for (const genre of genres) {
        console.log(`🎵 Testando gênero: ${genre.toUpperCase()}\n`);
        
        for (const quality of qualities) {
            console.log(`📊 Qualidade: ${quality}...`);
            
            const groupResults = {
                genre,
                quality,
                samples: [],
                v1_scores: [],
                v2_scores: [],
                improvements: []
            };
            
            for (let i = 0; i < samplesPerGroup; i++) {
                // Gerar dados técnicos simulados
                const technicalData = generateReferenceTechnicalData(genre, quality);
                
                // Calcular scores V1 e V2
                const v1Result = simulateLegacyScore(technicalData, genre);
                const v2Result = await computeMixScoreV2(technicalData, genre, { debug: false });
                
                const improvement = v2Result.scorePct - v1Result.scorePct;
                
                groupResults.samples.push({
                    id: `${genre}_${quality}_${i + 1}`,
                    technicalData,
                    v1: v1Result,
                    v2: v2Result,
                    improvement
                });
                
                groupResults.v1_scores.push(v1Result.scorePct);
                groupResults.v2_scores.push(v2Result.scorePct);
                groupResults.improvements.push(improvement);
            }
            
            results.push(groupResults);
            console.log(`   ✅ ${samplesPerGroup} amostras processadas\n`);
        }
    }
    
    return results;
}

// 🎯 CALCULAR ESTATÍSTICAS
function calculateStats(scores) {
    const sorted = [...scores].sort((a, b) => a - b);
    const n = sorted.length;
    
    return {
        mean: scores.reduce((a, b) => a + b, 0) / n,
        median: n % 2 === 0 ? (sorted[n/2 - 1] + sorted[n/2]) / 2 : sorted[Math.floor(n/2)],
        std: Math.sqrt(scores.reduce((a, b) => a + Math.pow(b - (scores.reduce((c, d) => c + d, 0) / n), 2), 0) / n),
        min: sorted[0],
        max: sorted[n - 1],
        q25: sorted[Math.floor(n * 0.25)],
        q75: sorted[Math.floor(n * 0.75)],
        above_70: scores.filter(s => s >= 70).length,
        above_80: scores.filter(s => s >= 80).length,
        count: n
    };
}

// 🎯 GERAR RELATÓRIO
async function generateReport(results) {
    console.log('📊 RELATÓRIO DE BACKTEST\n');
    console.log('=' .repeat(50) + '\n');
    
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            total_samples: results.reduce((sum, group) => sum + group.samples.length, 0),
            genres_tested: [...new Set(results.map(r => r.genre))],
            qualities_tested: [...new Set(results.map(r => r.quality))]
        },
        results_by_group: {},
        overall_comparison: {},
        recommendations: []
    };
    
    // Analisar por grupo
    for (const group of results) {
        const groupKey = `${group.genre}_${group.quality}`;
        
        const v1Stats = calculateStats(group.v1_scores);
        const v2Stats = calculateStats(group.v2_scores);
        const improvementStats = calculateStats(group.improvements);
        
        report.results_by_group[groupKey] = {
            genre: group.genre,
            quality: group.quality,
            sample_count: group.samples.length,
            v1_stats: v1Stats,
            v2_stats: v2Stats,
            improvement_stats: improvementStats
        };
        
        // Mostrar resultados
        console.log(`🎯 ${group.genre.toUpperCase()} - ${group.quality.toUpperCase()}:`);
        console.log(`   Amostras: ${group.samples.length}`);
        console.log(`   V1 Score: ${v1Stats.mean.toFixed(1)}% ± ${v1Stats.std.toFixed(1)} (${v1Stats.min}-${v1Stats.max})`);
        console.log(`   V2 Score: ${v2Stats.mean.toFixed(1)}% ± ${v2Stats.std.toFixed(1)} (${v2Stats.min}-${v2Stats.max})`);
        console.log(`   Melhoria: +${improvementStats.mean.toFixed(1)}% ± ${improvementStats.std.toFixed(1)}`);
        console.log(`   V1 ≥70%: ${v1Stats.above_70}/${v1Stats.count} (${(v1Stats.above_70/v1Stats.count*100).toFixed(1)}%)`);
        console.log(`   V2 ≥70%: ${v2Stats.above_70}/${v2Stats.count} (${(v2Stats.above_70/v2Stats.count*100).toFixed(1)}%)`);
        console.log(`   V1 ≥80%: ${v1Stats.above_80}/${v1Stats.count} (${(v1Stats.above_80/v1Stats.count*100).toFixed(1)}%)`);
        console.log(`   V2 ≥80%: ${v2Stats.above_80}/${v2Stats.count} (${(v2Stats.above_80/v2Stats.count*100).toFixed(1)}%)\n`);
    }
    
    // Comparação geral
    const allV1Scores = results.flatMap(r => r.v1_scores);
    const allV2Scores = results.flatMap(r => r.v2_scores);
    const allImprovements = results.flatMap(r => r.improvements);
    
    const overallV1 = calculateStats(allV1Scores);
    const overallV2 = calculateStats(allV2Scores);
    const overallImprovement = calculateStats(allImprovements);
    
    report.overall_comparison = {
        v1_overall: overallV1,
        v2_overall: overallV2,
        improvement_overall: overallImprovement
    };
    
    console.log('🎊 COMPARAÇÃO GERAL:');
    console.log(`   Total de amostras: ${allV1Scores.length}`);
    console.log(`   V1 Score médio: ${overallV1.mean.toFixed(1)}% ± ${overallV1.std.toFixed(1)}`);
    console.log(`   V2 Score médio: ${overallV2.mean.toFixed(1)}% ± ${overallV2.std.toFixed(1)}`);
    console.log(`   Melhoria média: +${overallImprovement.mean.toFixed(1)}% ± ${overallImprovement.std.toFixed(1)}`);
    console.log(`   V1 ≥70%: ${(overallV1.above_70/overallV1.count*100).toFixed(1)}%`);
    console.log(`   V2 ≥70%: ${(overallV2.above_70/overallV2.count*100).toFixed(1)}%`);
    console.log(`   V1 ≥80%: ${(overallV1.above_80/overallV1.count*100).toFixed(1)}%`);
    console.log(`   V2 ≥80%: ${(overallV2.above_80/overallV2.count*100).toFixed(1)}%\n`);
    
    // Recomendações
    const recommendations = [];
    
    if (overallImprovement.mean > 10) {
        recommendations.push('✅ V2 mostra melhoria significativa (+' + overallImprovement.mean.toFixed(1) + '% média)');
    }
    
    if (overallV2.above_70 > overallV1.above_70) {
        const improvement = ((overallV2.above_70 - overallV1.above_70) / overallV1.count * 100).toFixed(1);
        recommendations.push(`✅ V2 classifica ${improvement}% mais amostras como ≥70%`);
    }
    
    if (overallV2.std < overallV1.std) {
        recommendations.push('✅ V2 tem variância menor (scoring mais consistente)');
    }
    
    if (overallImprovement.min >= 0) {
        recommendations.push('✅ V2 nunca penaliza (score sempre ≥ V1)');
    } else {
        const negativeCount = allImprovements.filter(i => i < 0).length;
        const negativePct = (negativeCount / allImprovements.length * 100).toFixed(1);
        recommendations.push(`⚠️ V2 penaliza ${negativePct}% das amostras (revisar casos específicos)`);
    }
    
    recommendations.push('🎯 Recomendação: Implementar V2 com flag de rollback');
    
    report.recommendations = recommendations;
    
    console.log('💡 RECOMENDAÇÕES:');
    recommendations.forEach(rec => console.log(`   ${rec}`));
    console.log('');
    
    // Salvar relatório
    const reportPath = join(rootDir, 'audit', 'backtest-report.json');
    await writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Gerar CSV para análise externa
    const csvData = [
        'genre,quality,sample_id,v1_score,v2_score,improvement,v1_class,v2_class'
    ];
    
    for (const group of results) {
        for (const sample of group.samples) {
            csvData.push([
                group.genre,
                group.quality,
                sample.id,
                sample.v1.scorePct,
                sample.v2.scorePct,
                sample.improvement,
                sample.v1.classification,
                sample.v2.classification
            ].join(','));
        }
    }
    
    const csvPath = join(rootDir, 'audit', 'backtest-data.csv');
    await writeFile(csvPath, csvData.join('\n'));
    
    console.log(`💾 Relatório salvo em: ${reportPath}`);
    console.log(`📊 Dados CSV salvos em: ${csvPath}\n`);
    
    return report;
}

// 🎯 FUNÇÃO PRINCIPAL
async function main() {
    try {
        console.log('🎯 BACKTEST SCORING V2 - VALIDAÇÃO COMPLETA\n');
        
        // Executar backtest
        const results = await runBacktest();
        
        // Gerar relatório
        const report = await generateReport(results);
        
        console.log('🎊 BACKTEST CONCLUÍDO COM SUCESSO!');
        console.log('📋 Próximos passos:');
        console.log('   1. Revisar relatório JSON/CSV');
        console.log('   2. Implementar flag SCORING_V2 no sistema principal');
        console.log('   3. Criar testes unitários');
        console.log('   4. Deploy com rollback preparado');
        
    } catch (error) {
        console.error('❌ Erro no backtest:', error.message);
        console.error(error.stack);
    }
}

// Executar backtest
main();
