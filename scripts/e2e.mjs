// E2E judge-flow test. Drives the built app in headless Edge/Chrome.
// Flow: Dashboard -> Load Demo -> Trail -> Heatmap -> Risk -> Alert sim -> Audit (verify+tamper) -> Dashboard metrics.
// Then a 375px mobile pass for responsive behaviour.

import { chromium } from 'playwright-core';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EXE = EDGE;
const BASE = process.env.BASE_URL || 'http://localhost:4173';

let pass = 0;
let fail = 0;
function ok(name) { pass++; console.log('  PASS  ' + name); }
function bad(name, err) { fail++; console.log('  FAIL  ' + name + (err ? ' :: ' + (err.message || err).slice(0, 300) : '')); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickText(page, text, opts = {}) {
  await page.getByRole('button', { name: text }).first().click(opts);
}
async function hasText(page, text) {
  try {
    await page.getByText(text, { exact: false }).filter({ visible: true }).first().waitFor({ state: 'visible', timeout: 6000 });
    return true;
  } catch { return false; }
}

async function run(page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });

  // 1. Empty-state dashboard
  if (await hasText(page, 'Stop the cash-out')) ok('dashboard empty-state hero visible');
  else bad('dashboard empty-state hero');
  if (await hasText(page, 'Load demo case')) ok('Load Demo case CTA present');
  else bad('Load Demo case CTA');

  // 2. Load demo
  await clickText(page, 'Load demo case');
  await sleep(2200);
  if (await hasText(page, 'Money trail')) ok('loading skeleton -> trail view after demo load');
  else bad('trail after demo load');
  if (await hasText(page, 'TG-26184-0421')) ok('demo case id rendered');
  else bad('demo case id');

  // 3. Trail graph
  if (await hasText(page, 'R. Khanna')) ok('mule node (holder) rendered');
  else bad('mule node');
  await page.getByText('R. Khanna', { exact: false }).filter({ visible: true }).first().click();
  await sleep(400);
  if (await hasText(page, 'MU-1137') && await hasText(page, 'Why this score')) ok('node detail with risk breakdown opens');
  else bad('node detail panel');

  // click ATMs? verify edge labels exist
  if (await hasText(page, 'Shastri Nagar')) ok('ATM/edge label present');
  else bad('edge labels');

  // 4. Heatmap
  await clickText(page, 'Predict cash-out'); // trail primary button
  await sleep(900);
  if (await hasText(page, 'Prediction confidence')) ok('heatmap confidence panel visible');
  else bad('heatmap confidence');
  if (await hasText(page, 'Feature breakdown') || await hasText(page, 'why this prediction')) ok('feature breakdown panel visible');
  else bad('feature breakdown');
  // click a zone cell -> risk panel
  await page.locator('rect[class*="cursor-pointer"]').first().click();
  await sleep(500);
  if (await hasText(page, 'Nearest PS')) ok('zone detail with PS/risk opens');
  else bad('zone detail');

  // 5. Risk engine
  await clickText(page, 'Risk Engine');
  await sleep(700);
  if (await hasText(page, 'Risk scoring engine')) ok('risk engine page');
  else bad('risk engine page');
  if (await hasText(page, '/100')) ok('live score numbers rendered');
  else bad('score numbers');
  await page.getByText(/\bWhy \d+ \/ 100\b/).first().click();
  await sleep(300);
  if (await hasText(page, 'requires verification')) ok('risk factors with "requires verification" language');
  else bad('requires verification language');

  // 5b. Auto-freeze request simulation (HIGH-risk mule)
  await clickText(page, 'Send Freeze Request to Bank');
  await page.getByText('Account frozen', { exact: false }).filter({ visible: true }).first().waitFor({ state: 'visible', timeout: 12000 });
  if (await hasText(page, 'Frozen in')) ok('freeze timeline completes -> frozen summary');
  else bad('freeze timeline');
  if (await hasText(page, 'Simulated for demo purposes')) ok('freeze disclaimer present');
  else bad('freeze disclaimer');

  // 6. Alert simulation
  await clickText(page, 'Live Alert Stream');
  await sleep(800);
  if (await hasText(page, 'Run alert simulation')) ok('alert sim start present');
  else bad('alert sim start');
  if (await hasText(page, 'PRIORITY-1')) ok('priority-1 triggered');
  else bad('priority-1');
  await clickText(page, 'Run alert simulation');
  await sleep(2500);
  if (await hasText(page, 'dispatched') || await hasText(page, 'Dispatched')) ok('dispatch stage animated');
  else bad('dispatch stage');
  await sleep(2000);
  if (await hasText(page, 'Acknowledged')) ok('acknowledged stage animated');
  else bad('acknowledged stage');
  await clickText(page, 'Confirm interception');
  await sleep(800);
  if (await hasText(page, 'Response loop complete')) ok('action taken -> loop complete');
  else bad('action completed');
  if (await hasText(page, 'Cash-out prevented')) ok('prevention toast fired');
  else bad('prevention toast');

  // 6b. Prediction feedback loop — case is Resolved after interception
  await clickText(page, 'Cash-Out Heatmap');
  await sleep(900);
  const accBtn = page.getByRole('button', { name: 'Prediction Was Accurate' });
  await accBtn.scrollIntoViewIfNeeded();
  await accBtn.click();
  await sleep(400);
  if (await hasText(page, 'Reviewed for')) ok('prediction feedback logged to loop');
  else bad('feedback logged');
  if (await hasText(page, 'prediction accurate')) ok('accurate rating stored');
  else bad('feedback stored');

  // 7. Audit chain
  await clickText(page, 'Audit Chain');
  await sleep(800);
  if (await hasText(page, 'Blockchain-backed audit trail')) ok('audit page');
  else bad('audit page');
  if (await hasText(page, 'ACCOUNT_FROZEN')) ok('freeze action logged to audit chain');
  else bad('freeze audit entry');
  await clickText(page, 'Verify chain');
  await sleep(600);
  if (await hasText(page, 'Chain intact')) ok('integrity verification OK');
  else bad('integrity verification');
  await clickText(page, 'Simulate tamper');
  await sleep(300);
  await clickText(page, 'Verify chain');
  await sleep(600);
  if (await hasText(page, 'Chain integrity broken')) ok('tamper detected by hash-chain');
  else bad('tamper detection');
  await clickText(page, 'Restore chain');
  await sleep(400);
  await clickText(page, 'Verify chain');
  await sleep(500);

  // 8. Dashboard metrics after prevention
  await clickText(page, 'Command Dashboard');
  await sleep(700);
  if (await hasText(page, 'Amount protected')) ok('dashboard metrics panel visible');
  else bad('metrics panel');
  const saved = await page.getByText('Amount protected');
  await saved.scrollIntoViewIfNeeded();

  // 8b. Model accuracy (feedback loop) on dashboard
  await page.getByText('Model accuracy').scrollIntoViewIfNeeded();
  if (await hasText(page, 'Model accuracy')) ok('model accuracy card on dashboard');
  else bad('model accuracy card');
  if (await hasText(page, 'reviewed prediction')) ok('accuracy caption = reviewed predictions');
  else bad('accuracy caption');

  // 9. Screenshot sanity
  await page.screenshot({ path: 'C:\\Users\\ASUS\\AppData\\Local\\Temp\\opencode\\tracegrid-desktop.png' });
  ok('desktop screenshot captured');

  // 10. Mule reputation network
  await clickText(page, 'Reputation Network');
  await sleep(800);
  if (await hasText(page, 'Mule reputation network')) ok('reputation network page');
  else bad('reputation network page');
  if (await hasText(page, 'Pattern-based flag') && await hasText(page, 'requires investigative verification')) ok('reputation disclaimer (pattern = hypothesis)');
  else bad('reputation disclaimer');
  await clickText(page, 'View Network Graph');
  await sleep(600);
  if (await hasText(page, 'Network graph')) ok('network graph opens for account');
  else bad('network graph');
  if (await hasText(page, '3 prior cases')) ok('demo mule shows 3 linked appearances');
  else bad('prior appearances');
}

async function runMobile(page) {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });

  const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  if (noHScroll) ok('mobile: no horizontal scroll on dashboard');
  else bad('mobile: horizontal overflow ' + await page.evaluate(() => document.documentElement.scrollWidth) + 'px');

  // hamburger drawer
  await page.locator('button[aria-label="Open menu"]').click();
  await sleep(700);
  if (await page.locator('button[aria-label="Close menu"]').isVisible()) ok('mobile: drawer opens');
  else bad('mobile: drawer');
  await page.locator('button[aria-label="Close menu"]').click();
  try {
    await page.waitForSelector('button[aria-label="Close menu"]', { state: 'detached', timeout: 4000 });
    ok('mobile: drawer closes');
  } catch {
    bad('mobile: drawer close (still attached)');
    await page.screenshot({ path: 'C:\\Users\\ASUS\\AppData\\Local\\Temp\\opencode\\tracegrid-drawerfail.png' });
  }

  // load demo on mobile
  await clickText(page, 'Load demo case');
  await sleep(2200);
  if (await hasText(page, 'Money trail')) ok('mobile: demo loads to trail');
  else bad('mobile: demo trail');
  // no hscroll on trail
  const noTrailScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  if (noTrailScroll) ok('mobile: no horizontal scroll on trail');
  else bad('mobile: trail overflow');
  await page.screenshot({ path: 'C:\\Users\\ASUS\\AppData\\Local\\Temp\\opencode\\tracegrid-mobile.png' });

  // heatmap mobile
  try {
    await page.getByRole('button', { name: 'Open menu' }).click({ timeout: 5000 });
    ok('mobile: hamburger re-opens');
  } catch {
    bad('mobile: hamburger re-open (drawer stuck?)');
  }
  await sleep(600);
  await page.getByRole('button', { name: 'Cash-Out Heatmap' }).click();
  await sleep(900);
  const noHeatScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  if (noHeatScroll) ok('mobile: no horizontal scroll on heatmap');
  else bad('mobile: heatmap overflow');
  await page.screenshot({ path: 'C:\\Users\\ASUS\\AppData\\Local\\Temp\\opencode\\tracegrid-mobile-heat.png' });

  // dashboard stacked cards
  await page.getByRole('button', { name: 'Open menu' }).click();
  await sleep(400);
  await page.getByRole('button', { name: 'Command Dashboard' }).click();
  await sleep(700);
  await page.screenshot({ path: 'C:\\Users\\ASUS\\AppData\\Local\\Temp\\opencode\\tracegrid-mobile-dash.png' });
  ok('mobile screenshots captured');

  // reputation page mobile
  await page.getByRole('button', { name: 'Open menu' }).click();
  await sleep(400);
  await page.getByRole('button', { name: 'Reputation Network' }).click();
  await sleep(700);
  const noRepScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  if (noRepScroll) ok('mobile: no horizontal scroll on reputation');
  else bad('mobile: reputation overflow');
  if (await hasText(page, 'Mule reputation network')) ok('mobile: reputation page rendered');
  else bad('mobile: reputation page');
  await page.screenshot({ path: 'C:\\Users\\ASUS\\AppData\\Local\\Temp\\opencode\\tracegrid-mobile-rep.png' });
}

async function main() {
  console.log('TraceGrid AI E2E judge-flow test\n');
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(12000);
  try {
    await run(page);
  } catch (e) {
    bad('desktop flow', e);
    await page.screenshot({ path: 'C:\\Users\\ASUS\\AppData\\Local\\Temp\\opencode\\tracegrid-fail.png' });
  }
  try {
    await runMobile(page);
  } catch (e) {
    bad('mobile flow', e);
  }
  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });