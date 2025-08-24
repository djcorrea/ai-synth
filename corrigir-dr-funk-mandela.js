#!/usr/bin/env node
/**
 * CORREÇÃO DYNAMIC RANGE - FUNK MANDELA
 * 
 * Corrige o valor do DR target de 8.0 para 7.1 (mediana correta)
 * baseado na auditoria das médias.
 */

import fs from 'fs';

const JSON_FILE = 'c:/Users/DJ Correa/Desktop/Programação/ai-synth/refs/out/funk_mandela.json';
const PUBLIC_JSON = 'c:/Users/DJ Correa/Desktop/Programação/ai-synth/public/refs/out/funk_mandela.json';

function correctDynamicRange() {
    console.log('🔧 CORREÇÃO DYNAMIC RANGE - FUNK MANDELA');
    console.log('=' .repeat(50));
    
    // 1. Carregar JSON atual
    const jsonData = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
    const funkMandela = jsonData.funk_mandela;
    
    // 2. Verificar valor atual
    const currentDR = funkMandela.legacy_compatibility.dr_target;
    const correctDR = 7.1;
    
    console.log(`📊 Dynamic Range atual: ${currentDR}`);
    console.log(`📊 Dynamic Range correto: ${correctDR}`);
    
    if (Math.abs(currentDR - correctDR) < 0.1) {
        console.log('✅ Valor já está correto, nenhuma ação necessária.');
        return;
    }
    
    // 3. Fazer backup
    const backupFile = JSON_FILE.replace('.json', '.backup-before-dr-fix.json');
    fs.writeFileSync(backupFile, JSON.stringify(jsonData, null, 2));
    console.log(`💾 Backup criado: ${backupFile}`);
    
    // 4. Aplicar correção
    const oldVersion = funkMandela.version;
    funkMandela.legacy_compatibility.dr_target = correctDR;
    
    // Atualizar também no novo formato estruturado
    if (funkMandela.fixed && funkMandela.fixed.dynamicRange && funkMandela.fixed.dynamicRange.dr) {
        funkMandela.fixed.dynamicRange.dr.target = correctDR;
    }
    
    // 5. Incrementar versão
    funkMandela.version = oldVersion.includes('dr-fix') 
        ? oldVersion 
        : `${oldVersion}.dr-fix`;
    
    funkMandela.generated_at = new Date().toISOString();
    
    // 6. Adicionar nota
    if (!funkMandela.notes.includes('DR corrigido')) {
        funkMandela.notes += ' DR corrigido para mediana 7.1 baseado em auditoria 2025-08-24.';
    }
    
    // 7. Salvar arquivo principal
    fs.writeFileSync(JSON_FILE, JSON.stringify(jsonData, null, 2));
    console.log(`✅ Arquivo principal atualizado: ${JSON_FILE}`);
    
    // 8. Atualizar arquivo público
    try {
        fs.writeFileSync(PUBLIC_JSON, JSON.stringify(jsonData, null, 2));
        console.log(`✅ Arquivo público atualizado: ${PUBLIC_JSON}`);
    } catch (error) {
        console.log(`⚠️  Aviso: Não foi possível atualizar arquivo público: ${error.message}`);
    }
    
    // 9. Log final
    console.log('\n📋 CORREÇÃO APLICADA:');
    console.log(`   DR target: ${currentDR} → ${correctDR}`);
    console.log(`   Versão: ${oldVersion} → ${funkMandela.version}`);
    console.log(`   Data: ${funkMandela.generated_at}`);
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('   1. Testar análise com faixa Funk Mandela');
    console.log('   2. Verificar se DR 7.1 é aceito corretamente');
    console.log('   3. Monitorar feedback de usuários');
    
    console.log('\n✅ Correção concluída com sucesso!');
}

// Executar correção
correctDynamicRange();
