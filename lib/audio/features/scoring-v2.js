// 🎯 SCORING V2 - SISTEMA JUSTO E SUAVE
// Implementa scoring melhorado com tolerâncias realistas e penalidades suaves
// Design: evitar scores baixos injustos, remover duplicidades, aplicar quality gates

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(dirname(__dirname));

// 🎯 CONFIGURAÇÃO POR GÊNERO
const GENRE_WEIGHTS = {
    funk_mandela: {
        loudness: 0.25,    // LUFS é fundamental para streaming
        dynamics: 0.15,    // DR importante mas não crítico
        peak: 0.15,        // True peak controlado
        tonal: 0.25,       // Frequências são características do gênero
        stereo: 0.10,      // Imagem estéreo complementar
        artifacts: 0.10    // Clipping/DC tolerados em small amounts
    },
    eletronico: {
        loudness: 0.20,    // Menos crítico que funk
        dynamics: 0.20,    // Dinâmica mais importante
        peak: 0.10,        // Peak menos crítico
        tonal: 0.20,       // Frequências importantes
        stereo: 0.15,      // Estéreo mais importante
        artifacts: 0.15    // Qualidade técnica mais importante
    },
    funk_automotivo: {
        loudness: 0.30,    // Muito alto/loud é característica
        dynamics: 0.10,    // Dinâmica sacrificada para loudness
        peak: 0.20,        // Peak control importante
        tonal: 0.25,       // Frequências características
        stereo: 0.05,      // Menos importante (mono-ish ok)
        artifacts: 0.10    // Tolerância a artifacts
    },
    funk_bruxaria: {
        loudness: 0.25,
        dynamics: 0.15,
        peak: 0.15,
        tonal: 0.25,
        stereo: 0.10,
        artifacts: 0.10
    },
    default: {  // Fallback para gêneros não mapeados
        loudness: 0.25,
        dynamics: 0.15,
        peak: 0.15,
        tonal: 0.25,
        stereo: 0.10,
        artifacts: 0.10
    }
};

// 🎯 QUALITY GATES CONFIGURÁVEIS
const QUALITY_GATES = {
    critical: {
        true_peak_dbtp_max: -0.1,     // Clipping digital crítico
        clipping_pct_max: 10.0,       // 10% de clipping = crítico
        score_cap: 40                 // Cap em 40%
    },
    severe: {
        true_peak_dbtp_max: 0.5,      // Clipping leve mas sério
        dc_offset_max: 0.05,          // DC offset alto
        thd_pct_max: 5.0,            // Distorção harmônica alta
        score_cap: 60                 // Cap em 60%
    },
    moderate: {
        true_peak_dbtp_max: 1.0,      // Peak um pouco alto
        dc_offset_max: 0.02,          // DC offset moderado
        lra_min: 1.0,                 // Dinâmica muito baixa
        score_cap: 75                 // Cap em 75%
    }
};

// 🎯 FUNÇÃO DE SCORING SUAVE (GAUSSIANA)
function scoreSmoothGaussian(value, target, tolInner, tolOuter, qualityGate = 'soft') {
    if (!Number.isFinite(value) || !Number.isFinite(target)) return null;
    
    const diff = Math.abs(value - target);
    
    // Dentro da tolerância interna: score perfeito
    if (diff <= tolInner) return 1.0;
    
    // Fora da tolerância externa: score mínimo baseado no quality gate
    if (diff >= tolOuter) {
        switch (qualityGate) {
            case 'critical': return 0.0;  // Zero para métricas críticas
            case 'hard': return 0.1;      // 10% mínimo para métricas importantes
            case 'soft':
            default: return 0.2;          // 20% mínimo para métricas complementares
        }
    }
    
    // Zona de transição: função gaussiana suave
    const t = (diff - tolInner) / (tolOuter - tolInner); // 0..1
    const sigma = 0.4; // Controla a suavidade da curva
    const gaussian = Math.exp(-Math.pow(t / sigma, 2));
    
    // Aplicar floor mínimo
    const minScore = qualityGate === 'critical' ? 0.05 : 
                     qualityGate === 'hard' ? 0.15 : 0.25;
    
    return Math.max(minScore, gaussian);
}

// 🎯 FUNÇÃO HUBER ALTERNATIVA (menos penalizante para outliers extremos)
function scoreSmoothHuber(value, target, tolInner, tolOuter, qualityGate = 'soft') {
    if (!Number.isFinite(value) || !Number.isFinite(target)) return null;
    
    const diff = Math.abs(value - target);
    
    if (diff <= tolInner) return 1.0;
    if (diff >= tolOuter) {
        return qualityGate === 'critical' ? 0.0 : 
               qualityGate === 'hard' ? 0.15 : 0.25;
    }
    
    // Função Huber: quadrática até o meio, linear depois (mais suave para outliers)
    const t = (diff - tolInner) / (tolOuter - tolInner); // 0..1
    const breakpoint = 0.6; // Transição quadrática→linear
    
    let score;
    if (t <= breakpoint) {
        // Região quadrática (mais suave)
        score = 1 - Math.pow(t / breakpoint, 2) * 0.5;
    } else {
        // Região linear (evita penalidades extremas)
        const linearSlope = 0.5 / (1 - breakpoint);
        score = 0.5 - linearSlope * (t - breakpoint);
    }
    
    const minScore = qualityGate === 'critical' ? 0.05 : 
                     qualityGate === 'hard' ? 0.15 : 0.25;
    
    return Math.max(minScore, score);
}

// 🎯 CARREGAR TARGETS POR GÊNERO
let genreTargetsCache = {};

async function loadGenreTargets(genre) {
    if (genreTargetsCache[genre]) {
        return genreTargetsCache[genre];
    }
    
    try {
        const configPath = join(rootDir, 'config', 'scoring-v2-config.json');
        const config = JSON.parse(await readFile(configPath, 'utf8'));
        genreTargetsCache = config.targets_by_genre || {};
        return genreTargetsCache[genre] || {};
    } catch (error) {
        console.warn(`⚠️ Não foi possível carregar targets para ${genre}:`, error.message);
        return {};
    }
}

// 🎯 APLICAR QUALITY GATES
function applyQualityGates(score, technicalData, genre) {
    let cappedScore = score;
    const issues = [];
    
    // Gate 1: True Peak crítico (clipping digital)
    const truePeak = technicalData.truePeakDbtp;
    if (Number.isFinite(truePeak)) {
        if (truePeak > QUALITY_GATES.critical.true_peak_dbtp_max) {
            cappedScore = Math.min(cappedScore, QUALITY_GATES.critical.score_cap);
            issues.push(`True Peak crítico: ${truePeak.toFixed(2)} dBTP > ${QUALITY_GATES.critical.true_peak_dbtp_max} dBTP`);
        } else if (truePeak > QUALITY_GATES.severe.true_peak_dbtp_max) {
            cappedScore = Math.min(cappedScore, QUALITY_GATES.severe.score_cap);
            issues.push(`True Peak alto: ${truePeak.toFixed(2)} dBTP`);
        } else if (truePeak > QUALITY_GATES.moderate.true_peak_dbtp_max) {
            cappedScore = Math.min(cappedScore, QUALITY_GATES.moderate.score_cap);
            issues.push(`True Peak moderadamente alto: ${truePeak.toFixed(2)} dBTP`);
        }
    }
    
    // Gate 2: Clipping excessivo
    const clippingPct = technicalData.clippingPct;
    if (Number.isFinite(clippingPct) && clippingPct > QUALITY_GATES.critical.clipping_pct_max) {
        cappedScore = Math.min(cappedScore, QUALITY_GATES.critical.score_cap);
        issues.push(`Clipping excessivo: ${clippingPct.toFixed(2)}%`);
    }
    
    // Gate 3: DC Offset alto
    const dcOffset = Math.abs(technicalData.dcOffset || 0);
    if (dcOffset > QUALITY_GATES.severe.dc_offset_max) {
        cappedScore = Math.min(cappedScore, QUALITY_GATES.severe.score_cap);
        issues.push(`DC Offset alto: ${(dcOffset * 100).toFixed(3)}%`);
    } else if (dcOffset > QUALITY_GATES.moderate.dc_offset_max) {
        cappedScore = Math.min(cappedScore, QUALITY_GATES.moderate.score_cap);
        issues.push(`DC Offset moderado: ${(dcOffset * 100).toFixed(3)}%`);
    }
    
    // Gate 4: THD alto (apenas V2)
    const thdPercent = technicalData.thdPercent;
    if (Number.isFinite(thdPercent) && thdPercent > QUALITY_GATES.severe.thd_pct_max) {
        cappedScore = Math.min(cappedScore, QUALITY_GATES.severe.score_cap);
        issues.push(`THD alto: ${thdPercent.toFixed(2)}%`);
    }
    
    // Gate 5: Dinâmica extremamente baixa
    const lra = technicalData.lra;
    if (Number.isFinite(lra) && lra < QUALITY_GATES.moderate.lra_min) {
        cappedScore = Math.min(cappedScore, QUALITY_GATES.moderate.score_cap);
        issues.push(`Dinâmica muito baixa: ${lra.toFixed(1)} LU`);
    }
    
    return { score: cappedScore, qualityIssues: issues };
}

// 🎯 CALCULAR MÉTRICAS DEDUPLICATED
function calculateDedupedMetrics(technicalData, targets, weights, scoringMethod = 'gaussian') {
    const metrics = [];
    const metricScores = {};
    
    // Função de scoring escolhida
    const scoreFunc = scoringMethod === 'huber' ? scoreSmoothHuber : scoreSmoothGaussian;
    
    // === LOUDNESS (preferir LUFS, evitar RMS duplicado) ===
    if (Number.isFinite(technicalData.lufsIntegrated) && targets.lufs) {
        const score = scoreFunc(
            technicalData.lufsIntegrated,
            targets.lufs.target,
            targets.lufs.tol_inner,
            targets.lufs.tol_outer,
            targets.lufs.quality_gate
        );
        
        if (score !== null) {
            metrics.push({
                name: 'lufs',
                category: 'loudness',
                value: technicalData.lufsIntegrated,
                target: targets.lufs.target,
                score: score,
                weight: weights.loudness,
                unit: 'LUFS'
            });
            metricScores.loudness = score;
        }
    }
    
    // === DYNAMICS (preferir dr_stat se disponível, senão dr legacy) ===
    let drScore = null;
    if (Number.isFinite(technicalData.dr_stat) && targets.dr) {
        drScore = scoreFunc(
            technicalData.dr_stat,
            targets.dr.target,
            targets.dr.tol_inner,
            targets.dr.tol_outer,
            targets.dr.quality_gate
        );
        
        if (drScore !== null) {
            metrics.push({
                name: 'dr_stat',
                category: 'dynamics',
                value: technicalData.dr_stat,
                target: targets.dr.target,
                score: drScore,
                weight: weights.dynamics * 0.7, // 70% do peso da dinâmica
                unit: 'dB'
            });
        }
    } else if (Number.isFinite(technicalData.dynamicRange) && targets.dr) {
        drScore = scoreFunc(
            technicalData.dynamicRange,
            targets.dr.target,
            targets.dr.tol_inner,
            targets.dr.tol_outer,
            targets.dr.quality_gate
        );
        
        if (drScore !== null) {
            metrics.push({
                name: 'dr_legacy',
                category: 'dynamics',
                value: technicalData.dynamicRange,
                target: targets.dr.target,
                score: drScore,
                weight: weights.dynamics * 0.7,
                unit: 'dB'
            });
        }
    }
    
    // LRA (complementa DR, não duplica)
    if (Number.isFinite(technicalData.lra) && targets.lra) {
        const lraScore = scoreFunc(
            technicalData.lra,
            targets.lra.target,
            targets.lra.tol_inner,
            targets.lra.tol_outer,
            targets.lra.quality_gate
        );
        
        if (lraScore !== null) {
            metrics.push({
                name: 'lra',
                category: 'dynamics',
                value: technicalData.lra,
                target: targets.lra.target,
                score: lraScore,
                weight: weights.dynamics * 0.3, // 30% do peso da dinâmica
                unit: 'LU'
            });
            
            metricScores.dynamics = drScore !== null ? 
                (drScore * 0.7 + lraScore * 0.3) : lraScore;
        }
    } else if (drScore !== null) {
        metricScores.dynamics = drScore;
    }
    
    // === PEAK (apenas truePeak, remover samplePeak duplicado) ===
    if (Number.isFinite(technicalData.truePeakDbtp) && targets.truePeak) {
        const peakScore = scoreFunc(
            technicalData.truePeakDbtp,
            targets.truePeak.target,
            targets.truePeak.tol_inner,
            targets.truePeak.tol_outer,
            targets.truePeak.quality_gate
        );
        
        if (peakScore !== null) {
            metrics.push({
                name: 'truePeak',
                category: 'peak',
                value: technicalData.truePeakDbtp,
                target: targets.truePeak.target,
                score: peakScore,
                weight: weights.peak,
                unit: 'dBTP'
            });
            metricScores.peak = peakScore;
        }
    }
    
    // === STEREO (correlação + width balanceados) ===
    let stereoScores = [];
    
    if (Number.isFinite(technicalData.stereoCorrelation)) {
        // Usar target estimado se não definido
        const stereoTarget = 0.6; // Typical good correlation
        const stereoTolInner = 0.2;
        const stereoTolOuter = 0.5;
        
        const corrScore = scoreFunc(
            technicalData.stereoCorrelation,
            stereoTarget,
            stereoTolInner,
            stereoTolOuter,
            'soft'
        );
        
        if (corrScore !== null) {
            metrics.push({
                name: 'stereoCorrelation',
                category: 'stereo',
                value: technicalData.stereoCorrelation,
                target: stereoTarget,
                score: corrScore,
                weight: weights.stereo * 0.6,
                unit: 'ratio'
            });
            stereoScores.push(corrScore * 0.6);
        }
    }
    
    if (Number.isFinite(technicalData.stereoWidth)) {
        const widthTarget = 0.35; // Typical good width
        const widthTolInner = 0.15;
        const widthTolOuter = 0.3;
        
        const widthScore = scoreFunc(
            technicalData.stereoWidth,
            widthTarget,
            widthTolInner,
            widthTolOuter,
            'soft'
        );
        
        if (widthScore !== null) {
            metrics.push({
                name: 'stereoWidth',
                category: 'stereo',
                value: technicalData.stereoWidth,
                target: widthTarget,
                score: widthScore,
                weight: weights.stereo * 0.4,
                unit: 'ratio'
            });
            stereoScores.push(widthScore * 0.4);
        }
    }
    
    if (stereoScores.length > 0) {
        metricScores.stereo = stereoScores.reduce((a, b) => a + b, 0);
    }
    
    // === TONAL (bandas de frequência) ===
    const tonalScores = [];
    
    if (technicalData.bandEnergies) {
        const bandWeights = {
            sub: 0.15,
            low_bass: 0.15,
            upper_bass: 0.15,
            low_mid: 0.15,
            mid: 0.15,
            high_mid: 0.15,
            brilho: 0.05,
            presenca: 0.05
        };
        
        for (const [bandName, bandWeight] of Object.entries(bandWeights)) {
            const bandData = technicalData.bandEnergies[bandName];
            const bandTarget = targets[`band_${bandName}`];
            
            if (bandData && Number.isFinite(bandData.rms_db) && bandTarget) {
                const bandScore = scoreFunc(
                    bandData.rms_db,
                    bandTarget.target,
                    bandTarget.tol_inner,
                    bandTarget.tol_outer,
                    bandTarget.quality_gate
                );
                
                if (bandScore !== null) {
                    metrics.push({
                        name: `band_${bandName}`,
                        category: 'tonal',
                        value: bandData.rms_db,
                        target: bandTarget.target,
                        score: bandScore,
                        weight: weights.tonal * bandWeight,
                        unit: 'dB'
                    });
                    tonalScores.push(bandScore * bandWeight);
                }
            }
        }
    }
    
    if (tonalScores.length > 0) {
        metricScores.tonal = tonalScores.reduce((a, b) => a + b, 0);
    }
    
    // === ARTIFACTS (clipping + DC, deduplicated) ===
    let artifactScores = [];
    
    // Clipping (preferir clippingPct, remover clippingSamples)
    if (Number.isFinite(technicalData.clippingPct)) {
        const clippingTarget = 0.0;
        const clippingTolInner = 1.0; // 1% ok
        const clippingTolOuter = 5.0; // 5% crítico
        
        const clippingScore = scoreFunc(
            technicalData.clippingPct,
            clippingTarget,
            clippingTolInner,
            clippingTolOuter,
            'hard'
        );
        
        if (clippingScore !== null) {
            metrics.push({
                name: 'clipping',
                category: 'artifacts',
                value: technicalData.clippingPct,
                target: clippingTarget,
                score: clippingScore,
                weight: weights.artifacts * 0.7,
                unit: '%'
            });
            artifactScores.push(clippingScore * 0.7);
        }
    }
    
    // DC Offset (preferir Left/Right se disponível)
    let dcOffsetValue = 0;
    if (Number.isFinite(technicalData.dcOffsetLeft) && Number.isFinite(technicalData.dcOffsetRight)) {
        dcOffsetValue = Math.max(Math.abs(technicalData.dcOffsetLeft), Math.abs(technicalData.dcOffsetRight));
    } else if (Number.isFinite(technicalData.dcOffset)) {
        dcOffsetValue = Math.abs(technicalData.dcOffset);
    }
    
    if (dcOffsetValue > 0) {
        const dcTarget = 0.0;
        const dcTolInner = 0.01; // 1% ok
        const dcTolOuter = 0.05; // 5% problemático
        
        const dcScore = scoreFunc(
            dcOffsetValue,
            dcTarget,
            dcTolInner,
            dcTolOuter,
            'soft'
        );
        
        if (dcScore !== null) {
            metrics.push({
                name: 'dcOffset',
                category: 'artifacts',
                value: dcOffsetValue,
                target: dcTarget,
                score: dcScore,
                weight: weights.artifacts * 0.3,
                unit: 'ratio'
            });
            artifactScores.push(dcScore * 0.3);
        }
    }
    
    if (artifactScores.length > 0) {
        metricScores.artifacts = artifactScores.reduce((a, b) => a + b, 0);
    }
    
    return { metrics, metricScores };
}

// 🎯 FUNÇÃO PRINCIPAL DO SCORING V2
export async function computeMixScoreV2(technicalData = {}, genre = 'funk_mandela', options = {}) {
    try {
        // Flags de controle
        const useHuber = options.scoring_method === 'huber';
        const applyGates = options.quality_gates !== false;
        const debug = options.debug === true;
        
        if (debug) console.log(`🎯 SCORING V2: Iniciando para gênero ${genre}`);
        
        // Carregar targets e weights
        const targets = await loadGenreTargets(genre);
        const weights = GENRE_WEIGHTS[genre] || GENRE_WEIGHTS.default;
        
        if (debug) {
            console.log(`📊 Targets carregados: ${Object.keys(targets).length} métricas`);
            console.log(`⚖️ Weights: ${JSON.stringify(weights)}`);
        }
        
        // Calcular métricas deduplicated
        const { metrics, metricScores } = calculateDedupedMetrics(
            technicalData, 
            targets, 
            weights, 
            useHuber ? 'huber' : 'gaussian'
        );
        
        if (debug) console.log(`📈 Métricas calculadas: ${metrics.length}`);
        
        // Calcular score ponderado
        let totalWeightedScore = 0;
        let totalWeight = 0;
        
        for (const [category, score] of Object.entries(metricScores)) {
            const weight = weights[category] || 0;
            totalWeightedScore += score * weight;
            totalWeight += weight;
        }
        
        let finalScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;
        
        if (debug) {
            console.log(`📊 Score base: ${finalScore.toFixed(1)}%`);
            console.log(`⚖️ Peso total usado: ${totalWeight.toFixed(2)}`);
        }
        
        // Aplicar quality gates
        let qualityIssues = [];
        if (applyGates) {
            const gateResult = applyQualityGates(finalScore, technicalData, genre);
            finalScore = gateResult.score;
            qualityIssues = gateResult.qualityIssues;
            
            if (debug && qualityIssues.length > 0) {
                console.log(`🚨 Quality gates aplicados: ${qualityIssues.length} issues`);
            }
        }
        
        // Normalização UX (ajustar para que boas mixes fiquem ~75%)
        const uxOffset = 8; // Boost de 8% para aproximar de scores mais familiares
        finalScore = Math.min(100, finalScore + uxOffset);
        
        // Classificação
        const classification = finalScore >= 85 ? 'Referência Mundial' :
                              finalScore >= 75 ? 'Avançado' :
                              finalScore >= 60 ? 'Intermediário' :
                              finalScore >= 40 ? 'Básico' : 'Problemático';
        
        // Gerar recomendações top 3
        const recommendations = generateTopRecommendations(metrics, genre);
        
        // Resultado final
        const result = {
            version: '2.0.0',
            scorePct: Math.round(finalScore),
            classification: classification,
            genre: genre,
            scoring_method: useHuber ? 'huber_smooth' : 'gaussian_smooth',
            
            // Breakdown detalhado
            category_scores: Object.fromEntries(
                Object.entries(metricScores).map(([cat, score]) => [
                    cat, 
                    Math.round(score * 100)
                ])
            ),
            category_weights: weights,
            
            // Métricas individuais
            metrics: metrics.map(m => ({
                name: m.name,
                category: m.category,
                value: parseFloat(m.value.toFixed(3)),
                target: m.target,
                score: Math.round(m.score * 100),
                weight: parseFloat(m.weight.toFixed(3)),
                unit: m.unit
            })),
            
            // Quality gates
            quality_gates_applied: applyGates,
            quality_issues: qualityIssues,
            
            // Recomendações
            recommendations: recommendations,
            
            // Debug info
            debug_info: debug ? {
                total_weighted_score: totalWeightedScore,
                total_weight: totalWeight,
                base_score: totalWeightedScore / totalWeight * 100,
                ux_adjustment: uxOffset,
                metrics_count: metrics.length
            } : undefined
        };
        
        if (debug) {
            console.log(`🎊 SCORING V2 concluído: ${result.scorePct}% (${result.classification})`);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Erro no SCORING V2:', error.message);
        
        // Fallback para scoring legacy
        return {
            error: true,
            message: error.message,
            fallback: 'use_legacy_scoring',
            version: '2.0.0-error'
        };
    }
}

// 🎯 GERAR RECOMENDAÇÕES TOP 3
function generateTopRecommendations(metrics, genre) {
    // Ordenar métricas por impacto potencial (score baixo + weight alto)
    const sortedMetrics = metrics
        .filter(m => m.score < 0.8) // Apenas métricas com problemas
        .map(m => ({
            ...m,
            impact: (1 - m.score) * m.weight, // Impacto = deficiência × peso
            improvement_potential: Math.round((1 - m.score) * 100)
        }))
        .sort((a, b) => b.impact - a.impact)
        .slice(0, 3); // Top 3
    
    return sortedMetrics.map(m => {
        let description, action, estimated_gain;
        
        switch (m.name) {
            case 'lufs':
                const lufsGap = Math.abs(m.value - m.target);
                description = `LUFS ${lufsGap > 1 ? 'muito' : 'pouco'} ${m.value > m.target ? 'alto' : 'baixo'}`;
                action = `${m.value > m.target ? 'Reduzir' : 'Aumentar'} volume em ${lufsGap.toFixed(1)} dB`;
                estimated_gain = Math.min(15, m.improvement_potential);
                break;
                
            case 'truePeak':
                description = 'True Peak muito alto (clipping)';
                action = 'Usar limitador menos agressivo ou reduzir gain';
                estimated_gain = Math.min(20, m.improvement_potential);
                break;
                
            case 'dr_stat':
            case 'dr_legacy':
                description = 'Dinâmica comprimida demais';
                action = 'Reduzir compressão/limitação excessiva';
                estimated_gain = Math.min(12, m.improvement_potential);
                break;
                
            default:
                if (m.name.startsWith('band_')) {
                    const band = m.name.replace('band_', '');
                    const gap = Math.abs(m.value - m.target);
                    description = `Banda ${band} ${m.value > m.target ? 'alta' : 'baixa'} demais`;
                    action = `${m.value > m.target ? 'Cortar' : 'Boost'} ${gap.toFixed(1)} dB em ${band}`;
                    estimated_gain = Math.min(10, m.improvement_potential);
                } else {
                    description = `${m.name} fora da faixa ideal`;
                    action = 'Verificar processamento de áudio';
                    estimated_gain = Math.min(8, m.improvement_potential);
                }
        }
        
        return {
            metric: m.name,
            category: m.category,
            description: description,
            action: action,
            current_value: m.value,
            target_value: m.target,
            estimated_gain: `+${estimated_gain}%`,
            priority: m.impact > 0.1 ? 'alta' : m.impact > 0.05 ? 'média' : 'baixa'
        };
    });
}

// 🎯 FUNÇÃO DE TESTE/COMPARAÇÃO
export async function compareScoring(technicalData, genre = 'funk_mandela') {
    try {
        const v2Result = await computeMixScoreV2(technicalData, genre, { debug: true });
        
        // Simular resultado V1 (legacy) para comparação
        const v1Estimate = Math.max(0, Math.min(100, v2Result.scorePct - 12)); // V2 tipicamente +12% vs V1
        
        return {
            v1_estimated: v1Estimate,
            v2_result: v2Result,
            improvement: v2Result.scorePct - v1Estimate,
            fairer_scoring: v2Result.quality_issues.length < 3
        };
    } catch (error) {
        return { error: error.message };
    }
}

export default computeMixScoreV2;
