/**
 * 🔍 DEBUG: Verificar se as referências corretas estão sendo carregadas
 * Script para testar qual arquivo embedded-refs.js está sendo usado
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 AUDITORIA: Verificando arquivos de referência...\n');

// 1. Verificar embedded-refs.js principal
const mainRefsPath = './public/refs/embedded-refs.js';
if (fs.existsSync(mainRefsPath)) {
    const content = fs.readFileSync(mainRefsPath, 'utf8');
    const firstLines = content.split('\n').slice(0, 10).join('\n');
    console.log('📄 embedded-refs.js (PRINCIPAL):');
    console.log(firstLines);
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Extrair valor de funk mandela para comparação
    const funkMatch = content.match(/"funk_mandela":\s*{[^}]*"lufs_target":\s*([-\d.]+)/);
    if (funkMatch) {
        console.log(`🎯 Funk Mandela LUFS no arquivo principal: ${funkMatch[1]}`);
    }
} else {
    console.log('❌ embedded-refs.js principal NÃO ENCONTRADO!');
}

// 2. Verificar embedded-refs-new.js
const newRefsPath = './public/refs/embedded-refs-new.js';
if (fs.existsSync(newRefsPath)) {
    const content = fs.readFileSync(newRefsPath, 'utf8');
    const firstLines = content.split('\n').slice(0, 10).join('\n');
    console.log('📄 embedded-refs-new.js (BACKUP):');
    console.log(firstLines);
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Extrair valor de funk mandela para comparação
    const funkMatch = content.match(/"funk_mandela":\s*{[^}]*"lufs_target":\s*([-\d.]+)/);
    if (funkMatch) {
        console.log(`🎯 Funk Mandela LUFS no arquivo new: ${funkMatch[1]}`);
    }
}

// 3. Verificar index.html e qual script está sendo carregado
const indexPath = './public/index.html';
if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    const scriptMatch = content.match(/<script[^>]*src="refs\/embedded-refs[^"]*"[^>]*>/);
    if (scriptMatch) {
        console.log(`📜 Script carregado no index.html: ${scriptMatch[0]}`);
    }
}

// 4. Verificar vercel.json
console.log('\n🔧 VERCEL.JSON:');
const vercelPath = './vercel.json';
if (fs.existsSync(vercelPath)) {
    const content = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
    console.log(`FORCE_REBUILD: ${content.env.FORCE_REBUILD}`);
    
    // Verificar rotas de refs
    const refRoutes = content.routes.filter(r => r.src.includes('refs'));
    console.log('Rotas de refs:', refRoutes.map(r => `${r.src} → ${r.dest}`));
}

// 5. Verificar .vercelignore
console.log('\n🚫 .VERCELIGNORE:');
const ignorePath = './.vercelignore';
if (fs.existsSync(ignorePath)) {
    const content = fs.readFileSync(ignorePath, 'utf8');
    console.log(content);
}

console.log('\n✅ Auditoria concluída!');
