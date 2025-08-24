import fs from 'fs';

console.log('🔍 VERIFICAÇÃO DOS TARGETS ATUALIZADOS - FUNK MANDELA');
console.log('='.repeat(60));
console.log();

// Verificar arquivo público (usado em produção)
const publicPath = 'public/refs/out/funk_mandela.json';
if (fs.existsSync(publicPath)) {
    const publicData = JSON.parse(fs.readFileSync(publicPath, 'utf8'));
    const legacy = publicData.funk_mandela?.legacy_compatibility;
    
    console.log('📂 ARQUIVO PÚBLICO (PRODUÇÃO):');
    console.log(`   Caminho: ${publicPath}`);
    console.log(`   Versão: ${publicData.funk_mandela?.version}`);
    console.log(`   Data: ${publicData.funk_mandela?.generated_at}`);
    console.log();
    
    if (legacy) {
        console.log('🎯 TARGETS ATUAIS EM PRODUÇÃO:');
        console.log(`   True Peak: ${legacy.true_peak_target} dBTP (tol: ±${legacy.tol_true_peak})`);
        console.log(`   DR: ${legacy.dr_target} DR (tol: ±${legacy.tol_dr})`);
        console.log(`   LRA: ${legacy.lra_target} LU (tol: ±${legacy.tol_lra})`);
        console.log(`   Stereo: ${legacy.stereo_target} (tol: ±${legacy.tol_stereo})`);
        console.log();
        
        // Verificar se são os valores novos esperados
        const esperados = {
            true_peak_target: -8,
            tol_true_peak: 2.5,
            dr_target: 8,
            tol_dr: 1.5,
            lra_target: 9,
            tol_lra: 2,
            stereo_target: 0.6,
            tol_stereo: 0.15
        };
        
        console.log('✅ VERIFICAÇÃO DOS VALORES:');
        let todosCorretos = true;
        
        Object.entries(esperados).forEach(([chave, valorEsperado]) => {
            const valorAtual = legacy[chave];
            const correto = valorAtual === valorEsperado;
            const status = correto ? '✅' : '❌';
            
            console.log(`   ${status} ${chave}: ${valorAtual} (esperado: ${valorEsperado})`);
            
            if (!correto) {
                todosCorretos = false;
            }
        });
        
        console.log();
        if (todosCorretos) {
            console.log('🎉 SUCESSO! Todos os valores foram atualizados corretamente!');
            console.log('   O sistema agora está usando os novos targets em produção.');
        } else {
            console.log('⚠️ ATENÇÃO! Alguns valores não foram atualizados.');
            console.log('   Verifique se o arquivo foi salvo corretamente.');
        }
        
    } else {
        console.log('❌ Seção legacy_compatibility não encontrada');
    }
    
} else {
    console.log(`❌ Arquivo não encontrado: ${publicPath}`);
}

console.log();
console.log('📋 PRÓXIMOS PASSOS:');
console.log('   1. Os valores foram atualizados no arquivo público');
console.log('   2. Commit e push foram realizados');
console.log('   3. Vercel fará deploy automático das mudanças');
console.log('   4. Cache do navegador pode demorar alguns minutos para atualizar');
console.log();
console.log('💡 DICA: Se ainda aparecem valores antigos, aguarde alguns minutos');
console.log('   ou force refresh (Ctrl+F5) no navegador para limpar cache.');
