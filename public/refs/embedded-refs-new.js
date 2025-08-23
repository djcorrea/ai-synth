// Embedded fallback for reference JSONs when CDN routing fails
(function(){
  window.__EMBEDDED_REFS__ = window.__EMBEDDED_REFS__ || {};
  window.__EMBEDDED_REFS__.manifest = {"genres":[
    {"key":"trance","label":"Trance"},
    {"key":"funk_mandela","label":"Funk Mandela"},
    {"key":"funk_bruxaria","label":"Funk Bruxaria"},
    {"key":"funk_automotivo","label":"Funk Automotivo"},
    {"key":"eletronico","label":"Eletrônico"},
    {"key":"eletrofunk","label":"Eletrofunk"},
    {"key":"funk_consciente","label":"Funk Consciente"},
    {"key":"trap","label":"Trap"}
  ]};
  window.__EMBEDDED_REFS__.byGenre = window.__EMBEDDED_REFS__.byGenre || {};
  // Fallback completo para Trance (qualidade de referência)
  window.__EMBEDDED_REFS__.byGenre.trance = {"version":"1.0","generated_at":"2025-08-11T01:24:45.744Z","num_tracks":5,"lufs_target":-14,"tol_lufs":0.5,"true_peak_target":-7.26,"tol_true_peak":1.14,"dr_target":9.4,"tol_dr":0.8,"lra_target":10.7,"tol_lra":2.7,"stereo_target":0.17,"tol_stereo":0.03,"calor_target":-12.64,"brilho_target":-24.71,"clareza_target":-6.46,"bands":{"sub":{"target_db":-17.3,"tol_db":2.5},"low_bass":{"target_db":-14.6,"tol_db":4.3},"upper_bass":{"target_db":-14.8,"tol_db":2.5},"low_mid":{"target_db":-12.6,"tol_db":3.7},"mid":{"target_db":-12,"tol_db":4.0},"high_mid":{"target_db":-20.2,"tol_db":3.6},"brilho":{"target_db":-24.7,"tol_db":2.5},"presenca":{"target_db":-32.1,"tol_db":3.6}}};
  // Fallbacks mínimos para outros gêneros (evitam badge vermelho)
  const minimal = (overrides={}) => Object.assign({
    lufs_target: -14, tol_lufs: 1,
    true_peak_target: -1, tol_true_peak: 1,
    dr_target: 8, tol_dr: 2,
    lra_target: 6, tol_lra: 3,
    stereo_target: 0.1, tol_stereo: 0.1,
    bands: {
      sub:{target_db:-18,tol_db:4.5}, low_bass:{target_db:-16,tol_db:4.5}, upper_bass:{target_db:-15,tol_db:4.5},
      low_mid:{target_db:-14,tol_db:4.5}, mid:{target_db:-13,tol_db:4.5}, high_mid:{target_db:-20,tol_db:4.5}, brilho:{target_db:-25,tol_db:4.5}, presenca:{target_db:-32,tol_db:4.5}
    }
  }, overrides);
  window.__EMBEDDED_REFS__.byGenre['funk_mandela']   = window.__EMBEDDED_REFS__.byGenre['funk_mandela']   || minimal({ stereo_target: 0.22 });
  // 🎯 TARGETS ALINHADOS COM SCORING V2 - BASEADOS EM MÚSICA PROFISSIONAL
  window.__EMBEDDED_REFS__.byGenre['funk_mandela'] = {
    version: "v2.1_aligned", 
    aggregation_method: "linear_domain",
    num_tracks: 57,
    lufs_target: -10.0, tol_lufs: 3.0,          // ALINHADO: era -14, agora -10 como V2
    true_peak_target: -0.8, tol_true_peak: 1.0, // ALINHADO: era -10.46, agora -0.8 como V2
    dr_target: 7.0, tol_dr: 2.0,                // ALINHADO: era 7.5, agora 7.0 como V2
    lra_target: 3.5, tol_lra: 2.0,              // ALINHADO: era 7.4, agora 3.5 como V2
    stereo_target: 0.65, tol_stereo: 0.2,       // ALINHADO: era 0.22, agora 0.65 como V2
    calor_target: -8.42, brilho_target: -14.83, clareza_target: -0.35,
    bands: {
      sub: { target_db: -9.0, tol_db: 3.0 },        // ALINHADO com V2
      low_bass: { target_db: -7.5, tol_db: 3.0 },   // ALINHADO com V2
      upper_bass: { target_db: -8.5, tol_db: 3.0 }, // ALINHADO com V2
      low_mid: { target_db: -8.5, tol_db: 3.0 },    // ALINHADO com V2
      mid: { target_db: -9.5, tol_db: 3.0 },        // ALINHADO com V2
      high_mid: { target_db: -11.5, tol_db: 3.0 },  // ALINHADO com V2
      brilho: { target_db: -14.0, tol_db: 3.0 },    // ALINHADO com V2
      presenca: { target_db: -14.0, tol_db: 3.0 }   // ALINHADO com V2
    }
  };
  window.__EMBEDDED_REFS__.byGenre['funk_bruxaria']  = {
    version: "1.0.1",
    generated_at: "2025-08-23T18:03:37.143Z",
    num_tracks: 29,
    lufs_target: -14,
    tol_lufs: 0.5,
    true_peak_target: -10.6,
    tol_true_peak: 1.27,
    dr_target: 7.4,
    tol_dr: 1.3,
    lra_target: 8.4,
    tol_lra: 2.8,
    stereo_target: 0.3,
    tol_stereo: 0.1,
    calor_target: -11.95,
    brilho_target: -17.69,
    clareza_target: -1.21,
    bands: {
      sub: { target_db: -12.5, tol_db: 3 },
      low_bass: { target_db: -15.2, tol_db: 3 },
      upper_bass: { target_db: -15.2, tol_db: 2.3 },
      low_mid: { target_db: -12, tol_db: 1.7 },
      mid: { target_db: -8.7, tol_db: 1.7 },
      high_mid: { target_db: -14.5, tol_db: 2.8 },
      brilho: { target_db: -17.7, tol_db: 2.2 },
      presenca: { target_db: -26.7, tol_db: 2.8 }
    }
  };
  window.__EMBEDDED_REFS__.byGenre['funk_automotivo'] = window.__EMBEDDED_REFS__.byGenre['funk_automotivo'] || minimal({ 
    lufs_target: -8, 
    true_peak_target: -9.58,
    stereo_target: 0.3,
    bands: {
      sub: { target_db: -7.6, tol_db: 6.0 },
      low_bass: { target_db: -6.6, tol_db: 4.5 },
      upper_bass: { target_db: -11.4, tol_db: 3.5 },
      low_mid: { target_db: -8.2, tol_db: 3.5 },
      mid: { target_db: -6.7, tol_db: 3.0 },
      high_mid: { target_db: -12.8, tol_db: 4.5 },
      brilho: { target_db: -16.6, tol_db: 4.5 },
      presenca: { target_db: -22.7, tol_db: 5.0 }
    }
  });
  window.__EMBEDDED_REFS__.byGenre['eletronico']     = window.__EMBEDDED_REFS__.byGenre['eletronico']     || {
    lufs_target: -9.0, tol_lufs: 2.5,
    true_peak_target: -0.3, tol_true_peak: 1.0,
    dr_target: 6.5, tol_dr: 1.5,
    lra_target: 2.5, tol_lra: 1.0,
    stereo_correlation_target: 0.55, tol_stereo_correlation: 0.1,
    dc_offset_target: 0.0001, tol_dc_offset: 0.0005,
    clipping_percent_target: 0.05, tol_clipping_percent: 0.02,
    bands: {
      sub_bass: { target_db: -7.0, tol_db: 3.0 },
      bass: { target_db: -6.5, tol_db: 3.0 },
      low_mid: { target_db: -8.5, tol_db: 3.0 },
      mid: { target_db: -9.0, tol_db: 3.0 },
      high_mid: { target_db: -10.0, tol_db: 3.0 },
      brilho: { target_db: -14.0, tol_db: 4.0 },
      presenca: { target_db: -12.0, tol_db: 4.0 }
    }
  };
  window.__EMBEDDED_REFS__.byGenre['eletrofunk']     = window.__EMBEDDED_REFS__.byGenre['eletrofunk']     || {
    lufs_target: -8.3, tol_lufs: 1.22,
    true_peak_target: -1.9, tol_true_peak: 0.5,
    dr_target: 10.1, tol_dr: 1.35,
    lra_target: 8.4, tol_lra: 2.54,
    stereo_target: null, tol_stereo: 0.07,
    bands: {
      sub: { target_db: null, tol_db: 3.28 },
      low_bass: { target_db: 13.3, tol_db: 3.86 },
      upper_bass: { target_db: 11.5, tol_db: 3.52 },
      low_mid: { target_db: 8.8, tol_db: 3.57 },
      mid: { target_db: 2.5, tol_db: 3.31 },
      high_mid: { target_db: -6.7, tol_db: 3.02 },
      brilho: { target_db: -13.1, tol_db: 3.88 },
      presenca: { target_db: -22.7, tol_db: 4.97 }
    }
  };
  window.__EMBEDDED_REFS__.byGenre['funk_consciente']= window.__EMBEDDED_REFS__.byGenre['funk_consciente']|| minimal({ dr_target: 10 });
  window.__EMBEDDED_REFS__.byGenre['trap']           = window.__EMBEDDED_REFS__.byGenre['trap']           || minimal({ sub: { target_db: -16, tol_db: 5.5 } });
})();
