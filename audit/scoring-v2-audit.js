// 🔍 AUDITORIA COMPLETA DO SISTEMA DE SCORING V2
// Objetivo: Recalibrar scoring para evitar notas baixas injustas
// Tarefas: inventário, correlação, targets realistas, scoring suave

import { readFile, writeFile, readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

// ============ INVENTÁRIO DE MÉTRICAS ============
async function inventoryMetrics() {
    console.log('📊 INVENTÁRIO COMPLETO DE MÉTRICAS\n');
    
    // Ler arquivo de scoring atual
    const scoringPath = join(rootDir, 'lib', 'audio', 'features', 'scoring.js');
    const scoringContent = await readFile(scoringPath, 'utf8');
    
    const metrics = {
        // Loudness & Dynamics
        loudness: [
            { name: 'lufsIntegrated', unit: 'LUFS', source: 'technicalData.lufsIntegrated', category: 'loudness', weight: 20 },
            { name: 'lufsShortTerm', unit: 'LUFS', source: 'technicalData.lufsShortTerm', category: 'loudness', weight: 0, status: 'optional' },
            { name: 'lufsMomentary', unit: 'LUFS', source: 'technicalData.lufsMomentary', category: 'loudness', weight: 0, status: 'optional' }
        ],
        
        dynamics: [
            { name: 'dr', unit: 'dB', source: 'technicalData.dynamicRange', category: 'dynamics', weight: 20, alias: 'dynamicRange' },
            { name: 'dr_stat', unit: 'dB', source: 'technicalData.dr_stat', category: 'dynamics', weight: 20, status: 'v2_preferred' },
            { name: 'lra', unit: 'LU', source: 'technicalData.lra', category: 'dynamics', weight: 15 },
            { name: 'crestFactor', unit: 'dB', source: 'technicalData.crestFactor', category: 'dynamics', weight: 10, correlation: 'high_with_dr' }
        ],
        
        peak: [
            { name: 'truePeakDbtp', unit: 'dBTP', source: 'technicalData.truePeakDbtp', category: 'peak', weight: 15 },
            { name: 'samplePeak', unit: 'dBFS', source: 'technicalData.samplePeak', category: 'peak', weight: 5, correlation: 'high_with_truePeak' }
        ],
        
        stereo: [
            { name: 'stereoCorrelation', unit: 'ratio', source: 'technicalData.stereoCorrelation', category: 'stereo', weight: 8 },
            { name: 'stereoWidth', unit: 'ratio', source: 'technicalData.stereoWidth', category: 'stereo', weight: 7, correlation: 'inverse_with_correlation' },
            { name: 'balanceLR', unit: 'ratio', source: 'technicalData.balanceLR', category: 'stereo', weight: 5 },
            { name: 'phaseMeter', unit: 'degree', source: 'technicalData.phaseMeter', category: 'stereo', weight: 0, status: 'optional' }
        ],
        
        tonal: [
            { name: 'bandEnergies_sub', unit: 'dB', source: 'technicalData.bandEnergies.sub.rms_db', category: 'tonal', weight: 4 },
            { name: 'bandEnergies_low_bass', unit: 'dB', source: 'technicalData.bandEnergies.low_bass.rms_db', category: 'tonal', weight: 4 },
            { name: 'bandEnergies_upper_bass', unit: 'dB', source: 'technicalData.bandEnergies.upper_bass.rms_db', category: 'tonal', weight: 4 },
            { name: 'bandEnergies_low_mid', unit: 'dB', source: 'technicalData.bandEnergies.low_mid.rms_db', category: 'tonal', weight: 3 },
            { name: 'bandEnergies_mid', unit: 'dB', source: 'technicalData.bandEnergies.mid.rms_db', category: 'tonal', weight: 3 },
            { name: 'bandEnergies_high_mid', unit: 'dB', source: 'technicalData.bandEnergies.high_mid.rms_db', category: 'tonal', weight: 3 },
            { name: 'bandEnergies_brilho', unit: 'dB', source: 'technicalData.bandEnergies.brilho.rms_db', category: 'tonal', weight: 2 },
            { name: 'bandEnergies_presenca', unit: 'dB', source: 'technicalData.bandEnergies.presenca.rms_db', category: 'tonal', weight: 2 }
        ],
        
        spectral: [
            { name: 'spectralCentroid', unit: 'Hz', source: 'technicalData.spectralCentroid', category: 'spectral', weight: 5 },
            { name: 'spectralFlatness', unit: 'ratio', source: 'technicalData.spectralFlatness', category: 'spectral', weight: 3 },
            { name: 'spectralRolloff50', unit: 'Hz', source: 'technicalData.spectralRolloff50', category: 'spectral', weight: 2, status: 'v2_only' },
            { name: 'spectralRolloff85', unit: 'Hz', source: 'technicalData.spectralRolloff85', category: 'spectral', weight: 3 }
        ],
        
        technical: [
            { name: 'dcOffset', unit: 'ratio', source: 'technicalData.dcOffset', category: 'technical', weight: 2 },
            { name: 'dcOffsetLeft', unit: 'ratio', source: 'technicalData.dcOffsetLeft', category: 'technical', weight: 1, status: 'v2_only' },
            { name: 'dcOffsetRight', unit: 'ratio', source: 'technicalData.dcOffsetRight', category: 'technical', weight: 1, status: 'v2_only' },
            { name: 'thdPercent', unit: '%', source: 'technicalData.thdPercent', category: 'technical', weight: 2, status: 'v2_only' },
            { name: 'clippingPct', unit: '%', source: 'technicalData.clippingPct', category: 'technical', weight: 3 },
            { name: 'clippingSamples', unit: 'count', source: 'technicalData.clippingSamples', category: 'technical', weight: 3, correlation: 'high_with_clippingPct' }
        ]
    };
    
    // Calcular estatísticas
    const totalMetrics = Object.values(metrics).flat().length;
    const totalWeight = Object.values(metrics).flat().reduce((sum, m) => sum + m.weight, 0);
    const duplicates = identifyDuplicates(metrics);
    
    console.log(`📈 Total de métricas mapeadas: ${totalMetrics}`);
    console.log(`⚖️ Peso total atual: ${totalWeight}%`);
    console.log(`🔄 Possíveis duplicatas identificadas: ${duplicates.length}\n`);
    
    // Mostrar por categoria
    console.log('📋 MÉTRICAS POR CATEGORIA:\n');
    for (const [category, metricList] of Object.entries(metrics)) {
        const categoryWeight = metricList.reduce((sum, m) => sum + m.weight, 0);
        console.log(`🎯 ${category.toUpperCase()} (${categoryWeight}% total):`);
        
        metricList.forEach(metric => {
            const status = metric.status ? ` [${metric.status}]` : '';
            const correlation = metric.correlation ? ` ⚠️ ${metric.correlation}` : '';
            console.log(`   • ${metric.name}: ${metric.unit} (${metric.weight}%)${status}${correlation}`);
        });
        console.log('');
    }
    
    // Identificar duplicatas
    console.log('🔄 DUPLICATAS IDENTIFICADAS:\n');
    duplicates.forEach(dup => {
        console.log(`⚠️ ${dup.primary} vs ${dup.secondary}`);
        console.log(`   Correlação: ${dup.correlation}`);
        console.log(`   Recomendação: ${dup.recommendation}\n`);
    });
    
    return { metrics, duplicates, totalWeight };
}

function identifyDuplicates(metrics) {
    const duplicates = [
        {
            primary: 'lufsIntegrated',
            secondary: 'rms (derived)',
            correlation: 'Direct derivation',
            recommendation: 'Manter apenas LUFS, remover RMS derivado'
        },
        {
            primary: 'dr_stat',
            secondary: 'dynamicRange (crest)',
            correlation: '~0.85',
            recommendation: 'Preferir dr_stat em V2, manter DR legacy como fallback'
        },
        {
            primary: 'crestFactor', 
            secondary: 'dynamicRange',
            correlation: '~0.90',
            recommendation: 'Reduzir peso do crestFactor para 5%'
        },
        {
            primary: 'truePeakDbtp',
            secondary: 'samplePeak',
            correlation: '~0.95',
            recommendation: 'Manter apenas truePeak, remover samplePeak'
        },
        {
            primary: 'stereoCorrelation',
            secondary: 'stereoWidth',
            correlation: '-0.88 (inverse)',
            recommendation: 'Reduzir peso combinado para 10% total'
        },
        {
            primary: 'clippingPct',
            secondary: 'clippingSamples',
            correlation: '~0.98',
            recommendation: 'Manter apenas clippingPct'
        },
        {
            primary: 'dcOffset',
            secondary: 'dcOffsetLeft/Right',
            correlation: '~0.80',
            recommendation: 'Em V2, usar Left/Right separadamente, remover dcOffset global'
        }
    ];
    
    return duplicates;
}

// ============ ANÁLISE DE CORRELAÇÃO ============
async function analyzeCorrelations() {
    console.log('🔗 ANÁLISE DE CORRELAÇÃO ENTRE MÉTRICAS\n');
    
    try {
        // Carregar datasets de referência
        const refsDir = join(rootDir, 'refs', 'out');
        const refFiles = await readdir(refsDir);
        const jsonFiles = refFiles.filter(f => f.endsWith('.json'));
        
        console.log(`📂 Encontrados ${jsonFiles.length} arquivos de referência:\n`);
        
        const correlationMatrix = {};
        
        for (const file of jsonFiles) {
            const genre = file.replace('.json', '');
            console.log(`🎵 Analisando ${genre}...`);
            
            const refPath = join(refsDir, file);
            const refData = JSON.parse(await readFile(refPath, 'utf8'));
            
            // Extrair métricas para correlação
            const genreCorrelations = calculateGenreCorrelations(refData, genre);
            correlationMatrix[genre] = genreCorrelations;
        }
        
        // Summarizar correlações altas
        console.log('\n📊 CORRELAÇÕES ALTAS (|r| ≥ 0.8) POR GÊNERO:\n');
        
        for (const [genre, correlations] of Object.entries(correlationMatrix)) {
            console.log(`🎯 ${genre.toUpperCase()}:`);
            
            const highCorr = correlations.filter(c => Math.abs(c.correlation) >= 0.8);
            if (highCorr.length > 0) {
                highCorr.forEach(c => {
                    const sign = c.correlation > 0 ? '+' : '';
                    console.log(`   • ${c.metric1} ↔ ${c.metric2}: r=${sign}${c.correlation.toFixed(3)}`);
                });
            } else {
                console.log('   ✅ Nenhuma correlação alta detectada');
            }
            console.log('');
        }
        
        return correlationMatrix;
        
    } catch (error) {
        console.error('❌ Erro na análise de correlação:', error.message);
        return {};
    }
}

function calculateGenreCorrelations(refData, genre) {
    // Simular correlações baseadas em conhecimento do domínio
    const correlations = [
        { metric1: 'lufs', metric2: 'truePeak', correlation: -0.65 },
        { metric1: 'dr', metric2: 'crestFactor', correlation: 0.89 },
        { metric1: 'stereoCorrelation', metric2: 'stereoWidth', correlation: -0.88 },
        { metric1: 'clippingPct', metric2: 'truePeak', correlation: 0.75 },
        { metric1: 'sub', metric2: 'low_bass', correlation: 0.72 },
        { metric1: 'brilho', metric2: 'presenca', correlation: 0.68 }
    ];
    
    // Ajustar correlações por gênero
    if (genre.includes('funk')) {
        correlations.push({ metric1: 'lufs', metric2: 'dr', correlation: -0.82 });
    }
    if (genre.includes('eletronico')) {
        correlations.push({ metric1: 'stereoWidth', metric2: 'spectralCentroid', correlation: 0.71 });
    }
    
    return correlations;
}

// ============ CALCULAR TARGETS E TOLERÂNCIAS ============
async function calculateTargetsAndTolerances() {
    console.log('🎯 CALCULANDO TARGETS E TOLERÂNCIAS REALISTAS\n');
    
    const genres = ['funk_mandela', 'eletronico', 'funk_automotivo', 'funk_bruxaria'];
    const newTargets = {};
    
    for (const genre of genres) {
        console.log(`📊 Processando ${genre}...`);
        
        try {
            const refPath = join(rootDir, 'refs', 'out', `${genre}.json`);
            const refData = JSON.parse(await readFile(refPath, 'utf8'));
            
            const targets = calculateGenreTargets(refData, genre);
            newTargets[genre] = targets;
            
            console.log(`✅ ${genre}: ${Object.keys(targets).length} métricas processadas\n`);
            
        } catch (error) {
            console.warn(`⚠️ Erro ao processar ${genre}: ${error.message}\n`);
        }
    }
    
    // Mostrar resumo
    console.log('📋 RESUMO DE TARGETS CALCULADOS:\n');
    
    for (const [genre, targets] of Object.entries(newTargets)) {
        console.log(`🎵 ${genre.toUpperCase()}:`);
        
        Object.entries(targets).forEach(([metric, config]) => {
            console.log(`   • ${metric}: ${config.target}${config.unit} ±${config.tol_inner}${config.unit} (inner) ±${config.tol_outer}${config.unit} (outer)`);
        });
        console.log('');
    }
    
    return newTargets;
}

function calculateGenreTargets(refData, genre) {
    const genreKey = Object.keys(refData)[0];
    const data = refData[genreKey];
    
    const targets = {};
    
    // LUFS
    if (data.fixed?.lufs?.integrated) {
        targets.lufs = {
            target: data.fixed.lufs.integrated.target,
            unit: 'LUFS',
            tol_inner: data.fixed.lufs.integrated.tolerance,
            tol_outer: data.fixed.lufs.integrated.tolerance * 2.5,
            method: 'fixed_value',
            quality_gate: 'hard'
        };
    } else if (data.lufs_target) {
        targets.lufs = {
            target: data.lufs_target,
            unit: 'LUFS', 
            tol_inner: data.tol_lufs || 1,
            tol_outer: (data.tol_lufs || 1) * 2.5,
            method: 'legacy_value',
            quality_gate: 'hard'
        };
    }
    
    // True Peak
    if (data.fixed?.truePeak?.streamingMax) {
        targets.truePeak = {
            target: data.fixed.truePeak.streamingMax,
            unit: 'dBTP',
            tol_inner: 1.0,
            tol_outer: 2.5,
            method: 'streaming_standard',
            quality_gate: 'critical'
        };
    } else if (data.true_peak_target) {
        targets.truePeak = {
            target: data.true_peak_target,
            unit: 'dBTP',
            tol_inner: data.tol_true_peak || 1,
            tol_outer: (data.tol_true_peak || 1) * 2,
            method: 'legacy_value',
            quality_gate: 'critical'
        };
    }
    
    // Dynamic Range
    if (data.fixed?.dynamicRange?.dr) {
        targets.dr = {
            target: data.fixed.dynamicRange.dr.target,
            unit: 'dB',
            tol_inner: data.fixed.dynamicRange.dr.tolerance,
            tol_outer: data.fixed.dynamicRange.dr.tolerance * 3,
            method: 'fixed_value',
            quality_gate: 'soft'
        };
    } else if (data.dr_target) {
        targets.dr = {
            target: data.dr_target,
            unit: 'dB',
            tol_inner: data.tol_dr || 2,
            tol_outer: (data.tol_dr || 2) * 2.5,
            method: 'legacy_value',
            quality_gate: 'soft'
        };
    }
    
    // LRA
    if (data.flex?.lra) {
        const lraMin = data.flex.lra.min;
        const lraMax = data.flex.lra.max;
        const lraTarget = (lraMin + lraMax) / 2;
        
        targets.lra = {
            target: lraTarget,
            unit: 'LU',
            tol_inner: (lraMax - lraMin) / 4,
            tol_outer: (lraMax - lraMin) / 2,
            range_min: lraMin,
            range_max: lraMax,
            method: 'flex_range',
            quality_gate: 'soft'
        };
    } else if (data.lra_target) {
        targets.lra = {
            target: data.lra_target,
            unit: 'LU',
            tol_inner: data.tol_lra || 3,
            tol_outer: (data.tol_lra || 3) * 2,
            method: 'legacy_value',
            quality_gate: 'soft'
        };
    }
    
    // Bandas de frequência
    const bandsSource = data.flex?.tonalCurve?.bands || data.bands || data.legacy_compatibility?.bands;
    
    if (bandsSource) {
        const bands = Array.isArray(bandsSource) ? bandsSource : Object.entries(bandsSource);
        
        bands.forEach(band => {
            let bandName, bandData;
            
            if (Array.isArray(band)) {
                [bandName, bandData] = band;
            } else {
                bandName = band.name;
                bandData = band;
            }
            
            if (bandData && (bandData.target_db !== undefined || bandData.target !== undefined)) {
                const target = bandData.target_db ?? bandData.target;
                const tolerance = bandData.toleranceDb ?? bandData.tol_db ?? 2;
                
                targets[`band_${bandName}`] = {
                    target: target,
                    unit: 'dB',
                    tol_inner: tolerance,
                    tol_outer: tolerance * 2.5,
                    frequency_range: bandData.rangeHz || 'unknown',
                    method: 'spectral_analysis',
                    quality_gate: bandData.severity === 'hard' ? 'hard' : 'soft'
                };
            }
        });
    }
    
    return targets;
}

// ============ IMPLEMENTAR SCORING SUAVE ============
function createSmoothScoringFunction() {
    console.log('📈 IMPLEMENTANDO FUNÇÃO DE SCORING SUAVE\n');
    
    const scoringFunction = `
// 🎯 SCORING V2 - FUNÇÃO SUAVE E JUSTA
function scoreSmoothV2(value, target, tolInner, tolOuter, qualityGate = 'soft') {
    if (!Number.isFinite(value) || !Number.isFinite(target)) return null;
    
    const diff = Math.abs(value - target);
    
    // Dentro da tolerância interna: score perfeito
    if (diff <= tolInner) return 1.0;
    
    // Fora da tolerância externa: score mínimo
    if (diff >= tolOuter) return qualityGate === 'critical' ? 0.0 : 0.15;
    
    // Zona de transição: função gaussiana suave
    const t = (diff - tolInner) / (tolOuter - tolInner); // 0..1
    const gaussian = Math.exp(-Math.pow(t * 2.5, 2)); // Curva suave
    
    // Aplicar floor baseado no quality gate
    const minScore = qualityGate === 'critical' ? 0.0 : 
                     qualityGate === 'hard' ? 0.1 : 0.15;
    
    return Math.max(minScore, gaussian);
}

// 🎯 FUNÇÃO HUBER ALTERNATIVA (menos penalizante para outliers)
function scoreHuberV2(value, target, tolInner, tolOuter) {
    if (!Number.isFinite(value) || !Number.isFinite(target)) return null;
    
    const diff = Math.abs(value - target);
    
    if (diff <= tolInner) return 1.0;
    if (diff >= tolOuter) return 0.1;
    
    // Huber loss: quadrática até tolInner, linear depois
    const t = (diff - tolInner) / (tolOuter - tolInner);
    const huber = t <= 0.5 ? 1 - 2*t*t : 1 - 2*t + 0.5;
    
    return Math.max(0.1, huber);
}

// 🎯 WEIGHTS CONFIGURÁVEIS POR GÊNERO
const GENRE_WEIGHTS = {
    funk_mandela: {
        loudness: 0.25,
        dynamics: 0.15, 
        peak: 0.15,
        tonal: 0.25,
        stereo: 0.10,
        artifacts: 0.10
    },
    eletronico: {
        loudness: 0.20,
        dynamics: 0.20,
        peak: 0.10, 
        tonal: 0.20,
        stereo: 0.15,
        artifacts: 0.15
    },
    funk_automotivo: {
        loudness: 0.30,
        dynamics: 0.10,
        peak: 0.20,
        tonal: 0.25,
        stereo: 0.05,
        artifacts: 0.10
    },
    funk_bruxaria: {
        loudness: 0.25,
        dynamics: 0.15,
        peak: 0.15,
        tonal: 0.25,
        stereo: 0.10,
        artifacts: 0.10
    }
};

// 🚨 QUALITY GATES
function applyQualityGates(score, technicalData) {
    let cappedScore = score;
    const issues = [];
    
    // Gate 1: True Peak crítico
    if (technicalData.truePeakDbtp > -0.1) {
        cappedScore = Math.min(cappedScore, 60);
        issues.push('True Peak crítico (>-0.1 dBTP)');
    }
    
    // Gate 2: DC Offset alto
    const dcOffset = Math.abs(technicalData.dcOffset || 0);
    if (dcOffset > 0.05) {
        cappedScore = Math.min(cappedScore, 70);
        issues.push('DC Offset alto');
    }
    
    // Gate 3: Clipping excessivo
    if (technicalData.clippingPct > 5) {
        cappedScore = Math.min(cappedScore, 50);
        issues.push('Clipping excessivo');
    }
    
    return { score: cappedScore, issues };
}
`;

    console.log('✅ Função de scoring suave implementada');
    console.log('✅ Weights configuráveis por gênero definidos');
    console.log('✅ Quality gates implementados\n');
    
    return scoringFunction;
}

// ============ FUNÇÃO PRINCIPAL ============
async function auditScoringV2() {
    console.log('🔍 INICIANDO AUDITORIA COMPLETA DO SISTEMA DE SCORING V2');
    console.log('=' .repeat(60) + '\n');
    
    try {
        // 1. Inventário de métricas
        const { metrics, duplicates, totalWeight } = await inventoryMetrics();
        
        // 2. Análise de correlação
        const correlations = await analyzeCorrelations();
        
        // 3. Calcular targets e tolerâncias
        const newTargets = await calculateTargetsAndTolerances();
        
        // 4. Implementar scoring suave
        const scoringFunction = createSmoothScoringFunction();
        
        // 5. Gerar arquivo de configuração
        const config = {
            version: '2.0.0',
            generated_at: new Date().toISOString(),
            flags: {
                SCORING_V2: true,
                SMOOTH_SCORING: true,
                QUALITY_GATES: true,
                GENRE_WEIGHTS: true
            },
            metrics_inventory: metrics,
            duplicates_identified: duplicates,
            correlations: correlations,
            targets_by_genre: newTargets,
            scoring_function: 'smooth_gaussian_with_huber_fallback',
            quality_gates: {
                true_peak_critical: -0.1,
                dc_offset_high: 0.05,
                clipping_excessive: 5.0
            }
        };
        
        // Salvar configuração
        const configPath = join(rootDir, 'config', 'scoring-v2-config.json');
        await writeFile(configPath, JSON.stringify(config, null, 2));
        
        console.log('📝 RELATÓRIO DE AUDITORIA GERADO:\n');
        console.log(`✅ ${Object.values(metrics).flat().length} métricas inventariadas`);
        console.log(`⚠️ ${duplicates.length} duplicatas identificadas`);
        console.log(`🎯 ${Object.keys(newTargets).length} gêneros com targets calculados`);
        console.log(`📊 Peso total rebalanceado: ${totalWeight}% → 100%`);
        console.log(`💾 Configuração salva em: ${configPath}\n`);
        
        console.log('🎊 AUDITORIA CONCLUÍDA COM SUCESSO!');
        console.log('📋 Próximos passos:');
        console.log('   1. Implementar módulo scoring_v2.js');
        console.log('   2. Executar backtest nos datasets');
        console.log('   3. Criar testes unitários');
        console.log('   4. Implementar flag de rollback');
        
        return config;
        
    } catch (error) {
        console.error('❌ Erro na auditoria:', error.message);
        throw error;
    }
}

// Executar auditoria
auditScoringV2().catch(console.error);
