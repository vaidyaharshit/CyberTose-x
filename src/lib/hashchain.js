// Immutable hash-chained audit log (simulated blockchain-backed trail).
// Each entry stores prevHash + hash = SHA-256(seq|ts|actor|action|subject|detail|prevHash).
// Verification walks the chain and reports the first broken link.

import { sha256hex } from './sha256.js';

export const GENESIS = { seq: 0, ts: 0, actor: 'SYSTEM', action: 'GENESIS', subject: 'chain-root', detail: 'TraceGrid AI audit chain root', prevHash: '0'.repeat(64) };

function entryHash(entry) {
  return sha256hex(
    `${entry.seq}|${entry.ts}|${entry.actor}|${entry.action}|${entry.subject}|${entry.detail}|${entry.prevHash}`
  );
}

export function startChain(entries = []) {
  let chain = [GENESIS];
  for (const e of entries) {
    chain = appendEntry(chain, e);
  }
  return chain;
}

export function appendEntry(chain, { ts, actor, action, subject, detail }) {
  const prev = chain[chain.length - 1];
  const seq = prev.seq + 1;
  const raw = { seq, ts, actor, action, subject, detail, prevHash: prev.hash };
  const entry = { ...raw, hash: entryHash(raw) };
  return [...chain, entry];
}

// Returns { ok, firstBrokenSeq|null, brokenIndex|null, checked }
export function verifyChain(chain) {
  let checked = 0;
  for (let i = 1; i < chain.length; i++) {
    const entry = chain[i];
    // recompute own hash from raw fields
    const recomputed = entryHash({
      seq: entry.seq,
      ts: entry.ts,
      actor: entry.actor,
      action: entry.action,
      subject: entry.subject,
      detail: entry.detail,
      prevHash: entry.prevHash,
    });
    checked++;
    if (recomputed !== entry.hash) {
      return { ok: false, firstBrokenSeq: entry.seq, brokenIndex: i, checked };
    }
    const prev = chain[i - 1];
    if (entry.prevHash !== prev.hash) {
      return { ok: false, firstBrokenSeq: entry.seq, brokenIndex: i, checked };
    }
  }
  return { ok: true, firstBrokenSeq: null, brokenIndex: null, checked: checked };
}

export function verifyBlock(entry, prevHash) {
  const recomputed = entryHash({
    seq: entry.seq,
    ts: entry.ts,
    actor: entry.actor,
    action: entry.action,
    subject: entry.subject,
    detail: entry.detail,
    prevHash: entry.prevHash,
  });
  return recomputed === entry.hash && entry.prevHash === prevHash;
}

// Chain a "block" view used by the UI: shows how one entry links to the previous.
export function blockLinks(chain) {
  return chain.slice(1).map((e, i) => ({
    entry: e,
    prev: chain[i],
    linksPrev: e.prevHash === chain[i].hash,
    selfValid: verifyBlock(e, chain[i].hash) || e.prevHash === chain[i].hash && e.hash === entryHash({
      seq: e.seq, ts: e.ts, actor: e.actor, action: e.action, subject: e.subject, detail: e.detail, prevHash: e.prevHash,
    }),
  }));
}