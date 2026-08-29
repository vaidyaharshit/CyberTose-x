// Predictive cash-out engine. Deterministic function of (case, nowMs).
// Weights are heuristic and clearly labelled — never claims certainty.

import { ZONES, zoneById, zoneDistance } from './dataset.js';

// time-of-day propensity: cash-out peaks around market hours (10-13, 16-20)
function todFactor(ts) {
  const h = new Date(ts).getHours();
  const bell = (lo, hi) => {
    const d = h - lo;
    return Math.max(0, 1 - Math.abs(d) / (hi - lo));
  };
  const morning = bell(10, 13);
  const evening = bell(16, 20);
  return Math.min(1, Math.max(0, morning * 0.9 + evening * 0.85));
}

function peakness(probs) {
  const n = probs.length;
  if (n <= 1) return 1;
  let sum = 0;
  for (const p of probs) if (p > 0) sum += -p * Math.log(p);
  const norm = sum / Math.log(n);
  return Math.max(0, 1 - norm);
}

const clamp01 = (x) => Math.max(0, Math.min(1, x));

export function predictCashOut(c, now) {
  if (!c || !c.transactions || !c.mules || c.mules.length === 0) {
    return emptyPrediction();
  }

  const txs = c.transactions;
  const confirmed = txs.filter((t) => t.status === 'confirmed').length;
  const inflow = txs.find((t) => t.kind === 'inflow');
  const atRisk = c.atRisk || c.mules.reduce((a, m) => a + (m.balance || 0), 0);

  const allAt = txs.map((t) => t.at).filter(Boolean);
  const latest = Math.max(...allAt, now);
  const firstIn = inflow ? inflow.at : latest;
  const spanH = Math.max(0.05, (latest - firstIn) / 3600000);
  const velocityPerHr = atRisk / (spanH === 0 ? 1 : spanH);

  const lastZone = c.lastKnownPoint ? c.lastKnownPoint.zoneCode : (c.mules[0] && c.mules[0].knownArea) || 'Z01';
  const tod = todFactor(latest);
  const minsSinceLast = Math.max(0, (now - latest) / 60000);

  // per-zone raw score (0..1) = history + time-of-day + proximity
  const raws = ZONES.map((z) => {
    const hist = z.heatBase / 100;
    const retail = z.retail * tod;
    const dist = zoneDistance(z.id, lastZone);
    const prox = Math.exp(-((dist * dist) / (2 * 1.15 * 1.15)));
    return { zone: z, hist, retail, prox, raw: hist * 0.4 + retail * 0.25 + prox * 0.35 };
  });

  const maxRaw = Math.max(...raws.map((r) => r.raw), 1e-9);
  const velBoost = clamp01(velocityPerHr / 300000) * 0.6; // high flow intensity -> imminent

  const weighted = raws.map((r) => ({ ...r, w: r.raw * (1 + velBoost) }));
  const sumW = weighted.reduce((a, r) => a + r.w, 0);
  const ranked = weighted
    .map((r) => ({
      zone: r.zone,
      prob: sumW > 0 ? r.w / sumW : 0,
      shares: {
        history: Math.round((r.hist / maxRaw) * 100),
        timeshift: Math.round((r.retail / maxRaw) * 100),
        proximity: Math.round((r.prox / maxRaw) * 100),
        velocity: Math.round(velBoost * 100),
      },
    }))
    .sort((a, b) => b.prob - a.prob);

  const geoAvg = c.mules.reduce((a, m) => a + (m.geoConfidence || 0), 0) / c.mules.length;
  const completeness = txs.length ? confirmed / txs.length : 0;
  const probs = ranked.map((r) => r.prob);
  const conf = clamp01(geoAvg * 0.3 + completeness * 0.25 + clamp01(velocityPerHr / 400000) * 0.2 + peakness(probs) * 0.25);

  const imminent = atRisk > 0 && minsSinceLast < 150 && (velocityPerHr > 60000 || conf > 0.55);
  const windowMinutes = Math.max(18, Math.round(95 - conf * 55));

  const top = ranked[0];
  const exposure = Math.round(atRisk * (0.45 + conf * 0.35));

  const topNot = top
    ? {
        zone: top.zone,
        prob: top.prob,
        shares: top.shares,
        aatm: top.zone.atms[0],
        station: top.zone.station,
        responseMin: top.zone.respMin,
        travelFromLast: Math.round(zoneDistance(top.zone.id, lastZone) * 9),
      }
    : null;

  const contributions = [
    { key: 'history', label: 'Historical mule hotspots', share: top ? top.shares.history : 0, note: 'Zone-level incidence in past sample complaints (synthetic statistics).' },
    { key: 'timeshift', label: 'Time-of-day propensity', share: top ? top.shares.timeshift : 0, note: `Peak cash-out hours around market times; local time ${new Date(latest).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}.` },
    { key: 'proximity', label: 'Distance from last activity', share: top ? top.shares.proximity : 0, note: `Travel distance from ${lastZone} to ${top ? top.zone.id : ''} (${top ? topNot.travelFromLast : 0} min approx).` },
    { key: 'velocity', label: 'Transaction velocity', share: top ? top.shares.velocity : 0, note: `Flow intensity \u2248 ${Math.round(velocityPerHr / 1000)}K/hr across a ${spanH.toFixed(1)}h chain.` },
  ];

  const reasons = [
    `Last confirmed activity ${Math.round(minsSinceLast)}m ago in ${lastZone} — flow is still live.`,
    `${Math.round(geoAvg * 100)}% average geo-confidence across ${c.mules.length} suspect account(s); unverified legs widen uncertainty.`,
    `${(top ? top.prob * 100 : 0).toFixed(0)}% of predicted activity mass concentrates in ${top ? top.zone.name : '—'}.`,
    `Estimated exposure \u20B9${Math.round(exposure / 1000)}K within ~${windowMinutes} min — verification dispatched recommended.`,
  ];

  return {
    now,
    atRisk,
    imminent,
    confidence: conf,
    confidencePct: Math.round(conf * 100),
    windowMinutes,
    velocityPerHr,
    spanH,
    minsSinceLast,
    lastZone,
    exposure,
    ranked,
    top: topNot,
    contributions,
    reasons,
  };
}

function emptyPrediction() {
  return {
    now: Date.now(),
    atRisk: 0,
    imminent: false,
    confidence: 0,
    confidencePct: 0,
    windowMinutes: 0,
    velocityPerHr: 0,
    spanH: 0,
    minsSinceLast: 0,
    lastZone: '—',
    exposure: 0,
    ranked: [],
    top: null,
    contributions: [],
    reasons: [],
  };
}