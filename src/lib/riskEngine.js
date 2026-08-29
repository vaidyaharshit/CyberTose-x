// Risk scoring engine. Every score is a sum of weighted indicators with an
// explicit "why this score" breakdown. Inferences are always qualified with
// "requires verification" — we never claim certainty on unconfirmed data.

const withV = (note) => `${note} (requires verification)`;

export function scoreMule(m) {
  const factors = [];
  let score = 20; // base prior; not a verdict

  const openedDays = m.openedDaysAgo != null ? m.openedDaysAgo : 99;

  if (openedDays <= 15) {
    factors.push({ impact: 'raise', points: 25, label: 'Freshly opened account', note: withV(`Account opened only ${openedDays} days before the transfer pattern — a common funnel-account signature.`) });
    score += 25;
  }

  if (m.priorFlags && m.priorFlags > 0) {
    const pts = Math.min(3, m.priorFlags) * 10;
    factors.push({ impact: 'raise', points: pts, label: `Linked to ${m.priorFlags} earlier flagged chain(s)`, note: withV('Overlapping device/branch signals against sample history.') });
    score += pts;
  }

  const passThrough = m.balance != null && m.balance === 0 && m.role === 'entry mule';
  if (passThrough) {
    factors.push({ impact: 'raise', points: 20, label: 'Zero residual balance', note: 'Full principal was stripped out of this account within minutes — pass-through behaviour. (confirmed by ledger)'.replace('(confirmed by ledger)', '(ledger confirmed)') });
    score += 20;
  }

  if (m.geoConfidence != null && m.geoConfidence < 0.6) {
    factors.push({ impact: 'raise', points: 8, label: 'Weak geo-location data', note: withV('Suspected area of operation is only loosely corroborated.') });
    score += 8;
  }

  if (m.role === 'casher') {
    factors.push({ impact: 'raise', points: 10, label: 'Cash-out role', note: withV('Pattern of rapid ATM withdrawals consistent with a cash-out leg.') });
    score += 10;
  }

  if (m.balance && m.balance > 0) {
    factors.push({ impact: 'raise', points: 12, label: 'Holding live float', note: `\u20B9${(m.balance / 1000).toFixed(0)}K still held — actionable exposure window open.` });
    score += 12;
  } else if (m.balance != null && m.balance === 0 && !passThrough) {
    factors.push({ impact: 'lower', points: -8, label: 'Balance drained', note: 'Little float remains to intercept.' });
    score += -8;
  }

  if (m.role !== 'casher' && !passThrough) {
    factors.push({ impact: 'lower', points: -6, label: 'No confirmed withdrawal yet', note: 'Cash-out leg not observed on this account.' });
    score += -6;
  }

  score = Math.max(5, Math.min(98, score));
  const tier = score >= 65 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW';

  return {
    id: m.id,
    holder: m.holder,
    role: m.role,
    score,
    tier,
    tierLabel: tier === 'HIGH' ? 'High risk' : tier === 'MEDIUM' ? 'Medium risk' : 'Low risk',
    factors,
    balance: m.balance || 0,
    openedDaysAgo: m.openedDaysAgo,
  };
}

export function scoreZoneFromPrediction(pred, zone) {
  if (!pred || !pred.ranked || pred.ranked.length === 0) {
    return { zoneId: zone.id, score: 8, tier: 'LOW', tierLabel: 'Low risk', factors: [{ impact: 'lower', points: 0, label: 'No active prediction', note: 'Engine has no live float to score for this zone.' }] };
  }
  const ranked = pred.ranked;
  const maxP = ranked[0].prob;
  const idx = ranked.findIndex((r) => r.zone.id === zone.id);
  const prob = idx >= 0 ? ranked[idx].prob : 0;
  const rel = idx >= 0 ? prob / maxP : 0;

  const factors = [];
  let score = 12;

  if (prob > 0.18) {
    factors.push({ impact: 'raise', points: 24, label: 'Top concentration zone', note: `Captures ${(prob * 100).toFixed(0)}% of predicted activity mass.` });
    score += 24;
  } else if (prob > 0.05) {
    factors.push({ impact: 'raise', points: 10, label: 'Secondary corridor', note: `Captures ${(prob * 100).toFixed(0)}% of predicted activity mass.` });
    score += 10;
  }

  if (zone.heatBase >= 60) {
    factors.push({ impact: 'raise', points: 14, label: 'Historical hotspot', note: withV(`Synthetic history shows ${zone.heatBase}/100 mule-activity baseline.`) });
    score += 14;
  }

  if (rel >= 0.75 && prob > 0.05) {
    factors.push({ impact: 'raise', points: 16, label: 'Close to last activity', note: withV('Short travel time from last confirmed on-chain movement.') });
    score += 16;
  }

  if (zone.retail >= 0.8) {
    factors.push({ impact: 'raise', points: 8, label: 'High foot-traffic area', note: 'Crowded cash environments favour blending in.' });
    score += 8;
  }

  score = Math.max(6, Math.min(96, score));
  const tier = score >= 60 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW';
  return {
    zoneId: zone.id,
    score,
    tier,
    tierLabel: tier === 'HIGH' ? 'High risk' : tier === 'MEDIUM' ? 'Medium risk' : 'Low risk',
    factors,
    prob,
  };
}