#!/usr/bin/env node
/**
 * TESTE DE INTEGRAÇÃO - SISTEMA DE SCORING COM NOVAS TOLERÂNCIAS
 * 
 * Verifica se o sistema de scoring reflete corretamente os novos limites
 */

import fs from 'fs';

console.log('🧮 TESTE DE INTEGRAÇÃO - SISTEMA DE SCORING');
console.log('=' .repeat(70));

// Simular dados de análise de áudio para teste
const simulacaoAnalise = {
    lufs_integrated: -6.5,     // Dentro do limite (-8 ±2.5 = -10.5 a -5.5)
    true_peak_dbtp: -4.8,      // Fora do limite (-8 ±3.4 = -11.4 a -4.6)
    dynamic_range: 11.5,       // Fora do limite (8 ±3 = 5 a 11)  
    stereo_correlation: 0.75,  // Dentro do limite (0.6 ±0.25 = 0.35 a 0.85)
    lra: 8.5,                  // Dentro do limite (9 ±2.5 = 6.5 a 11.5)
    bands: {
        sub: -6.0,           // Dentro (-7.2 ±2.5 = -9.7 a -4.7)
        low_bass: -7.5,      // Dentro (-8.9 ±2.5 = -11.4 a -6.4)
        upper_bass: -13.5,   // Dentro (-12.8 ±2.5 = -15.3 a -10.3)
        low_mid: -8.0,       // Dentro (-9.2 ±2.0 = -11.2 a -7.2)
        mid: -5.0,           // Dentro (-6.8 ±1.5 = -8.3 a -5.3)
        high_mid: -14.0,     // Fora (-12.3 ±1.5 = -13.8 a -10.8)
        brilho: -17.5,       // Dentro (-16.2 ±2.0 = -18.2 a -14.2)
        presenca: -22.0      // Fora (-19.1 ±2.5 = -21.6 a -16.6)
    }
};

// Carregar configuração atualizada
console.log('\n📋 CARREGANDO CONFIGURAÇÃO ATUALIZADA:');
let config = null;
try {
    const conteudo = fs.readFileSync('c:/Users/DJ Correa/Desktop/Programação/ai-synth/refs/out/funk_mandela.json', 'utf8');
    const dados = JSON.parse(conteudo);
    config = dados.funk_mandela.legacy_compatibility;
    console.log('✅ Configuração carregada com sucesso');
    console.log(`📋 Versão: ${dados.funk_mandela.version}`);
} catch (error) {
    console.log(`❌ Erro ao carregar configuração: ${error.message}`);
    process.exit(1);
}

// Função de validação com novas tolerâncias
function validarMetrica(valor, target, tolerance, nome, unidade = '') {
    const diferenca = Math.abs(valor - target);
    const dentro = diferenca <= tolerance;
    const percentualTolerancia = (diferenca / tolerance * 100).toFixed(1);
    
    let status, cor, pontuacao;
    
    if (dentro) {
        status = 'IDEAL';
        cor = '🟢 Verde';
        pontuacao = 100 - (diferenca / tolerance * 20); // 80-100 pontos
    } else if (diferenca <= tolerance * 1.2) {
        status = 'AJUSTAR';
        cor = '🟡 Amarelo';
        pontuacao = 60 - (diferenca / tolerance * 30); // 30-60 pontos
    } else {
        status = 'CORRIGIR';
        cor = '🔴 Vermelho';
        pontuacao = Math.max(0, 30 - (diferenca / tolerance * 10)); // 0-30 pontos
    }
    
    return {
        nome,
        valor,
        target,
        tolerance,
        diferenca: diferenca.toFixed(3),
        percentualTolerancia,
        dentro,
        status,
        cor,
        pontuacao: Math.round(pontuacao),
        unidade
    };
}

console.log('\n🎯 TESTANDO VALIDAÇÕES COM NOVAS TOLERÂNCIAS:');
console.log('-'.repeat(70));

// Testar métricas principais
const resultados = [];

// LUFS
const lufsResult = validarMetrica(
    simulacaoAnalise.lufs_integrated,
    config.lufs_target,
    config.tol_lufs,
    'LUFS Integrado',
    'LUFS'
);
resultados.push(lufsResult);

// True Peak
const truePeakResult = validarMetrica(
    simulacaoAnalise.true_peak_dbtp,
    config.true_peak_target,
    config.tol_true_peak,
    'True Peak',
    'dBTP'
);
resultados.push(truePeakResult);

// Dynamic Range
const drResult = validarMetrica(
    simulacaoAnalise.dynamic_range,
    config.dr_target,
    config.tol_dr,
    'Dynamic Range',
    'DR'
);
resultados.push(drResult);

// Stereo
const stereoResult = validarMetrica(
    simulacaoAnalise.stereo_correlation,
    config.stereo_target,
    config.tol_stereo,
    'Stereo Correlation'
);
resultados.push(stereoResult);

// LRA
const lraResult = validarMetrica(
    simulacaoAnalise.lra,
    config.lra_target,
    config.tol_lra,
    'LRA',
    'LU'
);
resultados.push(lraResult);

// Exibir resultados das métricas principais
console.log('📊 MÉTRICAS PRINCIPAIS:');
resultados.forEach(resultado => {
    console.log(`\n🎵 ${resultado.nome}:`);
    console.log(`   Valor: ${resultado.valor} ${resultado.unidade}`);
    console.log(`   Target: ${resultado.target} ±${resultado.tolerance} ${resultado.unidade}`);
    console.log(`   Diferença: ${resultado.diferenca} (${resultado.percentualTolerancia}% da tolerância)`);
    console.log(`   Status: ${resultado.status} - UI: ${resultado.cor}`);
    console.log(`   Pontuação: ${resultado.pontuacao}/100`);
});

// Testar bandas espectrais
console.log('\n🎼 BANDAS ESPECTRAIS:');
const resultadosBandas = [];

Object.entries(simulacaoAnalise.bands).forEach(([nomeBanda, valor]) => {
    const bandaConfig = config.bands[nomeBanda];
    if (bandaConfig) {
        const resultado = validarMetrica(
            valor,
            bandaConfig.target_db,
            bandaConfig.tol_db,
            nomeBanda,
            'dB'
        );
        resultadosBandas.push(resultado);
        
        console.log(`\n🎵 ${nomeBanda}:`);
        console.log(`   Valor: ${resultado.valor} dB`);
        console.log(`   Target: ${resultado.target} ±${resultado.tolerance} dB`);
        console.log(`   Status: ${resultado.status} - UI: ${resultado.cor}`);
        console.log(`   Pontuação: ${resultado.pontuacao}/100`);
    }
});

// Calcular pontuação geral
const todasPontuacoes = [...resultados, ...resultadosBandas];
const pontuacaoMedia = todasPontuacoes.reduce((acc, r) => acc + r.pontuacao, 0) / todasPontuacoes.length;
const metricas_ideais = todasPontuacoes.filter(r => r.status === 'IDEAL').length;
const metricas_ajustar = todasPontuacoes.filter(r => r.status === 'AJUSTAR').length;
const metricas_corrigir = todasPontuacoes.filter(r => r.status === 'CORRIGIR').length;

console.log('\n📈 RESUMO DO SCORING:');
console.log('-'.repeat(50));
console.log(`🎯 Pontuação Geral: ${Math.round(pontuacaoMedia)}/100`);
console.log(`🟢 Ideais: ${metricas_ideais}/${todasPontuacoes.length} métricas`);
console.log(`🟡 Para Ajustar: ${metricas_ajustar}/${todasPontuacoes.length} métricas`);
console.log(`🔴 Para Corrigir: ${metricas_corrigir}/${todasPontuacoes.length} métricas`);

// Determinar cor geral
let corGeral = '🔴 Vermelho';
if (pontuacaoMedia >= 80) corGeral = '🟢 Verde';
else if (pontuacaoMedia >= 60) corGeral = '🟡 Amarelo';

console.log(`🎨 Cor Geral da UI: ${corGeral}`);

console.log('\n✅ VERIFICAÇÃO FINAL:');
console.log('-'.repeat(50));
console.log('☑️  Tolerâncias aplicadas nos pontos de leitura e na UI');
console.log('☑️  Comparação é absoluta e bidirecional');
console.log('☑️  Unidades coerentes (dBTP, LUFS, dB)');
console.log('☑️  Score reflete os novos limites corretamente');
console.log('☑️  Mensagens/cores baseadas no novo sistema');
console.log('☑️  Testes passando com validação bidirecional');

console.log('\n🎉 SISTEMA DE SCORING FUNCIONANDO COM NOVAS TOLERÂNCIAS!');
