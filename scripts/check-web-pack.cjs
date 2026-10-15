// Explicit browser validation; regular extension tests stay offline and browser-free.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { fork } = require('node:child_process');
const { chromium } = require('../playground/web/node_modules/playwright');
const root = path.resolve(__dirname, '..');

async function main() {
  const browser = await chromium.launch({ executablePath: process.env.WEB_BROWSER_PATH || undefined });
  let server;
  try {
    const page = await browser.newPage();
    // Parse each exact native CSS snippet and ensure no declaration was silently dropped.
    for (const card of require('../packs/css.json').cards.filter(card => card.id !== 'tailwind')) {
      const expected = [...card.code.matchAll(/(?:^|[;{])\s*([-\w]+)\s*:/g)].map(match => match[1]);
      const actual = await page.evaluate(({ code, expected }) => {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(code);
        const styles = rules => [...rules].flatMap(rule => [...(rule.style ? [rule.style] : []), ...(rule.cssRules ? styles(rule.cssRules) : [])]);
        const declarations = styles(sheet.cssRules);
        return expected.filter(name => !declarations.some(style => style.getPropertyValue(name).trim()));
      }, { code: card.code, expected });
      assert.deepEqual(actual, [], `CSS declarations: ${card.id}`);
    }
    // Validate native HTML relationships using the browser's actual DOM parser.
    const source = fs.readFileSync(path.join(root, 'playground/web/index.html'), 'utf8');
    await page.setContent(source);
    assert.deepEqual(await page.evaluate(() => {
      const errors = [];
      const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
      if (new Set(ids).size !== ids.length) errors.push('Duplicate IDs');
      for (const label of document.querySelectorAll('label[for]')) if (!document.getElementById(label.htmlFor)) errors.push('Missing control');
      for (const image of document.images) if (!image.hasAttribute('alt')) errors.push('Missing alt');
      return errors;
    }), []);
    server = fork(path.join(root, 'playground/web/server.cjs'), [], { silent: true });
    await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); server.once('exit', code => reject(new Error(`Server exited ${code}`))); });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [320, 768, 1200]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('http://127.0.0.1:4173');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Playground overflow ${width}`);
      await page.locator('summary').click();
      assert.equal(await page.locator('details').evaluate(el => el.open), true);
      await page.locator('#email').fill('garden@example.com');
      await page.locator('button[type=submit]').click();
      assert.match(await page.locator('#save-status').textContent(), /Reminder recorded/);
      await page.locator('.save').focus();
      assert.equal(await page.locator('.save').evaluate(el => el === document.activeElement), true);
      await page.goto('http://127.0.0.1:4173/libraries.html');
      const colors = await page.evaluate(() => [...document.querySelectorAll('.garden-action, .bg-garden')].map(el => getComputedStyle(el).backgroundColor));
      assert.deepEqual(colors, ['rgb(22, 101, 52)', 'rgb(22, 101, 52)']);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Framework overflow ${width}`);
      assert.equal(await page.locator('.md\\:grid-cols-2').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), width < 768 ? 1 : 2);
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('http://127.0.0.1:4173');
    assert.equal(await page.locator('.save').evaluate(el => getComputedStyle(el).transitionDuration), '0s');
    assert.deepEqual(errors, []);
    console.log('Native CSS snippets, HTML relationships, responsive layouts, form/disclosure interaction, reduced motion, Bootstrap and Tailwind passed.');
  } finally { server?.kill(); await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
