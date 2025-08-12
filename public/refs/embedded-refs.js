// Embedded fallback for reference JSONs when CDN routing fails
(function(){
  window.__EMBEDDED_REFS__ = window.__EMBEDDED_REFS__ || {};
  window.__EMBEDDED_REFS__.manifest = {"genres":[
    {"key":"trance","label":"Trance"},
    {"key":"funk_mandela","label":"Funk Mandela"},
    {"key":"funk_bruxaria","label":"Funk Bruxaria"},
    {"key":"eletronico","label":"Eletrônico"},
    {"key":"eletrofunk","label":"Eletrofunk"},
    {"key":"funk_consciente","label":"Funk Consciente"},
    {"key":"trap","label":"Trap"}
  ]};
  window.__EMBEDDED_REFS__.byGenre = window.__EMBEDDED_REFS__.byGenre || {};
  // Fallback completo para Trance (qualidade de referência)
  window.__EMBEDDED_REFS__.byGenre.trance = {"version":"1.0","generated_at":"2025-08-11T01:24:45.744Z","num_tracks":5,"lufs_target":-14,"tol_lufs":0.5,"true_peak_target":-7.26,"tol_true_peak":1.14,"dr_target":9.4,"tol_dr":0.8,"lra_target":10.7,"tol_lra":2.7,"stereo_target":0.17,"tol_stereo":0.03,"calor_target":-12.64,"brilho_target":-24.71,"clareza_target":-6.46,"bands":{"sub":{"target_db":-17.3,"tol_db":1},"low_bass":{"target_db":-14.6,"tol_db":2.8},"upper_bass":{"target_db":-14.8,"tol_db":1},"low_mid":{"target_db":-12.6,"tol_db":2.2},"mid":{"target_db":-12,"tol_db":2.5},"high_mid":{"target_db":-20.2,"tol_db":2.1},"brilho":{"target_db":-24.7,"tol_db":1},"presenca":{"target_db":-32.1,"tol_db":2.1}}};
  // Fallbacks mínimos para outros gêneros (evitam badge vermelho)
  const minimal = (overrides={}) => Object.assign({
    lufs_target: -14, tol_lufs: 1,
    true_peak_target: -1, tol_true_peak: 1,
    dr_target: 8, tol_dr: 2,
    lra_target: 6, tol_lra: 3,
    stereo_target: 0.1, tol_stereo: 0.1,
    bands: {
      sub:{target_db:-18,tol_db:3}, low_bass:{target_db:-16,tol_db:3}, upper_bass:{target_db:-15,tol_db:3},
      low_mid:{target_db:-14,tol_db:3}, mid:{target_db:-13,tol_db:3}, high_mid:{target_db:-20,tol_db:3}, brilho:{target_db:-25,tol_db:3}, presenca:{target_db:-32,tol_db:3}
    }
  }, overrides);
  window.__EMBEDDED_REFS__.byGenre['funk_mandela']   = window.__EMBEDDED_REFS__.byGenre['funk_mandela']   || minimal({ stereo_target: 0.2 });
  window.__EMBEDDED_REFS__.byGenre['funk_bruxaria']  = window.__EMBEDDED_REFS__.byGenre['funk_bruxaria']  || minimal({ lufs_target: -10 });
  window.__EMBEDDED_REFS__.byGenre['eletronico']     = window.__EMBEDDED_REFS__.byGenre['eletronico']     || minimal({ lra_target: 8 });
  window.__EMBEDDED_REFS__.byGenre['eletrofunk']     = window.__EMBEDDED_REFS__.byGenre['eletrofunk']     || minimal({ lufs_target: -9 });
  window.__EMBEDDED_REFS__.byGenre['funk_consciente']= window.__EMBEDDED_REFS__.byGenre['funk_consciente']|| minimal({ dr_target: 10 });
  window.__EMBEDDED_REFS__.byGenre['trap']           = window.__EMBEDDED_REFS__.byGenre['trap']           || minimal({ sub: { target_db: -16, tol_db: 4 } });
})();
