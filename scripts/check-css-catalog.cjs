// Exact catalog source, real pinned Chromium and Tailwind/Bootstrap dependencies.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const web = path.join(root, 'playground/web');
const fixtures = require('../playground/web/css-fixtures.json');
const cards = require('../packs/css.json').cards;
function compile(card, code = card.code) {
  if (card.topics[0] !== 'tailwind') return code;
  const temp = fs.mkdtempSync(path.join(web, '.css-check-'));
  try {
    const input = path.join(temp, 'input.css'), output = path.join(temp, 'output.css');
    fs.writeFileSync(input, code);
    const cli = require.resolve('../playground/web/node_modules/@tailwindcss/cli/dist/index.mjs');
    execFileSync(process.execPath, [cli, '-i', input, '-o', output, '--minify'], { cwd: web, stdio: 'pipe' });
    return fs.readFileSync(output, 'utf8');
  } finally { fs.rmSync(temp, {recursive:true, force:true}); }
}
function documentFor(card, css, fixture) {
  const bootstrap = card.topics[0] === 'bootstrap' ? fs.readFileSync(path.join(web,'node_modules/bootstrap/dist/css/bootstrap.min.css'),'utf8') : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${card.title}</title><style>body { margin:0; }</style><style>${bootstrap}</style><style id="catalog-css">${css}</style></head><body>${fixture.html}</body></html>`;
}
async function act(page, a) {
  if (a.css) await page.addStyleTag({content:a.css});
  if (a.attr) await page.locator(a.attr[0]).first().evaluate((el,[name,value])=>el.setAttribute(name,value),a.attr.slice(1));
  if (a.class) await page.locator(a.class[0]).first().evaluate((el,name)=>el.classList.add(name),a.class[1]);
  if (a.text) await page.locator(a.text[0]).first().evaluate((el,text)=>el.textContent=text,a.text[1]);
  if (a.value) await page.locator(a.value[0]).fill(a.value[1]);
  if (a.scroll) await page.locator(a.scroll[0]).evaluate((el,y)=>el.scrollTop=y,a.scroll[1]);
  if (a.scrollX) await page.locator(a.scrollX[0]).evaluate((el,x)=>el.scrollLeft=x,a.scrollX[1]);
  if (a.hover) await page.locator(a.hover).first().hover();
  if (a.focus) { await page.keyboard.press('Tab'); await page.locator(a.focus).first().focus(); }
  // Force style resolution across two animation frames before manipulating live timelines.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.evaluate(()=>{for(const animation of document.getAnimations())if(animation instanceof CSSTransition)animation.finish();});
  if (a.seek) await page.locator(a.seek[0]).evaluate((el,t)=>{for(const a of el.getAnimations()){a.pause();a.currentTime=t;}},a.seek[1]);
  if (a.finish) await page.locator(a.finish).evaluate(el=>{for(const a of el.getAnimations())a.finish();});
}
async function check(page, e, label) {
  const actual = await page.evaluate(e=>{
    const el=document.querySelector(e.sel), rect=el?.getBoundingClientRect();
    if (!el) throw Error(`Missing ${e.sel}`);
    switch(e.type){
      case 'style': return getComputedStyle(el,e.pseudo||null)[e.prop];
      case 'width': case 'widthBetween': return rect.width;
      case 'height': return rect.height;
      case 'overflow': return el.scrollWidth > el.clientWidth;
      case 'columns': return getComputedStyle(el).gridTemplateColumns.split(' ').length;
      case 'topDelta': return rect.top-document.querySelector(e.other).getBoundingClientRect().top;
      case 'leftDelta': return rect.left-document.querySelector(e.other).getBoundingClientRect().left;
      case 'hit': return document.elementFromPoint(e.x,e.y)===el;
      case 'scrollTop': return el.scrollTop;
      case 'animations': return el.getAnimations().length;
      case 'contrast': {
        const luminance = color => {
          const channels=color.match(/[\d.]+/g).slice(0,3).map(Number).map(c=>c/255).map(c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4);
          return channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;
        };
        const style=getComputedStyle(el), fg=luminance(style.color), bg=luminance(style.backgroundColor);
        return (Math.max(fg,bg)+0.05)/(Math.min(fg,bg)+0.05);
      }
      case 'disabled': return el.disabled;
      case 'brokenImage': return el.complete && el.naturalWidth===0;
      default: throw Error(`Unknown expectation ${e.type}`);
    }
  },e);
  if(e.type==='contrast') assert.ok(actual>=e.value, label+': contrast '+actual+' >= '+e.value);
  else if(e.type==='widthBetween') assert.ok(actual>=e.min&&actual<=e.max,`${label}: width ${actual} in [${e.min},${e.max}]`);
  else if(e.type==='hit'||e.type==='brokenImage') assert.equal(actual,true,label);
  else if(typeof e.value==='number') assert.ok(Math.abs(actual-e.value)<0.6,`${label}: ${e.type} ${e.sel} expected ${e.value}, got ${actual}`);
  else assert.equal(actual,e.value,`${label}: ${e.type} ${e.sel} ${e.prop||''}`);
}
async function checkCssCatalog(browser, overrides={}) {
  assert.deepEqual(Object.keys(fixtures).sort(),cards.filter(c=>!['selectors','cascade','box','values','colors','typography','display','flexbox','grid','position','overflow','states','pseudo-elements','media','container','variables','transitions','animation','bootstrap','tailwind'].includes(c.id)).map(c=>c.id).sort(),'Every expansion card needs an exact fixture');
  let count=0;
  for(const [id,fixture] of Object.entries(fixtures).filter(([id])=>!Object.keys(overrides).length || id in overrides)) {
    const card=cards.find(c=>c.id===id); assert.ok(card,id);
    assert.deepEqual(fixture.cases.map(c=>c.situation),['happy','edge','error'],id);
    const css=compile(card,overrides[id]??card.code);
    for(const c of fixture.cases) {
      const context=await browser.newContext({viewport:{width:c.action.viewport||800,height:600},reducedMotion:'no-preference',colorScheme:'light',...c.action.media});
      const page=await context.newPage();
      try {
        await page.route('**/*',route=>route.abort()); // data URLs and inline styles only
        await page.setContent(documentFor(card,css,fixture));
        await act(page,c.action);
        assert.ok(c.expect.length>0,`${id} ${c.situation} assertions`);
        for(const e of c.expect) await check(page,e,`${id} ${c.situation}`);
        if(id==='selectors-has'&&c.situation==='error') {
          await page.locator('input').fill('recovered@example.test');
          await check(page,{type:'style',sel:'.field',prop:'borderTopColor',value:'rgba(0, 0, 0, 0)'},'Native validation recovery');
        }
        count++;
      } finally { await context.close(); }
    }
  }
  console.log(`Exact CSS catalog: ${count/3} cards, ${count} happy/edge/error situations; Chromium ${browser.version()}.`);
}
function generateGallery(){
  const dir=path.join(web,'css-catalog'); fs.mkdirSync(dir,{recursive:true});
  for(const [id,fixture] of Object.entries(fixtures)){
    const card=cards.find(c=>c.id===id), css=compile(card);
    fs.writeFileSync(path.join(dir,id+'.html'),documentFor(card,css,fixture));
    fs.writeFileSync(path.join(dir,id+'.css'),card.code+'\n');
  }
  const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  fs.writeFileSync(path.join(web,'css-catalog.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><title>Exact CSS catalog</title><h1>CSS depth fixtures</h1><p>Each link opens exact catalog CSS with documented HTML surroundings. Use DevTools for the case changes below; reload between independent cases.</p>${Object.entries(fixtures).map(([id,f])=>`<section><h2><a href="css-catalog/${id}.html">${escape(cards.find(c=>c.id===id).title)}</a></h2><p>${escape(cards.find(c=>c.id===id).explanation)}</p><ul>${f.cases.map(c=>`<li>${c.situation}: ${escape(c.note)} <code>${escape(JSON.stringify(c.action))}</code></li>`).join('')}</ul></section>`).join('')}</html>`);
  console.log('Generated /css-catalog.html and exact-source manual fixtures.');
}
module.exports={checkCssCatalog,generateGallery};
if(require.main===module) {
  if(process.argv.includes('--generate')) generateGallery();
  else (async()=>{const {chromium}=require('../playground/web/node_modules/playwright');const browser=await chromium.launch({executablePath:process.env.WEB_BROWSER_PATH||undefined});try{await checkCssCatalog(browser);
    if(process.argv.includes('--mutation-check')) {
      for(const [id,from,to] of [['flex-minimum','min-width: 0','min-width: 500px'],['grid-auto-fit','min(100%, 160px)','160px'],['logical-direction','margin-inline-start: 20px','margin-left: 20px'],['sticky-heading','top:0','top:auto'],['preferences-motion','animation:none','animation:drift 1s linear infinite'],['cascade-revert-layer','color: revert-layer','color: red']]){
        const code=cards.find(c=>c.id===id).code;assert.ok(code.includes(from),id);
        await assert.rejects(checkCssCatalog(browser,{[id]:code.replace(from,to)}),undefined,'Mutation must fail: '+id);
        console.log('Catalog-only CSS mutation rejected: '+id);
      }
    }
  }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
}
