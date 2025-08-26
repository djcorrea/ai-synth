// 🎯 SOLUÇÃO DE EMERGÊNCIA: REFERENCIAS EMBARCADAS
// Se os arquivos JSON não estiverem acessíveis na Vercel, usar dados embarcados

// Dados do funk_mandela.json embarcados diretamente no código
window.EMERGENCY_REFS = {
  funk_mandela: {
    version: "2.0.0-spectral-v2",
    generated_at: "2025-08-24T16:41:56.711Z",
    num_tracks: 134,
    aggregation_method: "arithmetic_mean",
    spectralBalance: {
      version: "spectral_balance_v2",
      method: "arithmetic_mean_aggregation",
      measurement_lufs_target: -14,
      generated_at: "2025-08-24T16:41:56.711Z",
      bands: {
        sub: -19.2,
        bass: -17.8,
        low_mid: -15.4,
        mid: -13.1,
        high_mid: -15.9,
        high: -18.3,
        presence: -21.7,
        air: -27.4
      },
      tolerances: {
        sub: 2.5,
        bass: 2.0,
        low_mid: 1.8,
        mid: 1.5,
        high_mid: 1.8,
        high: 2.2,
        presence: 2.8,
        air: 3.5
      }
    },
    targets: {
      lufs_integrated: -14.0,
      dr_target: 10,
      tol_dr: 5,
      lra_target: 7,
      tol_lra: 5,
      true_peak_target: -1,
      tol_true_peak: 2.5
    }
  }
};

// Função de fallback para carregar referencias
window.loadReferencesWithFallback = async function() {
  console.log('🔄 Tentando carregar referencias...');
  
  const urls = [
    '/refs/out/funk_mandela.json',
    '/public/refs/out/funk_mandela.json',
    '/refs/out/funk_mandela.json?v=' + Date.now()
  ];
  
  for (const url of urls) {
    try {
      console.log(`📡 Tentando: ${url}`);
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Sucesso carregando: ${url}`);
        return data;
      }
    } catch (error) {
      console.warn(`❌ Falha em ${url}:`, error.message);
    }
  }
  
  console.log('🆘 Usando referencias de emergência embarcadas');
  return window.EMERGENCY_REFS;
};

console.log('🛡️ Sistema de referencias de emergência carregado');
