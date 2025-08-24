#!/usr/bin/env node
/**
 * SCRIPT DE DEPLOYMENT - TOLERÂNCIAS FUNK MANDELA
 * 
 * Script final para deployment das novas tolerâncias em produção
 */

import fs from 'fs';
import { execSync } from 'child_process';

console.log('🚀 DEPLOYMENT - NOVAS TOLERÂNCIAS FUNK MANDELA');
console.log('=' .repeat(70));

// Função para executar comandos de forma segura
function executarComando(comando, descricao) {
    try {
        console.log(`\n🔧 ${descricao}...`);
        const resultado = execSync(comando, { 
            encoding: 'utf8',
            cwd: 'c:/Users/DJ Correa/Desktop/Programação/ai-synth'
        });
        console.log(`✅ ${descricao} - Sucesso`);
        return resultado;
    } catch (error) {
        console.log(`❌ ${descricao} - Erro: ${error.message}`);
        return null;
    }
}

// Lista de verificações pré-deployment
console.log('\n📋 VERIFICAÇÕES PRÉ-DEPLOYMENT:');
const verificacoes = [
    { nome: 'Configuração JSON atualizada', arquivo: 'refs/out/funk_mandela.json' },
    { nome: 'Configuração pública atualizada', arquivo: 'public/refs/out/funk_mandela.json' },
    { nome: 'Script de integração atualizado', arquivo: 'public/audio-analyzer-integration.js' },
    { nome: 'Testes de validação', arquivo: 'testes-novas-tolerancias.js' },
    { nome: 'Teste de scoring integrado', arquivo: 'teste-scoring-integrado.js' }
];

let todasVerificacoesPassed = true;

verificacoes.forEach(verificacao => {
    const caminhoCompleto = `c:/Users/DJ Correa/Desktop/Programação/ai-synth/${verificacao.arquivo}`;
    if (fs.existsSync(caminhoCompleto)) {
        console.log(`✅ ${verificacao.nome}`);
    } else {
        console.log(`❌ ${verificacao.nome} - Arquivo não encontrado`);
        todasVerificacoesPassed = false;
    }
});

if (!todasVerificacoesPassed) {
    console.log('\n❌ Algumas verificações falharam. Abortando deployment.');
    process.exit(1);
}

// Executar testes finais
console.log('\n🧪 EXECUTANDO TESTES FINAIS:');

// Teste de tolerâncias
const testeTolerancia = executarComando(
    'node testes-novas-tolerancias.js',
    'Teste de tolerâncias bidirecionais'
);

if (!testeTolerancia) {
    console.log('❌ Teste de tolerâncias falhou. Abortando deployment.');
    process.exit(1);
}

// Teste de scoring integrado  
const testeScoring = executarComando(
    'node teste-scoring-integrado.js',
    'Teste de scoring integrado'
);

if (!testeScoring) {
    console.log('❌ Teste de scoring falhou. Abortando deployment.');
    process.exit(1);
}

// Verificar status do Git
console.log('\n📊 VERIFICANDO STATUS DO GIT:');
const gitStatus = executarComando('git status --porcelain', 'Verificação de arquivos modificados');

if (gitStatus && gitStatus.trim()) {
    console.log('⚠️  Existem arquivos modificados não commitados:');
    console.log(gitStatus);
    
    // Adicionar arquivos de teste ao commit
    executarComando('git add testes-novas-tolerancias.js', 'Adicionando teste de tolerâncias');
    executarComando('git add teste-scoring-integrado.js', 'Adicionando teste de scoring');
    executarComando('git add deploy-final-tolerancias.js', 'Adicionando script de deployment');
    
    // Commit final
    const commitMsg = 'feat: Adicionar testes finais e script de deployment para tolerâncias Funk Mandela\n\n- Teste completo de tolerâncias bidirecionais\n- Teste de integração do sistema de scoring\n- Script automatizado de deployment\n- Validação final antes da produção';
    
    executarComando(`git commit -m "${commitMsg}"`, 'Commit final dos testes');
}

// Verificar se estamos na branch correta
const branchAtual = executarComando('git branch --show-current', 'Verificação da branch atual');
if (branchAtual && branchAtual.trim() !== 'main') {
    console.log(`⚠️  Você está na branch '${branchAtual.trim()}', não na 'main'`);
    console.log('Deseja continuar mesmo assim? (Ctrl+C para cancelar)');
}

// Exibir resumo das mudanças
console.log('\n📈 RESUMO DAS MUDANÇAS IMPLEMENTADAS:');
console.log('-'.repeat(50));
console.log('🎯 Tolerâncias LUFS: ±2.5 (era ±1.5)');
console.log('🎯 Tolerâncias True Peak: ±3.40 dBTP (era ±1.0)');
console.log('🎯 Tolerâncias Dynamic Range: ±3.0 DR (era ±2.0)');
console.log('🎯 Tolerâncias Stereo: ±0.25 (era ±0.15)');
console.log('🎯 Tolerâncias LRA: ±2.5 LU (era ±1.5)');
console.log('🎯 Tolerâncias Bandas Espectrais: graduadas de ±1.5 a ±2.5 dB');
console.log('🎯 Validação bidirecional: abs(valor - target) ≤ tolerância');
console.log('🎯 Sistema de cores UI: Verde/Amarelo/Vermelho');
console.log('🎯 Scoring integrado com novas tolerâncias');

// Push para produção
console.log('\n🚀 PREPARANDO DEPLOY PARA PRODUÇÃO:');
console.log('Executando push para origin main...');

const pushResult = executarComando('git push origin main', 'Push para produção');

if (pushResult) {
    console.log('\n🎉 DEPLOYMENT CONCLUÍDO COM SUCESSO!');
    console.log('=' .repeat(50));
    console.log('✅ Novas tolerâncias aplicadas');
    console.log('✅ Validação bidirecional implementada');
    console.log('✅ Sistema de scoring atualizado');
    console.log('✅ Testes passando');
    console.log('✅ Mudanças enviadas para produção');
    
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Verificar se o servidor de produção foi atualizado');
    console.log('2. Testar interface do usuário com áudios reais');
    console.log('3. Confirmar cores da UI (Verde/Amarelo/Vermelho)');
    console.log('4. Validar scoring em ambiente de produção');
    
} else {
    console.log('\n❌ ERRO NO DEPLOYMENT');
    console.log('O push para produção falhou. Verifique a conexão e permissões.');
    process.exit(1);
}

console.log('\n🔍 PARA TESTAR EM PRODUÇÃO:');
console.log('1. Acesse a aplicação web');
console.log('2. Faça upload de um áudio Funk Mandela');
console.log('3. Verifique se as cores da UI refletem as novas tolerâncias');
console.log('4. Confirme se o scoring está usando os novos limites');

console.log('\n✨ DEPLOYMENT FINALIZADO! ✨');
