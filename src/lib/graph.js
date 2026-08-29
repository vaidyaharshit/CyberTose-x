// Builds the layered money-trail graph (victim -> mules -> ATM/withdrawal nodes).
// Positions computed in a 1000x620 logical space; viewport pan/zooms over it.

import { scoreMule } from './riskEngine.js';

export function buildGraph(c) {
  if (!c) return { nodes: [], edges: [] };
  const nodes = [];
  const edges = [];
  const addEdge = (from, to, amount, at, status, mode, label) =>
    edges.push({ from, to, amount, at, status, mode, label });

  const victim = c.intake?.victim;

  nodes.push({
    id: 'victim',
    type: 'victim',
    label: victim?.name || 'Victim',
    sub: victim?.location ? `${victim.location} \u00b7 complainant` : 'complainant',
    amount: c.claimedAmount,
    status: 'confirmed',
  });

  const muleNodes = c.mules.map((m) => {
    const risk = scoreMule(m);
    return {
      id: m.id,
      type: 'mule',
      label: m.holder,
      sub: `${m.bankCode} \u00b7 acct ${m.account}`,
      amount: m.balance || 0,
      risk,
      openedDaysAgo: m.openedDaysAgo,
      note: m.note,
      ifsc: m.ifsc,
      role: m.role,
    };
  });
  nodes.push(...muleNodes);

  const withdrawals = c.transactions.filter((t) => t.kind === 'withdrawal');
  const atmIds = withdrawals.map((w, i) => `atm-${i}`);
  withdrawals.forEach((w, i) => {
    nodes.push({
      id: atmIds[i],
      type: 'atm',
      label: w.via?.cluster || 'ATM cluster',
      sub: `${w.via?.code || 'Z01'} \u00b7 cash point`,
      amount: w.amount,
      status: w.status,
      mode: w.mode,
    });
  });

  const muleIdFor = (holder) => {
    if (!holder) return 'victim';
    const m = c.mules.find((mm) => mm.holder === holder);
    return m ? m.id : 'victim';
  };

  c.transactions.forEach((t) => {
    if (t.kind === 'inflow') {
      addEdge('victim', muleIdFor(t.to?.holder), t.amount, t.at, t.status, t.mode, t.label);
    } else if (t.kind === 'transfer') {
      addEdge(muleIdFor(t.from?.holder), muleIdFor(t.to?.holder), t.amount, t.at, t.status, t.mode, t.label);
    } else if (t.kind === 'withdrawal') {
      const fromId = muleIdFor(t.from?.holder);
      const atmId = atmIds[withdrawals.indexOf(t)];
      addEdge(fromId, atmId, t.amount, t.at, t.status, t.mode, t.label);
    }
  });

  // Layered layout
  const nMules = muleNodes.length || 1;
  nodes.forEach((node) => {
    if (node.type === 'victim') {
      node.x = 500;
      node.y = 84;
      node.size = 64;
    } else if (node.type === 'mule') {
      node.x = 500 + (muleNodes.indexOf(node) - (nMules - 1) / 2) * 250;
      node.y = 245;
      node.size = 54;
    } else {
      node.x = 500 + (withdrawals.length > 1 ? (Number(node.id.split('-')[1]) - (withdrawals.length - 1) / 2) * 190 : 0);
      node.y = 470;
      node.size = 48;
    }
  });

  return { nodes, edges };
}

export function graphSummary(c) {
  const totalIn = (c.transactions || []).filter((t) => t.kind === 'inflow').reduce((a, t) => a + t.amount, 0);
  return { totalIn, hopCount: (c.mules || []).length, txCount: (c.transactions || []).length };
}