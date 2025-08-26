// 🎯 IMPLEMENTAÇÃO PRÁTICA: ANÁLISE ESPECTRAL POR BANDAS
// Compatível com o sistema atual - expande as métricas existentes

class SpectralBandAnalyzer {
    constructor() {
        // Definição das bandas de frequência para análise profissional
        this.frequencyBands = {
            subBass: { min: 20, max: 60, ideal: { min: -12, max: -6 }, name: 'Sub Bass' },
            bass: { min: 60, max: 250, ideal: { min: -9, max: -3 }, name: 'Bass' },
            lowMid: { min: 250, max: 500, ideal: { min: -6, max: 0 }, name: 'Low Mid' },
            mid: { min: 500, max: 2000, ideal: { min: -3, max: 3 }, name: 'Mid' },
            highMid: { min: 2000, max: 4000, ideal: { min: -3, max: 3 }, name: 'High Mid' },
            presence: { min: 4000, max: 8000, ideal: { min: -6, max: 0 }, name: 'Presence' },
            brilliance: { min: 8000, max: 16000, ideal: { min: -9, max: -3 }, name: 'Brilliance' },
            air: { min: 16000, max: 20000, ideal: { min: -15, max: -9 }, name: 'Air' }
        };

        // Problemas comuns por banda
        this.commonProblems = {
            subBass: {
                tooHigh: 'Sub bass excessivo pode causar problemas em sistemas pequenos',
                tooLow: 'Sub bass insuficiente resulta em falta de peso e impacto'
            },
            bass: {
                tooHigh: 'Bass excessivo deixa mix muddy e pesado',
                tooLow: 'Bass insuficiente deixa mix fino e sem fundação'
            },
            lowMid: {
                tooHigh: 'Região crítica para mudding - frequências mascaradas',
                tooLow: 'Pode deixar mix muito limpo mas sem body'
            },
            mid: {
                tooHigh: 'Região de presença vocal - pode soar áspero',
                tooLow: 'Vocais e instrumentos principais podem ficar distantes'
            },
            highMid: {
                tooHigh: 'Região harsh - pode cansar o ouvinte rapidamente',
                tooLow: 'Falta de clareza e definição nos instrumentos'
            },
            presence: {
                tooHigh: 'Sibilância excessiva e som metálico',
                tooLow: 'Falta de brilho e presença'
            },
            brilliance: {
                tooHigh: 'Som muito brilhante pode ser fatigante',
                tooLow: 'Mix pode soar abafado e sem vida'
            },
            air: {
                tooHigh: 'Pode intensificar ruídos e sibilância',
                tooLow: 'Falta de abertura e espaciosidade'
            }
        };
    }

    /**
     * Analisa o espectro por bandas de frequência
     * @param {Object} spectralData - Dados espectrais existentes do sistema
     * @param {string} genre - Gênero musical para referência
     * @returns {Object} Análise detalhada por bandas
     */
    analyzeBands(spectralData, genre = 'pop') {
        const analysis = {
            bandLevels: {},
            problems: [],
            suggestions: [],
            overallBalance: 'good'
        };

        // Simular análise por bandas (em implementação real, usaria FFT)
        Object.entries(this.frequencyBands).forEach(([bandName, band]) => {
            const level = this.simulateBandLevel(spectralData, band);
            analysis.bandLevels[bandName] = {
                level: level,
                ideal: band.ideal,
                deviation: this.calculateDeviation(level, band.ideal),
                status: this.getBandStatus(level, band.ideal)
            };

            // Gerar problemas e sugestões específicas
            const problems = this.analyzeBandProblems(bandName, level, band.ideal, genre);
            analysis.problems.push(...problems.problems);
            analysis.suggestions.push(...problems.suggestions);
        });

        // Análise de balance geral
        analysis.overallBalance = this.analyzeOverallBalance(analysis.bandLevels);
        
        return analysis;
    }

    /**
     * Simula nível da banda baseado nos dados espectrais existentes
     */
    simulateBandLevel(spectralData, band) {
        const centroid = spectralData.spectralCentroid || 2000;
        const rolloff = spectralData.spectralRolloff85 || 8000;
        
        // Simulação baseada em centroid e rolloff
        if (band.min <= centroid && centroid <= band.max) {
            return -3; // Banda com energia principal
        } else if (band.max < rolloff) {
            return -6; // Banda com energia moderada
        } else {
            return -12; // Banda com baixa energia
        }
    }

    /**
     * Calcula desvio do ideal
     */
    calculateDeviation(level, ideal) {
        const idealCenter = (ideal.min + ideal.max) / 2;
        return level - idealCenter;
    }

    /**
     * Determina status da banda
     */
    getBandStatus(level, ideal) {
        if (level >= ideal.min && level <= ideal.max) {
            return 'good';
        } else if (level > ideal.max) {
            return 'too_high';
        } else {
            return 'too_low';
        }
    }

    /**
     * Analisa problemas específicos da banda
     */
    analyzeBandProblems(bandName, level, ideal, genre) {
        const problems = [];
        const suggestions = [];
        const deviation = this.calculateDeviation(level, ideal);
        const band = this.frequencyBands[bandName];

        if (Math.abs(deviation) > 3) { // Desvio significativo
            const problemType = level > (ideal.min + ideal.max) / 2 ? 'tooHigh' : 'tooLow';
            const problemDesc = this.commonProblems[bandName][problemType];

            problems.push({
                band: bandName,
                type: problemType,
                severity: Math.abs(deviation) > 6 ? 'high' : 'medium',
                description: problemDesc,
                frequency: `${band.min}-${band.max}Hz`,
                deviation: deviation.toFixed(1)
            });

            // Gerar sugestões específicas
            const suggestion = this.generateBandSuggestion(bandName, problemType, deviation, genre);
            suggestions.push(suggestion);
        }

        return { problems, suggestions };
    }

    /**
     * Gera sugestão específica para a banda
     */
    generateBandSuggestion(bandName, problemType, deviation, genre) {
        const band = this.frequencyBands[bandName];
        const correction = Math.abs(deviation);
        
        let suggestion = {
            band: bandName,
            type: 'eq',
            priority: correction > 6 ? 'high' : 'medium',
            frequency: `${band.min}-${band.max}Hz`,
            action: problemType === 'tooHigh' ? 'cut' : 'boost',
            amount: `${correction.toFixed(1)}dB`,
            description: '',
            technical: {}
        };

        // Sugestões específicas por banda e problema
        switch (bandName) {
            case 'bass':
                if (problemType === 'tooHigh') {
                    suggestion.description = `Bass excessivo (${correction.toFixed(1)}dB). Use high-pass filter em ${band.min}Hz ou EQ cut em ${(band.min + band.max) / 2}Hz`;
                    suggestion.technical = { filter: 'high-pass', frequency: band.min, q: 0.7 };
                } else {
                    suggestion.description = `Bass insuficiente. Boost de ${correction.toFixed(1)}dB em 80-120Hz para mais impacto`;
                    suggestion.technical = { filter: 'bell', frequency: 100, gain: correction, q: 1.2 };
                }
                break;

            case 'lowMid':
                if (problemType === 'tooHigh') {
                    suggestion.description = `Região muddy (${correction.toFixed(1)}dB). Cut em 300-400Hz para clareza`;
                    suggestion.technical = { filter: 'bell', frequency: 350, gain: -correction, q: 2.0 };
                } else {
                    suggestion.description = `Pouco body. Leve boost em 250-400Hz para mais presença`;
                    suggestion.technical = { filter: 'bell', frequency: 325, gain: correction, q: 1.5 };
                }
                break;

            case 'presence':
                if (problemType === 'tooHigh') {
                    suggestion.description = `Sibilância excessiva (${correction.toFixed(1)}dB). Use de-esser ou EQ cut em 6-8kHz`;
                    suggestion.technical = { filter: 'bell', frequency: 7000, gain: -correction, q: 3.0 };
                } else {
                    suggestion.description = `Falta de brilho. Boost suave em 5-7kHz para presença`;
                    suggestion.technical = { filter: 'bell', frequency: 6000, gain: correction, q: 2.0 };
                }
                break;

            default:
                suggestion.description = `${band.name}: ${problemType === 'tooHigh' ? 'Reduzir' : 'Aumentar'} ${correction.toFixed(1)}dB em ${band.min}-${band.max}Hz`;
        }

        return suggestion;
    }

    /**
     * Analisa balance geral do espectro
     */
    analyzeOverallBalance(bandLevels) {
        let lowEnergy = 0, midEnergy = 0, highEnergy = 0;
        let issues = 0;

        // Agrupar bandas
        ['subBass', 'bass'].forEach(band => {
            lowEnergy += bandLevels[band].level;
            if (bandLevels[band].status !== 'good') issues++;
        });

        ['lowMid', 'mid', 'highMid'].forEach(band => {
            midEnergy += bandLevels[band].level;
            if (bandLevels[band].status !== 'good') issues++;
        });

        ['presence', 'brilliance', 'air'].forEach(band => {
            highEnergy += bandLevels[band].level;
            if (bandLevels[band].status !== 'good') issues++;
        });

        if (issues <= 2) return 'good';
        if (issues <= 4) return 'fair';
        return 'poor';
    }
}

// 🚀 EXEMPLO DE USO COM O SISTEMA ATUAL
function demonstrateSpectralAnalysis() {
    console.log('🎯 DEMONSTRAÇÃO: ANÁLISE ESPECTRAL AVANÇADA');
    console.log('==========================================');

    const analyzer = new SpectralBandAnalyzer();
    
    // Dados espectrais simulados (vêm do sistema atual)
    const spectralData = {
        spectralCentroid: 1200,  // Centroid baixo
        spectralRolloff85: 6000, // Rolloff baixo
        spectralFlatness: 0.3
    };

    const analysis = analyzer.analyzeBands(spectralData, 'pop');

    console.log('\n📊 ANÁLISE POR BANDAS:');
    Object.entries(analysis.bandLevels).forEach(([band, data]) => {
        const status = data.status === 'good' ? '✅' : data.status === 'too_high' ? '🔴' : '🟡';
        console.log(`${status} ${band}: ${data.level}dB (ideal: ${data.ideal.min} a ${data.ideal.max}dB)`);
    });

    console.log('\n🚨 PROBLEMAS DETECTADOS:');
    analysis.problems.forEach(problem => {
        console.log(`${problem.severity === 'high' ? '🔴' : '🟡'} ${problem.description}`);
        console.log(`   Banda: ${problem.frequency}, Desvio: ${problem.deviation}dB`);
    });

    console.log('\n💡 SUGESTÕES ESPECÍFICAS:');
    analysis.suggestions.forEach(suggestion => {
        console.log(`${suggestion.priority === 'high' ? '🔥' : '⚡'} ${suggestion.description}`);
        if (suggestion.technical.filter) {
            console.log(`   Técnico: ${suggestion.technical.filter} @ ${suggestion.technical.frequency}Hz, Q=${suggestion.technical.q}`);
        }
    });

    console.log(`\n🎯 Balance Geral: ${analysis.overallBalance.toUpperCase()}`);
}

// Executar demonstração
demonstrateSpectralAnalysis();

console.log('\n🚀 PRÓXIMOS PASSOS:');
console.log('==================');
console.log('1. Integrar com sistema atual de métricas espectrais');
console.log('2. Implementar análise FFT real por bandas');
console.log('3. Adicionar ao enhanced-suggestion-engine.js');
console.log('4. Criar visualização por bandas na interface');
console.log('5. Testar com diferentes gêneros musicais');

console.log('\n💡 ESTA É A DIFERENÇA QUE FARÁ VOCÊ SER #1!');
console.log('Nenhum concorrente oferece sugestões tão específicas por banda de frequência');
