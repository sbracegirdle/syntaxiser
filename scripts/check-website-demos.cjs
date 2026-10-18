const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../playground/web/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const url = file => pathToFileURL(path.join(root, file)).href;
async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url('website/index.html'));
    const hero = page.frameLocator('.demo-hero');
    await hero.locator('#relevant .card').first().waitFor();
    assert.equal(await hero.locator('.demo-editor button').first().textContent(), 'Play animation');
    const before = await hero.locator('#relevant .card').first().getAttribute('aria-label');
    await hero.getByRole('button', { name: 'Next example' }).click();
    assert.notEqual(await hero.locator('#relevant .card').first().getAttribute('aria-label'), before);
    await hero.locator('#reference-tab').click();
    assert.equal(await hero.locator('#reference-section').isVisible(), true);
    await hero.locator('#lesson-browser-tab').click();
    assert.equal(await hero.locator('#lesson-browser').isVisible(), true);
    assert.ok(await hero.locator('#lesson-tree button').count() > 0);
    await hero.locator('#context-tab').click();
    await hero.locator('#query').fill('handle a missing value');
    await hero.locator('#query').press('Enter');
    assert.equal(await hero.locator('#search-section').isVisible(), true);
    const code = await hero.locator('#search-results .card pre code').first().textContent();
    const title = await hero.locator('#search-results .card').first().getAttribute('aria-label');
    const card = require('../packs/rust.json').cards.find(card => card.title === title);
    assert.equal(code, card.code, 'Demo must display exact production catalog code');
    await hero.locator('#search-results .pin-button').first().click();
    assert.equal(await hero.locator('#pinned .card').count(), 1);
    await hero.locator('#pinned .pin-button').click();
    assert.equal(await hero.locator('#pinned .card').count(), 0);
    await hero.locator('#query').fill('zzzznothing');
    await hero.locator('#query').press('Enter');
    assert.equal(await hero.locator('#query').inputValue(), 'zzzznothing');
    await hero.locator('#query').fill('');
    await hero.locator('#query').press('Enter');
    await hero.getByRole('button', { name: 'Play animation', exact: true }).click();
    await hero.getByRole('button', { name: 'Pause animation', exact: true }).click();
    const search = page.frameLocator('iframe[title="Interactive Syntaxiser search demo"]');
    await page.locator('iframe[title="Interactive Syntaxiser search demo"]').scrollIntoViewIfNeeded();
    await search.locator('#search-results .card').first().waitFor();
    assert.equal(await search.locator('#query').inputValue(), 'handle a missing value');
    const pins = page.frameLocator('iframe[title="Interactive Syntaxiser pins demo"]');
    await page.locator('iframe[title="Interactive Syntaxiser pins demo"]').scrollIntoViewIfNeeded();
    await pins.locator('#pinned .card').first().waitFor();
    assert.equal(await pins.locator('#pinned .card').count(), 2);
    assert.equal(await search.locator('#pinned .card').count(), 0, 'Demo state must be isolated');
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Page overflow at ${width}`);
      assert.ok(await hero.locator('body').evaluate(body => body.scrollWidth <= innerWidth), `Sidebar overflow at ${width}`);
    }
    await page.goto(url('website/index.html'));
    await hero.locator('#relevant .card').first().waitFor();
    for (const frame of await page.locator('iframe').all()) await frame.scrollIntoViewIfNeeded();
    await search.locator('#search-results .card').first().waitFor();
    await pins.locator('#pinned .card').first().waitFor();
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.locator('.brand').first().focus();
      await page.evaluate(() => window.scrollTo(0, 0));
      await hero.locator('#relevant .card').first().waitFor();
      await page.setViewportSize({ width, height: await page.evaluate(() => document.documentElement.scrollHeight) });
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(root, `docs/screenshots/website-demo-${width}.png`), fullPage: true });
    }
    const animated = await browser.newPage({ reducedMotion: 'no-preference' });
    await animated.goto(url('website/assets/demo.html') + '?view=context');
    await animated.waitForFunction(() => document.querySelector('.demo-editor code')?.textContent.includes('unwrap_or'), { timeout: 12000 });
    await animated.waitForFunction(() => document.querySelector('.demo-editor code')?.textContent.endsWith('}'), { timeout: 12000 });
    assert.ok((await animated.locator('#relevant .card').first().getAttribute('aria-label')) !== before);
    await animated.close();
    const staticPage = await browser.newPage({ javaScriptEnabled: false });
    await staticPage.goto(url('website/index.html'));
    assert.equal(await staticPage.locator('noscript img').count(), 3);
    await staticPage.locator('summary').first().focus();
    await staticPage.keyboard.press('Enter');
    assert.equal(await staticPage.locator('details').first().getAttribute('open'), '');
    assert.deepEqual(errors, []);
    console.log('Three demos: context, animation controls, tabs, lessons, exact catalog search, arbitrary queries, pin/unpin, isolation, responsive layout and no-JS fallback passed.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
