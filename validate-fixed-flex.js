// 🎛️ VALIDADOR FUNK MANDELA - Estrutura Fixed/Flex
// Valida implementação de padrões fixos vs flexíveis conforme especificação

console.log('🔄 VALIDANDO ESTRUTURA FIXED/FLEX DO FUNK MANDELA...');

// Função para validar estrutura fixed/flex
function validateFixedFlexStructure(data) {
    const validation = {
        success: true,
        errors: [],
        warnings: [],
        fixedFields: [],
        flexFields: []
    };

    const funk = data?.funk_mandela;
    if (!funk) {
        validation.errors.push('Dados do funk_mandela não encontrados');
        validation.success = false;
        return validation;
    }

    // Validar seção FIXED (hard constraints)
    console.log('🔥 Validando seção FIXED (hard constraints)...');
    if (funk.fixed) {
        // LUFS
        if (funk.fixed.lufs?.integrated) {
            const lufs = funk.fixed.lufs.integrated;
            if (lufs.target === -8.0 && lufs.tolerance === 1.0) {
                validation.fixedFields.push('✅ LUFS: -8.0 ±1.0');
            } else {
                validation.errors.push(`❌ LUFS inválido: ${lufs.target} ±${lufs.tolerance} (esperado: -8.0 ±1.0)`);
            }
        } else {
            validation.errors.push('❌ Campo LUFS.integrated ausente em fixed');
        }

        // True Peak
        if (funk.fixed.truePeak) {
            const tp = funk.fixed.truePeak;
            if (tp.streamingMax === -0.3 && tp.baileMax === 0.0) {
                validation.fixedFields.push('✅ True Peak: streaming -0.3, baile 0.0');
            } else {
                validation.errors.push(`❌ True Peak inválido: streaming ${tp.streamingMax}, baile ${tp.baileMax}`);
            }
        } else {
            validation.errors.push('❌ Campo truePeak ausente em fixed');
        }

        // Dynamic Range
        if (funk.fixed.dynamicRange?.dr) {
            const dr = funk.fixed.dynamicRange.dr;
            if (dr.target === 8.0 && dr.tolerance === 1.0) {
                validation.fixedFields.push('✅ DR: 8.0 ±1.0');
            } else {
                validation.errors.push(`❌ DR inválido: ${dr.target} ±${dr.tolerance} (esperado: 8.0 ±1.0)`);
            }
        } else {
            validation.errors.push('❌ Campo dynamicRange.dr ausente em fixed');
        }

        // Low End Mono
        if (funk.fixed.lowEnd?.mono?.cutoffHz === 100) {
            validation.fixedFields.push('✅ Low End Mono: 100Hz cutoff');
        } else {
            validation.errors.push('❌ Campo lowEnd.mono.cutoffHz inválido ou ausente');
        }

        // Vocal Presence
        if (funk.fixed.vocalPresence) {
            const vp = funk.fixed.vocalPresence;
            if (Array.isArray(vp.bandHz) && vp.bandHz[0] === 1000 && vp.bandHz[1] === 4000) {
                validation.fixedFields.push('✅ Vocal Presence: 1000-4000Hz');
            } else {
                validation.errors.push('❌ Campo vocalPresence.bandHz inválido');
            }
        } else {
            validation.errors.push('❌ Campo vocalPresence ausente em fixed');
        }

        // RMS Policy
        if (funk.fixed.rms?.policy === 'deriveFromLUFS') {
            validation.fixedFields.push('✅ RMS: derivado de LUFS');
        } else {
            validation.warnings.push('⚠️ RMS policy não definida ou inválida');
        }
    } else {
        validation.errors.push('❌ Seção "fixed" ausente');
        validation.success = false;
    }

    // Validar seção FLEX (soft constraints)
    console.log('🎨 Validando seção FLEX (soft constraints)...');
    if (funk.flex) {
        // Clipping
        if (funk.flex.clipping?.samplePctMax === 0.02) {
            validation.flexFields.push('✅ Clipping: max 2%');
        } else {
            validation.warnings.push('⚠️ Clipping limit inválido ou ausente');
        }

        // LRA
        if (funk.flex.lra?.min === 1.0 && funk.flex.lra?.max === 4.0) {
            validation.flexFields.push('✅ LRA: 1.0-4.0 range');
        } else {
            validation.warnings.push('⚠️ LRA range inválido ou ausente');
        }

        // Stereo Width
        if (funk.flex.stereo?.width?.midsHighsTolerance === 'wide') {
            validation.flexFields.push('✅ Stereo: wide tolerance em médios/agudos');
        } else {
            validation.warnings.push('⚠️ Stereo width tolerance não definida');
        }

        // Tonal Curve
        if (funk.flex.tonalCurve?.bands && Array.isArray(funk.flex.tonalCurve.bands)) {
            const bands = funk.flex.tonalCurve.bands;
            const expectedBands = ['sub', 'low_bass', 'upper_bass', 'low_mid', 'mid', 'high_mid', 'brilho', 'presenca'];
            const foundBands = bands.map(b => b.name);
            const missingBands = expectedBands.filter(eb => !foundBands.includes(eb));
            
            if (missingBands.length === 0) {
                validation.flexFields.push(`✅ Tonal Curve: ${bands.length} bandas definidas`);
            } else {
                validation.warnings.push(`⚠️ Bandas faltantes: ${missingBands.join(', ')}`);
            }
        } else {
            validation.warnings.push('⚠️ Tonal curve bands não definidas');
        }
    } else {
        validation.errors.push('❌ Seção "flex" ausente');
        validation.success = false;
    }

    // Validar compatibilidade legada
    console.log('🔗 Validando compatibilidade legada...');
    if (funk.legacy_compatibility) {
        if (funk.legacy_compatibility.lufs_target === -8) {
            validation.fixedFields.push('✅ Legacy compatibility: LUFS target');
        }
        if (funk.legacy_compatibility.pattern_rules) {
            validation.flexFields.push('✅ Legacy compatibility: pattern rules');
        }
    } else {
        validation.warnings.push('⚠️ Seção legacy_compatibility ausente');
    }

    return validation;
}

// Função para testar classificação hard vs soft
function testConstraintClassification(data) {
    console.log('🧪 Testando classificação de constraints...');
    
    const testCases = [
        {
            name: 'Hard OK, Soft Problemas',
            metrics: {
                lufsIntegrated: -8.0,        // ✅ Fixed: perfeito
                truePeakDbtp: -0.3,          // ✅ Fixed: perfeito
                dynamicRange: 8.0,           // ✅ Fixed: perfeito
                clippingPct: 0.03,           // ❌ Flex: 3% > 2%
                lra: 5.0,                    // ❌ Flex: fora 1-4
                stereoCorrelation: 0.4       // ❌ Flex: muito amplo
            },
            expectedResult: 'Score alto (>85%) pois fixed constraints OK'
        },
        {
            name: 'Hard Falhando, Soft OK',
            metrics: {
                lufsIntegrated: -6.0,        // ❌ Fixed: muito alto
                truePeakDbtp: -0.3,          // ✅ Fixed: OK
                dynamicRange: 6.0,           // ❌ Fixed: muito baixo
                clippingPct: 0.01,           // ✅ Flex: perfeito
                lra: 2.5,                    // ✅ Flex: perfeito
                stereoCorrelation: 0.22      // ✅ Flex: perfeito
            },
            expectedResult: 'Score baixo (<70%) pois fixed constraints falham'
        },
        {
            name: 'Contexto Streaming',
            metrics: {
                lufsIntegrated: -8.0,
                truePeakDbtp: -0.2,          // ❌ Para streaming (-0.3 required)
                context: 'streaming'
            },
            expectedResult: 'Falha em streaming context'
        },
        {
            name: 'Contexto Baile',
            metrics: {
                lufsIntegrated: -8.0,
                truePeakDbtp: -0.1,          // ✅ Para baile (0.0 max)
                context: 'baile'
            },
            expectedResult: 'OK em baile context'
        }
    ];

    const results = [];
    for (const testCase of testCases) {
        console.log(`📊 Testando: ${testCase.name}`);
        
        // Simular classificação
        let hardConstraintsPassed = 0;
        let hardConstraintsTotal = 3; // LUFS, TruePeak, DR
        
        // LUFS check
        if (Math.abs(testCase.metrics.lufsIntegrated - (-8)) <= 1) {
            hardConstraintsPassed++;
        }
        
        // True Peak check (contextual)
        const tpLimit = testCase.metrics.context === 'streaming' ? -0.3 : 0.0;
        if (testCase.metrics.truePeakDbtp <= tpLimit) {
            hardConstraintsPassed++;
        }
        
        // DR check
        if (testCase.metrics.dynamicRange && Math.abs(testCase.metrics.dynamicRange - 8) <= 1) {
            hardConstraintsPassed++;
        }
        
        const hardScore = (hardConstraintsPassed / hardConstraintsTotal) * 100;
        const result = {
            testCase: testCase.name,
            hardScore: Math.round(hardScore),
            hardPassed: hardConstraintsPassed,
            hardTotal: hardConstraintsTotal,
            expected: testCase.expectedResult
        };
        
        results.push(result);
        console.log(`  → Hard score: ${result.hardScore}% (${result.hardPassed}/${result.hardTotal})`);
    }
    
    return results;
}

// Função para gerar relatório final
function generateValidationReport(validation, testResults) {
    console.log('\n📋 RELATÓRIO FINAL DE VALIDAÇÃO\n');
    
    console.log('🔥 FIXED CONSTRAINTS (Hard):');
    validation.fixedFields.forEach(field => console.log(`  ${field}`));
    
    console.log('\n🎨 FLEX CONSTRAINTS (Soft):');
    validation.flexFields.forEach(field => console.log(`  ${field}`));
    
    if (validation.errors.length > 0) {
        console.log('\n❌ ERROS:');
        validation.errors.forEach(error => console.log(`  ${error}`));
    }
    
    if (validation.warnings.length > 0) {
        console.log('\n⚠️ WARNINGS:');
        validation.warnings.forEach(warning => console.log(`  ${warning}`));
    }
    
    console.log('\n🧪 RESULTADOS DOS TESTES:');
    testResults.forEach(result => {
        console.log(`  ${result.testCase}: ${result.hardScore}% - ${result.expected}`);
    });
    
    const overallSuccess = validation.success && validation.errors.length === 0;
    console.log(`\n🎯 STATUS GERAL: ${overallSuccess ? '✅ SUCESSO' : '❌ FALHA'}`);
    
    return {
        success: overallSuccess,
        fixedCount: validation.fixedFields.length,
        flexCount: validation.flexFields.length,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length,
        testResults
    };
}

// Executar validação
async function runValidation() {
    try {
        // Carregar dados do arquivo JSON
        const response = await fetch('/refs/out/funk_mandela.json?v=' + Date.now(), {
            cache: 'no-store'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📂 Dados carregados:', data.funk_mandela?.version);
        
        // Executar validações
        const validation = validateFixedFlexStructure(data);
        const testResults = testConstraintClassification(data);
        const report = generateValidationReport(validation, testResults);
        
        // Salvar no window para debug
        if (typeof window !== 'undefined') {
            window.__FUNK_MANDELA_VALIDATION__ = {
                validation,
                testResults,
                report,
                timestamp: new Date().toISOString()
            };
        }
        
        return report;
        
    } catch (error) {
        console.error('❌ ERRO NA VALIDAÇÃO:', error);
        return { success: false, error: error.message };
    }
}

// Auto-executar se em browser
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        runValidation().then(report => {
            console.log('🎉 Validação concluída:', report.success ? 'SUCESSO' : 'FALHA');
        });
    });
}

// Exports para Node.js
if (typeof module !== 'undefined') {
    module.exports = {
        validateFixedFlexStructure,
        testConstraintClassification,
        generateValidationReport,
        runValidation
    };
}
