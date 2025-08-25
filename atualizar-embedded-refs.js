/**
 * 🔄 ATUALIZADOR DE REFERÊNCIAS EMBEDDED
 * Atualiza o arquivo embedded-refs.js com as novas referências recalculadas
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 ATUALIZANDO EMBEDDED-REFS.JS COM NOVAS REFERÊNCIAS');

/**
 * Carrega todas as referências atualizadas
 */
function carregarReferenciasAtualizadas() {
    const refsDir = path.join(__dirname, 'refs', 'out');
    const referencias = {};
    
    console.log('📁 Carregando referências de:', refsDir);
    
    // Filtrar apenas os arquivos principais (sem backups)
    const arquivos = fs.readdirSync(refsDir)
        .filter(file => file.endsWith('.json'))
        .filter(file => !file.includes('backup'))
        .filter(file => !file.includes('legacy'))
        .filter(file => !file.includes('spectral'))
        .filter(file => !file.includes('ROLLBACK'))
        .filter(file => !file.includes('restore-result'))
        .filter(file => file !== 'genres.json'); // Excluir arquivo especial
    
    for (const arquivo of arquivos) {
        const genero = path.basename(arquivo, '.json');
        const caminhoArquivo = path.join(refsDir, arquivo);
        
        try {
            const conteudo = JSON.parse(fs.readFileSync(caminhoArquivo, 'utf8'));
            
            // Verificar se o arquivo tem estrutura válida
            if (conteudo[genero] && conteudo[genero].legacy_compatibility) {
                referencias[genero] = conteudo[genero];
                console.log(`✅ ${genero}: carregado (${referencias[genero].num_tracks} faixas)`);
            } else {
                console.log(`⚠️ ${genero}: estrutura inválida, pulando...`);
            }
        } catch (error) {
            console.error(`❌ Erro carregando ${arquivo}:`, error.message);
        }
    }
    
    return referencias;
}

/**
 * Gera o novo embedded-refs.js
 */
function gerarEmbeddedRefs(referencias) {
    const timestamp = new Date().toISOString();
    
    const conteudo = `/**
 * 🎵 REFERÊNCIAS MUSICAIS EMBEDDADAS - ATUALIZADAS
 * Médias aritméticas recalculadas corretamente
 * Gerado automaticamente em: ${timestamp}
 */

// 🔥 NOVO SISTEMA: Referências com médias aritméticas corretas
window.PROD_AI_REF_DATA = ${JSON.stringify(referencias, null, 2)};

// 🎯 COMPATIBILIDADE: Manter estrutura esperada pela interface
window.EMBEDDED_REFS_LOADED = true;
window.EMBEDDED_REFS_VERSION = "v2025.08.25-arithmetic-corrected";

console.log('🎵 Referências musicais carregadas:', Object.keys(window.PROD_AI_REF_DATA));
console.log('📊 Total de gêneros:', Object.keys(window.PROD_AI_REF_DATA).length);

// 📈 VALIDAÇÃO: Verificar se todas as referências têm dados válidos
Object.entries(window.PROD_AI_REF_DATA).forEach(([genero, dados]) => {
    const metricas = dados.legacy_compatibility || {};
    console.log(\`✅ \${genero}: LUFS=\${metricas.lufs_target}, TP=\${metricas.true_peak_target}, DR=\${metricas.dr_target}\`);
});

// 🎯 HOOK PARA DEBUG
window.__DEBUG_REFS = function() {
    return {
        loaded: window.EMBEDDED_REFS_LOADED,
        version: window.EMBEDDED_REFS_VERSION,
        genres: Object.keys(window.PROD_AI_REF_DATA),
        totalTracks: Object.values(window.PROD_AI_REF_DATA).reduce((sum, ref) => sum + (ref.num_tracks || 0), 0)
    };
};
`;
    
    return conteudo;
}

/**
 * Atualiza os arquivos embedded
 */
async function atualizarEmbeddedRefs() {
    try {
        // Carregar referências atualizadas
        const referencias = carregarReferenciasAtualizadas();
        
        if (Object.keys(referencias).length === 0) {
            throw new Error('Nenhuma referência foi carregada');
        }
        
        console.log(`\n📊 ${Object.keys(referencias).length} gêneros carregados`);
        
        // Gerar novo conteúdo
        const novoConteudo = gerarEmbeddedRefs(referencias);
        
        // Atualizar arquivo principal
        const arquivoPrincipal = path.join(__dirname, 'public', 'refs', 'embedded-refs.js');
        
        // Fazer backup do arquivo atual
        if (fs.existsSync(arquivoPrincipal)) {
            const backup = arquivoPrincipal + '.backup-' + Date.now();
            fs.copyFileSync(arquivoPrincipal, backup);
            console.log('💾 Backup criado:', backup);
        }
        
        // Criar diretório se não existir
        const dirRefs = path.dirname(arquivoPrincipal);
        if (!fs.existsSync(dirRefs)) {
            fs.mkdirSync(dirRefs, { recursive: true });
            console.log('📁 Diretório criado:', dirRefs);
        }
        
        // Escrever novo arquivo
        fs.writeFileSync(arquivoPrincipal, novoConteudo, 'utf8');
        console.log('✅ Arquivo atualizado:', arquivoPrincipal);
        
        // Também atualizar versão -new se existir
        const arquivoNew = path.join(__dirname, 'public', 'refs', 'embedded-refs-new.js');
        fs.writeFileSync(arquivoNew, novoConteudo, 'utf8');
        console.log('✅ Arquivo -new atualizado:', arquivoNew);
        
        // Validação final
        console.log('\n🔍 VALIDAÇÃO DOS DADOS ATUALIZADOS:');
        Object.entries(referencias).forEach(([genero, dados]) => {
            const compat = dados.legacy_compatibility || {};
            console.log(`📈 ${genero.padEnd(15)}: LUFS=${compat.lufs_target}, TP=${compat.true_peak_target}, DR=${compat.dr_target}, Bandas=${Object.keys(compat.bands || {}).length}`);
        });
        
        console.log('\n🎉 EMBEDDED-REFS.JS ATUALIZADO COM SUCESSO!');
        console.log('\n🎯 PRÓXIMOS PASSOS:');
        console.log('1. Recarregar a página da interface');
        console.log('2. Testar análise de áudio com novos valores');
        console.log('3. Verificar se scores estão mais realísticos');
        
        return true;
        
    } catch (error) {
        console.error('💥 ERRO ATUALIZANDO EMBEDDED-REFS:', error);
        return false;
    }
}

// Executar se chamado diretamente
if (process.argv[1] === __filename) {
    atualizarEmbeddedRefs()
        .then(sucesso => {
            process.exit(sucesso ? 0 : 1);
        });
}

export { atualizarEmbeddedRefs };
