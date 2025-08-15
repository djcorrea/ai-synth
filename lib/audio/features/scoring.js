// 🧮 MIX SCORING ENGINE
// Calcula porcentagem de conformidade e classificação qualitativa baseada nas métricas técnicas e referências por gênero
// Design principles:
// - Não falha se métricas ausentes; ignora e ajusta pesos dinamicamente
// - Usa tolerâncias da referência sempre que disponível; senão aplica faixas padrão
// - Transparente: retorna breakdown detalhado

function scoreTolerance(metricValue, target, tol, invert = false) {
  if (!Number.isFinite(metricValue) || !Number.isFinite(target)) return null;
  if (!Number.isFinite(tol) || tol <= 0) tol = 1;
  const diff = metricValue - target;
  const adiff = Math.abs(diff);
  if (invert) {
    if (diff <= 0) return 1; // abaixo ou igual target ótimo (ex: true peak, dc offset abs)
    if (diff >= 2 * tol) return 0;
    if (diff <= tol) return 1 - (diff / tol) * 0.5; // penalização suave dentro da 1ª tol
    return 1 - (0.5 + (diff - tol) / tol * 0.5);
  }
  if (adiff <= tol) return 1;
  if (adiff >= 2 * tol) return 0;
  return 1 - (adiff - tol) / tol;
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

const CATEGORY_WEIGHTS = {
  loudness: 15,
  dynamics: 20,
  peak: 10,
  stereo: 10,
  tonal: 25,
  spectral: 10,
  technical: 10
};

export function computeMixScore(technicalData = {}, reference = null) {
  const AUDIT_MODE = (typeof process !== 'undefined' && process.env.AUDIT_MODE === '1') || (typeof window !== 'undefined' && window.AUDIT_MODE === true);
  const SCORING_V2 = AUDIT_MODE && ((typeof process !== 'undefined' && process.env.SCORING_V2 !== '0') || (typeof window !== 'undefined' && window.SCORING_V2 !== false));
  const ref = reference;
  const metrics = technicalData || {};
  const perMetric = [];
  const catAgg = {};
  function addMetric(category, key, value, target, tol, opts = {}) {
    if (!Number.isFinite(value) || value === -Infinity) return;
    if (!Number.isFinite(target)) return;
    if (!Number.isFinite(tol) || tol <= 0) tol = DEFAULT_TARGETS[key]?.tol || 1;
    const s = scoreTolerance(value, target, tol, !!opts.invert);
    if (s == null) return;
    perMetric.push({ category, key, value, target, tol, score: clamp01(s) });
  }
  const lufsTarget = ref?.lufs_target ?? DEFAULT_TARGETS.lufsIntegrated.target;
  const lufsTol = ref?.tol_lufs ?? DEFAULT_TARGETS.lufsIntegrated.tol;
  addMetric('loudness', 'lufsIntegrated', metrics.lufsIntegrated, lufsTarget, lufsTol);
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
      if (Number.isFinite(refBand?.target_db) && Number.isFinite(refBand?.tol_db) && refBand.target_db != null) {
        addMetric('tonal', `band_${band}`, val, refBand.target_db, refBand.tol_db);
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
  const classification = classify(scorePct);
  const sorted = perMetric.slice().sort((a,b)=>b.score - a.score);
  const best = sorted.filter(m=>m.score>=0.95).slice(0,5).map(m=>m.key);
  const worst = sorted.filter(m=>m.score<=0.6).sort((a,b)=>a.score-b.score).slice(0,5).map(m=>m.key);
  const result = {
    scorePct: parseFloat(scorePct.toFixed(2)),
    classification,
    scoreMode: SCORING_V2 ? 'v2' : 'legacy',
    invariantsPenaltyApplied: (SCORING_V2 && metrics.auditInvariants && metrics.auditInvariants.flags) ? true : false,
    totalWeight: parseFloat(totalWeight.toFixed(2)),
    categories: Object.fromEntries(Object.entries(catAgg).map(([k,v])=>[k, { weight: v.weight, score: v.score != null ? parseFloat((v.score*100).toFixed(1)) : null }])),
    perMetric: perMetric.map(m=>({ key: m.key, category: m.category, value: m.value, target: m.target, tol: m.tol, scorePct: parseFloat((m.score*100).toFixed(1)) })),
    highlights: { excellent: best, needsAttention: worst }
  };
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

if (typeof window !== 'undefined') { window.__MIX_SCORING_VERSION__ = '1.0.0'; }
export default computeMixScore;
