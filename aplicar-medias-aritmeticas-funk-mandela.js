#!/usr/bin/env node
/**
 * SCRIPT DE CORREÇÃO - APLICAR MÉDIAS ARITMÉTICAS FUNK MANDELA
 * 
 * Este script aplica as médias aritméticas calculadas na auditoria
 * aos valores salvos no JSON do Funk Mandela.
 * 
 * ⚠️ ATENÇÃO: Esta correção mudará drasticamente o comportamento do sistema!
 */

import fs from 'fs';

const JSON_FILE = 'c:/Users/DJ Correa/Desktop/Programação/ai-synth/refs/out/funk_mandela.json';
const PUBLIC_JSON = 'c:/Users/DJ Correa/Desktop/Programação/ai-synth/public/refs/out/funk_mandela.json';

// Médias aritméticas calculadas na auditoria
const MEDIAS_CALCULADAS = {
    lufs: -4.889390,
    true_peak: -11.095675,
    dr: 7.340261,
    lra: 9.375367,
    stereo_corr: 0.546862,
    bands: {
        sub: -2.472,
        low_bass: -1.168,
        upper_bass: -2.885,
        low_mid: 1.569,
        mid: 2.855,
        high_mid: -1.354,
        brilho: -6.549,
        presenca: -12.144
    }
};

function aplicarMediasAritmeticas() {
    console.log('🔧 CORREÇÃO - APLICAR MÉDIAS ARITMÉTICAS');
    console.log('⚠️  ATENÇÃO: Esta operação mudará o comportamento do sistema!');
    console.log('='.repeat(70));
    
    // 1. Verificar se arquivo existe
    if (!fs.existsSync(JSON_FILE)) {
        console.log(`❌ Arquivo não encontrado: ${JSON_FILE}`);
        return false;
    }
    
    // 2. Carregar dados atuais
    const jsonData = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
    const funkMandela = jsonData.funk_mandela;
    
    // 3. Fazer backup
    const backupFile = JSON_FILE.replace('.json', '.backup-before-arithmetic-means.json');
    fs.writeFileSync(backupFile, JSON.stringify(jsonData, null, 2));
    console.log(`💾 Backup criado: ${backupFile}`);
    
    // 4. Exibir valores atuais vs. novos
    console.log('\n📊 COMPARAÇÃO VALORES ATUAIS → NOVOS (MÉDIAS ARITMÉTICAS):');
    console.log('='.repeat(70));
    
    const comparacoes = [
        { nome: 'LUFS', atual: funkMandela.legacy_compatibility.lufs_target, novo: MEDIAS_CALCULADAS.lufs },
        { nome: 'True Peak', atual: funkMandela.legacy_compatibility.true_peak_target, novo: MEDIAS_CALCULADAS.true_peak },
        { nome: 'DR', atual: funkMandela.legacy_compatibility.dr_target, novo: MEDIAS_CALCULADAS.dr },
        { nome: 'LRA', atual: funkMandela.legacy_compatibility.lra_target, novo: MEDIAS_CALCULADAS.lra },
        { nome: 'Estéreo', atual: funkMandela.legacy_compatibility.stereo_target, novo: MEDIAS_CALCULADAS.stereo_corr }
    ];
    
    for (const comp of comparacoes) {
        const diferenca = comp.novo - comp.atual;
        const simbolo = diferenca > 0 ? '+' : '';
        console.log(`${comp.nome}: ${comp.atual.toFixed(3)} → ${comp.novo.toFixed(3)} (${simbolo}${diferenca.toFixed(3)})`);
    }
    
    console.log('\n🎛️ BANDAS ESPECTRAIS:');
    for (const banda in MEDIAS_CALCULADAS.bands) {
        const atual = funkMandela.legacy_compatibility.bands[banda]?.target_db || 0;
        const novo = MEDIAS_CALCULADAS.bands[banda];
        const diferenca = novo - atual;
        const simbolo = diferenca > 0 ? '+' : '';
        console.log(`${banda}: ${atual.toFixed(1)} → ${novo.toFixed(1)} dB (${simbolo}${diferenca.toFixed(1)})`);
    }
    
    // 5. Solicitar confirmação
    console.log('\n⚠️  IMPACTO ESPERADO:');
    console.log('   • LUFS +3.1: Faixas com -5 a -8 LUFS serão aceitas como normais');
    console.log('   • True Peak -0.2: Mudança mínima na detecção de clipping');
    console.log('   • DR -0.7: Faixas com DR 7-8 serão mais aceitas');
    console.log('   • Bandas +4 a +10 dB: Critérios espectralís muito mais permissivos');
    console.log('   • Resultado: Sistema bem mais tolerante a variações');
    
    console.log('\n❓ CONFIRMAR APLICAÇÃO? (Esta mensagem é informativa)');
    console.log('   Para aplicar, execute: aplicarCorrecao()');
    
    return true;
}

function aplicarCorrecao() {
    console.log('\n🔧 APLICANDO CORREÇÃO...');
    
    // Carregar dados
    const jsonData = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
    const funkMandela = jsonData.funk_mandela;
    
    // Salvar versão anterior
    const oldVersion = funkMandela.version;
    
    // 6. Aplicar médias aritméticas
    funkMandela.legacy_compatibility.lufs_target = Math.round(MEDIAS_CALCULADAS.lufs * 1000) / 1000;
    funkMandela.legacy_compatibility.true_peak_target = Math.round(MEDIAS_CALCULADAS.true_peak * 1000) / 1000;
    funkMandela.legacy_compatibility.dr_target = Math.round(MEDIAS_CALCULADAS.dr * 1000) / 1000;
    funkMandela.legacy_compatibility.lra_target = Math.round(MEDIAS_CALCULADAS.lra * 1000) / 1000;
    funkMandela.legacy_compatibility.stereo_target = Math.round(MEDIAS_CALCULADAS.stereo_corr * 1000) / 1000;
    
    // Aplicar no formato estruturado também
    if (funkMandela.fixed) {
        if (funkMandela.fixed.lufs) {
            funkMandela.fixed.lufs.integrated.target = funkMandela.legacy_compatibility.lufs_target;
        }
        if (funkMandela.fixed.truePeak) {
            funkMandela.fixed.truePeak.streamingMax = funkMandela.legacy_compatibility.true_peak_target;
        }
        if (funkMandela.fixed.dynamicRange) {
            funkMandela.fixed.dynamicRange.dr.target = funkMandela.legacy_compatibility.dr_target;
        }
    }
    
    // Aplicar bandas
    for (const banda in MEDIAS_CALCULADAS.bands) {
        const valor = Math.round(MEDIAS_CALCULADAS.bands[banda] * 10) / 10;
        
        // Legacy format
        if (funkMandela.legacy_compatibility.bands[banda]) {
            funkMandela.legacy_compatibility.bands[banda].target_db = valor;
        }
        
        // Structured format
        if (funkMandela.flex && funkMandela.flex.tonalCurve && funkMandela.flex.tonalCurve.bands) {
            const bandaStruct = funkMandela.flex.tonalCurve.bands.find(b => b.name === banda);
            if (bandaStruct) {
                bandaStruct.target_db = valor;
            }
        }
    }
    
    // 7. Atualizar metadados
    funkMandela.version = `${oldVersion}.arithmetic-means`;
    funkMandela.generated_at = new Date().toISOString();
    funkMandela.notes += ' Valores atualizados com médias aritméticas das 17 faixas (auditoria 2025-08-24).';
    
    // 8. Salvar arquivo principal
    fs.writeFileSync(JSON_FILE, JSON.stringify(jsonData, null, 2));
    console.log(`✅ Arquivo principal atualizado: ${JSON_FILE}`);
    
    // 9. Atualizar arquivo público
    try {
        fs.writeFileSync(PUBLIC_JSON, JSON.stringify(jsonData, null, 2));
        console.log(`✅ Arquivo público atualizado: ${PUBLIC_JSON}`);
    } catch (error) {
        console.log(`⚠️  Arquivo público não atualizado: ${error.message}`);
    }
    
    // 10. Resumo final
    console.log('\n✅ CORREÇÃO APLICADA COM SUCESSO!');
    console.log(`📝 Versão: ${oldVersion} → ${funkMandela.version}`);
    console.log(`📅 Data: ${funkMandela.generated_at}`);
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('   1. Testar análise com faixas Funk Mandela');
    console.log('   2. Verificar se comportamento está mais permissivo');
    console.log('   3. Monitorar feedback de usuários');
    console.log('   4. Rollback disponível via backup se necessário');
    
    return true;
}

function mostrarResumo() {
    console.log('📋 RESUMO DO SCRIPT DE CORREÇÃO');
    console.log('='.repeat(50));
    console.log('Este script aplicará as médias aritméticas calculadas na auditoria.');
    console.log('');
    console.log('Comandos disponíveis:');
    console.log('  aplicarMediasAritmeticas() - Mostrar preview da correção');
    console.log('  aplicarCorrecao()          - Aplicar correção efetivamente');
    console.log('');
    console.log('⚠️  IMPORTANTE: Fazer backup antes de aplicar!');
}

// Executar preview por padrão
aplicarMediasAritmeticas();

// Exportar funções para uso manual
export { aplicarCorrecao, mostrarResumo };
