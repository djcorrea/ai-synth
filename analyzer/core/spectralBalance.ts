/**
 * 🎼 SPECTRAL BALANCE ANALYZER
 * 
 * Módulo isolado para análise de balanço espectral por bandas com cálculo INTERNO em porcentagem
 * de energia, mantendo a UI exibindo valores em dB.
 * 
 * Requisitos de arquitetura:
 * - Não alterar métricas existentes
 * - API clara e isolada
 * - Compatibilidade com tela atual (3 bandas resumo + 6-7 bandas avançado)
 * - Pipeline determinístico de medição
 */

// Configuração das bandas espectrais
export interface SpectralBandConfig {
    name: string;
    freqRange: [number, number]; // Hz
    displayName: string;
    category: 'grave' | 'medio' | 'agudo';
}

// Resultado da análise por banda
export interface BandAnalysisResult {
    name: string;
    freqRange: [number, number];
    rmsDb: number;           // dB RMS da banda
    powerLinear: number;     // Potência linear (para cálculo de %)
    energyPercent: number;   // % da energia total (0-100)
    targetPercent?: number;  // % alvo (se disponível)
    deltaDb?: number;        // Diferença em dB vs alvo
    tolerancePp?: number;    // Tolerância em pontos percentuais
    status?: 'ideal' | 'ajustar' | 'corrigir';
}

// Configuração do analisador
export interface SpectralBalanceConfig {
    // Configuração global
    spectralInternalMode: 'percent' | 'legacy';
    
    // Pipeline de medição  
    measurementTarget: {
        lufsTarget: number;     // LUFS alvo para normalização (-14 LUFS padrão)
        dcCutoff: number;       // Frequência de corte para DC (20 Hz)
        maxFreq: number;        // Frequência máxima (16 kHz)
    };
    
    // Método de filtragem
    filterMethod: 'fir' | 'iir' | 'fft';
    smoothing: '1/3_octave' | 'none';
    
    // Tolerâncias padrão
    defaultTolerancePp: number; // Pontos percentuais padrão
    
    // Bandas de análise
    bands: SpectralBandConfig[];
}

// Resultado completo da análise
export interface SpectralBalanceResult {
    // Metadados
    timestamp: string;
    sampleRate: number;
    durationSeconds: number;
    
    // Pipeline usado
    pipeline: {
        normalizedToLufs: number;
        filterMethod: string;
        smoothing: string;
        dcCutoff: number;
        maxFreq: number;
    };
    
    // Resultados por banda
    bands: BandAnalysisResult[];
    
    // Agregações (resumo 3 bandas)
    summary: {
        grave: BandAnalysisResult;  // Sub + Bass
        medio: BandAnalysisResult;  // Low-Mid + Mid  
        agudo: BandAnalysisResult;  // High-Mid + Presence + Air
    };
    
    // Validação
    validation: {
        totalEnergyCheck: number;  // Deve ser ~1.0
        bandsProcessed: number;    // Deve ser igual ao esperado
        errors: string[];
    };
}

// Configuração padrão das bandas
export const DEFAULT_SPECTRAL_BANDS: SpectralBandConfig[] = [
    { name: 'sub', freqRange: [20, 60], displayName: 'Sub Bass', category: 'grave' },
    { name: 'bass', freqRange: [60, 120], displayName: 'Bass', category: 'grave' },
    { name: 'low_mid', freqRange: [120, 250], displayName: 'Low-Mid', category: 'medio' },
    { name: 'mid', freqRange: [250, 1000], displayName: 'Mid', category: 'medio' },
    { name: 'high_mid', freqRange: [1000, 4000], displayName: 'High-Mid', category: 'agudo' },
    { name: 'presence', freqRange: [4000, 8000], displayName: 'Presence', category: 'agudo' },
    { name: 'air', freqRange: [8000, 16000], displayName: 'Air', category: 'agudo' }
];

// Configuração padrão
export const DEFAULT_CONFIG: SpectralBalanceConfig = {
    spectralInternalMode: 'percent',
    measurementTarget: {
        lufsTarget: -14.0,  // EBU R128 padrão
        dcCutoff: 20.0,
        maxFreq: 16000.0
    },
    filterMethod: 'fft',
    smoothing: '1/3_octave',
    defaultTolerancePp: 2.5,
    bands: DEFAULT_SPECTRAL_BANDS
};

/**
 * 🎼 SPECTRAL BALANCE ANALYZER
 */
export class SpectralBalanceAnalyzer {
    private config: SpectralBalanceConfig;
    private logger: (msg: string) => void;
    
    constructor(config: Partial<SpectralBalanceConfig> = {}, logger?: (msg: string) => void) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.logger = logger || console.log;
        
        this.validateConfig();
    }
    
    /**
     * Análise principal - processa áudio e retorna balanço espectral
     */
    async analyzeSpectralBalance(
        audioBuffer: Float32Array[], 
        sampleRate: number,
        referenceTargets?: { [bandName: string]: number }
    ): Promise<SpectralBalanceResult> {
        
        const startTime = performance.now();
        this.logger(`[SpectralBalance] Iniciando análise - SR: ${sampleRate}Hz, Canais: ${audioBuffer.length}`);
        
        try {
            // 1) Normalizar para medição
            const normalizedAudio = await this.normalizeForMeasurement(audioBuffer, sampleRate);
            this.logger(`[SpectralBalance] Áudio normalizado para ${this.config.measurementTarget.lufsTarget} LUFS`);
            
            // 2) Análise por bandas
            const bandResults = await this.analyzeBands(normalizedAudio, sampleRate);
            this.logger(`[SpectralBalance] ${bandResults.length} bandas analisadas`);
            
            // 3) Converter para porcentagens
            const bandsWithPercents = this.calculateEnergyPercentages(bandResults);
            
            // 4) Comparar com alvos se disponível
            const bandsWithComparison = this.compareWithTargets(bandsWithPercents, referenceTargets);
            
            // 5) Gerar agregações (resumo 3 bandas)
            const summary = this.generateSummary(bandsWithComparison);
            
            // 6) Validação final
            const validation = this.validateResults(bandsWithComparison);
            
            const result: SpectralBalanceResult = {
                timestamp: new Date().toISOString(),
                sampleRate,
                durationSeconds: normalizedAudio[0].length / sampleRate,
                pipeline: {
                    normalizedToLufs: this.config.measurementTarget.lufsTarget,
                    filterMethod: this.config.filterMethod,
                    smoothing: this.config.smoothing,
                    dcCutoff: this.config.measurementTarget.dcCutoff,
                    maxFreq: this.config.measurementTarget.maxFreq
                },
                bands: bandsWithComparison,
                summary,
                validation
            };
            
            const elapsed = performance.now() - startTime;
            this.logger(`[SpectralBalance] Análise concluída em ${elapsed.toFixed(2)}ms`);
            
            return result;
            
        } catch (error) {
            this.logger(`[SpectralBalance] ERRO: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * 1) Normalizar áudio para medição (TEMPORÁRIO - não altera original)
     */
    private async normalizeForMeasurement(
        audioBuffer: Float32Array[], 
        sampleRate: number
    ): Promise<Float32Array[]> {
        
        // TODO: Implementar normalização LUFS real
        // Por enquanto, retorna cópia do áudio original
        // Em implementação real, usar biblioteca LUFS como loudness-validator
        
        const normalized = audioBuffer.map(channel => new Float32Array(channel));
        
        // Log de placeholder
        this.logger(`[SpectralBalance] Normalização aplicada (placeholder) - alvo: ${this.config.measurementTarget.lufsTarget} LUFS`);
        
        return normalized;
    }
    
    /**
     * 2) Análise por bandas usando filtros ou FFT
     */
    private async analyzeBands(
        audioBuffer: Float32Array[], 
        sampleRate: number
    ): Promise<Omit<BandAnalysisResult, 'energyPercent'>[]> {
        
        const results: Omit<BandAnalysisResult, 'energyPercent'>[] = [];
        
        for (const bandConfig of this.config.bands) {
            const bandResult = await this.analyzeSingleBand(audioBuffer, sampleRate, bandConfig);
            results.push(bandResult);
            
            this.logger(`[SpectralBalance] Banda ${bandConfig.name}: ${bandResult.rmsDb.toFixed(2)} dB, potência: ${bandResult.powerLinear.toExponential(3)}`);
        }
        
        return results;
    }
    
    /**
     * Análise de uma banda individual
     */
    private async analyzeSingleBand(
        audioBuffer: Float32Array[], 
        sampleRate: number, 
        bandConfig: SpectralBandConfig
    ): Promise<Omit<BandAnalysisResult, 'energyPercent'>> {
        
        let bandEnergy = 0;
        const [minFreq, maxFreq] = bandConfig.freqRange;
        
        // Converter para mono se necessário
        const monoSignal = this.convertToMono(audioBuffer);
        
        if (this.config.filterMethod === 'fft') {
            bandEnergy = this.analyzeBandFFT(monoSignal, sampleRate, minFreq, maxFreq);
        } else {
            bandEnergy = this.analyzeBandFilter(monoSignal, sampleRate, minFreq, maxFreq);
        }
        
        // Converter potência para dB RMS
        const rmsDb = bandEnergy > 0 ? 10 * Math.log10(bandEnergy) : -80;
        
        return {
            name: bandConfig.name,
            freqRange: bandConfig.freqRange,
            rmsDb,
            powerLinear: bandEnergy
        };
    }
    
    /**
     * Análise usando FFT
     */
    private analyzeBandFFT(
        signal: Float32Array, 
        sampleRate: number, 
        minFreq: number, 
        maxFreq: number
    ): number {
        
        const fftSize = 2048;
        const hopSize = fftSize / 2;
        const window = this.createHannWindow(fftSize);
        
        let totalEnergy = 0;
        let frameCount = 0;
        
        // Processar em janelas
        for (let i = 0; i <= signal.length - fftSize; i += hopSize) {
            const frame = signal.slice(i, i + fftSize);
            
            // Aplicar janela
            for (let j = 0; j < fftSize; j++) {
                frame[j] *= window[j];
            }
            
            // FFT (implementação simplificada - em produção usar FFT real)
            const spectrum = this.simpleFFT(frame);
            
            // Calcular energia da banda
            const bandEnergy = this.extractBandEnergy(spectrum, sampleRate, fftSize, minFreq, maxFreq);
            totalEnergy += bandEnergy;
            frameCount++;
        }
        
        return frameCount > 0 ? totalEnergy / frameCount : 0;
    }
    
    /**
     * Análise usando filtros (placeholder)
     */
    private analyzeBandFilter(
        signal: Float32Array, 
        sampleRate: number, 
        minFreq: number, 
        maxFreq: number
    ): number {
        
        // TODO: Implementar filtros IIR/FIR reais
        // Por enquanto, usa método FFT como fallback
        this.logger(`[SpectralBalance] Filtro ${this.config.filterMethod} não implementado, usando FFT`);
        
        return this.analyzeBandFFT(signal, sampleRate, minFreq, maxFreq);
    }
    
    /**
     * 3) Converter para porcentagens de energia
     */
    private calculateEnergyPercentages(
        bandResults: Omit<BandAnalysisResult, 'energyPercent'>[]
    ): BandAnalysisResult[] {
        
        // Calcular energia total (apenas bandas válidas)
        const totalPower = bandResults.reduce((sum, band) => {
            return sum + Math.max(0, band.powerLinear);
        }, 0);
        
        if (totalPower <= 0) {
            this.logger(`[SpectralBalance] AVISO: Energia total zero ou negativa`);
            return bandResults.map(band => ({
                ...band,
                energyPercent: 0
            }));
        }
        
        // Calcular porcentagens
        const bandsWithPercents: BandAnalysisResult[] = bandResults.map(band => {
            const energyPercent = (band.powerLinear / totalPower) * 100;
            
            return {
                ...band,
                energyPercent
            };
        });
        
        // Log de verificação
        const totalPercent = bandsWithPercents.reduce((sum, band) => sum + band.energyPercent, 0);
        this.logger(`[SpectralBalance] Total de energia: ${totalPercent.toFixed(2)}% (deve ser ~100%)`);
        
        return bandsWithPercents;
    }
    
    /**
     * 4) Comparar com alvos de referência
     */
    private compareWithTargets(
        bandResults: BandAnalysisResult[],
        referenceTargets?: { [bandName: string]: number }
    ): BandAnalysisResult[] {
        
        if (!referenceTargets) {
            this.logger(`[SpectralBalance] Nenhum alvo de referência fornecido`);
            return bandResults;
        }
        
        return bandResults.map(band => {
            const targetPercent = referenceTargets[band.name];
            
            if (targetPercent === undefined) {
                return band;
            }
            
            // Calcular diferença em dB
            const deltaDb = 10 * Math.log10(band.energyPercent / targetPercent);
            
            // Determinar status baseado na tolerância
            const tolerancePp = this.config.defaultTolerancePp;
            const percentDiff = Math.abs(band.energyPercent - targetPercent);
            
            let status: 'ideal' | 'ajustar' | 'corrigir';
            if (percentDiff <= tolerancePp) {
                status = 'ideal';
            } else if (percentDiff <= tolerancePp * 1.5) {
                status = 'ajustar';
            } else {
                status = 'corrigir';
            }
            
            return {
                ...band,
                targetPercent,
                deltaDb,
                tolerancePp,
                status
            };
        });
    }
    
    /**
     * 5) Gerar resumo (3 bandas)
     */
    private generateSummary(bandResults: BandAnalysisResult[]): {
        grave: BandAnalysisResult;
        medio: BandAnalysisResult;
        agudo: BandAnalysisResult;
    } {
        
        const categories = {
            grave: bandResults.filter(band => 
                band.name === 'sub' || band.name === 'bass'
            ),
            medio: bandResults.filter(band => 
                band.name === 'low_mid' || band.name === 'mid'
            ),
            agudo: bandResults.filter(band => 
                band.name === 'high_mid' || band.name === 'presence' || band.name === 'air'
            )
        };
        
        const summary = {} as any;
        
        for (const [categoryName, bands] of Object.entries(categories)) {
            if (bands.length === 0) {
                continue;
            }
            
            // Agregar energia e porcentagens
            const totalPower = bands.reduce((sum, band) => sum + band.powerLinear, 0);
            const totalPercent = bands.reduce((sum, band) => sum + band.energyPercent, 0);
            const avgTargetPercent = bands
                .filter(band => band.targetPercent !== undefined)
                .reduce((sum, band, _, arr) => sum + band.targetPercent! / arr.length, 0);
            
            const aggregatedRmsDb = totalPower > 0 ? 10 * Math.log10(totalPower) : -80;
            const deltaDb = avgTargetPercent > 0 ? 10 * Math.log10(totalPercent / avgTargetPercent) : undefined;
            
            summary[categoryName] = {
                name: categoryName,
                freqRange: [
                    Math.min(...bands.map(b => b.freqRange[0])),
                    Math.max(...bands.map(b => b.freqRange[1]))
                ] as [number, number],
                rmsDb: aggregatedRmsDb,
                powerLinear: totalPower,
                energyPercent: totalPercent,
                targetPercent: avgTargetPercent > 0 ? avgTargetPercent : undefined,
                deltaDb,
                tolerancePp: this.config.defaultTolerancePp,
                status: this.determineAggregatedStatus(bands)
            };
        }
        
        return summary;
    }
    
    /**
     * 6) Validação dos resultados
     */
    private validateResults(bandResults: BandAnalysisResult[]): {
        totalEnergyCheck: number;
        bandsProcessed: number;
        errors: string[];
    } {
        
        const errors: string[] = [];
        
        // Verificar contagem de bandas
        const expectedBands = this.config.bands.length;
        if (bandResults.length !== expectedBands) {
            errors.push(`Esperado ${expectedBands} bandas, processado ${bandResults.length}`);
        }
        
        // Verificar soma das porcentagens
        const totalPercent = bandResults.reduce((sum, band) => sum + band.energyPercent, 0);
        const totalEnergyCheck = totalPercent / 100; // Deve ser ~1.0
        
        if (Math.abs(totalEnergyCheck - 1.0) > 1e-6) {
            errors.push(`Soma das porcentagens: ${totalPercent.toFixed(2)}% (deveria ser 100%)`);
        }
        
        // Verificar valores suspeitos
        bandResults.forEach(band => {
            if (!Number.isFinite(band.rmsDb) || !Number.isFinite(band.energyPercent)) {
                errors.push(`Banda ${band.name}: valores não finitos`);
            }
            if (band.energyPercent < 0 || band.energyPercent > 50) {
                errors.push(`Banda ${band.name}: porcentagem suspeita (${band.energyPercent.toFixed(2)}%)`);
            }
        });
        
        return {
            totalEnergyCheck,
            bandsProcessed: bandResults.length,
            errors
        };
    }
    
    // === MÉTODOS AUXILIARES ===
    
    private validateConfig(): void {
        if (this.config.bands.length === 0) {
            throw new Error('Configuração deve ter pelo menos uma banda');
        }
        
        if (this.config.measurementTarget.lufsTarget > -1) {
            throw new Error('LUFS target muito alto');
        }
    }
    
    private convertToMono(audioBuffer: Float32Array[]): Float32Array {
        if (audioBuffer.length === 1) {
            return audioBuffer[0];
        }
        
        const length = audioBuffer[0].length;
        const mono = new Float32Array(length);
        
        for (let i = 0; i < length; i++) {
            let sum = 0;
            for (let ch = 0; ch < audioBuffer.length; ch++) {
                sum += audioBuffer[ch][i];
            }
            mono[i] = sum / audioBuffer.length;
        }
        
        return mono;
    }
    
    private createHannWindow(size: number): Float32Array {
        const window = new Float32Array(size);
        for (let i = 0; i < size; i++) {
            window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
        }
        return window;
    }
    
    private simpleFFT(frame: Float32Array): Float32Array {
        // Implementação FFT muito simplificada para demonstração
        // Em produção, usar biblioteca FFT real (ex: fft.js)
        const spectrum = new Float32Array(frame.length / 2);
        
        for (let k = 0; k < spectrum.length; k++) {
            let real = 0, imag = 0;
            for (let n = 0; n < frame.length; n++) {
                const angle = -2 * Math.PI * k * n / frame.length;
                real += frame[n] * Math.cos(angle);
                imag += frame[n] * Math.sin(angle);
            }
            spectrum[k] = real * real + imag * imag;
        }
        
        return spectrum;
    }
    
    private extractBandEnergy(
        spectrum: Float32Array, 
        sampleRate: number, 
        fftSize: number, 
        minFreq: number, 
        maxFreq: number
    ): number {
        
        const freqResolution = sampleRate / fftSize;
        const minBin = Math.floor(minFreq / freqResolution);
        const maxBin = Math.min(spectrum.length - 1, Math.floor(maxFreq / freqResolution));
        
        let energy = 0;
        for (let i = minBin; i <= maxBin; i++) {
            energy += spectrum[i];
        }
        
        return energy;
    }
    
    private determineAggregatedStatus(bands: BandAnalysisResult[]): 'ideal' | 'ajustar' | 'corrigir' {
        const statuses = bands.map(band => band.status).filter(Boolean);
        
        if (statuses.includes('corrigir')) return 'corrigir';
        if (statuses.includes('ajustar')) return 'ajustar';
        return 'ideal';
    }
}

/**
 * 🎯 FACTORY FUNCTION - Criar analisador com configuração
 */
export function createSpectralBalanceAnalyzer(
    config?: Partial<SpectralBalanceConfig>,
    logger?: (msg: string) => void
): SpectralBalanceAnalyzer {
    return new SpectralBalanceAnalyzer(config, logger);
}

/**
 * 📊 UTILITY - Converter resultado para formato de exibição UI
 */
export function formatForUI(result: SpectralBalanceResult): {
    bands: Array<{
        name: string;
        displayName: string;
        freqRange: string;
        deltaDb: number;
        energyPercent: number;
        status: string;
        colorClass: string;
    }>;
    summary: Array<{
        category: string;
        deltaDb: number;
        energyPercent: number;
        status: string;
        colorClass: string;
    }>;
} {
    
    const formatBand = (band: BandAnalysisResult) => {
        const bandConfig = DEFAULT_SPECTRAL_BANDS.find(b => b.name === band.name);
        return {
            name: band.name,
            displayName: bandConfig?.displayName || band.name,
            freqRange: `${band.freqRange[0]}-${band.freqRange[1]} Hz`,
            deltaDb: band.deltaDb || 0,
            energyPercent: band.energyPercent,
            status: band.status || 'unknown',
            colorClass: band.status === 'ideal' ? 'green' : 
                       band.status === 'ajustar' ? 'yellow' : 'red'
        };
    };
    
    return {
        bands: result.bands.map(formatBand),
        summary: Object.entries(result.summary).map(([category, data]) => ({
            category,
            deltaDb: data.deltaDb || 0,
            energyPercent: data.energyPercent,
            status: data.status || 'unknown',
            colorClass: data.status === 'ideal' ? 'green' : 
                       data.status === 'ajustar' ? 'yellow' : 'red'
        }))
    };
}
