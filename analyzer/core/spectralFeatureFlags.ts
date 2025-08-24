/**
 * 🎛️ SPECTRAL FEATURE FLAGS - Controle de funcionalidades espectrais
 * Gerenciamento centralizado de flags para o sistema de balanço espectral
 */

import type { SpectralFeatureFlags, SpectralMode } from './spectralTypes.js';

// 🎯 CONSTANTES GLOBAIS
export const SPECTRAL_INTERNAL_MODE: SpectralMode = "percent";
export const SPECTRAL_CACHE_VERSION = "spectral:v2";

// 🔧 CONFIGURAÇÃO PADRÃO
const DEFAULT_FLAGS: SpectralFeatureFlags = {
  SPECTRAL_INTERNAL_MODE: "percent",
  ENABLE_SPECTRAL_CACHE: true,
  SPECTRAL_UI_SHOW_PERCENTAGES: false,
  SPECTRAL_FORCE_NORMALIZATION: true,
  SPECTRAL_DEBUG_MODE: false
} as const;

// 🌐 CLASSE DE GERENCIAMENTO DE FLAGS
export class SpectralFeatureManager {
  private static instance: SpectralFeatureManager;
  private flags: { [K in keyof SpectralFeatureFlags]: SpectralFeatureFlags[K] };
  private listeners: Set<(flags: SpectralFeatureFlags) => void> = new Set();

  private constructor() {
    this.flags = { ...DEFAULT_FLAGS };
    this.loadFromGlobalScope();
  }

  public static getInstance(): SpectralFeatureManager {
    if (!SpectralFeatureManager.instance) {
      SpectralFeatureManager.instance = new SpectralFeatureManager();
    }
    return SpectralFeatureManager.instance;
  }

  /**
   * 🔄 Carregar flags do escopo global (window/process.env)
   */
  private loadFromGlobalScope(): void {
    if (typeof window !== 'undefined') {
      // Browser environment
      const globalFlags = (window as any).SPECTRAL_FLAGS;
      if (globalFlags && typeof globalFlags === 'object') {
        this.updateFlags(globalFlags);
      }

      // Variáveis individuais no window
      if (typeof (window as any).SPECTRAL_INTERNAL_MODE === 'string') {
        this.flags.SPECTRAL_INTERNAL_MODE = (window as any).SPECTRAL_INTERNAL_MODE;
      }
    } else if (typeof process !== 'undefined' && process.env) {
      // Node.js environment
      if (process.env.SPECTRAL_INTERNAL_MODE) {
        this.flags.SPECTRAL_INTERNAL_MODE = process.env.SPECTRAL_INTERNAL_MODE as SpectralMode;
      }
      if (process.env.SPECTRAL_DEBUG_MODE === 'true') {
        this.flags.SPECTRAL_DEBUG_MODE = true;
      }
      if (process.env.SPECTRAL_DISABLE_CACHE === 'true') {
        this.flags.ENABLE_SPECTRAL_CACHE = false;
      }
    }
  }

  /**
   * 📖 Obter todas as flags
   */
  public getFlags(): Readonly<SpectralFeatureFlags> {
    return { ...this.flags };
  }

  /**
   * 🎛️ Obter flag específica
   */
  public getFlag<K extends keyof SpectralFeatureFlags>(key: K): SpectralFeatureFlags[K] {
    return this.flags[key];
  }

  /**
   * ✏️ Atualizar flags
   */
  public updateFlags(newFlags: Partial<SpectralFeatureFlags>): void {
    const prevFlags = { ...this.flags };
    this.flags = { ...this.flags, ...newFlags };
    
    // Notificar listeners se houve mudança
    const hasChanges = Object.keys(newFlags).some(
      key => prevFlags[key as keyof SpectralFeatureFlags] !== this.flags[key as keyof SpectralFeatureFlags]
    );
    
    if (hasChanges) {
      this.notifyListeners();
    }
  }

  /**
   * 📡 Adicionar listener para mudanças
   */
  public addListener(callback: (flags: SpectralFeatureFlags) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * 📢 Notificar todos os listeners
   */
  private notifyListeners(): void {
    const currentFlags = this.getFlags();
    this.listeners.forEach(callback => {
      try {
        callback(currentFlags);
      } catch (error) {
        console.warn('🎛️ [SpectralFlags] Erro no listener:', error);
      }
    });
  }

  /**
   * 🔄 Reset para configuração padrão
   */
  public reset(): void {
    this.updateFlags(DEFAULT_FLAGS);
  }

  /**
   * 🎯 Verificar se está no modo legacy
   */
  public isLegacyMode(): boolean {
    return this.flags.SPECTRAL_INTERNAL_MODE === "legacy";
  }

  /**
   * 💾 Verificar se cache está habilitado
   */
  public isCacheEnabled(): boolean {
    return this.flags.ENABLE_SPECTRAL_CACHE;
  }

  /**
   * 🐛 Verificar se debug está ativado
   */
  public isDebugMode(): boolean {
    return this.flags.SPECTRAL_DEBUG_MODE;
  }

  /**
   * 🎨 Verificar se deve mostrar percentagens na UI
   */
  public shouldShowPercentages(): boolean {
    return this.flags.SPECTRAL_UI_SHOW_PERCENTAGES;
  }

  /**
   * ⚡ Verificar se deve forçar normalização
   */
  public shouldForceNormalization(): boolean {
    return this.flags.SPECTRAL_FORCE_NORMALIZATION;
  }
}

// 🎯 FUNÇÕES DE CONVENIÊNCIA
export function getSpectralFlags(): Readonly<SpectralFeatureFlags> {
  return SpectralFeatureManager.getInstance().getFlags();
}

export function getSpectralFlag<K extends keyof SpectralFeatureFlags>(
  key: K
): SpectralFeatureFlags[K] {
  return SpectralFeatureManager.getInstance().getFlag(key);
}

export function updateSpectralFlags(flags: Partial<SpectralFeatureFlags>): void {
  SpectralFeatureManager.getInstance().updateFlags(flags);
}

export function isSpectralLegacyMode(): boolean {
  return SpectralFeatureManager.getInstance().isLegacyMode();
}

export function isSpectralCacheEnabled(): boolean {
  return SpectralFeatureManager.getInstance().isCacheEnabled();
}

export function addSpectralFlagsListener(
  callback: (flags: SpectralFeatureFlags) => void
): () => void {
  return SpectralFeatureManager.getInstance().addListener(callback);
}

// 🔧 UTILITÁRIOS PARA INTEGRAÇÃO
export function createSpectralCacheKey(audioHash: string, config: any): string {
  const mode = getSpectralFlag('SPECTRAL_INTERNAL_MODE');
  const normalization = getSpectralFlag('SPECTRAL_FORCE_NORMALIZATION');
  
  return `${SPECTRAL_CACHE_VERSION}:${mode}:${normalization}:${audioHash}:${JSON.stringify(config)}`;
}

export function shouldInvalidateSpectralCache(): boolean {
  // Verificar se houve mudança significativa que requer invalidação do cache
  const mode = getSpectralFlag('SPECTRAL_INTERNAL_MODE');
  const forceNorm = getSpectralFlag('SPECTRAL_FORCE_NORMALIZATION');
  
  // Se mudou para modo percent, invalidar cache legacy
  return mode === "percent" && forceNorm;
}

// 🎛️ INTEGRAÇÃO COM ESCOPO GLOBAL
if (typeof window !== 'undefined') {
  // Expor no window para debugging
  (window as any).SpectralFlags = {
    get: getSpectralFlags,
    update: updateSpectralFlags,
    isLegacy: isSpectralLegacyMode,
    isCache: isSpectralCacheEnabled,
    reset: () => SpectralFeatureManager.getInstance().reset()
  };
}

// 🐛 LOGGING CONDICIONAL
export function spectralLog(...args: any[]): void {
  if (getSpectralFlag('SPECTRAL_DEBUG_MODE')) {
    console.log('🎵 [SpectralBalance]', ...args);
  }
}

export function spectralWarn(...args: any[]): void {
  if (getSpectralFlag('SPECTRAL_DEBUG_MODE')) {
    console.warn('⚠️ [SpectralBalance]', ...args);
  }
}

export function spectralError(...args: any[]): void {
  console.error('🚨 [SpectralBalance]', ...args);
}
