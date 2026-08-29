// Case factories. All persons, banks, account numbers and timestamps are SYNTHETIC.
// Timestamps are derived relative to a session "now" so a judge's demo always looks live.

import { sha256hex, mulberry32 } from './sha256.js';

export function makeSessionNow() {
  return Date.now();
}

function span(now, hours) {
  return now - Math.round(hours * 3600000);
}

// ---------- DEMO CASE (Judge Mode) ----------
export function buildDemoCase(now) {
  const reportAt = span(now, 1.7);
  const mules = [
    {
      id: 'MU-1137',
      holder: 'R. Khanna',
      role: 'entry mule',
      bankCode: 'VNB',
      account: '\u2022\u2022\u2022\u2022\u2022211',
      ifsc: 'VNB0000211',
      openedDaysAgo: 9,
      knownArea: 'Z01',
      geoConfidence: 0.85,
      balance: 0,
      priorFlags: 0,
      note: 'Received the full claimed amount within 8 minutes of the incident.',
    },
    {
      id: 'MU-2218',
      holder: 'S. Deokar',
      role: 'distributor / casher',
      bankCode: 'MCB',
      account: '\u2022\u2022\u2022\u2022\u2022840',
      ifsc: 'MCB0002840',
      openedDaysAgo: 6,
      knownArea: 'Z02',
      geoConfidence: 0.7,
      balance: 170000,
      priorFlags: 1,
      note: 'Rapid onward transfers within 3 minutes of inflow.',
    },
    {
      id: 'MU-3304',
      holder: 'P. Nadar',
      role: 'casher',
      bankCode: 'NPB',
      account: '\u2022\u2022\u2022\u2022\u2022501',
      ifsc: 'NPB0002501',
      openedDaysAgo: 11,
      knownArea: 'Z09',
      geoConfidence: 0.55,
      balance: 100000,
      priorFlags: 2,
      note: 'Name appears in 2 earlier flagged-chains (sample statistic, requires verification).',
    },
  ];

  const transactions = [
    {
      id: 'T1',
      kind: 'inflow',
      from: { holder: 'Ananya Rathi', account: '\u2022\u2022\u2022\u2022\u2022012', bankCode: 'SCB' },
      to: { holder: 'R. Khanna', account: mules[0].account, bankCode: 'VNB' },
      amount: 480000,
      at: span(now, 1.55),
      status: 'confirmed',
      mode: 'UPI transfer',
      label: 'Victim \u2192 MU-1137',
    },
    {
      id: 'T2',
      kind: 'transfer',
      from: mules[0],
      to: mules[1],
      amount: 260000,
      at: span(now, 1.32),
      status: 'confirmed',
      mode: 'UPI transfer',
      label: 'MU-1137 \u2192 MU-2218',
    },
    {
      id: 'T3',
      kind: 'transfer',
      from: mules[0],
      to: mules[2],
      amount: 140000,
      at: span(now, 1.26),
      status: 'confirmed',
      mode: 'UPI transfer',
      label: 'MU-1137 \u2192 MU-3304',
    },
    {
      id: 'T4',
      kind: 'withdrawal',
      via: { cluster: 'ATM cluster, Indira Chowk', code: 'Z01' },
      from: mules[0],
      amount: 80000,
      at: span(now, 1.02),
      status: 'suspected',
      mode: 'Cash withdrawal',
      label: 'MU-1137 \u2192 ATM (Indira Chowk)',
    },
    {
      id: 'T5',
      kind: 'withdrawal',
      via: { cluster: 'ATM cluster, Airport Road', code: 'Z07' },
      from: mules[2],
      amount: 40000,
      at: span(now, 0.82),
      status: 'suspected',
      mode: 'Cash withdrawal',
      label: 'MU-3304 \u2192 ATM (Airport Rd)',
    },
    {
      id: 'T6',
      kind: 'withdrawal',
      via: { cluster: 'ATM cluster, Shastri Nagar', code: 'Z02' },
      from: mules[1],
      amount: 90000,
      at: span(now, 0.55),
      status: 'confirmed',
      mode: 'Cash withdrawal',
      label: 'MU-2218 \u2192 ATM (Shastri Nagar)',
    },
  ];

  const caseObj = {
    id: 'TG-26184-0421',
    title: 'UPI \u201crefund\u201d KYC fraud',
    status: 'Active',
    source: 'demo',
    createdAt: reportAt,
    claimedAmount: 480000,
    intake: {
      victim: { name: 'Ananya Rathi', age: 34, location: 'Ranagiri', phone: '\u2022\u2022\u2022\u2022\u20224231' },
      incident: {
        type: 'UPI KYC / refund fraud',
        paymentMode: 'UPI (PhonePe-class app)',
        reportedAt: reportAt,
        narrative:
          'Victim received a call from a caller impersonating the bank fraud desk, was told a KYC update was pending, and was guided to share an OTP. \u20B94,80,000 moved out in one UPI push within minutes. No real PII recorded in this demo.',
      },
    },
    transactions,
    mules,
    lastKnownPoint: { zoneCode: 'Z02', at: span(now, 0.55), kind: 'confirmed withdrawal' },
    atRisk: 270000,
    actionLog: [
      { at: reportAt, actor: 'Officer R. Deshmukh', action: 'COMPLAINT_LOGGED', note: 'Intake registered via TraceGrid AI console.' },
      { at: span(now, 1.1), actor: 'SYSTEM', action: 'MONEY_TRAIL_MAPPED', note: '3 mule accounts triangulated from shared device metadata (sample).' },
      { at: span(now, 0.7), actor: 'SYSTEM', action: 'FLOAT_MONITORED', note: '\u20B92,70,000 tracked float exposed across 2 mule balances.' },
    ],
  };
  return caseObj;
}

// ---------- HISTORIC SAMPLE CASES (seed the dashboard) ----------
export function buildHistoricCases(now) {
  const mk = (id, title, status, claimed, saved, prevented, contacts, caused, atRisk) => ({
    id,
    title,
    status,
    source: 'sample',
    createdAt: caused,
    claimedAmount: claimed,
    intake: {
      victim: { name: id === 'TG-26184-0409' ? 'Vikram Iyer' : 'Kajal Menon', age: 41, location: 'Ranagiri', phone: '\u2022\u2022\u2022\u2022\u202201' },
      incident: { type: id === 'TG-26184-0409' ? 'Refund-advance fraud' : 'SIM-swap banking fraud', paymentMode: 'UPI / netbanking', reportedAt: caused, narrative: 'Synthetic historical record for dashboard conditioning.' },
    },
    transactions: [],
    mules: [],
    lastKnownPoint: null,
    atRisk: atRisk || 0,
    actionLog: [
      { at: caused, actor: 'Officer R. Deshmukh', action: 'COMPLAINT_LOGGED', note: 'Intake registered.' },
      ...(prevented
        ? [{ at: contacts, actor: 'Officer R. Deshmukh', action: 'ALERT_ACTION', note: 'Local PS + bank flagged; cash-out intercepted early.' }]
        : [{ at: contacts, actor: 'Officer A. Menon', action: 'CASE_REVIEW', note: 'Awaiting confirmed withdrawals.' }]),
    ],
    _saved: saved,
    _prevented: prevented,
    _contacts: contacts,
  });

  return [
    mk('TG-26184-0409', 'Refund-advance fraud', 'Resolved', 230000, 230000, true, span(now, 26), span(now, 30), 0),
    mk('TG-26184-0422', 'SIM-swap banking fraud', 'Active', 96000, 0, false, span(now, 11), span(now, 14), 90000),
  ];
}

// ---------- INTAKE (officer-submitted) CASE ----------
export function buildIntakeCase(inputs, now, serial) {
  const seed = parseInt(sha256hex(`${inputs.victimName}|${now}|${serial}`).slice(0, 6), 16);
  const rnd = mulberry32(seed);

  const claimedAmount = Math.max(1000, Math.round(Number(inputs.amount) || 0));
  const nMules = Math.min(3, Math.max(1, inputs.muleAccounts.filter(Boolean).length || 1));

  const muleCodes = ['VNB', 'MCB', 'NPB', 'SCB', 'IRB', 'BGC'];
  const mules = [];
  for (let i = 0; i < nMules; i++) {
    const acc = inputs.muleAccounts[i];
    const bankCode = muleCodes[Math.floor(rnd() * muleCodes.length)];
    const opened = acc && acc.openedDays ? Math.min(90, Math.max(1, Number(acc.openedDays) || 15)) : 12 + Math.floor(rnd() * 40);
    const zoneIdx = Math.floor(rnd() * 10);
    const zone = ['Z01', 'Z02', 'Z03', 'Z04', 'Z05', 'Z06', 'Z07', 'Z08', 'Z09', 'Z10'][zoneIdx];
    mules.push({
      id: `MU-${seed.toString().slice(0, 3)}${i + 4}${i === 0 ? '1' : '7'}`,
      holder: (acc && acc.holder) || `Holder ${i + 1}`,
      role: i === 0 ? 'suspected receiving account' : `hop ${i + 1}`,
      bankCode,
      account: (acc && acc.account) || '\u2022'.repeat(4) + String(1000 + Math.floor(rnd() * 8999)),
      ifsc: (acc && acc.ifsc) || `${bankCode}000${1000 + Math.floor(rnd() * 8999)}`,
      openedDaysAgo: opened,
      knownArea: zone,
      geoConfidence: 0.35,
      balance: 0,
      priorFlags: 0,
      note: 'Officer-declared account; geo/linkage unconfirmed \u2014 requires verification.',
    });
  }

  // deterministic split of the claimed amount to first mule, onward hops get fractions
  const splits = mules.map(() => Math.max(0.18, Math.round(rnd() * 0.6 + 0.2)));
  const sumSplit = splits.reduce((a, b) => a + b, 0);
  const txs = [];
  txs.push({
    id: 'T1',
    kind: 'inflow',
    from: { holder: inputs.victimName, account: 'unknown (reported)', bankCode: 'SCB' },
    to: { holder: mules[0].holder, account: mules[0].account, bankCode: mules[0].bankCode },
    amount: claimedAmount,
    at: now,
    status: 'suspected',
    mode: inputs.mode || 'UPI transfer',
    label: `Victim \u2192 ${mules[0].id}`,
  });
  for (let i = 1; i < mules.length; i++) {
    const portion = Math.round((claimedAmount * splits[i]) / sumSplit / 100) * 100;
    txs.push({
      id: `T${i + 1}`,
      kind: 'transfer',
      from: mules[i - 1],
      to: mules[i],
      amount: portion,
      at: now,
      status: 'suspected',
      mode: 'UPI transfer',
      label: `${mules[i - 1].id} \u2192 ${mules[i].id}`,
    });
  }
  mules[0].balance = claimedAmount;
  for (let i = 1; i < mules.length; i++) {
    mules[0].balance -= txs.find((t) => t.id === `T${i + 1}`).amount;
  }
  for (let i = 1; i < mules.length; i++) {
    mules[i].balance = txs.find((t) => t.to && t.to.holder === mules[i].holder && t.id !== 'T1').amount;
  }

  const reportAt = now;

  return {
    id: `TG-26184-${String(serial).padStart(4, '0')}`,
    title: inputs.type || 'New cybercrime complaint',
    status: 'Active',
    source: 'intake',
    createdAt: reportAt,
    claimedAmount,
    intake: {
      victim: { name: inputs.victimName, age: inputs.victimAge || null, location: inputs.city || 'Ranagiri', phone: inputs.phone || 'not recorded' },
      incident: {
        type: inputs.type || 'Reported fraud',
        paymentMode: inputs.mode || 'UPI',
        reportedAt: reportAt,
        narrative: inputs.narrative || 'Officer intake \u2014 details to be confirmed against complaint record.',
      },
    },
    transactions: txs,
    mules,
    lastKnownPoint: { zoneCode: mules[0].knownArea, at: now, kind: 'suspected entry account location' },
    atRisk: mules.reduce((a, m) => a + m.balance, 0),
    actionLog: [
      { at: reportAt, actor: 'Officer R. Deshmukh', action: 'COMPLAINT_LOGGED', note: 'Intake registered via TraceGrid AI console.' },
      { at: reportAt, actor: 'SYSTEM', action: 'MONEY_TRAIL_MAPPED', note: `${mules.length} suspect account(s) mapped from reported details (unverified).` },
    ],
  };
}