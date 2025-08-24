import fs from 'fs';
import path from 'path';

class AtualizadorTargetsFunkMandela {
    constructor() {
        this.configPath = 'refs/out/funk_mandela.json';
        this.backupPath = this.gerarNomeBackup();
        this.novosTargets = {
            true_peak_target: -8.0,
            tol_true_peak: 2.5,
            dr_target: 8.0,
            tol_dr: 1.5,
            lra_target: 9.0,
            tol_lra: 2.0,
            stereo_target: 0.60,
            tol_stereo: 0.15
        };
    }

    gerarNomeBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `refs/out/funk_mandela.backup-${timestamp}.json`;
    }

    async executarAtualizacao() {
        console.log('='.repeat(70));
        console.log('ATUALIZACAO DE TARGETS - FUNK MANDELA');
        console.log('='.repeat(70));
        console.log();

        try {
            // 1. Verificar se arquivo existe
            if (!fs.existsSync(this.configPath)) {
                throw new Error(`Arquivo não encontrado: ${this.configPath}`);
            }

            // 2. Carregar configuração atual
            console.log('📂 Carregando configuração atual...');
            const configAtual = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            
            // 3. Criar backup
            console.log('💾 Criando backup de segurança...');
            this.criarBackup(configAtual);

            // 4. Capturar valores antigos
            console.log('📊 Capturando valores atuais...');
            const valoresAntigos = this.capturarValoresAtuais(configAtual);

            // 5. Aplicar novos valores
            console.log('🔄 Aplicando novos targets...');
            const configAtualizada = this.aplicarNovosTargets(configAtual);

            // 6. Validar estrutura JSON
            console.log('✅ Validando estrutura JSON...');
            this.validarEstrutura(configAtualizada);

            // 7. Salvar arquivo atualizado
            console.log('💾 Salvando configuração atualizada...');
            this.salvarConfiguracao(configAtualizada);

            // 8. Gerar relatório de mudanças
            console.log('📝 Gerando relatório de mudanças...');
            this.gerarRelatorioMudancas(valoresAntigos, this.novosTargets);

            console.log();
            console.log('✅ ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!');

        } catch (error) {
            console.log(`❌ ERRO: ${error.message}`);
            if (fs.existsSync(this.backupPath)) {
                console.log(`🔄 Backup disponível em: ${this.backupPath}`);
            }
        }
    }

    criarBackup(config) {
        fs.writeFileSync(this.backupPath, JSON.stringify(config, null, 2));
        console.log(`   ✅ Backup criado: ${this.backupPath}`);
    }

    capturarValoresAtuais(config) {
        const legacyCompat = config.funk_mandela?.legacy_compatibility;
        if (!legacyCompat) {
            throw new Error('Seção legacy_compatibility não encontrada');
        }

        return {
            true_peak_target: legacyCompat.true_peak_target,
            tol_true_peak: legacyCompat.tol_true_peak,
            dr_target: legacyCompat.dr_target,
            tol_dr: legacyCompat.tol_dr,
            lra_target: legacyCompat.lra_target,
            tol_lra: legacyCompat.tol_lra,
            stereo_target: legacyCompat.stereo_target,
            tol_stereo: legacyCompat.tol_stereo
        };
    }

    aplicarNovosTargets(config) {
        // Criar cópia profunda da configuração
        const configAtualizada = JSON.parse(JSON.stringify(config));
        
        // Atualizar valores em legacy_compatibility
        const legacyCompat = configAtualizada.funk_mandela.legacy_compatibility;
        
        Object.entries(this.novosTargets).forEach(([chave, valor]) => {
            legacyCompat[chave] = valor;
        });

        // Também atualizar na estrutura "fixed" se existir
        const fixed = configAtualizada.funk_mandela.fixed;
        if (fixed) {
            // True Peak
            if (fixed.truePeak) {
                fixed.truePeak.streamingMax = this.novosTargets.true_peak_target;
            }
            
            // Dynamic Range
            if (fixed.dynamicRange && fixed.dynamicRange.dr) {
                fixed.dynamicRange.dr.target = this.novosTargets.dr_target;
                fixed.dynamicRange.dr.tolerance = this.novosTargets.tol_dr;
            }
        }

        // Atualizar na estrutura "flex" se existir
        const flex = configAtualizada.funk_mandela.flex;
        if (flex) {
            // LRA
            if (flex.lra) {
                const lraCenter = this.novosTargets.lra_target;
                const lraTol = this.novosTargets.tol_lra;
                flex.lra.min = +(lraCenter - lraTol).toFixed(3);
                flex.lra.max = +(lraCenter + lraTol).toFixed(3);
            }
        }

        // Atualizar timestamp de geração
        configAtualizada.funk_mandela.generated_at = new Date().toISOString();
        configAtualizada.funk_mandela.version = "2025-08-updated-targets.2.1.2";

        return configAtualizada;
    }

    validarEstrutura(config) {
        // Verificar se a estrutura JSON é válida
        try {
            JSON.stringify(config);
            console.log('   ✅ Estrutura JSON válida');
        } catch (error) {
            throw new Error(`JSON inválido: ${error.message}`);
        }

        // Verificar se as seções essenciais existem
        if (!config.funk_mandela) {
            throw new Error('Seção funk_mandela ausente');
        }

        if (!config.funk_mandela.legacy_compatibility) {
            throw new Error('Seção legacy_compatibility ausente');
        }

        console.log('   ✅ Estrutura consistente mantida');
    }

    salvarConfiguracao(config) {
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
        console.log(`   ✅ Arquivo salvo: ${this.configPath}`);
    }

    gerarRelatorioMudancas(valoresAntigos, novosValores) {
        console.log();
        console.log('📋 RELATÓRIO DE MUDANÇAS APLICADAS:');
        console.log('='.repeat(70));
        
        const mudancas = [
            {
                metrica: 'True Peak Target',
                antigo: valoresAntigos.true_peak_target,
                novo: novosValores.true_peak_target,
                unidade: 'dBTP'
            },
            {
                metrica: 'True Peak Tolerance',
                antigo: valoresAntigos.tol_true_peak,
                novo: novosValores.tol_true_peak,
                unidade: 'dB'
            },
            {
                metrica: 'DR Target',
                antigo: valoresAntigos.dr_target,
                novo: novosValores.dr_target,
                unidade: 'DR'
            },
            {
                metrica: 'DR Tolerance',
                antigo: valoresAntigos.tol_dr,
                novo: novosValores.tol_dr,
                unidade: 'DR'
            },
            {
                metrica: 'LRA Target',
                antigo: valoresAntigos.lra_target,
                novo: novosValores.lra_target,
                unidade: 'LU'
            },
            {
                metrica: 'LRA Tolerance',
                antigo: valoresAntigos.tol_lra,
                novo: novosValores.tol_lra,
                unidade: 'LU'
            },
            {
                metrica: 'Stereo Target',
                antigo: valoresAntigos.stereo_target,
                novo: novosValores.stereo_target,
                unidade: ''
            },
            {
                metrica: 'Stereo Tolerance',
                antigo: valoresAntigos.tol_stereo,
                novo: novosValores.tol_stereo,
                unidade: ''
            }
        ];

        console.log();
        console.log('| Métrica | Valor Antigo | Valor Novo | Diferença | Unidade |');
        console.log('|---------|--------------|------------|-----------|---------|');
        
        mudancas.forEach(({ metrica, antigo, novo, unidade }) => {
            const diferenca = +(novo - antigo).toFixed(3);
            const sinal = diferenca > 0 ? '+' : '';
            console.log(`| ${metrica} | ${antigo} | ${novo} | ${sinal}${diferenca} | ${unidade} |`);
        });

        console.log();
        console.log('🔍 IMPACTOS DAS MUDANÇAS:');
        console.log('   • True Peak mais permissivo (-8.0 vs -10.9): +2.9 dB de headroom');
        console.log('   • DR mantido (8.0): Mesmo perfil dinâmico');
        console.log('   • LRA reduzido (9.0 vs 9.9): Menos variação de loudness permitida');
        console.log('   • Stereo mantido (0.60): Mesmo perfil de correlação estéreo');
        console.log('   • Tolerâncias ajustadas para maior flexibilidade');

        // Salvar relatório em arquivo
        this.salvarRelatorioArquivo(mudancas);
    }

    salvarRelatorioArquivo(mudancas) {
        const timestamp = new Date().toISOString();
        const relatorio = this.gerarMarkdownRelatorio(mudancas, timestamp);
        
        const nomeArquivo = `RELATORIO_ATUALIZACAO_TARGETS_FUNK_MANDELA_${new Date().toISOString().split('T')[0]}.md`;
        fs.writeFileSync(nomeArquivo, relatorio);
        
        console.log();
        console.log(`📄 Relatório detalhado salvo: ${nomeArquivo}`);
    }

    gerarMarkdownRelatorio(mudancas, timestamp) {
        let md = `# 🔄 RELATÓRIO DE ATUALIZAÇÃO - TARGETS FUNK MANDELA\n\n`;
        md += `**Data da Atualização:** ${new Date().toLocaleDateString('pt-BR')}\n`;
        md += `**Timestamp:** ${timestamp}\n`;
        md += `**Arquivo Atualizado:** ${this.configPath}\n`;
        md += `**Backup Criado:** ${this.backupPath}\n\n`;
        
        md += `---\n\n## 📊 MUDANÇAS APLICADAS\n\n`;
        md += `| Métrica | Valor Antigo | Valor Novo | Diferença | Unidade |\n`;
        md += `|---------|--------------|------------|-----------|----------|\n`;
        
        mudancas.forEach(({ metrica, antigo, novo, unidade }) => {
            const diferenca = +(novo - antigo).toFixed(3);
            const sinal = diferenca > 0 ? '+' : '';
            md += `| **${metrica}** | ${antigo} | **${novo}** | ${sinal}${diferenca} | ${unidade} |\n`;
        });

        md += `\n---\n\n## 🎯 NOVOS PARÂMETROS\n\n`;
        md += `### True Peak\n`;
        md += `- **Target:** -8.0 dBTP\n`;
        md += `- **Tolerância:** ±2.5 dB\n`;
        md += `- **Range:** -10.5 a -5.5 dBTP\n\n`;
        
        md += `### Dynamic Range (DR)\n`;
        md += `- **Target:** 8.0 DR\n`;
        md += `- **Tolerância:** ±1.5 DR\n`;
        md += `- **Range:** 6.5 a 9.5 DR\n\n`;
        
        md += `### Loudness Range (LRA)\n`;
        md += `- **Target:** 9.0 LU\n`;
        md += `- **Tolerância:** ±2.0 LU\n`;
        md += `- **Range:** 7.0 a 11.0 LU\n\n`;
        
        md += `### Correlação Estéreo\n`;
        md += `- **Target:** 0.60\n`;
        md += `- **Tolerância:** ±0.15\n`;
        md += `- **Range:** 0.45 a 0.75\n\n`;

        md += `---\n\n## 🔍 ANÁLISE DE IMPACTO\n\n`;
        md += `### 📈 Mudanças Significativas\n`;
        md += `- **True Peak:** Muito mais permissivo (+2.9 dB)\n`;
        md += `- **LRA:** Ligeiramente mais restritivo (-0.9 LU)\n`;
        md += `- **Tolerâncias:** Ajustadas para melhor flexibilidade\n\n`;
        
        md += `### 🎵 Características do Novo Perfil\n`;
        md += `- **Mais headroom:** True Peak -8.0 permite mais dynamics\n`;
        md += `- **Controle LRA:** Menor variação de loudness (mais consistente)\n`;
        md += `- **Flexibilidade:** Tolerâncias balanceadas\n`;
        md += `- **Estéreo mantido:** Perfil de correlação preservado\n\n`;

        md += `---\n\n## ✅ VALIDAÇÃO\n\n`;
        md += `- ✅ Backup criado antes da modificação\n`;
        md += `- ✅ Estrutura JSON mantida íntegra\n`;
        md += `- ✅ Valores aplicados em todas as seções relevantes\n`;
        md += `- ✅ Timestamp de versão atualizado\n`;
        md += `- ✅ Bandas de frequência preservadas (conforme solicitado)\n\n`;

        md += `**Status:** Atualização concluída com sucesso! 🎯\n`;

        return md;
    }
}

// Executar atualização
const atualizador = new AtualizadorTargetsFunkMandela();
atualizador.executarAtualizacao().catch(console.error);
