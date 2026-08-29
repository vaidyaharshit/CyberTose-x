// Synthetic "city" dataset for the predictive cash-out model.
// Everything here is fictional — no real banks, ATMs, people, or case data.

export const CITY_NAME = 'Ranagiri';

export const BANKS = {
  VNB: { code: 'VNB', name: 'Vikram National Bank' },
  MCB: { code: 'MCB', name: 'MegaCore Bank' },
  SCB: { code: 'SCB', name: 'Surya City Bank' },
  NPB: { code: 'NPB', name: 'NovaPay Bank' },
  IRB: { code: 'IRB', name: 'Indu River Co-op Bank' },
  BGC: { code: 'BGC', name: 'Bharat Gramin Co-op' },
};

export function bankName(code) {
  return BANKS[code] ? BANKS[code].name : code;
}

// grid spans x: 0..GRID_W-1, y: 0..GRID_H-1 (stylized city map)
export const GRID_W = 12;
export const GRID_H = 8;

// heatBase: historical mule-withdrawal activity (0-100, sample data)
// retail: crowd propensity 0..1 used by time-of-day modelling
export const ZONES = [
  { id: 'Z01', name: 'Financial District', x: 4, y: 1, heatBase: 78, retail: 0.85, station: 'Cyber Crime Cell, Indira Chowk', respMin: 6, atms: ['ATM-VNB-2211', 'ATM-SCB-1174', 'ATM-MCB-9033'] },
  { id: 'Z02', name: 'Shastri Nagar Market', x: 8, y: 2, heatBase: 72, retail: 0.9, station: 'Shastri Nagar PS', respMin: 5, atms: ['ATM-MCB-8840', 'ATM-NPB-5510', 'ATM-VNB-3320'] },
  { id: 'Z03', name: 'Gandhi Bazaar', x: 6, y: 5, heatBase: 64, retail: 0.95, station: 'Gandhi Bazaar PS', respMin: 7, atms: ['ATM-SCB-6601', 'ATM-BGC-2215', 'ATM-NPB-7742'] },
  { id: 'Z04', name: 'Nehru Colony', x: 2, y: 5, heatBase: 55, retail: 0.6, station: 'Nehru Colony PS', respMin: 8, atms: ['ATM-IRB-1182', 'ATM-MCB-0277', 'ATM-VNB-9011'] },
  { id: 'Z05', name: 'Old Town Crossing', x: 3, y: 3, heatBase: 50, retail: 0.7, station: 'Old Town PS', respMin: 6, atms: ['ATM-BGC-3309', 'ATM-SCB-2204', 'ATM-NPB-6655'] },
  { id: 'Z06', name: 'Electronic City Gate', x: 10, y: 6, heatBase: 58, retail: 0.5, station: 'El-City Gate PS', respMin: 9, atms: ['ATM-VNB-5120', 'ATM-MCB-9044', 'ATM-SCB-3455'] },
  { id: 'Z07', name: 'Airport Road Hub', x: 6, y: 0, heatBase: 60, retail: 0.75, station: 'Airport Road PS', respMin: 8, atms: ['ATM-NPB-5501', 'ATM-VNB-6080', 'ATM-MCB-1175'] },
  { id: 'Z08', name: 'Riverside Marg', x: 1, y: 1, heatBase: 32, retail: 0.4, station: 'Riverside PS', respMin: 10, atms: ['ATM-IRB-7712', 'ATM-BGC-4490', 'ATM-NPB-0033'] },
  { id: 'Z09', name: 'Kaveri Extension', x: 9, y: 1, heatBase: 42, retail: 0.55, station: 'Kaveri Ext. PS', respMin: 7, atms: ['ATM-SCB-8821', 'ATM-MCB-3312', 'ATM-VNB-7766'] },
  { id: 'Z10', name: 'Sangam Chauk', x: 8, y: 5, heatBase: 68, retail: 0.8, station: 'Sangam Chauk PS', respMin: 5, atms: ['ATM-VNB-2250', 'ATM-NPB-8810', 'ATM-MCB-6600'] },
];

export function zoneById(id) {
  return ZONES.find((z) => z.id === id);
}

// Euclidean grid distance between two zones (in grid units)
export function zoneDistance(aId, bId) {
  const a = zoneById(aId);
  const b = zoneById(bId);
  if (!a || !b) return 99;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function travelMinutes(aId, bId) {
  return Math.round(zoneDistance(aId, bId) * 9);
}

export const GRIDMAX = { x: GRID_W - 1, y: GRID_H - 1 };