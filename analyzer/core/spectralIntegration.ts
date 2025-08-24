/**
 * 🔗 INTEGRAÇÃO - SPECTRAL BALANCE COM SISTEMA EXISTENTE
 * 
 * Integra o novo módulo de balanço espectral com o sistema atual,
 * mantendo compatibilidade e adicionando feature flag para rollback.
 */

import { 
    SpectralBalanceAnalyzer, 
    createSpectralBalanceAnalyzer, 
    SpectralBalanceResult, 
    formatForUI,
    DEFAULT_SPECTRAL_BANDS 
} from './spectralBalance.js';

// Feature flag global
export const SPECTRAL_INTERNAL_MODE = globalThis.SPECTRAL_INTERNAL_MODE || 'percent';

/**
 * 🎛️ CONFIGURAÇÃO - Sistema de balanço espectral
 */
export interface SpectralIntegrationConfig {
    enabled: boolean;
    mode: 'percent' | 'legacy';
    logging: boolean;
    targets?: { [genreName: string]: { [bandName: string]: number } };
}

/**
 * 🎼 WRAPPER - Integração com o analisador de áudio existente
 */
export class SpectralBalanceIntegration {
    private analyzer: SpectralBalanceAnalyzer;
    private config: SpectralIntegrationConfig;
    private logger: (msg: string) => void;
    
    constructor(config: Partial<SpectralIntegrationConfig> = {}) {
        this.config = {
            enabled: true,
            mode: SPECTRAL_INTERNAL_MODE as 'percent' | 'legacy',
            logging: true,
            ...config
        };
        
        this.logger = this.config.logging ? 
            (msg: string) => console.log(`[SpectralIntegration] ${msg}`) :
            () => {};
            
        // Criar analisador
        this.analyzer = createSpectralBalanceAnalyzer({
            spectralInternalMode: this.config.mode,
            measurementTarget: {
                lufsTarget: -14.0,  // EBU R128 para normalização
                dcCutoff: 20.0,
                maxFreq: 16000.0
            }
        }, this.logger);
        
        this.logger(`Inicializado - Modo: ${this.config.mode}, Enabled: ${this.config.enabled}`);
    }
    
    /**
     * 🎯 ANÁLISE PRINCIPAL - Integração com pipeline existente
     */
    async analyzeAudio(
        audioBuffer: Float32Array[],
        sampleRate: number,
        genreName?: string
    ): Promise<{
        spectralBalance: SpectralBalanceResult | null;
        legacyBands: any; // Formato antigo para compatibilidade
        uiData: any;      // Dados formatados para UI
    }> {
        
        if (!this.config.enabled || this.config.mode === 'legacy') {
            this.logger('Análise espectral desabilitada ou em modo legacy');
            return {
                spectralBalance: null,
                legacyBands: this.generateLegacyPlaceholder(),
                uiData: null
            };
        }
        
        try {
            // Obter alvos de referência para o gênero
            const referenceTargets = this.getReferenceTargets(genreName);
            
            // Executar análise
            const result = await this.analyzer.analyzeSpectralBalance(
                audioBuffer, 
                sampleRate, 
                referenceTargets
            );
            
            // Gerar dados de compatibilidade
            const legacyBands = this.convertToLegacyFormat(result);
            const uiData = formatForUI(result);
            
            this.logResults(result);
            
            return {
                spectralBalance: result,
                legacyBands,
                uiData
            };
            
        } catch (error) {
            this.logger(`ERRO na análise: ${error.message}`);
            return {
                spectralBalance: null,
                legacyBands: this.generateLegacyPlaceholder(),
                uiData: null
            };
        }
    }
    
    /**
     * 📋 OBTER ALVOS - Buscar alvos de referência para gênero
     */
    private getReferenceTargets(genreName?: string): { [bandName: string]: number } | undefined {
        if (!genreName || !this.config.targets) {
            return undefined;
        }
        
        const targets = this.config.targets[genreName];
        if (!targets) {
            this.logger(`Nenhum alvo encontrado para gênero: ${genreName}`);
            return undefined;
        }
        
        this.logger(`Alvos carregados para ${genreName}: ${Object.keys(targets).length} bandas`);
        return targets;
    }
    
    /**
     * 🔄 CONVERTER - Para formato legacy (compatibilidade)
     */
    private convertToLegacyFormat(result: SpectralBalanceResult): any {
        const legacy: any = {};
        
        // Converter bandas individuais
        result.bands.forEach(band => {
            legacy[band.name] = {
                energy_db: band.rmsDb,
                rms_db: band.rmsDb,
                target_db: band.deltaDb ? (band.rmsDb - band.deltaDb) : undefined,
                tolerance_db: band.tolerancePp ? (band.tolerancePp * 0.4) : undefined, // Conversão aproximada
                range_hz: band.freqRange,
                status: band.status
            };
        });
        
        // Adicionar resumo (3 bandas)
        Object.entries(result.summary).forEach(([category, data]) => {
            legacy[category] = {
                energy_db: data.rmsDb,
                rms_db: data.rmsDb,
                range_hz: data.freqRange,
                status: data.status,
                category: true
            };
        });
        
        return legacy;
    }
    
    /**
     * 📊 PLACEHOLDER - Dados legacy vazios
     */
    private generateLegacyPlaceholder(): any {
        const placeholder: any = {};
        
        DEFAULT_SPECTRAL_BANDS.forEach(band => {
            placeholder[band.name] = {
                energy_db: -40,
                rms_db: -40,
                range_hz: band.freqRange,
                status: 'unknown'
            };
        });
        
        return placeholder;
    }
    
    /**
     * 📝 LOG - Resultados da análise
     */
    private logResults(result: SpectralBalanceResult): void {
        this.logger('=== RESULTADOS SPECTRAL BALANCE ===');
        this.logger(`Pipeline: ${result.pipeline.filterMethod}, normalizado: ${result.pipeline.normalizedToLufs} LUFS`);
        
        // Log das bandas
        result.bands.forEach(band => {
            const delta = band.deltaDb ? `${band.deltaDb > 0 ? '+' : ''}${band.deltaDb.toFixed(1)}dB` : 'N/A';
            this.logger(`${band.name}: ${band.energyPercent.toFixed(1)}% (${delta}) - ${band.status || 'N/A'}`);
        });
        
        // Log do resumo
        Object.entries(result.summary).forEach(([category, data]) => {
            const delta = data.deltaDb ? `${data.deltaDb > 0 ? '+' : ''}${data.deltaDb.toFixed(1)}dB` : 'N/A';
            this.logger(`${category.toUpperCase()}: ${data.energyPercent.toFixed(1)}% (${delta}) - ${data.status || 'N/A'}`);
        });
        
        // Log de validação
        if (result.validation.errors.length > 0) {
            this.logger(`AVISOS: ${result.validation.errors.join(', ')}`);
        } else {
            this.logger(`Validação OK - ${result.validation.bandsProcessed} bandas, energia total: ${(result.validation.totalEnergyCheck * 100).toFixed(1)}%`);
        }
    }
    
    /**
     * 🔧 CONFIGURAR - Alvos de referência
     */
    setReferenceTargets(targets: { [genreName: string]: { [bandName: string]: number } }): void {
        this.config.targets = targets;
        this.logger(`Alvos de referência configurados para ${Object.keys(targets).length} gêneros`);
    }
    
    /**
     * 🎛️ FEATURE FLAG - Alterar modo
     */
    setMode(mode: 'percent' | 'legacy'): void {
        this.config.mode = mode;
        this.logger(`Modo alterado para: ${mode}`);
        
        // Recriar analisador se necessário
        if (mode === 'percent') {
            this.analyzer = createSpectralBalanceAnalyzer({
                spectralInternalMode: mode
            }, this.logger);
        }
    }
    
    /**
     * 📊 STATUS - Informações de debug
     */
    getStatus(): {
        enabled: boolean;
        mode: string;
        bandsConfigured: number;
        targetsLoaded: number;
    } {
        return {
            enabled: this.config.enabled,
            mode: this.config.mode,
            bandsConfigured: DEFAULT_SPECTRAL_BANDS.length,
            targetsLoaded: this.config.targets ? Object.keys(this.config.targets).length : 0
        };
    }
}

/**
 * 🏭 FACTORY - Instância global (singleton pattern)
 */
let globalSpectralIntegration: SpectralBalanceIntegration | null = null;

export function getSpectralBalanceIntegration(): SpectralBalanceIntegration {
    if (!globalSpectralIntegration) {
        globalSpectralIntegration = new SpectralBalanceIntegration({
            mode: SPECTRAL_INTERNAL_MODE as 'percent' | 'legacy'
        });
    }
    return globalSpectralIntegration;
}

/**
 * 🧪 TESTE - Função para validação básica
 */
export async function testSpectralBalance(): Promise<boolean> {
    try {
        const integration = getSpectralBalanceIntegration();
        
        // Gerar sinal de teste (tom sintético em 1 kHz)
        const sampleRate = 44100;
        const duration = 1.0; // 1 segundo
        const testFreq = 1000; // 1 kHz
        
        const samples = Math.floor(sampleRate * duration);
        const testSignal = new Float32Array(samples);
        
        for (let i = 0; i < samples; i++) {
            testSignal[i] = 0.5 * Math.sin(2 * Math.PI * testFreq * i / sampleRate);
        }
        
        // Executar análise
        const result = await integration.analyzeAudio([testSignal], sampleRate);
        
        if (result.spectralBalance) {
            // Verificar se a banda mid concentra a maior energia (tom em 1 kHz)
            const midBand = result.spectralBalance.bands.find(b => b.name === 'mid');
            if (midBand && midBand.energyPercent > 50) {
                console.log('✅ Teste espectral passou - banda mid concentrou energia');
                return true;
            }
        }
        
        console.log('❌ Teste espectral falhou');
        return false;
        
    } catch (error) {
        console.log(`❌ Teste espectral com erro: ${error.message}`);
        return false;
    }
}

/**
 * 📦 EXPORTAÇÕES - Interface pública
 */
export {
    SpectralBalanceAnalyzer,
    createSpectralBalanceAnalyzer,
    SpectralBalanceResult,
    formatForUI,
    DEFAULT_SPECTRAL_BANDS
};
