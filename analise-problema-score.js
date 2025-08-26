// 🔬 ANÁLISE ESPECÍFICA DO PROBLEMA DE SCORE FIXO
// Investigação direcionada para descobrir por que o score não muda

console.log('🔬 [PROBLEMA-SCORE] Iniciando análise específica do problema...');

// Capturar dados da última análise do console
function capturarDadosConsole() {
    console.log('📝 [CONSOLE-DATA] Analisando dados do console...');
    
    // Procurar por dados no console atual
    const ultimaAnalise = window.__LAST_FULL_ANALYSIS;
    const ultimoScore = window.__LAST_MIX_SCORE;
    
    console.log('📊 [CONSOLE-DATA] Última análise:', ultimaAnalise);
    console.log('🎯 [CONSOLE-DATA] Último score:', ultimoScore);
    
    // Dados do console mostram score de 36.5%
    const dadosDoConsole = {
        scoreObtido: 36.5, // do console: "Score final definido: 36.55"
        metricasKey: [
            'lufsIntegrated', 'truePeakDbtp', 'dynamicRange', 'lra', 
            'crestFactor', 'stereoCorrelation', 'stereoWidth',
            'spectralCentroid', 'bandEnergies'
        ],
        valorEsperado: "Deveria ser diferente para arquivo diferente",
        problemaIdentificado: "Score sempre 36.5% independente do arquivo"
    };
    
    return dadosDoConsole;
}

// Simular diferentes arquivos de áudio
function simularArquivosDiferentes() {
    console.log('🎵 [SIMULAÇÃO] Simulando diferentes arquivos de áudio...');
    
    // Arquivo 1: Qualidade baixa (deveria dar score baixo)
    const arquivoBaixaQualidade = {
        lufsIntegrated: -3.0,  // Muito alto (ruim)
        truePeakDbtp: 0.5,     // Clipping (péssimo)
        dynamicRange: 2.0,     // Muito baixo (ruim)
        dr: 2.0,
        lra: 20.0,            // Muito alto (ruim)
        crestFactor: 3.0,     // Muito baixo (ruim)
        stereoCorrelation: -0.8, // Muito baixo (ruim)
        stereoWidth: 1.5,     // Muito alto (ruim)
        spectralCentroid: 8000, // Muito alto (ruim)
        bandEnergies: {
            'graves_60_120': { rms_db: -25.0 },     // Muito baixo
            'medias_graves_200_500': { rms_db: -1.0 }, // Muito alto  
            'medias_500_2000': { rms_db: -30.0 },   // Muito baixo
            'medias_agudas_2_4khz': { rms_db: 0.0 }, // Muito alto
            'agudos_4_8khz': { rms_db: -35.0 },     // Muito baixo
            'presenca_8_12khz': { rms_db: 2.0 }     // Muito alto
        }
    };
    
    // Arquivo 2: Qualidade alta (deveria dar score alto)
    const arquivoAltaQualidade = {
        lufsIntegrated: -14.0,  // Perfeito
        truePeakDbtp: -3.0,     // Perfeito
        dynamicRange: 12.0,     // Bom
        dr: 12.0,
        lra: 8.0,              // Bom
        crestFactor: 12.0,     // Bom
        stereoCorrelation: 0.6, // Bom
        stereoWidth: 0.8,      // Bom
        spectralCentroid: 2500, // Perfeito
        bandEnergies: {
            'graves_60_120': { rms_db: -8.0 },      // Perfeito
            'medias_graves_200_500': { rms_db: -9.0 }, // Perfeito
            'medias_500_2000': { rms_db: -6.0 },    // Perfeito
            'medias_agudas_2_4khz': { rms_db: -12.0 }, // Perfeito
            'agudos_4_8khz': { rms_db: -16.0 },     // Perfeito
            'presenca_8_12khz': { rms_db: -19.0 }   // Perfeito
        }
    };
    
    // Arquivo 3: Dados do console atual (o que está sendo analisado)
    const arquivoAtual = {
        lufsIntegrated: -6.2,
        truePeakDbtp: -1.9,
        dynamicRange: 6.6,
        dr: 6.6,
        lra: 4.96,
        crestFactor: null, // não informado
        stereoCorrelation: 0.20,
        stereoWidth: 0.23,
        spectralCentroid: 4615,
        bandEnergies: {
            'graves_60_120': { rms_db: -6.90 },
            'medias_graves_200_500': { rms_db: -7.44 },
            'medias_500_2000': { rms_db: -7.31 },
            'medias_agudas_2_4khz': { rms_db: -12.34 },
            'agudos_4_8khz': { rms_db: -15.54 },
            'presenca_8_12khz': { rms_db: -22.82 }
        }
    };
    
    return { arquivoBaixaQualidade, arquivoAltaQualidade, arquivoAtual };
}

// Testar cada arquivo e comparar scores
function testarTodosArquivos() {
    console.log('🧪 [TESTE-COMPARATIVO] Testando todos os arquivos...');
    
    const arquivos = simularArquivosDiferentes();
    const referencia = {
        lufs_target: -8.0,
        tol_lufs: 2.0,
        true_peak_target: -3.0,
        tol_true_peak: 2.0,
        dr_target: 8.0,
        tol_dr: 3.0,
        lra_target: 9.0,
        tol_lra: 4.0,
        stereo_target: 0.6,
        tol_stereo: 0.5,
        bands: {
            'graves_60_120': { target_db: -8.0, tol_db: 2.0 },
            'medias_graves_200_500': { target_db: -9.0, tol_db: 2.0 },
            'medias_500_2000': { target_db: -6.0, tol_db: 2.0 },
            'medias_agudas_2_4khz': { target_db: -12.0, tol_db: 3.0 },
            'agudos_4_8khz': { target_db: -16.0, tol_db: 4.0 },
            'presenca_8_12khz': { target_db: -19.0, tol_db: 3.0 }
        }
    };
    
    const resultados = {};
    
    // Verificar se função de scoring existe
    if (!window.computeMixScore) {
        console.error('❌ [TESTE-COMPARATIVO] window.computeMixScore não encontrado!');
        return null;
    }
    
    // Testar cada arquivo
    Object.entries(arquivos).forEach(([nome, dados]) => {
        console.log(`🎵 [TESTE-COMPARATIVO] Testando ${nome}...`);
        console.log(`📊 [TESTE-COMPARATIVO] Dados:`, dados);
        
        try {
            const resultado = window.computeMixScore(dados, referencia);
            resultados[nome] = {
                score: resultado.scorePct,
                metodo: resultado.method || resultado.scoringMethod,
                classificacao: resultado.classification,
                detalhes: resultado
            };
            
            console.log(`✅ [TESTE-COMPARATIVO] ${nome}: ${resultado.scorePct}% (${resultado.method})`);
        } catch (error) {
            console.error(`❌ [TESTE-COMPARATIVO] Erro em ${nome}:`, error);
            resultados[nome] = { error: error.message };
        }
    });
    
    return resultados;
}

// Analisar diferenças nos resultados
function analisarDiferencas(resultados) {
    console.log('📈 [ANÁLISE] Analisando diferenças nos scores...');
    
    if (!resultados) {
        console.error('❌ [ANÁLISE] Nenhum resultado para analisar');
        return null;
    }
    
    const scores = Object.entries(resultados).map(([nome, dados]) => ({
        nome,
        score: dados.score || 0,
        metodo: dados.metodo || 'N/A'
    }));
    
    console.log('📊 [ANÁLISE] Scores obtidos:');
    scores.forEach(item => {
        console.log(`  ${item.nome}: ${item.score}% (${item.metodo})`);
    });
    
    // Calcular diferenças
    const scoreValues = scores.map(s => s.score).filter(s => s > 0);
    const minScore = Math.min(...scoreValues);
    const maxScore = Math.max(...scoreValues);
    const diferenca = maxScore - minScore;
    
    console.log(`📈 [ANÁLISE] Score mínimo: ${minScore}%`);
    console.log(`📈 [ANÁLISE] Score máximo: ${maxScore}%`);
    console.log(`📈 [ANÁLISE] Diferença: ${diferenca.toFixed(1)} pontos`);
    
    // Diagnóstico
    if (diferenca < 5) {
        console.error('❌ [DIAGNÓSTICO] PROBLEMA DETECTADO: Scores muito similares!');
        console.error('❌ [DIAGNÓSTICO] Sistema não está diferenciando qualidade de áudio adequadamente');
        console.error('❌ [DIAGNÓSTICO] Diferença de apenas ' + diferenca.toFixed(1) + ' pontos entre qualidade baixa e alta');
        return { problema: true, diferenca, scores };
    } else {
        console.log('✅ [DIAGNÓSTICO] Sistema funcionando: diferença de ' + diferenca.toFixed(1) + ' pontos');
        return { problema: false, diferenca, scores };
    }
}

// Investigar possíveis causas do problema
function investigarCausas() {
    console.log('🔍 [INVESTIGAÇÃO] Investigando possíveis causas...');
    
    const causas = [];
    
    // 1. Verificar se scoring.js está carregado corretamente
    if (!window.computeMixScore) {
        causas.push('scoring.js não carregado ou função não disponível');
    }
    
    // 2. Verificar se há cache/valores fixos
    if (window.__LAST_MIX_SCORE) {
        causas.push('Cache de score pode estar interferindo');
    }
    
    // 3. Verificar flags do sistema
    const flags = {
        AUDIT_MODE: window.AUDIT_MODE,
        SCORING_V2: window.SCORING_V2,
        USE_TT_DR: window.USE_TT_DR,
        AUTO_SCORING_V2: window.AUTO_SCORING_V2
    };
    
    if (!Object.values(flags).some(Boolean)) {
        causas.push('Flags do sistema não estão configuradas corretamente');
    }
    
    // 4. Verificar se Equal Weight V3 está forçado
    if (window.__MIX_SCORING_VERSION__ && window.__MIX_SCORING_VERSION__.includes('equal-weight-v3-FORCED')) {
        causas.push('Sistema forçado para Equal Weight V3 - pode ter bug');
    }
    
    // 5. Verificar se referências estão ativas
    if (!window.PROD_AI_REF_DATA || !window.PROD_AI_REF_DATA_ACTIVE) {
        causas.push('Referências de gênero não estão ativas');
    }
    
    console.log('🔍 [INVESTIGAÇÃO] Possíveis causas encontradas:');
    causas.forEach((causa, index) => {
        console.log(`  ${index + 1}. ${causa}`);
    });
    
    return causas;
}

// Propor soluções
function proporSolucoes(causas) {
    console.log('💡 [SOLUÇÕES] Propondo soluções...');
    
    const solucoes = [];
    
    causas.forEach(causa => {
        if (causa.includes('scoring.js')) {
            solucoes.push('Recarregar scoring.js ou verificar imports');
        }
        if (causa.includes('cache')) {
            solucoes.push('Limpar cache: delete window.__LAST_MIX_SCORE');
        }
        if (causa.includes('flags')) {
            solucoes.push('Configurar flags: window.AUDIT_MODE = true; window.SCORING_V2 = true');
        }
        if (causa.includes('equal-weight-v3')) {
            solucoes.push('Desabilitar forçamento do Equal Weight V3 ou corrigir bug na implementação');
        }
        if (causa.includes('referências')) {
            solucoes.push('Ativar referências: window.PROD_AI_REF_DATA_ACTIVE = true');
        }
    });
    
    console.log('💡 [SOLUÇÕES] Soluções propostas:');
    solucoes.forEach((solucao, index) => {
        console.log(`  ${index + 1}. ${solucao}`);
    });
    
    return solucoes;
}

// Função principal de análise
function analisarProblemaScore() {
    console.log('🎯 [ANÁLISE-PRINCIPAL] Iniciando análise completa do problema...');
    
    // Capturar dados atuais
    const dadosConsole = capturarDadosConsole();
    
    // Testar diferentes arquivos
    const resultados = testarTodosArquivos();
    
    // Analisar diferenças
    const analise = analisarDiferencas(resultados);
    
    // Investigar causas
    const causas = investigarCausas();
    
    // Propor soluções
    const solucoes = proporSolucoes(causas);
    
    // Relatório final
    console.log('📋 [RELATÓRIO-FINAL] ========================');
    console.log('📋 [RELATÓRIO-FINAL] ANÁLISE DO PROBLEMA SCORE');
    console.log('📋 [RELATÓRIO-FINAL] ========================');
    
    if (analise && analise.problema) {
        console.error('❌ [RELATÓRIO-FINAL] PROBLEMA CONFIRMADO: Score não está variando adequadamente');
        console.error('❌ [RELATÓRIO-FINAL] Diferença entre qualidades: ' + analise.diferenca.toFixed(1) + ' pontos');
        console.error('❌ [RELATÓRIO-FINAL] Esperado: pelo menos 20-30 pontos de diferença');
    } else {
        console.log('✅ [RELATÓRIO-FINAL] Sistema aparenta estar funcionando corretamente');
    }
    
    console.log('🔍 [RELATÓRIO-FINAL] Causas identificadas: ' + causas.length);
    console.log('💡 [RELATÓRIO-FINAL] Soluções propostas: ' + solucoes.length);
    
    return {
        problema: analise ? analise.problema : true,
        dadosConsole,
        resultados,
        analise,
        causas,
        solucoes,
        timestamp: new Date().toISOString()
    };
}

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
    window.analisarProblemaScore = analisarProblemaScore;
    window.testarTodosArquivos = testarTodosArquivos;
    window.investigarCausas = investigarCausas;
    window.proporSolucoes = proporSolucoes;
    
    console.log('🔧 [SETUP] Funções de análise disponíveis:');
    console.log('🔧 [SETUP] - window.analisarProblemaScore() // Análise completa');
    console.log('🔧 [SETUP] - window.testarTodosArquivos() // Teste comparativo');
    console.log('🔧 [SETUP] - window.investigarCausas() // Investigação');
}

// Auto-executar uma análise inicial
setTimeout(() => {
    console.log('🚀 [AUTO-EXEC] Executando análise automática em 3 segundos...');
    if (typeof window !== 'undefined' && window.analisarProblemaScore) {
        window.analisarProblemaScore();
    }
}, 3000);

export { analisarProblemaScore, testarTodosArquivos, investigarCausas };
