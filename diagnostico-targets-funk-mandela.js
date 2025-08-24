import fs from 'fs';
import https from 'https';
import { URL } from 'url';

class DiagnosticoCompleto {
    constructor() {
        this.localPath = 'public/refs/out/funk_mandela.json';
        this.prodUrl = 'https://ai-synth.vercel.app/refs/out/funk_mandela.json';
    }

    async executarDiagnostico() {
        console.log('🔍 DIAGNÓSTICO COMPLETO - TARGETS FUNK MANDELA');
        console.log('='.repeat(70));
        console.log();

        try {
            // 1. Verificar arquivo local
            await this.verificarArquivoLocal();
            
            // 2. Verificar arquivo em produção
            await this.verificarArquivoProducao();
            
            // 3. Verificar cache do sistema
            await this.verificarCacheLocal();
            
            // 4. Gerar diagnóstico final
            this.gerarDiagnosticoFinal();

        } catch (error) {
            console.log('❌ ERRO no diagnóstico:', error.message);
        }
    }

    async verificarArquivoLocal() {
        console.log('📂 1. VERIFICANDO ARQUIVO LOCAL:');
        console.log('-'.repeat(50));
        
        if (fs.existsSync(this.localPath)) {
            const data = JSON.parse(fs.readFileSync(this.localPath, 'utf8'));
            const legacy = data.funk_mandela?.legacy_compatibility;
            
            console.log(`   ✅ Arquivo existe: ${this.localPath}`);
            console.log(`   📅 Versão: ${data.funk_mandela?.version}`);
            console.log(`   🕒 Data: ${data.funk_mandela?.generated_at}`);
            console.log();
            
            if (legacy) {
                console.log('   🎯 TARGETS LOCAIS:');
                console.log(`      True Peak: ${legacy.true_peak_target} dBTP (tol: ±${legacy.tol_true_peak})`);
                console.log(`      DR: ${legacy.dr_target} DR (tol: ±${legacy.tol_dr})`);
                console.log(`      LRA: ${legacy.lra_target} LU (tol: ±${legacy.tol_lra})`);
                console.log(`      Stereo: ${legacy.stereo_target} (tol: ±${legacy.tol_stereo})`);
                console.log();
                
                // Verificar se são os valores esperados
                const esperados = [-8, 2.5, 8, 1.5, 9, 2, 0.6, 0.15];
                const atuais = [
                    legacy.true_peak_target, legacy.tol_true_peak,
                    legacy.dr_target, legacy.tol_dr,
                    legacy.lra_target, legacy.tol_lra,
                    legacy.stereo_target, legacy.tol_stereo
                ];
                
                const corretos = atuais.every((val, i) => Math.abs(val - esperados[i]) < 0.001);
                console.log(`   📊 Status Local: ${corretos ? '✅ CORRETOS' : '❌ INCORRETOS'}`);
            }
        } else {
            console.log(`   ❌ Arquivo não encontrado: ${this.localPath}`);
        }
        console.log();
    }

    async verificarArquivoProducao() {
        console.log('🌐 2. VERIFICANDO ARQUIVO EM PRODUÇÃO:');
        console.log('-'.repeat(50));
        
        try {
            const data = await this.fetchJson(this.prodUrl);
            const legacy = data.funk_mandela?.legacy_compatibility;
            
            console.log(`   ✅ Acesso bem-sucedido: ${this.prodUrl}`);
            console.log(`   📅 Versão Produção: ${data.funk_mandela?.version}`);
            console.log(`   🕒 Data Produção: ${data.funk_mandela?.generated_at}`);
            console.log();
            
            if (legacy) {
                console.log('   🎯 TARGETS EM PRODUÇÃO:');
                console.log(`      True Peak: ${legacy.true_peak_target} dBTP (tol: ±${legacy.tol_true_peak})`);
                console.log(`      DR: ${legacy.dr_target} DR (tol: ±${legacy.tol_dr})`);
                console.log(`      LRA: ${legacy.lra_target} LU (tol: ±${legacy.tol_lra})`);
                console.log(`      Stereo: ${legacy.stereo_target} (tol: ±${legacy.tol_stereo})`);
                console.log();
                
                // Verificar se são os valores esperados
                const esperados = [-8, 2.5, 8, 1.5, 9, 2, 0.6, 0.15];
                const atuais = [
                    legacy.true_peak_target, legacy.tol_true_peak,
                    legacy.dr_target, legacy.tol_dr,
                    legacy.lra_target, legacy.tol_lra,
                    legacy.stereo_target, legacy.tol_stereo
                ];
                
                const corretos = atuais.every((val, i) => Math.abs(val - esperados[i]) < 0.001);
                console.log(`   📊 Status Produção: ${corretos ? '✅ NOVOS VALORES' : '❌ VALORES ANTIGOS'}`);
                
                if (!corretos) {
                    console.log('   ⚠️ PROBLEMA IDENTIFICADO: Produção tem valores antigos!');
                    console.log('   🔧 Possíveis causas:');
                    console.log('      - Deploy ainda não propagou');
                    console.log('      - Cache do CDN/Vercel');
                    console.log('      - Arquivo não foi commitado corretamente');
                }
            }
        } catch (error) {
            console.log(`   ❌ Erro ao acessar produção: ${error.message}`);
        }
        console.log();
    }

    async verificarCacheLocal() {
        console.log('💾 3. VERIFICANDO CACHE E OUTROS ARQUIVOS:');
        console.log('-'.repeat(50));
        
        // Verificar se há outros arquivos funk_mandela.json
        const possiveisCaminhos = [
            'refs/out/funk_mandela.json',
            'public/refs/funk_mandela.json',
            'refs/funk_mandela.json'
        ];
        
        for (const caminho of possiveisCaminhos) {
            if (fs.existsSync(caminho)) {
                const data = JSON.parse(fs.readFileSync(caminho, 'utf8'));
                const truePeak = data.funk_mandela?.legacy_compatibility?.true_peak_target;
                const versao = data.funk_mandela?.version;
                
                console.log(`   📄 ${caminho}:`);
                console.log(`      True Peak: ${truePeak}, Versão: ${versao}`);
            }
        }
        
        // Verificar arquivos de backup
        const backupDir = 'refs/out/';
        if (fs.existsSync(backupDir)) {
            const arquivos = fs.readdirSync(backupDir);
            const backups = arquivos.filter(f => f.includes('funk_mandela.backup'));
            
            console.log(`   📦 Backups encontrados: ${backups.length}`);
            backups.slice(-3).forEach(backup => {
                console.log(`      - ${backup}`);
            });
        }
        
        console.log();
    }

    async fetchJson(url) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            
            const options = {
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; DiagnosticoBot/1.0)',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        resolve(json);
                    } catch (error) {
                        reject(new Error(`JSON inválido: ${error.message}`));
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Timeout na requisição'));
            });
            
            req.end();
        });
    }

    gerarDiagnosticoFinal() {
        console.log('📋 4. DIAGNÓSTICO FINAL E SOLUÇÕES:');
        console.log('='.repeat(70));
        console.log();
        
        console.log('🔧 POSSÍVEIS PROBLEMAS E SOLUÇÕES:');
        console.log();
        
        console.log('1️⃣ CACHE DO BROWSER:');
        console.log('   - Problema: Navegador usando cache antigo');
        console.log('   - Solução: Ctrl+F5 ou Shift+F5 para hard refresh');
        console.log();
        
        console.log('2️⃣ CACHE DO CDN/VERCEL:');
        console.log('   - Problema: Vercel ainda não propagou a mudança');
        console.log('   - Solução: Aguardar 5-10 minutos ou forçar redeploy');
        console.log();
        
        console.log('3️⃣ FUNÇÃO loadReferenceData COM CACHE:');
        console.log('   - Problema: Sistema pode ter cache interno');
        console.log('   - Solução: Adicionar timestamp para quebrar cache');
        console.log();
        
        console.log('4️⃣ ARQUIVO INCORRETO SENDO USADO:');
        console.log('   - Problema: Sistema pode estar lendo de outro local');
        console.log('   - Solução: Verificar todos os caminhos possíveis');
        console.log();
        
        console.log('🚀 PRÓXIMAS AÇÕES RECOMENDADAS:');
        console.log('   1. Verificar função loadReferenceData()');
        console.log('   2. Adicionar cache-busting com timestamp');
        console.log('   3. Forçar redeploy se necessário');
        console.log('   4. Verificar logs do Vercel');
    }
}

// Executar diagnóstico
const diagnostico = new DiagnosticoCompleto();
diagnostico.executarDiagnostico().catch(console.error);
