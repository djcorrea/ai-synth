/**
 * 🚀 DEPLOY FINAL DAS NOVAS REFERÊNCIAS
 * Força atualização completa do sistema com as médias corretas
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 INICIANDO DEPLOY FINAL DAS NOVAS REFERÊNCIAS');

/**
 * Atualiza cache-bust para forçar reload
 */
function atualizarCacheBust() {
    const cacheBustFile = path.join(__dirname, 'cache-bust.txt');
    const timestamp = Date.now();
    
    fs.writeFileSync(cacheBustFile, timestamp.toString(), 'utf8');
    console.log('🔄 Cache-bust atualizado:', timestamp);
    
    return timestamp;
}

/**
 * Cria arquivo de verificação das referências
 */
function criarArquivoVerificacao() {
    const referencias = JSON.parse(fs.readFileSync(
        path.join(__dirname, 'public', 'refs', 'embedded-refs.js'), 'utf8'
    ).split('window.PROD_AI_REF_DATA = ')[1].split(';')[0]);
    
    const verificacao = {
        updated_at: new Date().toISOString(),
        total_genres: Object.keys(referencias).length,
        total_tracks: Object.values(referencias).reduce((sum, ref) => sum + (ref.num_tracks || 0), 0),
        method: 'arithmetic_mean_corrected',
        genres: Object.keys(referencias).map(genero => ({
            genre: genero,
            tracks: referencias[genero].num_tracks,
            lufs: referencias[genero].legacy_compatibility?.lufs_target,
            true_peak: referencias[genero].legacy_compatibility?.true_peak_target,
            dr: referencias[genero].legacy_compatibility?.dr_target
        }))
    };
    
    const verificacaoFile = path.join(__dirname, 'public', 'refs', 'verification.json');
    fs.writeFileSync(verificacaoFile, JSON.stringify(verificacao, null, 2), 'utf8');
    console.log('✅ Arquivo de verificação criado:', verificacaoFile);
    
    return verificacao;
}

/**
 * Atualiza HTML para forçar reload das referências
 */
function atualizarHTML() {
    const htmlFile = path.join(__dirname, 'public', 'index.html');
    
    if (!fs.existsSync(htmlFile)) {
        console.log('⚠️ index.html não encontrado, criando entrada básica...');
        return;
    }
    
    let html = fs.readFileSync(htmlFile, 'utf8');
    
    // Atualizar parâmetros de cache nos scripts
    const timestamp = Date.now();
    
    // Substitur versões antigas
    html = html.replace(/embedded-refs\.js\?v=\d+/g, `embedded-refs.js?v=${timestamp}`);
    html = html.replace(/embedded-refs-new\.js\?v=\d+/g, `embedded-refs-new.js?v=${timestamp}`);
    
    // Se não tiver parâmetros de versão, adicionar
    if (!html.includes('embedded-refs.js?v=')) {
        html = html.replace(/embedded-refs\.js/g, `embedded-refs.js?v=${timestamp}`);
    }
    if (!html.includes('embedded-refs-new.js?v=')) {
        html = html.replace(/embedded-refs-new\.js/g, `embedded-refs-new.js?v=${timestamp}`);
    }
    
    // Backup e salvar
    const backup = htmlFile + '.backup-' + Date.now();
    fs.copyFileSync(htmlFile, backup);
    fs.writeFileSync(htmlFile, html, 'utf8');
    
    console.log('🔄 HTML atualizado com novos cache-busters');
    console.log('💾 Backup HTML:', backup);
}

/**
 * Cria página de teste para validação
 */
function criarPaginaTeste() {
    const testeHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🧪 Teste das Novas Referências</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a1a; color: #fff; }
        .container { max-width: 1200px; margin: 0 auto; }
        .genre { background: #2a2a2a; margin: 10px 0; padding: 15px; border-radius: 8px; }
        .metric { display: inline-block; margin: 5px 15px 5px 0; padding: 5px 10px; background: #333; border-radius: 4px; }
        .lufs { background: #2d5a2d; }
        .peak { background: #5a2d2d; }
        .dr { background: #2d2d5a; }
        .tracks { color: #888; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎵 Teste das Novas Referências Musicais</h1>
        <p><strong>Atualizado:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        
        <div id="referencias"></div>
        
        <script src="refs/embedded-refs.js?v=${Date.now()}"></script>
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                if (typeof window.PROD_AI_REF_DATA === 'undefined') {
                    document.getElementById('referencias').innerHTML = '❌ Erro: Referências não carregadas!';
                    return;
                }
                
                const container = document.getElementById('referencias');
                const refs = window.PROD_AI_REF_DATA;
                
                container.innerHTML = '<h2>📊 Total de gêneros: ' + Object.keys(refs).length + '</h2>';
                
                Object.entries(refs).forEach(([genero, dados]) => {
                    const compat = dados.legacy_compatibility || {};
                    const div = document.createElement('div');
                    div.className = 'genre';
                    div.innerHTML = [
                        '<h3>' + genero.toUpperCase() + '</h3>',
                        '<div class="tracks">📀 ' + (dados.num_tracks || 0) + ' faixas</div>',
                        '<div class="metric lufs">LUFS: ' + (compat.lufs_target || 'N/A') + '</div>',
                        '<div class="metric peak">True Peak: ' + (compat.true_peak_target || 'N/A') + ' dBTP</div>',
                        '<div class="metric dr">DR: ' + (compat.dr_target || 'N/A') + '</div>',
                        '<div class="tracks">🎛️ ' + Object.keys(compat.bands || {}).length + ' bandas espectrais</div>'
                    ].join('');
                    container.appendChild(div);
                });
            });
        </script>
    </div>
</body>
</html>`;
    
    const testeFile = path.join(__dirname, 'public', 'teste-referencias-novas.html');
    fs.writeFileSync(testeFile, testeHTML, 'utf8');
    console.log('🧪 Página de teste criada:', testeFile);
    
    return testeFile;
}

/**
 * Deploy completo
 */
async function deployFinal() {
    try {
        console.log('\\n🔄 Executando deploy final...');
        
        // 1. Atualizar cache-bust
        const timestamp = atualizarCacheBust();
        
        // 2. Criar arquivo de verificação
        const verificacao = criarArquivoVerificacao();
        
        // 3. Atualizar HTML
        atualizarHTML();
        
        // 4. Criar página de teste
        const paginaTeste = criarPaginaTeste();
        
        console.log('\\n✅ DEPLOY CONCLUÍDO COM SUCESSO!');
        console.log('\\n📊 RESUMO:');
        console.log(`🎵 Gêneros atualizados: ${verificacao.total_genres}`);
        console.log(`📀 Total de faixas: ${verificacao.total_tracks}`);
        console.log(`🔄 Cache-bust: ${timestamp}`);
        
        console.log('\\n🧪 TESTANDO:');
        console.log('1. Abrir: http://localhost:3000/teste-referencias-novas.html');
        console.log('2. Verificar se todas as referências aparecem');
        console.log('3. Confirmar novos valores de LUFS/Peak/DR');
        
        console.log('\\n🎯 PRÓXIMOS PASSOS:');
        console.log('1. Fazer git add/commit/push');
        console.log('2. Aguardar deploy automático');
        console.log('3. Testar análise de áudio real');
        
        return true;
        
    } catch (error) {
        console.error('💥 ERRO NO DEPLOY:', error);
        return false;
    }
}

// Executar se chamado diretamente
if (process.argv[1] === __filename) {
    deployFinal()
        .then(sucesso => {
            process.exit(sucesso ? 0 : 1);
        });
}

export { deployFinal };
