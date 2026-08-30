// Prediction feedback loop (synthetic). Officers mark resolved/reviewed
// predictions as accurate or false-alarm. Accuracy is a simple running ratio
// over the most recent 30 reviews, with an up/down trend vs the prior half.

import { mulberry32 } from './sha256.js';

// Deterministic seeded set of prior officer reviews so the dashboard metric
// has honest history on first load (sample data, clearly synthetic).
export function buildSeedReviews(now = Date.now(), n = 26) {
  const rnd = mulberry32(0xfeed1234);
  const reviews = [];
  for (let i = 0; i < n; i++) {
    // ~78% of the seed reviews were accurate — trend drifts slightly upward
    const p = 0.72 + i * 0.004;
    reviews.push({
      caseId: `TG-26184-19${String(20 + i).padStart(2, '0')}`,
      accurate: rnd() < p,
      at: now - (n - i) * 86400000,
      source: 'seed',
    });
  }
  return reviews;
}

// Accuracy of the most recent `window` reviews + trend vs the earlier half.
export function computeAccuracy(reviews, window = 30) {
  const recent = (reviews || []).slice(-window);
  const accurate = recent.filter((r) => r.accurate).length;
  const pct = recent.length ? Math.round((accurate / recent.length) * 100) : 0;

  const half = Math.floor(recent.length / 2);
  const first = recent.slice(0, half);
  const second = recent.slice(half);
  const rate = (arr) => (arr.length ? arr.filter((r) => r.accurate).length / arr.length : 0);
  const firstRate = rate(first);
  const secondRate = rate(second);
  const delta = secondRate - firstRate;

  const trend = delta > 0.04 ? 'up' : delta < -0.04 ? 'down' : 'flat';

  return {
    recent,
    reviewed: recent.length,
    all: (reviews || []).length,
    accurate,
    pct,
    trend,
    trendPct: Math.round(Math.abs(delta) * 100),
    spark: recent.map((r) => (r.accurate ? 1 : 0)),
    firstRate,
    secondRate,
  };
}