const assert = require('node:assert/strict');
// Every branch consumes a document built from the unchanged practical card.
async function checkDepth({ page, card, load, failures, expect }) {
  const data = () => page.locator('form').evaluate(el => [...new FormData(el).entries()].map(([key,value]) => [key, typeof value === 'string' ? value : value.name]));
  const valid = () => page.locator('form').evaluate(el => el.checkValidity());
  switch (card.id) {
    case 'document-direction':
      assert.deepEqual(await page.evaluate(() => [document.documentElement.lang, document.documentElement.dir, getComputedStyle(document.body).direction, document.querySelector('meta[name=description]').content]), ['ar','rtl','rtl','Local planting notes in Arabic and English']);
      await expect(page.locator('p[lang=en]')).toHaveCSS('direction', 'ltr');
      await expect(page.locator('bdi')).toHaveCSS('unicode-bidi','isolate'); break;
    case 'document-base':
      assert.deepEqual(await page.locator('a').evaluateAll(els => els.map(el=>el.href)), ['http://catalog.test/guides/beans.html','http://catalog.test/help']); break;
    case 'assets-defer':
      await expect(page.locator('#deferred-status')).toHaveText('Waiting');
      await page.getByRole('button').click(); await expect(page.locator('#deferred-status')).toHaveText('Ready'); break;
    case 'assets-async':
      await expect(page.locator('output')).toHaveText('Weather widget ready');
      failures.add('async-widget.js'); await load(); await expect(page.locator('output')).toHaveText('Weather unavailable');
      failures.clear(); await load(); await expect(page.locator('output')).toHaveText('Weather widget ready'); break;
    case 'assets-module-error':
      await expect(page.getByRole('status')).toHaveText('Tools ready');
      failures.add('optional-tools.js'); await load();
      await expect(page.getByRole('status')).toHaveText('Tools unavailable; basic editing still works.');
      failures.clear(); await load(); await expect(page.getByRole('status')).toHaveText('Tools ready'); break;
    case 'semantics-sections':
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.getByRole('region', {name:'Weekly forecast'})).toHaveCount(1);
      await expect(page.getByRole('complementary', {name:'Water restrictions'})).toHaveCount(1);
      assert.deepEqual(await page.getByRole('heading').allTextContents(), ['Garden forecast','Weekly forecast','Water restrictions']); break;
    case 'semantics-navigation':
      await expect(page.getByRole('navigation', {name:'Primary'})).toHaveCount(1);
      await expect(page.getByRole('navigation', {name:'Guide pages'})).toHaveCount(1);
      await expect(page.getByRole('article', {name:'Planting diary'})).toHaveCount(1); break;
    case 'text-machine-values':
      await expect(page.locator('time')).toHaveAttribute('datetime','2026-10-16T09:00:00+08:00');
      await expect(page.locator('time')).toHaveText('Friday at 9 am Perth time');
      await expect(page.locator('data')).toHaveAttribute('value','SKU-BEAN-04');
      await expect(page.locator('data')).toHaveText('Climbing beans'); break;
    case 'text-quotation':
      await expect(page.locator('blockquote')).toHaveAttribute('cite','/sources/garden-notes');
      await expect(page.locator('cite')).toHaveText('Garden notes');
      await expect(page.locator('q')).toHaveText('a patient experiment'); await expect(page.locator('a')).toHaveCount(0); break;
    case 'tables-complex':
      await expect(page.getByRole('table', {name:'Harvest by season and crop'})).toHaveCount(1);
      assert.deepEqual(await page.locator('td').evaluateAll(els=>els.map(el=>[el.textContent,...el.headers.split(' ').map(id=>document.getElementById(id).textContent)])), [['8','Beans','Spring','Weight (kg)'],['2','Beans','Spring','Beds']]);
      await expect(page.locator('#spring')).toHaveAttribute('colspan','2'); break;
    case 'tables-empty':
      await expect(page.getByRole('table',{name:'Seed inventory'})).toHaveCount(1);
      await expect(page.getByRole('cell')).toHaveAttribute('colspan','2');
      await expect(page.getByRole('cell')).toHaveText('No seed packets recorded.');
      await expect(page.getByRole('status')).toHaveText('0 crops in inventory.'); break;
    case 'form-groups-radio':
      await expect(page.getByRole('group',{name:'Delivery speed'})).toHaveCount(1);
      assert.deepEqual(await data(), [['speed','standard']]);
      await page.getByLabel('Express', {exact:true}).check();
      await expect(page.getByLabel('Standard',{exact:true})).not.toBeChecked();
      assert.deepEqual(await data(), [['speed','express']]); break;
    case 'form-groups-suggestions':
      await expect(page.getByLabel('Crop name')).toHaveAttribute('list','crops');
      assert.equal(await valid(), false);
      await page.getByLabel('Crop name').fill('Kale'); await page.getByLabel('Season',{exact:true}).selectOption('autumn');
      assert.equal(await valid(),true); assert.deepEqual(await data(),[['crop','Kale'],['season','autumn']]);
      await page.getByLabel('Season',{exact:true}).selectOption(''); assert.equal(await valid(),false); break;
    case 'form-hints-address': case 'form-hints-code': {
      const input = page.locator('input');
      await expect(input).toHaveAttribute('inputmode','numeric');
      await expect(input).toHaveAttribute('autocomplete',card.id.endsWith('address') ? 'section-order shipping postal-code' : 'one-time-code');
      for(const [value, expected] of [['',false],['abc',false],['123',false],[card.id.endsWith('address')?'0123':'012345',true]]) {
        await input.fill(value); assert.equal(await valid(), expected, value);
        await expect(input).toHaveValue(value);
      }
      assert.equal((await data())[0][1], card.id.endsWith('address')?'0123':'012345'); break;
    }
    case 'form-state-readonly':
      await expect(page.getByLabel('Account key')).toHaveAttribute('readonly','');
      await page.getByLabel('Account key').focus(); await expect(page.getByLabel('Account key')).toBeFocused();
      await expect(page.getByLabel('Internal note')).toBeDisabled();
      assert.deepEqual(await data(),[['account','BED-07']]);
      await page.getByLabel('Account key').evaluate(el=>{el.value='';});
      assert.equal(await valid(),true); assert.deepEqual(await data(),[['account','']]); break;
    case 'form-state-fieldset':
      await expect(page.getByLabel('Street',{exact:true})).toBeDisabled();
      await expect(page.getByLabel('Deliver seeds')).toBeEnabled(); assert.deepEqual(await data(),[]);
      await page.getByLabel('Deliver seeds').check(); assert.deepEqual(await data(),[['deliver','on'],['street','7 Garden Lane']]);
      await page.getByLabel('Street',{exact:true}).fill(''); assert.equal(await valid(),false);
      await page.getByLabel('Deliver seeds').uncheck(); assert.equal(await valid(),true); assert.deepEqual(await data(),[]); break;
    case 'upload-avatar': case 'upload-batch': {
      const input=page.locator('input[type=file]');
      assert.equal(await valid(), false);
      const batch=card.id==='upload-batch';
      const files=batch ? [{name:'first.txt',mimeType:'text/plain',buffer:Buffer.from('beans')},{name:'second.txt',mimeType:'text/plain',buffer:Buffer.from('peas')}] : [{name:'avatar.png',mimeType:'image/png',buffer:Buffer.from([137,80,78,71])}];
      await input.setInputFiles(files); assert.equal(await valid(),true);
      assert.deepEqual((await data()).filter(([key])=>key===(batch?'notes':'avatar')).map(([,name])=>name),files.map(f=>f.name));
      const [sent] = await Promise.all([page.waitForRequest(r=>new URL(r.url()).pathname==='/upload'), page.locator('button').click()]);
      assert.equal(sent.method(),'POST'); assert.match(sent.headers()['content-type'],/^multipart\/form-data; boundary=/);
      for(const f of files) assert.ok(sent.postDataBuffer().includes(f.buffer));
      await expect(page.locator('body')).toHaveText('Upload accepted locally');
      await load(); await input.setInputFiles({name:'bad.exe',mimeType:'application/x-bad',buffer:Buffer.from('invalid')});
      assert.equal(await valid(),true, 'accept is not server validation');
      await page.locator('button').click(); await expect(page.locator('body')).toHaveText('File type rejected locally');
      await load(); await input.setInputFiles(files); await page.locator('button').click(); await expect(page.locator('body')).toHaveText('Upload accepted locally'); break;
    }
    case 'validation-pattern': case 'validation-custom': {
      const pattern=card.id==='validation-pattern', input=page.locator('input'), error=page.getByRole('alert'), result=page.getByRole('status');
      await page.getByRole('button').click(); await expect(result).toHaveText('');
      await input.fill(pattern?'ab-7':'reserved'); await page.getByRole('button').click();
      await expect(input).toHaveAttribute('aria-invalid','true'); await expect(error).toHaveText(pattern?'Use a code such as AB-07.':'Choose another crop name.');
      await input.fill(pattern?'AB-07':'Beans'); await expect(error).toHaveText('');
      await page.getByRole('button').click(); await expect(result).toHaveText(pattern?'Code accepted locally.':'Name accepted locally.');
      assert.equal(await valid(), true); break;
    }
    case 'dialog-confirm': case 'dialog-edit': {
      const edit=card.id==='dialog-edit', dialog=page.getByRole('dialog'), opener=page.locator('#open');
      await opener.click(); await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleName(edit?'Bed label':'Record harvest?');
      assert.equal(await page.locator('dialog').evaluate(el=>el.matches(':modal')),true);
      if(edit) {
        await expect(page.getByLabel('Label',{exact:true})).toBeFocused();
        await page.getByRole('button',{name:'Save',exact:true}).click(); await expect(dialog).toBeVisible();
        assert.equal(await page.locator('input').evaluate(el=>el.validity.valueMissing),true);
        await page.getByRole('button',{name:'Cancel',exact:true}).click(); await expect(dialog).toBeHidden();
        await expect(opener).toBeFocused(); await opener.click(); await page.getByLabel('Label',{exact:true}).fill('North');
        await page.getByRole('button',{name:'Save',exact:true}).click(); await expect(page.getByRole('status')).toHaveText('North');
      } else {
        await expect(page.getByRole('button',{name:'Cancel',exact:true})).toBeFocused();
        await page.getByRole('button',{name:'Record',exact:true}).click(); await expect(page.getByRole('status')).toHaveText('Recorded locally');
      }
      await expect(dialog).toBeHidden(); await expect(opener).toBeFocused();
      await opener.click(); await page.keyboard.press('Escape'); await expect(dialog).toBeHidden(); await expect(opener).toBeFocused();
      await expect(page.getByRole('status')).toHaveText(edit?'Unchanged':'Cancelled'); break;
    }
    case 'popover-auto': case 'popover-manual': {
      const manual=card.id==='popover-manual', panel=page.locator('[popover]'), opener=page.locator('[popovertarget]').first();
      await expect(panel).toBeHidden(); await opener.click(); await expect(panel).toBeVisible();
      await page.keyboard.press('Escape'); await expect(panel)[manual?'toBeVisible':'toBeHidden']();
      if(!manual) await opener.click();
      await page.locator('#outside').click(); await expect(panel)[manual?'toBeVisible':'toBeHidden']();
      if(manual) {await page.getByRole('button',{name:'Close checklist'}).click(); await expect(panel).toBeHidden();}
      else {await opener.click(); await opener.click(); await expect(panel).toBeHidden();}
      const target = await opener.getAttribute('popovertarget');
      await opener.evaluate(el=>el.setAttribute('popovertarget','missing-panel'));
      await opener.click(); await expect(panel).toBeHidden();
      await opener.evaluate((el,target)=>el.setAttribute('popovertarget',target),target);
      await opener.click(); await expect(panel).toBeVisible();
      break;
    }
    case 'picture-art-direction': case 'picture-resolution': {
      const art=card.id==='picture-art-direction';
      for (const [width,filename] of [[320, art?'seedling.svg':'small.svg'],[1000,art?'wide.svg':'large.svg']]) {
        await page.setViewportSize({width,height:900}); await load();
        await expect.poll(()=>page.locator('img').evaluate(el=>el.complete && el.naturalWidth>0)).toBe(true);
        assert.equal(new URL(await page.locator('img').evaluate(el=>el.currentSrc)).pathname,`/${filename}`);
      }
      if(art) {await page.locator('source').evaluate(el=>el.remove()); await expect.poll(()=>page.locator('img').evaluate(el=>new URL(el.currentSrc).pathname)).toBe('/seedling.svg');}
      failures.add(art?'wide.svg':'large.svg'); await load();
      await expect.poll(()=>page.locator('img').evaluate(el=>el.complete)).toBe(true);
      assert.equal(await page.locator('img').evaluate(el=>el.naturalWidth),0);
      await expect(page.getByRole('img')).toHaveAccessibleName(art?'Seedling in the garden':'Planting diagram');
      failures.clear(); await load(); await expect.poll(()=>page.locator('img').evaluate(el=>el.naturalWidth>0)).toBe(true); break;
    }
    case 'media-video': case 'media-audio': {
      const video=card.id==='media-video', media=page.locator(video?'video':'audio'), filename=video?'garden.webm':'garden.wav';
      await expect.poll(()=>media.evaluate(el=>el.readyState)).toBeGreaterThanOrEqual(1);
      assert.equal(await media.evaluate(el=>el.controls && el.duration>0),true);
      if(video) {
        await expect.poll(()=>page.locator('track').evaluate(el=>el.readyState)).toBe(2);
        assert.equal(await page.locator('track').evaluate(el=>el.track.cues[0].text),'[Silent title card: Garden fixture]');
      }
      await media.evaluate(el=>el.play()); await expect.poll(()=>media.evaluate(el=>el.paused)).toBe(false);
      await media.evaluate(el=>el.pause()); assert.equal(await media.evaluate(el=>el.paused),true);
      await expect(page.getByRole('link')).toHaveAttribute('href','./transcript.html');
      failures.add(filename); await load();
      // source-list exhaustion reports error on source; the video card handles it explicitly.
      await expect(page.getByRole('status')).toHaveText(video?'Video unavailable; use the transcript.':'Audio unavailable; use the transcript.');
      failures.clear(); await load(); await expect.poll(()=>media.evaluate(el=>el.readyState)).toBeGreaterThanOrEqual(1);
      await expect(page.getByRole('status')).toHaveText(''); break;
    }
    case 'iframe-static': case 'iframe-script': {
      const scripted=card.id==='iframe-script', frame=page.frameLocator('iframe');
      await expect(page.locator('iframe')).toHaveAttribute('title',scripted?'Interactive garden preview':'Static garden preview');
      await expect(frame.getByRole('heading')).toHaveText('Garden preview');
      if(scripted) {
        await expect(page.getByRole('status')).toHaveText('Isolated preview ready');
        await expect(frame.locator('body')).toHaveAttribute('data-ran','yes');
        await expect(frame.locator('body')).toHaveAttribute('data-blocked','yes');
        assert.equal(await page.locator('body').getAttribute('data-compromised'),null);
        await page.evaluate(()=>{document.querySelector('#frame-status').textContent='Waiting for preview'; window.dispatchEvent(new MessageEvent('message',{origin:'null',data:'preview-ready',source:window}));});
        await expect(page.getByRole('status')).toHaveText('Waiting for preview');
      } else assert.equal(await frame.locator('body').getAttribute('data-ran'),null);
      assert.equal(await page.locator('iframe').evaluate(el=>{try{return el.contentWindow.document.body.textContent;}catch{return 'blocked';}}),'blocked'); break;
    }
    case 'bootstrap-validation':
      await expect(page.locator('.invalid-feedback')).toBeHidden();
      await page.getByRole('button').click(); await expect(page.locator('.invalid-feedback')).toBeVisible();
      await expect(page.locator('input')).toHaveAttribute('aria-invalid','true');
      await page.getByLabel('Contact email').fill('invalid'); await page.getByRole('button').click();
      await expect(page.locator('.invalid-feedback')).toBeVisible(); await expect(page.getByRole('status')).toHaveText('');
      await page.getByLabel('Contact email').fill('a@b.test'); await page.getByRole('button').click();
      await expect(page.locator('.invalid-feedback')).toBeHidden(); await expect(page.getByRole('status')).toHaveText('Email accepted locally.');
      await expect.poll(()=>page.locator('input').evaluate(el=>getComputedStyle(el).borderColor)).toBe('rgb(25, 135, 84)'); break;
    case 'bootstrap-disclosure':
      await expect(page.getByRole('navigation',{name:'Garden pages'})).toHaveCount(1);
      await expect(page.getByRole('link',{name:'Overview'})).toHaveAttribute('aria-current','page');
      assert.equal(await page.locator('.nav').evaluate(el=>getComputedStyle(el).display),'flex');
      await expect(page.locator('details p')).toBeHidden();
      await page.locator('summary').focus(); await page.keyboard.press('Enter'); await expect(page.locator('details p')).toBeVisible();
      await page.keyboard.press('Space'); await expect(page.locator('details p')).toBeHidden(); break;
    case 'tailwind-form':
      for(const [value,expected] of [['',false],['0',false],['1',true],['10',true],['11',false]]) {
        await page.locator('input').fill(value); assert.equal(await valid(),expected);
        assert.equal(await page.locator('input').evaluate(el=>getComputedStyle(el).borderColor),expected?'rgb(0, 0, 0)':'oklch(0.577 0.245 27.325)');
      }
      await page.locator('input').focus(); await expect(page.locator('input')).toBeFocused(); break;
    case 'tailwind-status':
      for(const width of [320,767,768,1200]) {
        await page.setViewportSize({width,height:900});
        assert.equal(await page.locator('section').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),width<768?1:2);
      }
      await expect(page.getByRole('region',{name:'Garden tasks'})).toHaveCount(1);
      await expect(page.getByRole('status')).toHaveText('No pending tasks.');
      await expect(page.locator('details ul')).toBeHidden(); await page.locator('summary').focus(); await page.keyboard.press('Enter'); await expect(page.locator('details ul')).toBeVisible();
      await page.keyboard.press('Space'); await expect(page.locator('details ul')).toBeHidden(); break;
    default: throw Error(`Missing assertions for ${card.id}`);
  }
}
module.exports = { checkDepth };
