import fs from 'fs';
import path from 'path';

class AuditorReferencias {
    constructor() {
        this.genreConfigPath = 'refs/out/funk_mandela.json';
        this.samplesDir = 'refs/funk_mandela/samples';
    }

    async auditarReferenciasAtuais() {
        console.log('='.repeat(60));
        console.log('AUDITORIA DAS METRICAS DE REFERENCIA ATUAIS - FUNK MANDELA');
        console.log('='.repeat(60));
        console.log();

        try {
            // 1. Verificar se existe arquivo de configuracao
            if (!fs.existsSync(this.genreConfigPath)) {
                console.log('❌ ERRO: Arquivo de configuracao nao encontrado:', this.genreConfigPath);
                return;
            }

            // 2. Carregar configuracao atual
            const configData = JSON.parse(fs.readFileSync(this.genreConfigPath, 'utf8'));
            console.log('📁 Arquivo de configuracao carregado:', this.genreConfigPath);
            console.log();

            // 3. Verificar quantidade de faixas de referencia
            const faixasContadas = this.contarFaixasReferencia();
            console.log('📊 FAIXAS DE REFERENCIA DISPONIVEIS:');
            console.log('   Quantidade:', faixasContadas);
            console.log('   Esperado: 17 faixas');
            console.log('   Status:', faixasContadas === 17 ? '✅ CORRETO' : '⚠️ DIVERGENCIA');
            console.log();

            // 4. Analisar estrutura do JSON
            this.analisarEstrutura(configData);

            // 5. Extrair e apresentar metricas
            this.apresentarMetricas(configData);

        } catch (error) {
            console.log('❌ ERRO durante auditoria:', error.message);
        }
    }

    contarFaixasReferencia() {
        if (!fs.existsSync(this.samplesDir)) {
            return 0;
        }
        
        const arquivos = fs.readdirSync(this.samplesDir);
        const wavFiles = arquivos.filter(file => file.toLowerCase().endsWith('.wav'));
        return wavFiles.length;
    }

    analisarEstrutura(configData) {
        console.log('🔍 ESTRUTURA DO ARQUIVO DE CONFIGURACAO:');
        
        // Verificar chaves principais
        const chavesPrincipais = Object.keys(configData);
        console.log('   Chaves principais:', chavesPrincipais.join(', '));
        
        // Verificar se tem legacy_compatibility
        if (configData.legacy_compatibility) {
            console.log('   ✅ Seção legacy_compatibility encontrada');
            const chavesLegacy = Object.keys(configData.legacy_compatibility);
            console.log('   Chaves em legacy_compatibility:', chavesLegacy.join(', '));
        } else {
            console.log('   ❌ Seção legacy_compatibility NAO encontrada');
        }
        
        console.log();
    }

    apresentarMetricas(configData) {
        console.log('📋 METRICAS DE REFERENCIA ATUAIS:');
        console.log('-'.repeat(50));

        // Acessar a estrutura correta do JSON
        let metricas = null;
        let metricasFixed = null;
        let metricasFlex = null;
        let origemEstrutura = '';

        // Verificar se existe funk_mandela
        if (configData.funk_mandela) {
            const funkData = configData.funk_mandela;
            
            // Priorizar legacy_compatibility
            if (funkData.legacy_compatibility) {
                metricas = funkData.legacy_compatibility;
                origemEstrutura = 'funk_mandela.legacy_compatibility';
            }
            
            // Tambem capturar fixed e flex para comparacao
            if (funkData.fixed) {
                metricasFixed = funkData.fixed;
            }
            if (funkData.flex) {
                metricasFlex = funkData.flex;
            }
        }

        if (!metricas) {
            console.log('❌ Nenhuma metrica encontrada na estrutura esperada');
            return;
        }

        console.log(`📍 Metricas localizadas em: ${origemEstrutura}`);
        console.log();

        // Listar metricas principais
        this.listarMetrica('LUFS Integrado', metricas.lufs_target, 'LUFS');
        this.listarMetrica('True Peak', metricas.true_peak_target, 'dBTP');
        this.listarMetrica('Dynamic Range (DR)', metricas.dr_target, 'DR');
        this.listarMetrica('Loudness Range (LRA)', metricas.lra_target, 'LU');
        this.listarMetrica('Correlacao Estereo', metricas.stereo_target, '');

        // Mostrar tambem informacoes de tolerancia
        console.log();
        console.log('📊 TOLERANCIAS CONFIGURADAS:');
        this.listarMetrica('Tolerancia LUFS', metricas.tol_lufs, 'LUFS');
        this.listarMetrica('Tolerancia True Peak', metricas.tol_true_peak, 'dB');
        this.listarMetrica('Tolerancia DR', metricas.tol_dr, 'DR');
        this.listarMetrica('Tolerancia LRA', metricas.tol_lra, 'LU');
        this.listarMetrica('Tolerancia Stereo', metricas.tol_stereo, '');

        // Listar bandas de frequencia se existirem
        this.listarBandasFrequencia(metricas);

        // Mostrar informacoes das estruturas fixed e flex tambem
        if (metricasFixed || metricasFlex) {
            console.log();
            console.log('🏗️ ESTRUTURAS ADICIAIS ENCONTRADAS:');
            if (metricasFixed) {
                console.log('   ✅ Estrutura "fixed" disponivel');
                console.log('      LUFS integrado target:', metricasFixed.lufs?.integrated?.target);
                console.log('      True Peak streaming max:', metricasFixed.truePeak?.streamingMax);
                console.log('      DR target:', metricasFixed.dynamicRange?.dr?.target);
            }
            if (metricasFlex) {
                console.log('   ✅ Estrutura "flex" disponivel');
                console.log('      LRA min:', metricasFlex.lra?.min);
                console.log('      LRA max:', metricasFlex.lra?.max);
                console.log('      Clipping sample pct max:', metricasFlex.clipping?.samplePctMax);
            }
        }

        // Informacoes adicionais sobre origem dos calculos
        console.log();
        console.log('📝 INFORMACOES SOBRE ORIGEM DOS CALCULOS:');
        console.log('-'.repeat(50));
        this.inferirOrigemCalculos(metricas, configData);
    }

    listarMetrica(nome, valor, unidade) {
        if (valor !== undefined && valor !== null) {
            const valorFormatado = typeof valor === 'number' ? valor.toFixed(3) : valor;
            const unidadeTexto = unidade ? ` ${unidade}` : '';
            console.log(`   ${nome}: ${valorFormatado}${unidadeTexto}`);
        } else {
            console.log(`   ${nome}: ❌ NAO DEFINIDO`);
        }
    }

    listarBandasFrequencia(metricas) {
        console.log();
        console.log('🎵 BANDAS DE FREQUENCIA:');
        
        // Verificar se existe estrutura bands em legacy_compatibility
        if (metricas.bands) {
            console.log('   📍 Encontradas em: legacy_compatibility.bands');
            
            Object.entries(metricas.bands).forEach(([banda, config]) => {
                const target = config.target_db || 'N/A';
                const tolerancia = config.tol_db || 'N/A';
                const severity = config.severity || 'N/A';
                console.log(`   ${banda}: ${target} dB (tol: ±${tolerancia} dB, severity: ${severity})`);
            });
        } else {
            console.log('   ❌ Nenhuma banda de frequencia encontrada em legacy_compatibility');
        }

        // Verificar outras metricas relacionadas
        console.log();
        console.log('🎯 METRICAS TONAIS ESPECIAIS:');
        if (metricas.calor_target !== undefined) {
            this.listarMetrica('Calor', metricas.calor_target, 'dB');
        }
        if (metricas.brilho_target !== undefined) {
            this.listarMetrica('Brilho', metricas.brilho_target, 'dB');
        }
        if (metricas.clareza_target !== undefined) {
            this.listarMetrica('Clareza', metricas.clareza_target, 'dB');
        }
    }

    inferirOrigemCalculos(metricas, configData) {
        console.log('📊 ANALISE DOS VALORES DE REFERENCIA:');
        console.log();
        
        // Informacoes sobre versao e metodo de agregacao
        console.log('   📅 Versao do sistema:', configData?.funk_mandela?.version || 'N/A');
        console.log('   📈 Metodo de agregacao:', configData?.funk_mandela?.aggregation_method || 'N/A');
        console.log('   🎵 Numero de faixas processadas:', configData?.funk_mandela?.num_tracks || 'N/A');
        console.log('   📅 Data de geracao:', configData?.funk_mandela?.generated_at || 'N/A');
        console.log();

        // Analise dos valores principais
        console.log('   🔍 ORIGEM INFERIDA DOS VALORES:');
        
        // LUFS
        if (metricas.lufs_target === -8) {
            console.log('   • LUFS (-8.000): Valor FIXO (padrão para o gênero)');
        }
        
        // True Peak
        if (metricas.true_peak_target === -10.9) {
            console.log('   • True Peak (-10.900): Valor FIXO (padrão streaming)');
        }
        
        // DR
        if (metricas.dr_target === 8) {
            console.log('   • DR (8.000): Valor FIXO (padrão para o gênero)');
        }
        
        // LRA - este tem decimais, provavelmente calculado
        if (metricas.lra_target && metricas.lra_target !== Math.floor(metricas.lra_target)) {
            console.log(`   • LRA (${metricas.lra_target}): CALCULADO (média/mediana de ${configData?.funk_mandela?.num_tracks || '?'} faixas)`);
        }
        
        // Stereo correlation - com decimais, provavelmente calculado
        if (metricas.stereo_target && metricas.stereo_target !== Math.floor(metricas.stereo_target)) {
            console.log(`   • Correlação Estéreo (${metricas.stereo_target}): CALCULADO (média/mediana de ${configData?.funk_mandela?.num_tracks || '?'} faixas)`);
        }

        // Bandas de frequencia
        if (metricas.bands) {
            console.log();
            console.log('   🎵 BANDAS DE FREQUENCIA:');
            console.log('   • Todas as bandas: CALCULADAS (média/mediana das 17 faixas)');
            console.log('   • Método usado historicamente: mediana (robusto contra outliers)');
        }

        console.log();
        console.log('   📋 RESUMO DA METODOLOGIA:');
        console.log('   • Valores fixos: LUFS, True Peak, DR (padrões do gênero)');
        console.log('   • Valores calculados: LRA, Correlação, Bandas espectrais');
        console.log('   • Fonte dos calculados: 17 faixas de referência');
        console.log('   • Método histórico: mediana (mais robusto que média aritmética)');
    }
}

// Executar auditoria
const auditor = new AuditorReferencias();
auditor.auditarReferenciasAtuais().catch(console.error);
