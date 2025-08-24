/**
 * 📋 TIPOS TYPESCRIPT - BALANÇO ESPECTRAL
 * 
 * Definições de tipos para o sistema de balanço espectral por bandas
 */

// Enum das bandas espectrais
export type SpectralBand = "sub" | "bass" | "low_mid" | "mid" | "high_mid" | "presence" | "air";

// Resultado da análise de uma banda
export interface SpectralDelta {
    band: SpectralBand;
    hzRange: string;          // ex: "20–60 Hz"
    deltaDB: number;          // 10*log10(pct_user/pct_ref)
    pctUser: number;          // 0–1
    pctRef: number;           // 0–1
    status: 'ideal' | 'ajustar' | 'corrigir';
    colorClass: 'green' | 'yellow' | 'red';
}

// Resumo das 3 bandas principais
export interface SpectralSummary3Bands {
    lowDB: number;       // Grave (Sub + Bass) em dB
    midDB: number;       // Médio (Low-Mid + Mid) em dB
    highDB: number;      // Agudo (High-Mid + Presence + Air) em dB
    lowPct: number;      // Grave em % (0-100)
    midPct: number;      // Médio em % (0-100)
    highPct: number;     // Agudo em % (0-100)
}

// Resultado completo da análise espectral
export interface SpectralSummary {
    lowMidHigh: SpectralSummary3Bands;
    bands: SpectralDelta[];
    mode: "percent" | "legacy";
    timestamp: string;
    validation: {
        totalEnergyCheck: number;  // ~1.0
        bandsProcessed: number;
        errors: string[];
    };
}

// Configuração de tolerâncias por banda
export interface SpectralToleranceConfig {
    sub: number;          // ±2.5 dB
    bass: number;         // ±2.5 dB
    low_mid: number;      // ±2.0 dB
    mid: number;          // ±1.5 dB
    high_mid: number;     // ±1.5 dB
    presence: number;     // ±2.0 dB
    air: number;          // ±2.5 dB
    defaultPp: number;    // Tolerância padrão em pontos percentuais
}

// Targets de referência (% de energia)
export interface SpectralReferenceTargets {
    sub: number;          // % energia (0-100)
    bass: number;         // % energia (0-100)
    low_mid: number;      // % energia (0-100)
    mid: number;          // % energia (0-100)
    high_mid: number;     // % energia (0-100)
    presence: number;     // % energia (0-100)
    air: number;          // % energia (0-100)
}

// Estatísticas de referência (para agregação)
export interface SpectralReferenceStats {
    [bandName: string]: {
        median: number;
        std: number;
        count: number;
    };
}

// Estrutura do JSON de referências
export interface SpectralReferenceData {
    targets: {
        bands: SpectralReferenceTargets;
    };
    stats: {
        bands: SpectralReferenceStats;
    };
    metadata: {
        version: string;
        trackCount: number;
        lastUpdated: string;
        method: 'arithmetic_mean' | 'median';
    };
}

// Resposta da API de análise (estendida)
export interface AudioAnalysisResponse {
    // Métricas existentes (não alterar)
    lufsIntegrated: number;
    truePeakDbtp: number;
    dynamicRange: number;
    stereoCorrelation: number;
    lra: number;
    
    // NOVO: Sistema de balanço espectral
    spectralBalance?: SpectralSummary;
    
    // Metadados
    timestamp: string;
    mode: "percent" | "legacy";
    performance: {
        processingTime: string;
    };
}

// DTO para comunicação frontend/backend
export interface SpectralAnalysisDTO {
    // Entrada
    audioData: ArrayBuffer | Float32Array[];
    sampleRate: number;
    referenceTargets?: SpectralReferenceTargets;
    config?: {
        spectralMode: "percent" | "legacy";
        lufsTarget: number;  // Para normalização (-14 LUFS)
        filterMethod: 'fir' | 'iir' | 'fft';
        smoothing: '1/3_octave' | 'none';
    };
    
    // Saída
    result?: SpectralSummary;
    errors?: string[];
}

// Props para componentes UI
export interface SpectralBalanceUIProps {
    spectralData: SpectralSummary;
    showAdvanced?: boolean;  // Mostrar 6-7 bandas ou apenas resumo 3 bandas
    toleranceConfig: SpectralToleranceConfig;
    onBandClick?: (band: SpectralBand) => void;
    colorTheme?: 'default' | 'dark' | 'high-contrast';
}

// Estado do cache/SWR
export interface SpectralCacheKey {
    audioHash: string;       // Hash do áudio
    spectralVersion: string; // "spectral:v2:percent"
    referenceVersion: string;
    configHash: string;
}

// Telemetria e logs
export interface SpectralTelemetry {
    mode: "percent" | "legacy";
    latencyMs: number;
    bandsProcessed: number;
    outliers: {
        band: SpectralBand;
        deltaDB: number;
        severity: 'warning' | 'error';
    }[];
    cacheHit: boolean;
    timestamp: string;
}

// Configuração de integração
export interface SpectralIntegrationConfig {
    // Feature flags
    enablePercentMode: boolean;
    enableReferenceTargets: boolean;
    enableValidation: boolean;
    
    // Performance
    maxProcessingTimeMs: number;
    enableCaching: boolean;
    cacheExpiryHours: number;
    
    // UI
    defaultShowAdvanced: boolean;
    enableTooltips: boolean;
    enableColorCoding: boolean;
    
    // Debug
    enableDebugLogs: boolean;
    enablePerformanceLogs: boolean;
}

// Hook personalizado para React
export interface UseSpectralBalanceHook {
    spectralData: SpectralSummary | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    clearCache: () => void;
}

// Fallbacks e tratamento de erros
export interface SpectralFallbackData {
    mode: "legacy";
    bands: Array<{
        name: string;
        value: number;
        unit: 'dB';
        status: 'unknown';
    }>;
    message: string;
}
