/**
 * 🎯 TIPOS TYPESCRIPT - Sistema de Balanço Espectral V2
 * Definições de tipos para o sistema de análise espectral
 */

// 🎛️ CONFIGURAÇÕES E CONSTANTES
export const SPECTRAL_INTERNAL_MODE = "percent" as const;

// 🎵 TIPOS BASE
export type SpectralMode = "percent" | "legacy";

export type BandStatus = "OK" | "HIGH" | "LOW" | "NO_REF";

export type BandName = 
  | "sub" 
  | "bass" 
  | "low_mid" 
  | "mid" 
  | "high_mid" 
  | "presence" 
  | "air";

export type AggregateBandName = "low" | "mid" | "high";

// 📊 INTERFACES DE DADOS
export interface SpectralBandData {
  readonly band: BandName;
  readonly hz: string;
  readonly deltaDB: number | null;
  readonly pctUser: number;
  readonly pctRef: number | null;
  readonly status: BandStatus;
  readonly tolerance?: number;
}

export interface SpectralSummary3Band {
  readonly lowDB: number | null;
  readonly midDB: number | null; 
  readonly highDB: number | null;
  readonly lowPct: number;
  readonly midPct: number;
  readonly highPct: number;
}

export interface SpectralBalanceAnalysis {
  readonly mode: SpectralMode;
  readonly bands: readonly SpectralBandData[];
  readonly summary3: SpectralSummary3Band;
  readonly totalEnergyLinear: number;
  readonly normalizationApplied: boolean;
  readonly processingTimeMs: number;
  readonly version: "v2";
  readonly cacheKey: string;
}

// 🔧 CONFIGURAÇÃO DO SISTEMA
export interface SpectralConfig {
  readonly mode: SpectralMode;
  readonly includeAirInHigh: boolean;
  readonly normalizationLUFS: number;
  readonly defaultTolerancePP: number;
  readonly fftSize: number;
  readonly enableCache: boolean;
}

// 📋 REFERÊNCIAS
export interface SpectralReference {
  readonly bands: Record<BandName, number>;
  readonly summary3: {
    readonly low: number;
    readonly mid: number;
    readonly high: number;
  };
  readonly version: string;
  readonly source: string;
}

// 🎪 RESPOSTA DA API/ENDPOINT
export interface SpectralBalanceEndpointResponse {
  readonly mode: SpectralMode;
  readonly bands: Array<{
    readonly band: BandName;
    readonly hz: string;
    readonly deltaDB: number | null;
    readonly pctUser: number;
    readonly pctRef: number | null;
    readonly status: BandStatus;
  }>;
  readonly summary3: SpectralSummary3Band;
  readonly metadata: {
    readonly processingTimeMs: number;
    readonly normalizationApplied: boolean;
    readonly version: "v2";
    readonly cacheKey: string;
  };
}

// 🎨 TIPOS PARA UI
export interface SpectralUIData {
  readonly band: BandName;
  readonly friendlyName: string;
  readonly hz: string;
  readonly deltaDB: number | null;
  readonly deltaText: string;
  readonly colorClass: string;
  readonly tooltipText: string;
  readonly status: BandStatus;
}

export interface SpectralColorConfig {
  readonly ok: string;
  readonly high: string;
  readonly low: string;
  readonly noRef: string;
  readonly thresholds: {
    readonly minor: number; // ±1.5 dB
    readonly major: number; // ±3.0 dB
  };
}

// 🔄 INTEGRAÇÃO COM SISTEMA LEGADO
export interface LegacySpectralData {
  readonly bandEnergies?: Record<string, { rms_db: number; energy?: number }>;
  readonly tonalBalance?: Record<string, { rms_db: number }>;
  readonly bandScale?: string;
}

export interface SpectralIntegrationResult {
  readonly newSystem: SpectralBalanceAnalysis;
  readonly legacyCompat: LegacySpectralData;
  readonly migrationApplied: boolean;
}

// 🧪 TIPOS PARA TESTES
export interface SpectralTestCase {
  readonly name: string;
  readonly description: string;
  readonly audioFreq: number; // Hz para tom de teste
  readonly expectedBand: BandName;
  readonly expectedPctMin: number;
  readonly tolerance: number;
}

// 🎯 VALIDAÇÃO E ERRO
export interface SpectralValidationError {
  readonly type: "INVALID_CONFIG" | "MISSING_REFERENCE" | "AUDIO_ERROR" | "FFT_ERROR";
  readonly message: string;
  readonly details?: Record<string, any>;
}

export type SpectralResult<T> = {
  readonly success: true;
  readonly data: T;
} | {
  readonly success: false;
  readonly error: SpectralValidationError;
};

// 🎛️ FEATURE FLAGS
export interface SpectralFeatureFlags {
  readonly SPECTRAL_INTERNAL_MODE: SpectralMode;
  readonly ENABLE_SPECTRAL_CACHE: boolean;
  readonly SPECTRAL_UI_SHOW_PERCENTAGES: boolean;
  readonly SPECTRAL_FORCE_NORMALIZATION: boolean;
  readonly SPECTRAL_DEBUG_MODE: boolean;
}

export const DEFAULT_SPECTRAL_FLAGS: SpectralFeatureFlags = {
  SPECTRAL_INTERNAL_MODE: "percent",
  ENABLE_SPECTRAL_CACHE: true,
  SPECTRAL_UI_SHOW_PERCENTAGES: false,
  SPECTRAL_FORCE_NORMALIZATION: true,
  SPECTRAL_DEBUG_MODE: false
} as const;
