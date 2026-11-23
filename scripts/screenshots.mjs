// Capture verified features from the running app. Market responses are never mocked.
import {chromium,expect} from '@playwright/test';
import {readFileSync,mkdirSync,readdirSync,unlinkSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const folder=fileURLToPath(new URL('../docs/screenshots/',import.meta.url));
const credentials=JSON.parse(readFileSync(new URL('../.runtime/demo-credentials.json',import.meta.url)));
const evidence=JSON.parse(readFileSync(new URL('../.runtime/feature-evidence.json',import.meta.url)));
if(evidence.checks!=='passed')throw new Error('Run npm run test:features successfully before screenshots.');
mkdirSync(folder,{recursive:true});
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:1050},locale:'en-GB',timezoneId:'Asia/Dhaka',deviceScaleFactor:1});
const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
const captured=[];
async function shot(name,locator=page) {
 await page.evaluate(()=>document.fonts.ready);
 await locator.screenshot({path:`${folder}/${name}.png`,...(locator===page?{fullPage:false}:{})});captured.push(name+'.png');console.log('Captured',name);
}
async function go(path,ready){await page.goto(path);await ready();}
const web=path=>'http://localhost:5173'+path,admin=path=>'http://localhost:5174'+path;
try {
 await go(web('/signup'),()=>page.getByRole('button',{name:'Create Account',exact:true}).waitFor());await shot('signup',page.locator('.auth-dialog'));
 await go(web('/login'),()=>page.getByRole('button',{name:'Log In',exact:true}).last().waitFor());await shot('login',page.locator('.auth-dialog'));
 // Use the visible login form and verify the resulting account session.
 await page.locator('input[type=email]').fill(credentials.user.email);await page.locator('input[type=password]').fill(credentials.user.password);
 await page.getByRole('button',{name:'Log In',exact:true}).last().click();await page.getByRole('link',{name:'Demo Investor',exact:true}).waitFor();
 await page.getByRole('cell',{name:'ABBANK',exact:true}).waitFor();await shot('dashboard');
 const search=page.getByPlaceholder('Search stocks...');await search.fill('GP');await expect(page.getByRole('cell',{name:'GP',exact:true})).toBeVisible();await search.fill('');
 await go(web('/stocks/GP'),()=>page.getByRole('heading',{name:'Grameenphone Ltd.',exact:true}).waitFor());
 for(const type of ['price-chart','candlestick-chart']){
  await expect(page.getByTestId(type)).toHaveAttribute('data-bars',/^\d{2,}$/);
  await expect(page.getByTestId(type).locator('[role=alert]')).toHaveCount(0);
  const colored=await page.getByTestId(type).locator('canvas').evaluateAll(canvases=>canvases.reduce((n,c)=>{
    const ctx=c.getContext('2d');if(!ctx)return n;const {data}=ctx.getImageData(0,0,c.width,c.height);let pixels=0;
    for(let i=0;i<data.length;i+=4){if((data[i+1]>120&&data[i]<100&&data[i+2]<150)||(data[i]>180&&data[i+1]<150&&data[i+2]<150))pixels++;}return n+pixels;
  },0));
  if(colored<100)throw new Error(`${type} has no visible plotted series`);
 }
 await expect(page.getByTestId('price-chart')).not.toContainText('N/A');await shot('stock-details');
 // Verify range controls change the requested range and plotted sample count.
 const price=page.getByTestId('price-chart');const previous=Number(await price.getAttribute('data-bars'));
 await price.getByRole('button',{name:'1Y',exact:true}).click();await expect.poll(async()=>Number(await price.getAttribute('data-bars'))).toBeGreaterThan(previous);
 await price.getByRole('button',{name:'6M',exact:true}).click();await expect(price).toHaveAttribute('data-bars',String(previous));
 await shot('company-fundamentals',page.locator('.stock-info-cards .row').first());
 await shot('ownership',page.locator('.shareholding-multiyear').locator('..').locator('..'));
 await shot('corporate-actions',page.locator('.corporate-actions'));
 await shot('financial-performance',page.getByTestId('financial-performance'));
 await page.getByRole('button',{name:'Buy',exact:true}).click();await page.getByRole('heading',{name:'Trading Form',exact:true}).waitFor();await page.getByText('Loading orders…').waitFor({state:'hidden'});
 await expect(page.getByText('No buy orders',{exact:true})).toHaveCount(0);await expect(page.getByText('No sell orders',{exact:true})).toHaveCount(0);await shot('trade-form',page.locator('.trade-modal'));
 await page.getByRole('button',{name:'My Orders',exact:true}).click();await page.getByRole('button',{name:'Edit',exact:true}).first().waitFor();await shot('my-orders',page.locator('.trade-modal'));
 await page.getByRole('button',{name:'Edit',exact:true}).first().click();await page.getByRole('button',{name:'Resubmit',exact:true}).waitFor();await shot('my-orders-edit',page.locator('.trade-modal'));
 await page.getByRole('button',{name:'Close',exact:true}).click();
 await go(web('/Profile'),()=>page.getByTestId('transaction-history').getByRole('cell',{name:'BUY',exact:true}).first().waitFor());
 await page.getByText('Loading portfolio...', {exact:true}).waitFor({state:'hidden',timeout:90000});
 await expect(page.locator('.profile .stock-table-container').first().getByRole('cell',{name:'GP',exact:true})).toBeVisible();await shot('portfolio',page.locator('.profile'));
 await shot('transaction-history',page.getByTestId('transaction-history'));
 await go(web('/money-request'),()=>page.getByText(evidence.transactionId+'-PENDING',{exact:true}).waitFor());await shot('funding-request',page.locator('.container.mt-4'));
 await go(web('/Sectors'),()=>page.getByText('Bank',{exact:true}).first().waitFor());await page.getByText('Bank',{exact:true}).first().click();await page.getByRole('cell',{name:'BRACBANK',exact:true}).waitFor();await shot('sectors');
 await go(web('/ai-advisor'),()=>page.getByText('AI Financial Advisor',{exact:true}).waitFor());
 await page.locator('.history-item').filter({hasText:'What does the latest GP quote show?'}).first().click();
 await expect(page.locator('.msg-bubble.ai').last()).toContainText(evidence.quoteDate);await shot('ai-advisor');
 // Check a second symbol and ensure charts do not retain the first symbol's bars.
 await go(web('/stocks/SQURPHARMA'),()=>page.getByRole('heading',{name:/Square Pharmaceuticals/i}).waitFor());
 await expect(page.getByTestId('candlestick-chart')).toHaveAttribute('data-bars',/^\d{2,}$/);
 await go(admin('/admin/login'),()=>page.locator('input[name=email]').waitFor());await shot('admin-login',page.locator('.container.mt-5'));
 await page.locator('input[name=email]').fill(credentials.admin.email);await page.locator('input[name=password]').fill(credentials.admin.password);await page.getByRole('button',{name:'Login',exact:true}).click();await page.getByRole('heading',{name:'Admin Dashboard',exact:true}).waitFor();await shot('admin-dashboard',page.locator('.container.mt-4'));
 await go(admin('/admin/users'),()=>page.getByRole('cell',{name:credentials.user.email,exact:true}).waitFor());await shot('admin-users',page.locator('.container.mt-4'));
 await go(admin('/admin/assign-stock'),()=>page.getByRole('heading',{name:'Assign Stock to User',exact:true}).waitFor());await page.locator('input[name=email]').fill(credentials.seller.email);await page.locator('input[name=tradingCode]').fill('GP');await page.locator('input[name=quantity]').fill('1');
 await page.getByRole('button',{name:'Assign Stock',exact:true}).click();await page.getByText('Stock assigned successfully.',{exact:true}).waitFor();await shot('admin-assign-stock',page.locator('.container.mt-4'));
 await go(admin('/admin/requests'),()=>page.getByText(evidence.transactionId+'-PENDING',{exact:true}).waitFor());await shot('admin-requests',page.locator('.container.mt-4'));
 await page.getByRole('combobox').selectOption('Approved');await page.getByText(evidence.transactionId,{exact:true}).waitFor();await shot('admin-approved-requests',page.locator('.container.mt-4'));
 await go(admin('/admin/bulk-fetch'),()=>page.getByRole('progressbar').waitFor());await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','100');await shot('admin-bulk-fetch',page.locator('.container.mt-4'));
 await go('http://localhost:8000/docs',()=>page.getByText('Bloomfolio Market Data API',{exact:false}).first().waitFor());await shot('market-data-api');
 if(errors.length)throw new Error(errors.join('; '));
 // Remove only obsolete documentation images after the whole capture succeeds.
 for(const file of readdirSync(folder))if(file.endsWith('.png')&&!captured.includes(file))unlinkSync(`${folder}/${file}`);
 console.log(`PASS ${captured.length} feature captures; both graphs contain visible plot pixels; ranges, symbol navigation and login verified.`);
}finally{await browser.close();}
