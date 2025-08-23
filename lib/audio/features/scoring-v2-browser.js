/**
 * 🎯 SCORING V2 - SISTEMA JUSTO E SUAVE (BROWSER VERSION)
 * =======================================================
 * 
 * Implementa scoring melhorado com tolerâncias realistas e penalidades suaves
 * Versão simplificada para browser sem dependências de filesystem
 */

// 🎯 CONFIGURAÇÃO POR GÊNERO
const GENRE_WEIGHTS = {
    funk_mandela: {
        loudness: 0.25,    // LUFS é fundamental
        dynamics: 0.15,    // DR importante mas não crítico
        peak: 0.15,        // True peak controlado
        tonal: 0.25,       // Frequências características
        stereo: 0.10,      // Imagem estéreo complementar
        artifacts: 0.10    // Tolerância a artifacts
    },
    eletronico: {
        loudness: 0.20,    // Menos crítico que funk
        dynamics: 0.20,    // Dinâmica mais importante
        peak: 0.10,        // Peak menos crítico
        tonal: 0.20,       // Frequências importantes
        stereo: 0.15,      // Estéreo mais importante
        artifacts: 0.15    // Qualidade técnica importante
    },
    default: {
        loudness: 0.25,
        dynamics: 0.15,
        peak: 0.15,
        tonal: 0.25,
        stereo: 0.10,
        artifacts: 0.10
    }
};

// 🎯 TARGETS POR GÊNERO (simplified)
const GENRE_TARGETS = {
    funk_mandela: {
        lufsIntegrated: { min: -16, ideal: -12, max: -8 },
        truePeak: { min: -6, ideal: -1, max: -0.1 },
        dynamicRange: { min: 3, ideal: 8, max: 20 },
        lra: { min: 2, ideal: 6, max: 12 },
        stereoCorrelation: { min: 0.3, ideal: 0.8, max: 1.0 }
    },
    eletronico: {
        lufsIntegrated: { min: -14, ideal: -10, max: -6 },
        truePeak: { min: -3, ideal: -0.5, max: -0.1 },
        dynamicRange: { min: 2, ideal: 5, max: 15 },
        lra: { min: 1, ideal: 4, max: 8 },
        stereoCorrelation: { min: 0.2, ideal: 0.7, max: 1.0 }
    },
    default: {
        lufsIntegrated: { min: -16, ideal: -14, max: -8 },
        truePeak: { min: -6, ideal: -1, max: -0.1 },
        dynamicRange: { min: 3, ideal: 8, max: 20 },
        lra: { min: 2, ideal: 6, max: 12 },
        stereoCorrelation: { min: 0.3, ideal: 0.8, max: 1.0 }
    }
};

// 🎯 QUALITY GATES
const QUALITY_GATES = {
    critical: {
        maxScore: 40,
        conditions: [
            { metric: 'truePeak', threshold: -0.1, operator: '>' }
        ]
    },
    severe: {
        maxScore: 60,
        conditions: [
            { metric: 'dcOffset', threshold: 0.01, operator: '>' }
        ]
    },
    moderate: {
        maxScore: 75,
        conditions: [
            { metric: 'clippingPercent', threshold: 1.0, operator: '>' }
        ]
    }
};

/**
 * 🧮 FUNÇÃO PRINCIPAL DO SCORING V2
 */
export function calculateScoringV2(technicalData = {}, reference = null, options = {}) {
    console.log('🎯 [SCORING_V2] Iniciando cálculo V2...', { options });
    
    const startTime = performance.now();
    
    try {
        // Determinar gênero baseado na referência ou dados
        const genre = detectGenre(reference, technicalData);
        const weights = GENRE_WEIGHTS[genre] || GENRE_WEIGHTS.default;
        const targets = GENRE_TARGETS[genre] || GENRE_TARGETS.default;
        
        console.log(`🎵 [SCORING_V2] Gênero detectado: ${genre}`, { weights });
        
        // 📊 CALCULAR SCORES POR CATEGORIA
        const categoryScores = calculateCategoryScores(technicalData, targets, weights, options);
        
        // 🎯 SCORING GAUSSIANO SUAVE
        const rawScore = calculateWeightedScore(categoryScores, weights);
        
        // 🛡️ APLICAR QUALITY GATES
        const finalScore = applyQualityGates(rawScore, technicalData, options);
        
        // 📊 RESULTADO FINAL
        const result = {
            scorePct: Math.max(15, Math.min(100, Math.round(finalScore))), // Entre 15% e 100%
            classification: classifyScore(finalScore),
            method: 'v2_gaussian',
            genre: genre,
            
            // Detalhes técnicos
            details: {
                categoryScores: categoryScores,
                rawScore: rawScore,
                finalScore: finalScore,
                weights: weights,
                targets: targets,
                appliedGates: getAppliedGates(technicalData)
            },
            
            // Metadados
            processingTime: performance.now() - startTime,
            version: 'v2.0.0-browser',
            timestamp: new Date().toISOString()
        };
        
        console.log(`✅ [SCORING_V2] Score calculado: ${result.scorePct}% (${result.classification})`);
        
        return result;
        
    } catch (error) {
        console.error('❌ [SCORING_V2] Erro no cálculo:', error);
        throw error;
    }
}

/**
 * 🔍 DETECTAR GÊNERO
 */
function detectGenre(reference, technicalData) {
    // Se há referência específica
    if (reference && reference.genre) {
        return reference.genre;
    }
    
    // Detectar pelo window global (se disponível)
    if (typeof window !== 'undefined') {
        const activeGenre = window.PROD_AI_REF_GENRE;
        if (activeGenre && GENRE_WEIGHTS[activeGenre]) {
            return activeGenre;
        }
    }
    
    // Fallback para default
    return 'default';
}

/**
 * 📊 CALCULAR SCORES POR CATEGORIA
 */
function calculateCategoryScores(technicalData, targets, weights, options) {
    const categories = {};
    
    // Loudness
    categories.loudness = scoreLoudness(technicalData, targets);
    
    // Dynamics
    categories.dynamics = scoreDynamics(technicalData, targets);
    
    // Peak
    categories.peak = scorePeak(technicalData, targets);
    
    // Tonal (simplificado)
    categories.tonal = scoreTonal(technicalData, targets);
    
    // Stereo
    categories.stereo = scoreStereo(technicalData, targets);
    
    // Artifacts
    categories.artifacts = scoreArtifacts(technicalData, targets);
    
    return categories;
}

/**
 * 🔊 SCORE LOUDNESS (LUFS)
 */
function scoreLoudness(data, targets) {
    const lufs = data.lufsIntegrated;
    if (!Number.isFinite(lufs)) return 50; // Neutro se não disponível
    
    const target = targets.lufsIntegrated;
    return scoreGaussian(lufs, target.ideal, (target.max - target.min) / 4);
}

/**
 * 📈 SCORE DYNAMICS
 */
function scoreDynamics(data, targets) {
    const dr = data.dynamicRange || data.dr;
    if (!Number.isFinite(dr)) return 50;
    
    const target = targets.dynamicRange;
    return scoreGaussian(dr, target.ideal, (target.max - target.min) / 4);
}

/**
 * ⚡ SCORE PEAK
 */
function scorePeak(data, targets) {
    const truePeak = data.truePeakDbtp;
    if (!Number.isFinite(truePeak)) return 50;
    
    const target = targets.truePeak;
    
    // Penalizar mais severamente picos acima de -0.1 dBTP
    if (truePeak > -0.1) {
        return Math.max(0, 40 - (truePeak + 0.1) * 100); // Penalização severa
    }
    
    return scoreGaussian(truePeak, target.ideal, (target.max - target.min) / 4);
}

/**
 * 🎵 SCORE TONAL (simplificado)
 */
function scoreTonal(data, targets) {
    // Score simplificado baseado em bandas se disponíveis
    if (data.bandEnergies) {
        const bandScores = [];
        
        for (const [bandName, bandData] of Object.entries(data.bandEnergies)) {
            if (bandData && Number.isFinite(bandData.rms_db)) {
                // Assumir target neutro para bandas sem referência específica
                const score = scoreGaussian(bandData.rms_db, -7, 3);
                bandScores.push(score);
            }
        }
        
        if (bandScores.length > 0) {
            return bandScores.reduce((a, b) => a + b) / bandScores.length;
        }
    }
    
    // Fallback para score neutro
    return 70; // Assumir OK se não há dados de banda
}

/**
 * 🎧 SCORE STEREO
 */
function scoreStereo(data, targets) {
    const correlation = data.stereoCorrelation;
    if (!Number.isFinite(correlation)) return 50;
    
    const target = targets.stereoCorrelation;
    return scoreGaussian(correlation, target.ideal, (target.max - target.min) / 4);
}

/**
 * 🔧 SCORE ARTIFACTS
 */
function scoreArtifacts(data, targets) {
    let artifactScore = 100; // Começar com pontuação máxima
    
    // Penalizar DC offset
    const dcOffset = Math.abs(data.dcOffset || 0);
    if (dcOffset > 0.001) {
        artifactScore -= dcOffset * 1000; // Penalização por DC offset
    }
    
    // Penalizar clipping
    const clipping = data.clippingPercent || data.clippingSamples || 0;
    if (clipping > 0) {
        artifactScore -= clipping * 10; // Penalização por clipping
    }
    
    return Math.max(0, Math.min(100, artifactScore));
}

/**
 * 🧮 FUNÇÃO GAUSSIANA PARA SCORING SUAVE
 */
function scoreGaussian(value, ideal, sigma) {
    if (!Number.isFinite(value) || !Number.isFinite(ideal) || !Number.isFinite(sigma) || sigma <= 0) {
        return 50; // Score neutro se dados inválidos
    }
    
    const diff = Math.abs(value - ideal);
    const gaussianScore = Math.exp(-0.5 * Math.pow(diff / sigma, 2)) * 100;
    
    return Math.max(0, Math.min(100, gaussianScore));
}

/**
 * ⚖️ CALCULAR SCORE PONDERADO
 */
function calculateWeightedScore(categoryScores, weights) {
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const [category, weight] of Object.entries(weights)) {
        const score = categoryScores[category];
        if (Number.isFinite(score)) {
            weightedSum += score * weight;
            totalWeight += weight;
        }
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 50;
}

/**
 * 🛡️ APLICAR QUALITY GATES
 */
function applyQualityGates(rawScore, technicalData, options) {
    if (!options.enableQualityGates) {
        return rawScore;
    }
    
    let finalScore = rawScore;
    
    // Verificar gates críticos
    for (const [gateName, gate] of Object.entries(QUALITY_GATES)) {
        for (const condition of gate.conditions) {
            const metricValue = technicalData[condition.metric];
            
            if (Number.isFinite(metricValue)) {
                let conditionMet = false;
                
                switch (condition.operator) {
                    case '>':
                        conditionMet = metricValue > condition.threshold;
                        break;
                    case '<':
                        conditionMet = metricValue < condition.threshold;
                        break;
                    case '>=':
                        conditionMet = metricValue >= condition.threshold;
                        break;
                    case '<=':
                        conditionMet = metricValue <= condition.threshold;
                        break;
                }
                
                if (conditionMet) {
                    console.log(`🛡️ [QUALITY_GATE] Aplicando gate ${gateName}: max ${gate.maxScore}%`);
                    finalScore = Math.min(finalScore, gate.maxScore);
                }
            }
        }
    }
    
    return finalScore;
}

/**
 * 🏷️ CLASSIFICAR SCORE
 */
function classifyScore(score) {
    if (score >= 90) return 'Referência Mundial';
    if (score >= 75) return 'Avançado';
    if (score >= 60) return 'Intermediário';
    return 'Básico';
}

/**
 * 🔍 OBTER GATES APLICADOS
 */
function getAppliedGates(technicalData) {
    const applied = [];
    
    for (const [gateName, gate] of Object.entries(QUALITY_GATES)) {
        for (const condition of gate.conditions) {
            const metricValue = technicalData[condition.metric];
            
            if (Number.isFinite(metricValue)) {
                let conditionMet = false;
                
                switch (condition.operator) {
                    case '>':
                        conditionMet = metricValue > condition.threshold;
                        break;
                    case '<':
                        conditionMet = metricValue < condition.threshold;
                        break;
                }
                
                if (conditionMet) {
                    applied.push({
                        gate: gateName,
                        metric: condition.metric,
                        value: metricValue,
                        threshold: condition.threshold,
                        maxScore: gate.maxScore
                    });
                }
            }
        }
    }
    
    return applied;
}

// Global namespace para browser
window.ScoringV2 = {
    calculateScoringV2: calculateScoringV2
};

console.log('🎯 [SCORING_V2] Módulo V2 carregado globalmente!');
