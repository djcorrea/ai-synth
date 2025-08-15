// 🧮 MIX SCORING ENGINE
// Calcula porcentagem de conformidade e classificação qualitativa baseada nas métricas técnicas e referências por gênero
// Design principles:
// - Não falha se métricas ausentes; ignora e ajusta pesos dinamicamente
// - Usa tolerâncias da referência sempre que disponível; senão aplica faixas padrão
// - Transparente: retorna breakdown detalhado

// Novo: suporte a tolerância assimétrica (tolMin / tolMax). Mantém compatibilidade quando apenas tol fornecido.
function scoreTolerance(metricValue, target, tol, invert = false, tolMin = null, tolMax = null) {
  if (!Number.isFinite(metricValue) || !Number.isFinite(target)) return null;
  // Compatibilidade: se tolMin/tolMax ausentes, usar tol simétrico
  if (!Number.isFinite(tol) || tol <= 0) tol = 1;
  if (!Number.isFinite(tolMin) || tolMin <= 0) tolMin = tol;
  if (!Number.isFinite(tolMax) || tolMax <= 0) tolMax = tol;
  const diff = metricValue - target; // positivo => acima
  const sideTol = diff > 0 ? tolMax : (diff < 0 ? tolMin : Math.max(tolMin, tolMax));
  const adiff = Math.abs(diff);
  if (invert) {
    // Métricas onde só penalizamos acima do target (ex: truePeak) – manter lógica antiga
    if (diff <= 0) return 1;
    if (diff >= 2 * sideTol) return 0;
    if (diff <= sideTol) return 1 - (diff / sideTol) * 0.5;
    return 1 - (0.5 + (diff - sideTol) / sideTol * 0.5);
  }
  if (adiff <= sideTol) return 1;
  if (adiff >= 2 * sideTol) return 0;
  return 1 - (adiff - sideTol) / sideTol;
}
function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function classify(scorePct) {
  if (scorePct >= 90) return 'Referência Mundial';
  if (scorePct >= 75) return 'Avançado';
  if (scorePct >= 60) return 'Intermediário';
  return 'Básico';
}

const DEFAULT_TARGETS = {
  crestFactor: { target: 10, tol: 4 },
  stereoCorrelation: { target: 0.3, tol: 0.5 },
  stereoWidth: { target: 0.6, tol: 0.25 },
  balanceLR: { target: 0, tol: 0.15 },
  dcOffset: { target: 0, tol: 0.02, invert: true },
  spectralFlatness: { target: 0.25, tol: 0.15 },
  centroid: { target: 2500, tol: 1200 },
  rolloff50: { target: 3000, tol: 1200 },
  rolloff85: { target: 8000, tol: 2500 },
  thdPercent: { target: 1, tol: 1, invert: true },
  lufsIntegrated: { target: -14, tol: 1 },
  lra: { target: 7, tol: 3 },
  dr: { target: 10, tol: 3 },
  truePeakDbtp: { target: -1, tol: 1, invert: true }
};

// Mantido para compatibilidade (não mais usado na fórmula final principal, mas
// preservado para não quebrar consumidores legados que olham categories.weight)
const CATEGORY_WEIGHTS = {
  loudness: 15,
  dynamics: 20,
  peak: 10,
  stereo: 10,
  tonal: 25,
  spectral: 10,
  technical: 10
};

function _computeMixScoreInternal(technicalData = {}, reference = null, force = { AUDIT_MODE:false, SCORING_V2:false, AUTO_V2:true }) {
  const __caiarLog = (typeof window !== 'undefined' && window.__caiarLog) ? window.__caiarLog : function(){};
  __caiarLog('SCORING_START','Iniciando cálculo de mix score', { metrics: Object.keys(technicalData||{}).length, ref: !!reference, modeFlags: force });
  const AUDIT_MODE = !!force.AUDIT_MODE;
  let SCORING_V2 = !!force.SCORING_V2 && (AUDIT_MODE || force.overrideAuditBypass);
  // Auto-upgrade: se não está em V2 mas métricas avançadas existem e auto habilitado
  if (!SCORING_V2 && force.AUTO_V2 !== false) {
    if (technicalData && (
      Number.isFinite(technicalData.dr_stat) ||
      Number.isFinite(technicalData.thdPercent) ||
      Number.isFinite(technicalData.spectralRolloff50) ||
      Number.isFinite(technicalData.dcOffsetLeft) ||
      Number.isFinite(technicalData.dcOffsetRight)
    )) {
      SCORING_V2 = true;
      force._autoPromoted = true;
    }
  }
  const ref = reference;
  const metrics = technicalData || {};
  const perMetric = [];
  const catAgg = {};
  function addMetric(category, key, value, target, tol, opts = {}) {
    if (!Number.isFinite(value) || value === -Infinity) return;
    if (!Number.isFinite(target)) return;
    if (!Number.isFinite(tol) || tol <= 0) tol = DEFAULT_TARGETS[key]?.tol || 1;
    // Suporte opcional a tolMin / tolMax em opts
    const tolMin = Number.isFinite(opts.tolMin) && opts.tolMin > 0 ? opts.tolMin : null;
    const tolMax = Number.isFinite(opts.tolMax) && opts.tolMax > 0 ? opts.tolMax : null;
    const s = scoreTolerance(value, target, tol, !!opts.invert, tolMin, tolMax);
    if (s == null) return;
    // Determinar status (OK / BAIXO / ALTO) e severidade
    let status = 'OK';
    let severity = null;
    const diff = value - target;
    const effTolMin = tolMin || tol; const effTolMax = tolMax || tol;
    if (!opts.invert) {
      if (diff < -effTolMin) status = 'BAIXO'; else if (diff > effTolMax) status = 'ALTO';
    } else {
      // invert: só faz sentido 'ALTO' se acima do target mais tolMax
      if (diff > effTolMax) status = 'ALTO';
    }
    if (status !== 'OK') {
      const sideTol = diff > 0 ? effTolMax : effTolMin;
      const n = Math.abs(diff) / sideTol;
      severity = n <= 1 ? 'leve' : (n <= 2 ? 'media' : 'alta');
    }
    perMetric.push({ category, key, value, target, tol, tol_min: effTolMin, tol_max: effTolMax, score: clamp01(s), status, severity, diff: parseFloat((value-target).toFixed(3)) });
    try { __caiarLog && __caiarLog('SCORING_METRIC', 'Metric avaliada', { key, value, target, tolMin: effTolMin, tolMax: effTolMax, status, severity }); } catch {}
  }
  const lufsTarget = ref?.lufs_target ?? DEFAULT_TARGETS.lufsIntegrated.target;
  const lufsTol = ref?.tol_lufs ?? DEFAULT_TARGETS.lufsIntegrated.tol;
  // Loudness com suporte a tol_lufs_min / tol_lufs_max
  const lufsTolMin = Number.isFinite(ref?.tol_lufs_min) ? ref.tol_lufs_min : lufsTol;
  const lufsTolMax = Number.isFinite(ref?.tol_lufs_max) ? ref.tol_lufs_max : lufsTol;
  addMetric('loudness', 'lufsIntegrated', metrics.lufsIntegrated, lufsTarget, (lufsTolMin + lufsTolMax)/2, { tolMin: lufsTolMin, tolMax: lufsTolMax });
  // DR (legacy crest) vs dr_stat (percentil). Em modo V2 usamos dr_stat se existir, caso contrário fallback.
  if (SCORING_V2 && Number.isFinite(metrics.dr_stat)) {
    addMetric('dynamics', 'dr_stat', metrics.dr_stat, ref?.dr_stat_target ?? (ref?.dr_target ?? DEFAULT_TARGETS.dr.target), ref?.tol_dr_stat ?? (ref?.tol_dr ?? DEFAULT_TARGETS.dr.tol));
  } else {
    addMetric('dynamics', 'dr', metrics.dynamicRange ?? metrics.dr, ref?.dr_target ?? DEFAULT_TARGETS.dr.target, ref?.tol_dr ?? DEFAULT_TARGETS.dr.tol);
  }
  addMetric('dynamics', 'lra', metrics.lra, ref?.lra_target ?? DEFAULT_TARGETS.lra.target, ref?.tol_lra ?? DEFAULT_TARGETS.lra.tol);
  addMetric('dynamics', 'crestFactor', metrics.crestFactor, DEFAULT_TARGETS.crestFactor.target, DEFAULT_TARGETS.crestFactor.tol);
  addMetric('peak', 'truePeakDbtp', metrics.truePeakDbtp, ref?.true_peak_target ?? DEFAULT_TARGETS.truePeakDbtp.target, ref?.tol_true_peak ?? DEFAULT_TARGETS.truePeakDbtp.tol, { invert: true });
  addMetric('stereo', 'stereoCorrelation', metrics.stereoCorrelation, ref?.stereo_target ?? DEFAULT_TARGETS.stereoCorrelation.target, ref?.tol_stereo ?? DEFAULT_TARGETS.stereoCorrelation.tol);
  addMetric('stereo', 'stereoWidth', metrics.stereoWidth, DEFAULT_TARGETS.stereoWidth.target, DEFAULT_TARGETS.stereoWidth.tol);
  addMetric('stereo', 'balanceLR', metrics.balanceLR, DEFAULT_TARGETS.balanceLR.target, DEFAULT_TARGETS.balanceLR.tol);
  if (ref?.bands && metrics.bandEnergies) {
    for (const [band, refBand] of Object.entries(ref.bands)) {
      const mBand = metrics.bandEnergies[band];
      if (!mBand) continue;
      const val = Number.isFinite(mBand.rms_db) ? mBand.rms_db : null;
      if (val == null) continue;
      if (Number.isFinite(refBand?.target_db) && (Number.isFinite(refBand?.tol_db) || (Number.isFinite(refBand?.tol_min) && Number.isFinite(refBand?.tol_max))) && refBand.target_db != null) {
        const tolMin = Number.isFinite(refBand.tol_min) ? refBand.tol_min : (Number.isFinite(refBand.tol_db) ? refBand.tol_db : null);
        const tolMax = Number.isFinite(refBand.tol_max) ? refBand.tol_max : (Number.isFinite(refBand.tol_db) ? refBand.tol_db : null);
        const tolAvg = ((tolMin||0)+(tolMax||0))/2 || refBand.tol_db || 1;
        addMetric('tonal', `band_${band}`, val, refBand.target_db, tolAvg, { tolMin, tolMax });
      }
    }
  } else if (metrics.tonalBalance) {
    ['sub','low','mid','high'].forEach(b => {
      const v = metrics.tonalBalance?.[b]?.rms_db;
      if (Number.isFinite(v)) addMetric('tonal', `band_${b}`, v, v, 6);
    });
  }
  addMetric('spectral', 'centroid', metrics.spectralCentroid, DEFAULT_TARGETS.centroid.target, DEFAULT_TARGETS.centroid.tol);
  addMetric('spectral', 'spectralFlatness', metrics.spectralFlatness, DEFAULT_TARGETS.spectralFlatness.target, DEFAULT_TARGETS.spectralFlatness.tol);
  if (SCORING_V2) {
    addMetric('spectral', 'rolloff50', metrics.spectralRolloff50, DEFAULT_TARGETS.rolloff50.target, DEFAULT_TARGETS.rolloff50.tol);
  }
  addMetric('spectral', 'rolloff85', metrics.spectralRolloff85, DEFAULT_TARGETS.rolloff85.target, DEFAULT_TARGETS.rolloff85.tol);
  if (SCORING_V2 && Number.isFinite(metrics.thdPercent)) {
    addMetric('technical', 'thdPercent', metrics.thdPercent, DEFAULT_TARGETS.thdPercent.target, DEFAULT_TARGETS.thdPercent.tol, { invert: true });
  }
  addMetric('technical', 'dcOffset', Math.abs(metrics.dcOffset), DEFAULT_TARGETS.dcOffset.target, DEFAULT_TARGETS.dcOffset.tol, { invert: true });
  if (SCORING_V2) {
    if (Number.isFinite(metrics.dcOffsetLeft)) addMetric('technical','dcOffsetLeft', Math.abs(metrics.dcOffsetLeft), DEFAULT_TARGETS.dcOffset.target, DEFAULT_TARGETS.dcOffset.tol, { invert:true });
    if (Number.isFinite(metrics.dcOffsetRight)) addMetric('technical','dcOffsetRight', Math.abs(metrics.dcOffsetRight), DEFAULT_TARGETS.dcOffset.target, DEFAULT_TARGETS.dcOffset.tol, { invert:true });
  }
  if (Number.isFinite(metrics.clippingPct)) {
    const cTol = 0.5;
    const cVal = metrics.clippingPct;
    const s = cVal <= cTol ? 1 : (cVal >= 5 ? 0 : 1 - (cVal - cTol) / (5 - cTol));
    perMetric.push({ category: 'technical', key: 'clippingPct', value: cVal, target: 0, tol: cTol, score: clamp01(s) });
  } else if (Number.isFinite(metrics.clippingSamples)) {
    const samples = metrics.clippingSamples;
    const s = samples === 0 ? 1 : (samples < 10 ? 0.7 : 0);
    perMetric.push({ category: 'technical', key: 'clippingSamples', value: samples, target: 0, tol: 0, score: clamp01(s) });
  }
  for (const cat of Object.keys(CATEGORY_WEIGHTS)) {
    catAgg[cat] = { weight: CATEGORY_WEIGHTS[cat], metrics: [], score: null };
  }
  for (const m of perMetric) { if (catAgg[m.category]) catAgg[m.category].metrics.push(m); }
  let totalWeight = 0;
  for (const cat of Object.values(catAgg)) { if (cat.metrics.length === 0) cat.weight = 0; else totalWeight += cat.weight; }
  if (totalWeight === 0) return { scorePct: 0, classification: 'Básico', details: { perMetric: [], categories: {} } };
  let weightedSum = 0;
  for (const [name, cat] of Object.entries(catAgg)) {
    if (cat.weight === 0 || cat.metrics.length === 0) continue;
    const mean = cat.metrics.reduce((a,b)=>a + b.score, 0) / cat.metrics.length;
    cat.score = mean;
    weightedSum += mean * cat.weight;
  }
  let scorePct = (weightedSum / totalWeight) * 100;
  // Penalização de invariants (SCORING_V2): reduz até 5 pontos conforme flags críticos
  if (SCORING_V2 && metrics.auditInvariants && metrics.auditInvariants.flags) {
    const f = metrics.auditInvariants.flags;
    let penalty = 0;
    if (f.truePeakOverZero) penalty += 2;
    if (f.dcOffsetHigh) penalty += 1;
    if (f.tooManyBandsOut) penalty += 2;
    if (f.nonFinite) penalty += 5;
    if (f.lufsOutOfRange) penalty += 2;
    scorePct = Math.max(0, scorePct - penalty);
  }
  // (legacy intermediate classification calculado antes da nova fórmula é ignorado)
  // ================= NOVO ALGORITMO DE PENALIDADES (score reformulado) =================
  // Requisitos chave:
  // - Penalização bidirecional (abaixo/acima) usando tol_min/tol_max assimétricos
  // - Fórmula score = round(100 * (1 - P_final)) onde P_final = max(P_sum, P_crit)
  // - Curva de severidade com joelhos em 1x e 2x tolerância
  // - Caps para desvios críticos >=3x
  // - Redistribuição de pesos quando faltam métricas

  const logMetricPenalty = (m) => { try { __caiarLog('SCORING_PENALTY_METRIC','Penalty calc', m); } catch {} };

  // Função util clamp
  const clamp01f = (x)=> x<0?0:(x>1?1:x);
  function unitPenaltyFromN(n){
    if (n <= 0) return 0;
    if (n <= 1) return 0.15 * n; // até 0.15
    if (n <= 2) return 0.15 + 0.25 * (n - 1); // 0.15 -> 0.40
    // n > 2: 0.40 + 0.60 * ((n-2)/1) saturando em 1 em 3x
    return 0.40 + 0.60 * clamp01f(n - 2);
  }

  // Mapear pesos base (somam 0.95 + 0.05 contextual = 1.0)
  const baseWeights = {
    lufsIntegrated: 0.18,
    truePeakDbtp: 0.14, // headroom substituído por truePeak
    band_high_mid: 0.14,
    band_brilho: 0.12,
    band_presenca: 0.12,
    band_low_bass: 0.08,
    band_upper_bass: 0.07,
    band_low_mid: 0.05,
    band_mid: 0.05,
    // Contextuais (espalhar 0.05): lra, dr|dr_stat, stereoCorrelation, stereoWidth
    lra: 0, // atribuído depois
    dr: 0,
    dr_stat: 0,
    stereoCorrelation: 0,
    stereoWidth: 0
  };
  const contextualKeys = ['lra','dr_stat','dr','stereoCorrelation','stereoWidth'];
  const contextualBudget = 0.05;
  // Coletar quais contextuais estão presentes
  const presentContextual = contextualKeys.filter(k => perMetric.some(m => m.key === k));
  const ctxUnit = presentContextual.length ? contextualBudget / presentContextual.length : 0;
  presentContextual.forEach(k => { baseWeights[k] = ctxUnit; });

  // Filtrar métricas realmente presentes com target válido
  const presentMetrics = perMetric.filter(m => Number.isFinite(m.value) && Number.isFinite(m.target));
  // Coletar soma de pesos presentes (usando fallback de 0 se não existir definido)
  const sumBasePresent = presentMetrics.reduce((acc,m)=> acc + (baseWeights[m.key] || 0), 0) || 1;
  // Redistribuição proporcional para somar 1.0
  const weightScale = 1 / sumBasePresent;

  // Conjunto críticos (chaves alinhadas com perMetric.key)
  const criticalKeys = ['lufsIntegrated','truePeakDbtp','band_high_mid','band_brilho','band_presenca'];

  const penalties = []; // {key, n, u, w, p, status, severity}
  let allNZero = true;
  const critUnits = [];
  const critNArr = [];
  for (const m of presentMetrics) {
    const tolMin = Number.isFinite(m.tol_min) ? m.tol_min : (Number.isFinite(m.tol) ? m.tol : 1);
    const tolMax = Number.isFinite(m.tol_max) ? m.tol_max : (Number.isFinite(m.tol) ? m.tol : 1);
    const lower = m.target - tolMin;
    const upper = m.target + tolMax;
    let n = 0;
    if (m.value < lower) n = (lower - m.value) / (tolMin || 1);
    else if (m.value > upper) n = (m.value - upper) / (tolMax || 1);
    if (n < 1e-9) n = 0;
    if (n > 0) allNZero = false;
    const u = unitPenaltyFromN(n);
    const wRaw = (baseWeights[m.key] || 0) * weightScale;
    const p = wRaw * u;
    let severity = null;
    if (n > 0) severity = n <= 1 ? 'leve' : (n <= 2 ? 'media' : 'alta');
    penalties.push({ key: m.key, n: parseFloat(n.toFixed(4)), u: parseFloat(u.toFixed(4)), w: parseFloat(wRaw.toFixed(5)), p: parseFloat(p.toFixed(5)), status: m.status, severity, value: m.value, target: m.target, tol_min: tolMin, tol_max: tolMax });
    if (criticalKeys.includes(m.key)) {
      critUnits.push(u);
      critNArr.push(n);
    }
    logMetricPenalty({ key: m.key, value: m.value, target: m.target, tol_min: tolMin, tol_max: tolMax, n, u, w: wRaw, p });
  }
  const P_sum = clamp01f(penalties.reduce((a,b)=> a + b.p, 0));
  critUnits.sort((a,b)=> b - a);
  const Ucrit_max = critUnits[0] || 0;
  const Ucrit_2nd = critUnits[1] || 0;
  const P_crit = critUnits.length ? clamp01f(0.6 * Ucrit_max + 0.4 * (critUnits.length>1 ? Ucrit_2nd : 0)) : 0;
  let P_final = Math.max(P_sum, P_crit);
  let scoreNew = Math.round(100 * (1 - P_final));
  // Floor perfeito
  if (allNZero) scoreNew = 100;
  // Caps críticos (n>=3)
  const critSevereCount = critNArr.filter(n => n >= 3).length;
  if (critSevereCount >= 2) scoreNew = Math.min(scoreNew, 10);
  else if (critSevereCount === 1) scoreNew = Math.min(scoreNew, 20);
  // Cap clipping
  try {
    const clippingFlag = (Number.isFinite(metrics.clippingPct) && metrics.clippingPct > 0) || (metrics.auditInvariants?.flags?.truePeakOverZero);
    if (clippingFlag) scoreNew = Math.min(scoreNew, 60);
  } catch {}
  // Garantir limites
  scoreNew = Math.max(0, Math.min(100, scoreNew));

  // Reavaliar classificação baseada no novo score
  const classification = classify(scoreNew);
  const sorted = perMetric.slice().sort((a,b)=>b.score - a.score);
  const best = sorted.filter(m=>m.score>=0.95).slice(0,5).map(m=>m.key);
  const worst = sorted.filter(m=>m.score<=0.6).sort((a,b)=>a.score-b.score).slice(0,5).map(m=>m.key);

  const result = {
    scorePct: parseFloat(scoreNew.toFixed(2)),
    classification,
    scoreMode: SCORING_V2 ? 'v2' : 'legacy',
    invariantsPenaltyApplied: (SCORING_V2 && metrics.auditInvariants && metrics.auditInvariants.flags) ? true : false,
    totalWeight: parseFloat(totalWeight.toFixed(2)),
    categories: Object.fromEntries(Object.entries(catAgg).map(([k,v])=>[k, { weight: v.weight, score: v.score != null ? parseFloat((v.score*100).toFixed(1)) : null }])),
    perMetric: perMetric.map(m=>({ key: m.key, category: m.category, value: m.value, target: m.target, tol: m.tol, tol_min: m.tol_min, tol_max: m.tol_max, diff: m.diff, status: m.status, severity: m.severity, scorePct: parseFloat((m.score*100).toFixed(1)) })),
    highlights: { excellent: best, needsAttention: worst },
    penalties: penalties, // detalhamento novo
    penaltiesSummary: { P_sum: parseFloat(P_sum.toFixed(4)), P_crit: parseFloat(P_crit.toFixed(4)), P_final: parseFloat(P_final.toFixed(4)), Ucrit_max: parseFloat(Ucrit_max.toFixed(4)), Ucrit_2nd: parseFloat(Ucrit_2nd.toFixed(4)) },
    formulaNote: 'Score = 100 * (1 - max(P_sum, P_crit)); penalidades ponderadas com ênfase em métricas críticas; desvios >2x aceleram.'
  };
  try { __caiarLog('SCORING_PENALTY_AGG','Aggregated penalties', { P_sum: result.penaltiesSummary.P_sum, P_crit: result.penaltiesSummary.P_crit, P_final: result.penaltiesSummary.P_final, score: result.scorePct }); } catch {}
  __caiarLog('SCORING_DONE','Mix score calculado', { scorePct: result.scorePct, class: result.classification, mode: result.scoreMode, metrics: result.perMetric.length });
  if (!AUDIT_MODE && !force._autoPromoted) {
    result._note = 'Modo legado: AUDIT_MODE desativado e nenhuma métrica avançada para promover.';
  } else if (!AUDIT_MODE && force._autoPromoted) {
    result._note = 'Auto-promovido para V2 (AUTO_SCORING_V2) por métricas avançadas presentes.';
  } else if (AUDIT_MODE && result.scoreMode==='legacy') {
    result._note = 'AUDIT_MODE ativo mas SCORING_V2 desativado explicitamente.';
  }
  // Expor para inspeção externa sem depender de logs prévios
  try {
    if (typeof window !== 'undefined') {
      window.__LAST_MIX_SCORE = result;
      if (window.DEBUG_SCORE === true) {
        // Log compacto + detalhado em grupo
        console.log('[MIX_SCORE]', result.scorePct + '%', 'mode=' + result.scoreMode, 'class=' + result.classification);
        if (window.DEBUG_SCORE_VERBOSE) console.log('[MIX_SCORE_FULL]', result);
      }
    }
  } catch {}
  return result;
}

export function computeMixScore(technicalData = {}, reference = null) {
  const AUDIT_MODE = (typeof process !== 'undefined' && process.env.AUDIT_MODE === '1') || (typeof window !== 'undefined' && window.AUDIT_MODE === true);
  const win = (typeof window !== 'undefined') ? window : {};
  const explicitV2 = ((typeof process !== 'undefined' && process.env.SCORING_V2 === '1') || win.SCORING_V2 === true);
  const explicitLegacy = ((typeof process !== 'undefined' && process.env.SCORING_V2 === '0') || win.SCORING_V2 === false);
  const AUTO_V2 = win.AUTO_SCORING_V2 !== false; // default true
  const overrideAuditBypass = win.FORCE_SCORING_V2 === true; // permite V2 mesmo sem AUDIT_MODE
  const SCORING_V2 = (!explicitLegacy) && (explicitV2 || (AUDIT_MODE && win.SCORING_V2 !== false) || overrideAuditBypass);
  return _computeMixScoreInternal(technicalData, reference, { AUDIT_MODE, SCORING_V2, AUTO_V2, overrideAuditBypass });
}

// Diagnóstico: compara resultado legacy vs v2 independente das flags atuais
export function computeMixScoreBoth(technicalData = {}, reference = null) {
  const legacy = _computeMixScoreInternal(technicalData, reference, { AUDIT_MODE:true, SCORING_V2:false, AUTO_V2:false });
  const v2 = _computeMixScoreInternal(technicalData, reference, { AUDIT_MODE:true, SCORING_V2:true, AUTO_V2:false });
  return {
    legacy,
    v2,
    deltaPct: parseFloat((v2.scorePct - legacy.scorePct).toFixed(2)),
    changedMetricsCount: (v2.perMetric||[]).length - (legacy.perMetric||[]).length
  };
}

try {
  if (typeof window !== 'undefined') {
    window.__compareMixScore = (td, ref) => computeMixScoreBoth(td || (window.__LAST_FULL_ANALYSIS?.technicalData)||{}, ref || (typeof window !== 'undefined'? window.PROD_AI_REF_DATA : null));
    // Helper rápido de debug
    if (typeof window.debugMix !== 'function') {
      window.debugMix = () => ({ lastScore: window.__LAST_MIX_SCORE, lastAnalysis: window.__LAST_FULL_ANALYSIS });
    }
  }
} catch {}

if (typeof window !== 'undefined') { window.__MIX_SCORING_VERSION__ = '1.0.0'; }
export default computeMixScore;
