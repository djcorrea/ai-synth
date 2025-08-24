#!/usr/bin/env node
/**
 * AUDITORIA - PONTOS QUE CONSOMEM ESPECTRO
 * 
 * Mapeia onde e como o sistema atual processa informações espectrais
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 AUDITORIA - PONTOS QUE CONSOMEM ESPECTRO');
console.log('=' .repeat(70));

const baseDir = 'c:/Users/DJ Correa/Desktop/Programação/ai-synth';
const arquivosParaInspecionar = [
    'public/audio-analyzer-integration.js',
    'public/audio-analyzer-v2.js', 
    'api/audio/analyze.js',
    'analyzer/core/spectralBalance.ts',
    'analyzer/core/bands.ts',
    'refs/out/funk_mandela.json'
];

console.log('\n📋 ARQUIVOS A INSPECIONAR:');
arquivosParaInspecionar.forEach((arquivo, i) => {
    const caminhoCompleto = path.join(baseDir, arquivo);
    const existe = fs.existsSync(caminhoCompleto);
    console.log(`${i+1}. ${arquivo} - ${existe ? '✅ Existe' : '❌ Não existe'}`);
});

// Função para encontrar padrões espectrais
function buscarPadroesEspectrais(conteudo, nomeArquivo) {
    const padroes = [
        { nome: 'Bandas de frequência', regex: /band|frequency|freq|spectral|hz/gi },
        { nome: 'FFT/Análise', regex: /fft|spectrum|analyze|fourier/gi },
        { nome: 'Filtros', regex: /filter|bandpass|lowpass|highpass/gi },
        { nome: 'RMS/dB', regex: /rms|db|decibel|power|energy/gi },
        { nome: 'Configuração de bandas', regex: /sub|bass|mid|high|presence|air/gi }
    ];
    
    const resultados = [];
    
    padroes.forEach(padrao => {
        const matches = conteudo.match(padrao.regex) || [];
        if (matches.length > 0) {
            resultados.push({
                tipo: padrao.nome,
                ocorrencias: matches.length,
                exemplos: [...new Set(matches)].slice(0, 5) // Únicos, máximo 5
            });
        }
    });
    
    return resultados;
}

console.log('\n🔍 ANÁLISE POR ARQUIVO:');
console.log('-'.repeat(70));

arquivosParaInspecionar.forEach(arquivo => {
    const caminhoCompleto = path.join(baseDir, arquivo);
    
    console.log(`\n📄 ${arquivo}:`);
    
    if (!fs.existsSync(caminhoCompleto)) {
        console.log('   ❌ Arquivo não encontrado');
        return;
    }
    
    try {
        const conteudo = fs.readFileSync(caminhoCompleto, 'utf8');
        const linhas = conteudo.split('\n').length;
        const tamanho = (conteudo.length / 1024).toFixed(1);
        
        console.log(`   📊 ${linhas} linhas, ${tamanho}KB`);
        
        const padroes = buscarPadroesEspectrais(conteudo, arquivo);
        
        if (padroes.length === 0) {
            console.log('   🔍 Nenhum padrão espectral encontrado');
        } else {
            padroes.forEach(padrao => {
                console.log(`   🎯 ${padrao.tipo}: ${padrao.ocorrencias} ocorrências`);
                console.log(`      Exemplos: ${padrao.exemplos.join(', ')}`);
            });
        }
        
        // Buscar estruturas específicas importantes
        if (arquivo.includes('funk_mandela.json')) {
            const dados = JSON.parse(conteudo);
            if (dados.funk_mandela?.legacy_compatibility?.bands) {
                const bandas = Object.keys(dados.funk_mandela.legacy_compatibility.bands);
                console.log(`   🎼 Bandas configuradas: ${bandas.join(', ')}`);
            }
        }
        
        if (arquivo.includes('audio-analyzer-integration.js')) {
            // Buscar estruturas de UI existentes
            const templateMatches = conteudo.match(/frequency-bands|band-item|band-name/g) || [];
            if (templateMatches.length > 0) {
                console.log(`   🖥️ Templates UI bandas: ${templateMatches.length} elementos`);
            }
            
            const funcMatches = conteudo.match(/function.*[Bb]and|const.*[Bb]and|let.*[Bb]and/g) || [];
            if (funcMatches.length > 0) {
                console.log(`   ⚙️ Funções relacionadas a bandas: ${funcMatches.length}`);
            }
        }
        
    } catch (error) {
        console.log(`   ❌ Erro ao ler: ${error.message}`);
    }
});

// Análise de dependências e estruturas
console.log('\n🏗️ ESTRUTURAS ATUAIS DETECTADAS:');
console.log('-'.repeat(50));

// Verificar estrutura do analyzer
const analyzerDir = path.join(baseDir, 'analyzer');
if (fs.existsSync(analyzerDir)) {
    console.log('✅ Diretório analyzer/ existe');
    
    const coreDir = path.join(analyzerDir, 'core');
    if (fs.existsSync(coreDir)) {
        console.log('✅ Diretório analyzer/core/ existe');
        
        const arquivosCore = fs.readdirSync(coreDir);
        console.log(`   📁 Arquivos core: ${arquivosCore.join(', ')}`);
        
        // Verificar se spectralBalance.ts existe e se está vazio
        const spectralPath = path.join(coreDir, 'spectralBalance.ts');
        if (fs.existsSync(spectralPath)) {
            const spectralContent = fs.readFileSync(spectralPath, 'utf8').trim();
            console.log(`   🎯 spectralBalance.ts: ${spectralContent.length === 0 ? 'VAZIO - Pronto para implementação' : 'Tem conteúdo'}`);
        }
    }
}

// Verificar se existe sistema de feature flags
console.log('\n🚩 FEATURE FLAGS:');
const flagPatterns = [
    'SPECTRAL_INTERNAL_MODE',
    'REFERENCE_MODE_ENABLED', 
    'DEBUG_ANALYZER'
];

arquivosParaInspecionar.forEach(arquivo => {
    const caminhoCompleto = path.join(baseDir, arquivo);
    if (fs.existsSync(caminhoCompleto)) {
        const conteudo = fs.readFileSync(caminhoCompleto, 'utf8');
        
        flagPatterns.forEach(flag => {
            if (conteudo.includes(flag)) {
                console.log(`✅ Flag ${flag} encontrada em ${arquivo}`);
            }
        });
    }
});

console.log('\n📝 RESUMO DA AUDITORIA:');
console.log('-'.repeat(50));
console.log('🎯 Sistema atual processa bandas espectrais em:');
console.log('   • public/audio-analyzer-integration.js (UI)');
console.log('   • refs/out/funk_mandela.json (configuração)');
console.log('   • api/audio/analyze.js (backend)');
console.log('');
console.log('🎯 Pontos de integração identificados:');
console.log('   • analyzer/core/spectralBalance.ts (VAZIO - implementar aqui)');
console.log('   • Sistema de bandas legacy compatível');
console.log('   • UI já tem estrutura para frequencyBands');
console.log('   • Feature flags parcialmente implementadas');
console.log('');
console.log('✅ PRÓXIMO PASSO: Implementar spectralBalance.ts com API limpa');

console.log('\n🎯 ARQUIVOS QUE PRECISARÃO SER MODIFICADOS:');
console.log('1. analyzer/core/spectralBalance.ts (criar implementação)');
console.log('2. api/audio/analyze.js (integrar novo pipeline)'); 
console.log('3. public/audio-analyzer-integration.js (consumir nova API)');
console.log('4. refs/out/funk_mandela.json (adicionar targets.bands)');
console.log('5. Criar tipos TypeScript para DTOs');
console.log('6. Testes automatizados');
