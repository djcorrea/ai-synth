/**
 * 🎛️ FEATURE FLAGS - SISTEMA DE BALANÇO ESPECTRAL
 * 
 * Feature flag principal para controle do novo sistema de análise espectral
 */

export const SPECTRAL_INTERNAL_MODE: "percent" | "legacy" = "percent";

// Outras flags relacionadas
export const ENABLE_SPECTRAL_BALANCE = true;
export const ENABLE_REFERENCE_TARGETS = true;
export const ENABLE_SPECTRAL_VALIDATION = true;

// Debug flags
export const DEBUG_SPECTRAL_BALANCE = process.env.NODE_ENV === 'development';
export const LOG_SPECTRAL_PERFORMANCE = process.env.NODE_ENV === 'development';

/**
 * Verifica se o novo sistema de balanço espectral está ativo
 */
export function isSpectralPercentModeEnabled(): boolean {
    return SPECTRAL_INTERNAL_MODE === "percent" && ENABLE_SPECTRAL_BALANCE;
}

/**
 * Verifica se deve usar modo legacy
 */
export function isLegacyModeEnabled(): boolean {
    return SPECTRAL_INTERNAL_MODE === "legacy";
}
