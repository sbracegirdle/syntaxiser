// Browser fixtures always embed the exact catalog string; no hand-maintained copies.
const assert = require('node:assert/strict');
const { expect } = require('../playground/web/node_modules/playwright/test');
const cards = require('../packs/html.json').cards;
const registrations = require('../playground/web/html-evidence.json');
const { documentFor, dependencies } = require('./html-fixtures.cjs');
const { checkDepth } = require('./check-html-depth.cjs');

async function checkHtmlCatalog(browser, overrides = {}) {
  assert.deepEqual(cards.map(c => c.id).sort(), Object.keys(registrations).sort(), 'Every HTML card needs inspected assertions');
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  // An intercepted test origin supplies only documented local dependencies. No sockets/public network.
  let markup;
  const files = dependencies();
  const failures = new Set();
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== 'http://catalog.test') throw Error(`Unexpected external request: ${url}`);
    if (url.pathname === '/upload') {
      const body = route.request().postDataBuffer()?.toString() || '';
      const valid = /Content-Type: (?:image\/png|text\/plain)/i.test(body) && !/Content-Type: application\/x-bad/i.test(body);
      await route.fulfill({ status: valid ? 200 : 415, contentType: 'text/plain', body: valid ? 'Upload accepted locally' : 'File type rejected locally' });
      return;
    }
    const name = url.pathname.slice(1), file = files[name];
    if (failures.has(name)) { await route.fulfill({ status: 404, body: 'Fixture missing' }); return; }
    await route.fulfill({ status: file || url.pathname === '/' ? 200 : 404,
      contentType: file?.[0] || 'text/html', body: file?.[1] || (url.pathname === '/' ? markup : 'Fixture not found') });
  });
  try {
    for (const card of cards) {
      const code = overrides[card.id] ?? card.code;
      markup = documentFor(card, code);
      assert.ok(markup.includes(code), `Exact source: ${card.id}`);
      const load = async () => { await page.goto('http://catalog.test/'); };
      failures.clear();
      await page.setViewportSize({ width: 1000, height: 900 });
      await load();
      // Common rejection invariants: broken relationships, duplicate IDs, unnamed images.
      assert.deepEqual(await page.evaluate(() => {
        const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
        const problems = new Set(ids).size === ids.length ? [] : ['duplicate IDs'];
        for (const label of document.querySelectorAll('label[for]')) if (!label.control) problems.push('unassociated label');
        for (const el of document.querySelectorAll('[aria-describedby]')) for (const id of el.getAttribute('aria-describedby').split(/\s+/)) if (!document.getElementById(id)) problems.push('missing description');
        for (const el of document.querySelectorAll('[aria-labelledby]')) for (const id of el.getAttribute('aria-labelledby').split(/\s+/)) if (!document.getElementById(id)) problems.push('missing name');
        for (const el of document.querySelectorAll('[popovertarget]')) if (!document.getElementById(el.getAttribute('popovertarget'))?.hasAttribute('popover')) problems.push('missing popover target');
        for (const el of document.querySelectorAll('td[headers]')) for (const id of el.headers.split(/\s+/)) {
          const header = document.getElementById(id);
          if (header?.tagName !== 'TH' || header.closest('table') !== el.closest('table')) problems.push('missing table header');
        }
        for (const image of document.images) if (!image.getAttribute('alt')?.trim()) problems.push('missing image alternative');
        return problems;
      }), [], `${card.id}: relationships`);
      switch (card.id) {
        case 'document':
          assert.deepEqual(await page.evaluate(() => [document.doctype?.name, document.compatMode, document.documentElement.lang, document.characterSet, document.title, document.querySelector('meta[name=viewport]')?.content]), ['html', 'CSS1Compat', 'en', 'UTF-8', 'Garden journal', 'width=device-width, initial-scale=1']);
          await expect(page.getByRole('heading', { level: 1 })).toHaveText('Garden journal'); break;
        case 'assets':
          await expect(page.locator('html')).toHaveAttribute('data-module-loaded', 'yes');
          assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).getPropertyValue('--fixture-loaded').trim()), 'yes'); break;
        case 'semantics':
          await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(1);
          await expect(page.getByRole('main')).toHaveAttribute('id', 'entries');
          await page.getByRole('link', { name: 'Entries' }).click();
          assert.equal(new URL(page.url()).hash, '#entries');
          await expect(page.getByRole('article').getByRole('heading', { level: 2 })).toHaveText('First harvest'); break;
        case 'text':
          await expect(page.locator('strong')).toHaveText('Wear gloves.');
          await expect(page.locator('em')).toHaveText('before');
          await expect(page.locator('code')).toHaveText('<seed> & water');
          await expect(page.locator('code seed')).toHaveCount(0); break;
        case 'links':
          await page.getByRole('link', { name: 'Skip to planting advice' }).focus();
          await page.keyboard.press('Enter');
          assert.equal(new URL(page.url()).hash, '#planting');
          await expect(page.locator('#planting')).toHaveText('Planting advice');
          await expect(page.locator('a[target=_blank]')).toHaveAttribute('rel', 'noopener');
          await expect(page.locator('a[target=_blank]')).toHaveAttribute('href', 'https://developer.mozilla.org/'); break;
        case 'lists':
          assert.deepEqual(await page.locator('ol li').allTextContents(), ['Loosen the soil.', 'Plant the seeds.', 'Water gently.']);
          await expect(page.locator('dt')).toHaveText('Germination');
          await expect(page.locator('dd')).toHaveText('The first growth from a seed.'); break;
        case 'images':
          await expect(page.getByRole('img', { name: 'Two leaves sprouting above the soil' })).toHaveCount(1);
          await expect.poll(() => page.locator('img').evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
          assert.deepEqual(await page.locator('img').evaluate(el => [el.width, el.height, el.loading]), [320, 180, 'lazy']);
          await expect(page.locator('figcaption')).toHaveText('A bean seedling after one week.'); break;
        case 'tables':
          await expect(page.getByRole('table', { name: 'Seeds planted this week' })).toHaveCount(1);
          assert.deepEqual(await page.locator('th[scope=col]').allTextContents(), ['Plant', 'Count']);
          await expect(page.locator('th[scope=row]')).toHaveText('Beans');
          await expect(page.getByRole('cell')).toHaveText('12'); break;
        case 'forms': {
          await expect(page.getByRole('searchbox', { name: 'Find a plant' })).toHaveCount(1);
          await expect(page.locator('form')).toHaveAttribute('method', 'get');
          await expect(page.locator('form')).toHaveAttribute('action', '/search');
          // Inspect the actual browser navigation request; the illustrative backend returns 404.
          for (const value of ['beans & peas', '']) {
            await page.locator('input').fill(value);
            const request = page.waitForRequest(r => new URL(r.url()).pathname === '/search');
            await page.getByRole('button', { name: 'Search' }).click();
            const sent = await request;
            assert.equal(sent.method(), 'GET');
            assert.equal(new URL(sent.url()).searchParams.get('q'), value);
            await page.goto('http://catalog.test/');
          }
          break;
        }
        case 'inputs': {
          await expect(page.getByRole('textbox', { name: 'Email for harvest reminders' })).toHaveCount(1);
          await expect(page.getByRole('spinbutton', { name: 'Number of beds' })).toHaveCount(1);
          await expect(page.locator('#email')).toHaveAttribute('autocomplete', 'email');
          await page.evaluate(() => { window.submissions = 0; document.querySelector('form').addEventListener('submit', e => { e.preventDefault(); window.submissions++; }); });
          for (const [email, beds, valid] of [['', '2', false], ['bad', '2', false], ['a@b.test', '0', false], ['a@b.test', '21', false], ['a@b.test', '1', true], ['a@b.test', '20', true]]) {
            await page.locator('#email').fill(email); await page.locator('#beds').fill(beds);
            assert.equal(await page.locator('form').evaluate(el => el.checkValidity()), valid, `inputs ${email}/${beds}`);
            const before = await page.evaluate(() => window.submissions);
            await page.getByRole('button').click();
            assert.equal(await page.evaluate(() => window.submissions), before + Number(valid));
          }
          break;
        }
        case 'choices':
          await page.getByLabel('Planting season').focus(); await page.keyboard.press('End');
          await expect(page.locator('select')).toHaveValue('autumn');
          await page.getByLabel('Notes').fill('Beans\nPeas'); await expect(page.locator('textarea')).toHaveValue('Beans\nPeas');
          await page.getByLabel('Notes').fill(''); await expect(page.locator('textarea')).toHaveValue(''); break;
        case 'buttons':
          await expect(page.getByRole('button', { name: 'Save harvest' })).toBeDisabled();
          await expect(page.getByRole('button')).toHaveAccessibleDescription('Enter a harvest date to enable saving.');
          await page.evaluate(() => { window.clicks = 0; document.querySelector('button').onclick = () => window.clicks++; });
          await page.locator('button').evaluate(el => el.click()); assert.equal(await page.evaluate(() => window.clicks), 0);
          // Supplied application prerequisite, not behavior claimed for static markup.
          await page.locator('button').evaluate(el => { el.disabled = false; });
          await page.getByRole('button').click(); assert.equal(await page.evaluate(() => window.clicks), 1); break;
        case 'details':
          await expect(page.locator('details')).not.toHaveAttribute('open', '');
          await expect(page.locator('details p')).toBeHidden();
          await page.locator('summary').focus(); await page.keyboard.press('Enter');
          await expect(page.locator('details p')).toBeVisible();
          await page.keyboard.press('Space'); await expect(page.locator('details p')).toBeHidden(); break;
        case 'accessibility':
          await expect(page.getByRole('button', { name: 'Close planting tips', exact: true })).toHaveCount(1);
          await expect(page.getByRole('status')).toHaveText('No changes saved.');
          await page.getByRole('button').focus(); await expect(page.getByRole('button')).toBeFocused();
          // Application-supplied update: DOM live-region contract only, not screen-reader speech.
          await page.locator('#save-status').evaluate(el => { el.textContent = 'Saved planting tips.'; });
          await expect(page.getByRole('status')).toHaveText('Saved planting tips.'); break;
        case 'data':
          await expect(page.locator('article.garden-card')).toHaveAttribute('id', 'bed-7');
          await expect(page.locator('article')).toHaveAttribute('data-bed-id', '7');
          await expect(page.getByRole('heading')).toHaveText('North bed');
          await expect(page.locator('p')).toHaveText('Archived notes'); await expect(page.locator('p')).toBeHidden(); break;
        case 'bootstrap':
          await expect(page.getByRole('button', { name: 'Save notes' })).toBeEnabled();
          await expect(page.getByRole('status')).toHaveText('Your notes are saved.');
          assert.equal(await page.locator('button').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(13, 110, 253)');
          assert.equal(await page.getByRole('status').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(209, 231, 221)');
          await page.getByRole('button').focus(); await expect(page.getByRole('button')).toBeFocused(); break;
        case 'tailwind':
          for (const width of [320, 767, 768, 1200]) {
            await page.setViewportSize({ width, height: 900 });
            assert.equal(await page.locator('section').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), width < 768 ? 1 : 2);
          }
          assert.equal(await page.locator('article').evaluate(el => getComputedStyle(el).paddingTop), '16px');
          assert.notEqual(await page.locator('button').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
          await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: 'Save' })).toBeFocused();
          assert.equal(await page.locator('button').evaluate(el => getComputedStyle(el).outlineWidth), '2px'); break;
        default: await checkDepth({ page, card, load, failures, expect });
      }
      console.log(`Exact HTML card passed: ${card.id}`);
    }
    assert.deepEqual(errors, [], 'No catalog script errors');
  } finally { await context.close(); }
}
module.exports = { checkHtmlCatalog };
