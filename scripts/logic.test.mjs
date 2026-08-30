// Logic self-test: verifies SHA-256, hash chain integrity, tamper detection,
// deterministic demo-case pipeline and that all numbers come from real calculations.
import assert from 'node:assert';
import { sha256hex } from '../src/lib/sha256.js';
import { appendEntry, startChain, verifyChain } from '../src/lib/hashchain.js';
import { buildDemoCase, buildHistoricCases, buildIntakeCase } from '../src/lib/cases.js';
import { predictCashOut } from '../src/lib/predictor.js';
import { scoreMule, scoreZoneFromPrediction } from '../src/lib/riskEngine.js';
import { reputationForAccount, buildCorpus, computeReputation } from '../src/lib/reputation.js';
import { buildSeedReviews, computeAccuracy } from '../src/lib/feedback.js';
import { ZONES } from '../src/lib/dataset.js';

let passed = 0;
const check = (name, fn) => {
  fn();
  passed++;
  console.log('  ok  ' + name);
};

console.log('TraceGrid AI logic self-test');
console.log('\n[SHA-256]');
check('known vector "abc"', () => {
  assert.strictEqual(sha256hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
check('deterministic', () => assert.strictEqual(sha256hex('x'), sha256hex('x')));

console.log('\n[Hash chain]');
const chain = startChain([
  { ts: 1, actor: 'A', action: 'CASE_LOADED', subject: 'TG-1', detail: 'demo' },
  { ts: 2, actor: 'B', action: 'ALERT', subject: 'TG-1', detail: 'dispatched' },
]);
assert.strictEqual(chain.length, 3);
assert.strictEqual(chain[1].hash, chain[2].prevHash, 'link continuity');
check('verification passes', () => assert.strictEqual(verifyChain(chain).ok, true));
const tampered = chain.map((e, i) => (i === 2 ? { ...e, detail: 'TAMPERED!' } : e));
check('tamper detected at seq', () => {
  const v = verifyChain(tampered);
  assert.strictEqual(v.ok, false);
  assert.strictEqual(v.firstBrokenSeq, 2);
});
const more = appendEntry(chain, { ts: 3, actor: 'C', action: 'ACTION_TAKEN', subject: 'TG-1', detail: 'prevented' });
check('append preserves integrity', () => assert.strictEqual(verifyChain(more).ok, true));

console.log('\n[Demo case pipeline]');
const now = Date.now();
const demo = buildDemoCase(now);
assert.strictEqual(demo.claimedAmount, 480000);
assert.strictEqual(demo.mules.length, 3);
assert.strictEqual(demo.transactions.length, 6);
assert.strictEqual(demo.atRisk, 270000);
check('demo case structure', () => assert.ok(demo.id.startsWith('TG-')));

const pred = predictCashOut(demo, now);
check('prediction ranked + normalized', () => {
  assert.ok(pred.ranked.length === ZONES.length);
  assert.ok(pred.ranked[0].prob >= pred.ranked[1].prob);
  const total = pred.ranked.reduce((a, r) => a + r.prob, 0);
  assert.ok(total > 0.98 && total < 1.02, 'probabilities normalize');
});
check('prediction is imminent with confidence', () => {
  assert.strictEqual(pred.imminent, true);
  assert.ok(pred.confidencePct >= 45 && pred.confidencePct <= 95);
  assert.strictEqual(pred.atRisk, 270000);
});
check('deterministic across calls', () => {
  const p2 = predictCashOut(demo, now);
  assert.strictEqual(pred.ranked[0].zone.id, p2.ranked[0].zone.id);
  assert.strictEqual(pred.exposure, p2.exposure);
});

console.log('\n[Risk engine]');
const r1 = scoreMule(demo.mules[0]);
const r2 = scoreMule(demo.mules[1]);
const r3 = scoreMule(demo.mules[2]);
check('mule scores are ranked high', () => {
  assert.ok(['HIGH', 'MEDIUM'].includes(r1.tier));
  assert.ok(['HIGH', 'MEDIUM'].includes(r2.tier));
  assert.ok(['HIGH', 'MEDIUM'].includes(r3.tier));
  assert.ok(r1.factors.length > 1);
});
check('all factors explain why', () => {
  for (const m of [r1, r2, r3]) {
    for (const f of m.factors) assert.ok(f.label && f.note && typeof f.points === 'number');
  }
});
const zr = scoreZoneFromPrediction(pred, ZONES[0]);
check('zone risk derived from prediction', () => {
  assert.ok(['LOW', 'MEDIUM', 'HIGH'].includes(zr.tier));
  assert.strictEqual(zr.zoneId, 'Z01');
});

console.log('\n[Intake pipeline]');
const intake = buildIntakeCase({ victimName: 'Test Person', amount: '125000', muleAccounts: [{ holder: 'H1' }, { holder: 'H2' }] }, now, 5);
const ip = predictCashOut(intake, now);
check('intake case predictable', () => {
  assert.strictEqual(intake.mules.length, 2);
  assert.ok(ip.confidencePct >= 0);
  assert.ok(intake.atRisk > 0);
});

console.log('\n[Historic seed]');
const hist = buildHistoricCases(now);
check('history seeded', () => assert.strictEqual(hist.length, 2));

console.log('\n[Mule reputation network]');
const corpus = buildCorpus(now);
const rep1 = reputationForAccount('VNB0000211', now);
check('demo mule appears in exactly 3 prior cases', () => assert.strictEqual(rep1.cases, 3));
check('reputation tier is one of the 4', () => assert.ok(['CLEAN', 'WATCH', 'FLAGGED', 'CONFIRMED'].includes(rep1.tier)));
check('higher overlap + flow -> higher score', () => {
  const a = computeReputation(corpus.find((x) => x.ifsc === 'VNB0000211'));
  const b = computeReputation(corpus.find((x) => x.ifsc === 'IRB0007684'));
  assert.ok(a.score > b.score);
  assert.ok(a.tier !== 'CLEAN');
});
check('every factor carries impact + note', () => {
  for (const a of corpus.map(computeReputation)) {
    assert.ok(a.factors.length > 0);
    for (const f of a.factors) assert.ok(['raise', 'lower'].includes(f.impact) && f.label && f.note);
  }
});
check('unknown IFSC -> CLEAN zero entry', () => {
  const u = reputationForAccount('XXX0000000', now);
  assert.strictEqual(u.tier, 'CLEAN');
  assert.strictEqual(u.cases, 0);
  assert.strictEqual(u.score, 0);
});

console.log('\n[Prediction feedback loop]');
const reviews = buildSeedReviews(now);
check('seed reviews deterministic', () => assert.deepStrictEqual(reviews, buildSeedReviews(now)));
const acc = computeAccuracy(reviews, 30);
check('accuracy derived from last 30 (26 seed) reviews', () => assert.strictEqual(acc.reviewed, 26));
check('accuracy pct stays in honest band ~78%', () => assert.ok(acc.pct >= 55 && acc.pct <= 95));
check('sparkline length equals reviewed window', () => assert.strictEqual(acc.spark.length, acc.reviewed));

console.log(`\n${passed} checks passed.`);