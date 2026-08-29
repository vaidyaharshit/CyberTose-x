import { sha256hex } from './sha256.js';

// Human-readable formatting helpers.

export function inr(n) {
  const v = Math.round(Number(n) || 0);
  return new Intl.NumberFormat('en-IN').format(v);
}

export function inrFull(n) {
  return '\u20B9' + inr(n);
}

// Compact Indian-style large currency: ₹4.80L, ₹92K, ₹12C (crore).
export function inrCompact(n) {
  const v = Math.abs(Number(n) || 0);
  const neg = n < 0 ? '-' : '';
  if (v >= 10000000) return `${neg}\u20B9${trimNum(v / 10000000)}C`;
  if (v >= 100000) return `${neg}\u20B9${trimNum(v / 100000)}L`;
  if (v >= 1000) return `${neg}\u20B9${trimNum(v / 1000)}K`;
  return `${neg}\u20B9${inr(v)}`;
}

function trimNum(x) {
  return (Math.round(x * 100) / 100).toString().replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

export function pct(x, digits = 0) {
  return `${(x * 100).toFixed(digits)}%`;
}

export function shortDate(ts) {
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function shortTime(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function fullDate(ts) {
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function timeAgo(ms, now = Date.now()) {
  const diff = Math.max(0, now - ms);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ${min % 60}m ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export function minsAgo(ms, now = Date.now()) {
  return Math.max(0, Math.round((now - ms) / 60000));
}

export function hashShort(h) {
  if (!h) return '—';
  return `${h.slice(0, 10)}\u2026${h.slice(-6)}`;
}