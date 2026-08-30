// Mule account reputation network (SYNTHETIC).
// Account-IFSC combos can surface across multiple sample complaints. This
// module derives a "pattern-based" reputation score from that overlap.
// Everything here is fictional sample data — reputation flags are hypotheses
// that require investigative verification, never verified law-enforcement data.

const DAY = 86400000;
const ago = (now, days) => now - Math.round(days * DAY);

export const REP_TIERS = ['CLEAN', 'WATCH', 'FLAGGED', 'CONFIRMED'];

export function tierLabel(key) {
  return (
    {
      CLEAN: 'Clean',
      WATCH: 'Watch',
      FLAGGED: 'Flagged',
      CONFIRMED: 'Confirmed Mule',
    }[key] || 'Clean'
  );
}

// Known accounts: the demo-case mules (VNB0000211, MCB0002840, NPB0002501)
// deliberately re-appear across multiple earlier sample complaints so the
// overlapping-account concept is visible in the judge demo.
export function buildCorpus(now = Date.now()) {
  return [
    {
      ifsc: 'VNB0000211',
      holder: 'R. Khanna',
      bankCode: 'VNB',
      accountMask: '\u2022\u2022\u2022\u2022\u2022211',
      appearances: [
        { caseId: 'TG-26184-0411', victim: 'M. Pillai', at: ago(now, 38), amount: 76000, speedMin: 14, outcome: 'intercepted — no loss' },
        { caseId: 'TG-26184-0407', victim: 'K. Sethi', at: ago(now, 25), amount: 52000, speedMin: 22, outcome: 'partial cash-out' },
        { caseId: 'TG-26184-0401', victim: 'A. Bedi', at: ago(now, 12), amount: 115000, speedMin: 9, outcome: 'cash-out completed' },
      ],
    },
    {
      ifsc: 'MCB0002840',
      holder: 'S. Deokar',
      bankCode: 'MCB',
      accountMask: '\u2022\u2022\u2022\u2022\u2022840',
      appearances: [
        { caseId: 'TG-26184-0406', victim: 'R. Joshi', at: ago(now, 33), amount: 96000, speedMin: 17, outcome: 'intercepted — no loss' },
        { caseId: 'TG-26184-0403', victim: 'T. Nair', at: ago(now, 19), amount: 148000, speedMin: 26, outcome: 'partial cash-out' },
      ],
    },
    {
      ifsc: 'NPB0002501',
      holder: 'P. Nadar',
      bankCode: 'NPB',
      accountMask: '\u2022\u2022\u2022\u2022\u2022501',
      appearances: [
        { caseId: 'TG-26184-0404', victim: 'J. Rodrigues', at: ago(now, 41), amount: 61000, speedMin: 12, outcome: 'intercepted — no loss' },
        { caseId: 'TG-26184-0402', victim: 'S. Iyer', at: ago(now, 8), amount: 190000, speedMin: 31, outcome: 'cash-out completed' },
      ],
    },
    {
      ifsc: 'SCB0004433',
      holder: 'D. Fernandes',
      bankCode: 'SCB',
      accountMask: '\u2022\u2022\u2022\u2022\u2022433',
      appearances: [
        { caseId: 'TG-26184-0408', victim: 'L. Gupta', at: ago(now, 28), amount: 88000, speedMin: 19, outcome: 'partial cash-out' },
        { caseId: 'TG-26184-0405', victim: 'N. Verma', at: ago(now, 16), amount: 44000, speedMin: 24, outcome: 'intercepted — no loss' },
        { caseId: 'TG-26184-0400', victim: 'P. Kulkarni', at: ago(now, 4), amount: 132000, speedMin: 11, outcome: 'cash-out completed' },
      ],
    },
    {
      ifsc: 'IRB0007684',
      holder: 'V. Tiwari',
      bankCode: 'IRB',
      accountMask: '\u2022\u2022\u2022\u2022\u2022684',
      appearances: [
        { caseId: 'TG-26184-0409', victim: 'V. Iyer', at: ago(now, 30), amount: 230000, speedMin: 42, outcome: 'intercepted — no loss (sample)' },
      ],
    },
    {
      ifsc: 'BGC0005510',
      holder: 'H. Shaikh',
      bankCode: 'BGC',
      accountMask: '\u2022\u2022\u2022\u2022\u2022510',
      appearances: [
        { caseId: 'TG-26184-0398', victim: 'F. Dsouza', at: ago(now, 20), amount: 54000, speedMin: 38, outcome: 'intercepted — no loss' },
      ],
    },
    {
      ifsc: 'VNB0008122',
      holder: 'A. Mehra',
      bankCode: 'VNB',
      accountMask: '\u2022\u2022\u2022\u2022\u2022122',
      appearances: [],
    },
    {
      ifsc: 'MCB0006607',
      holder: 'G. Kaur',
      bankCode: 'MCB',
      accountMask: '\u2022\u2022\u2022\u2022\u2022607',
      appearances: [],
    },
  ];
}

// Pattern-based score, 0..100. Fed by (a) prior-case overlap, (b) total
// flow through the account, (c) how fast cash was withdrawn after receipt.
export function computeReputation(entry) {
  const n = (entry.appearances || []).length;
  const totalFlow = (entry.appearances || []).reduce((a, x) => a + x.amount, 0);
  const speeds = (entry.appearances || []).map((x) => x.speedMin).filter(Number.isFinite);
  const avgSpeed = speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : null;

  const factors = [];
  let score = 0;

  if (n >= 3) {
    factors.push({ impact: 'raise', points: 30, label: `Appeared in ${n} prior complaints`, note: `Same account/IFSC combination recurs across ${n} sample cases — a repeating-relay signature.` });
    score += 30;
  } else if (n === 2) {
    factors.push({ impact: 'raise', points: 20, label: 'Appeared in 2 prior complaints', note: 'Account recurs across two sample cases — warrants a closer look.' });
    score += 20;
  } else if (n === 1) {
    factors.push({ impact: 'raise', points: 6, label: 'Single prior appearance', note: 'Account linked to one earlier sample complaint.' });
    score += 6;
  } else {
    factors.push({ impact: 'lower', points: 0, label: 'No prior appearances', note: 'No overlap with the sample complaint corpus yet.' });
  }

  if (totalFlow >= 300000) {
    factors.push({ impact: 'raise', points: 22, label: `₹${(totalFlow / 100000).toFixed(1)}L lifetime flow`, note: 'High cumulative value has passed through this account in sample records.' });
    score += 22;
  } else if (totalFlow >= 150000) {
    factors.push({ impact: 'raise', points: 14, label: `₹${(totalFlow / 1000).toFixed(0)}K lifetime flow`, note: 'Meaningful cumulative flow across linked complaints.' });
    score += 14;
  } else if (totalFlow >= 50000) {
    factors.push({ impact: 'raise', points: 6, label: `₹${(totalFlow / 1000).toFixed(0)}K lifetime flow`, note: 'Moderate cumulative flow across linked complaints.' });
    score += 6;
  }

  if (avgSpeed != null && avgSpeed <= 15) {
    factors.push({ impact: 'raise', points: 26, label: `Withdrawn in ${Math.round(avgSpeed)} min avg`, note: 'Funds moved to cash unusually fast after receipt — rapid-cash-out pattern.' });
    score += 26;
  } else if (avgSpeed != null && avgSpeed <= 30) {
    factors.push({ impact: 'raise', points: 16, label: `Withdrawn in ${Math.round(avgSpeed)} min avg`, note: 'Cash-out speed is below the median window observed in sample cases.' });
    score += 16;
  } else if (avgSpeed != null && avgSpeed <= 60) {
    factors.push({ impact: 'raise', points: 8, label: `Withdrawn in ${Math.round(avgSpeed)} min avg`, note: 'Cash-out happened within an hour in past appearances.' });
    score += 8;
  }

  const clamped = Math.max(0, Math.min(100, score));
  const tier = clamped >= 70 ? 'CONFIRMED' : clamped >= 45 ? 'FLAGGED' : clamped >= 20 ? 'WATCH' : 'CLEAN';

  return {
    ifsc: entry.ifsc,
    holder: entry.holder,
    bankCode: entry.bankCode,
    accountMask: entry.accountMask,
    score: clamped,
    tier,
    tierLabel: tierLabel(tier),
    cases: n,
    totalFlow,
    avgSpeedMin: avgSpeed,
    factors,
    appearances: entry.appearances || [],
    synthetic: true,
  };
}

// Reputation for a single account/IFSC. Returns a CLEAN "no prior overlap"
// entry when the IFSC is not in the known corpus (e.g. freshly reported accounts).
export function reputationForAccount(ifsc, now) {
  if (!ifsc) return null;
  const entry = corpusLookup(buildCorpus(now), ifsc);
  return computeReputation(entry || { ifsc, holder: 'Unknown holder', bankCode: ifsc.slice(0, 3), accountMask: '\u2022\u2022\u2022\u2022\u2022\u2022', appearances: [] });
}

function corpusLookup(corpus, ifsc) {
  return corpus.find((a) => a.ifsc === ifsc);
}