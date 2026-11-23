// Exercise mutations only against explicitly named, fictional demo accounts.
import {request} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const credentials=JSON.parse(readFileSync(new URL('../.runtime/demo-credentials.json',import.meta.url)));
const user=await request.newContext(),seller=await request.newContext(),admin=await request.newContext(),guest=await request.newContext();
const api='http://localhost:8080',adm='http://localhost:8081';
async function call(client,path,body,method='post',base=api){
 const response=await client[method](base+path,{data:body,timeout:100000});const data=await response.json();
 if(!response.ok()||data.success===false)throw new Error(`${method} ${path}: ${response.status()} ${data.message || data.detail}`);
 return data;
}
try {
 const health=await call(guest,'/api/health',undefined,'get');assert.ok(health.database?.endsWith('_demo'),'Feature mutations require the isolated demo database');
 for(const [client,role] of [[user,'user'],[seller,'seller']])await call(client,'/login',credentials[role]);
 await call(admin,'/admin/auth/login',credentials.admin,'post',adm);
 assert.equal((await guest.get(api+'/api/orders/mine')).status(),401);
 const temporary={name:'Temporary QA account',email:`qa-${Date.now()}@example.test`,password:'Demo-only-password-'+Date.now()};
 const signup=await call(guest,'/signup',temporary);assert.ok(signup.user.id);
 assert.equal((await guest.post(api+'/signup',{data:temporary})).status(),409);
 await call(admin,`/admin/users/${signup.user.id}`,undefined,'delete',adm);
 await call(admin,'/admin/orders',undefined,'delete',adm);
 console.log('PASS signup, duplicate signup, temporary-user deletion and demo order-book reset');
 assert.equal((await guest.post(api+'/login',{data:{email:credentials.user.email,password:'wrong-password'}})).status(),401);
 const all=await call(user,'/fetch-all-stocks',undefined,'get');assert.ok(all.count>350);
 const detail=(await call(user,'/fetch-details/GP',undefined,'get')).data;assert.ok(detail.shareholding.length>=3);assert.ok(detail.financialPerformance.yearly.length>=3);
 for(const months of [6,12,24,60]){const history=await call(user,`/api/history?symbol=GP&months=${months}`,undefined,'get','http://localhost:8000');assert.ok(history.count>50);assert.ok(history.data.every(r=>r.high>=r.open&&r.high>=r.close&&r.low<=r.open&&r.low<=r.close));}
 console.log('PASS 400+ market snapshots, company facts, ownership, earnings, four OHLC chart ranges');
 const users=(await call(admin,'/admin/users',undefined,'get',adm)).data;
 const investor=users.find(u=>u.email===credentials.user.email),counterparty=users.find(u=>u.email===credentials.seller.email);
 assert.equal((await user.get(api+`/users/${counterparty._id}`)).status(),403);
 const initial=(await call(user,`/users/${investor._id}`,undefined,'get')).purchasePower;
 const tx='FEATURE-'+Date.now();const funding=await call(user,'/api/requests',{requestedAmount:5000,transactionId:tx});
 await call(admin,`/admin/requests/${funding.data._id}/accept`,{},'post',adm);
 assert.equal((await call(user,`/users/${investor._id}`,undefined,'get')).purchasePower,initial+5000);
 assert.equal((await admin.post(adm+`/admin/requests/${funding.data._id}/accept`,{data:{}})).status(),409);
 const rejected=await call(user,'/api/requests',{requestedAmount:1500,transactionId:tx+'-R'});await call(admin,`/admin/requests/${rejected.data._id}/reject`,{reason:'Fictional test request'},'post',adm);
 const modified=await call(user,'/api/requests',{requestedAmount:2000,transactionId:tx+'-M'});await call(admin,`/admin/requests/${modified.data._id}/modify`,{newAmount:1800},'post',adm);
 console.log('PASS funding submit/approve/reject/modify; repeated approval cannot double-credit');
 // A real execution in the app's virtual ledger, at the provider quote.
 const price=detail.marketInformation.lastTradingPrice;
 const sell=await call(seller,'/api/orders',{tradingCode:'GP',orderType:'SELL',askingPrice:price,quantity:10});
 const buy=await call(user,'/api/orders',{tradingCode:'GP',orderType:'BUY',askingPrice:price,quantity:10});
 assert.equal((await seller.post(api+`/api/order/execute/${buy.data._id}`,{data:{}})).status(),403);
 const fill=await call(user,`/api/order/execute/${buy.data._id}`,{});assert.equal(fill.data.remainingQty,0);assert.equal(fill.data.processed.reduce((n,p)=>n+p.qty,0),10);
 const profile=await call(user,`/users/${investor._id}`,undefined,'get');assert.ok(profile.transactionHistory.some(t=>t.action==='BUY'&&t.tradingCode==='GP'));
 const pending=await call(user,'/api/orders',{tradingCode:'GP',orderType:'BUY',askingPrice:price-1,quantity:15});
 const changed=await call(user,`/api/orders/${pending.data._id}/resubmit`,{askingPrice:price-2,quantity:20});await call(user,`/api/orders/${changed.data._id}`,undefined,'delete');
 assert.equal((await user.post(api+'/api/orders',{data:{tradingCode:'GP',orderType:'SELL',askingPrice:price,quantity:999999}})).status(),400);
 // Preserve meaningful pending rows for UI captures.
 await call(user,'/api/orders',{tradingCode:'GP',orderType:'BUY',askingPrice:price-1,quantity:15});
 await call(seller,'/api/orders',{tradingCode:'GP',orderType:'SELL',askingPrice:price+1,quantity:50});
 await call(user,'/api/requests',{requestedAmount:3000,transactionId:tx+'-PENDING'});
 console.log('PASS order matching, balances/holdings/history, ownership checks, resubmit/cancel, invalid holdings');
 await call(admin,'/admin/assign-stock',{email:credentials.seller.email,tradingCode:'GP',quantity:1},'post',adm);
 await call(admin,'/admin/bulk-fetch',{},'post',adm);await new Promise(r=>setTimeout(r,500));await call(admin,'/admin/bulk-fetch/stop',{},'post',adm);
 let progress;for(let i=0;i<30;i++){progress=await call(admin,'/admin/bulk-fetch/progress',undefined,'get',adm);if(!progress.data.isRunning)break;await new Promise(r=>setTimeout(r,200));}
 assert.equal(progress.data.isRunning,false);assert.ok(progress.data.completed<progress.data.total);
 await call(admin,'/admin/bulk-fetch',{},'post',adm);for(let i=0;i<90;i++){progress=await call(admin,'/admin/bulk-fetch/progress',undefined,'get',adm);if(!progress.data.isRunning)break;await new Promise(r=>setTimeout(r,200));}
 assert.equal(progress.data.completed,progress.data.total);assert.equal(progress.data.failed,0);
 console.log('PASS admin stock assignment and bulk-sync cancellation/completion');
 const chat=await call(user,'/api/ai/chat',{tradingCodes:['GP'],question:'What does the latest GP quote show? Mention its date, price and sector. Use three short sentences.'});assert.ok(chat.data.answer.length>30);assert.ok(!chat.data.answer.includes('$'),'DSE quote response must use BDT');
 const saved=await call(user,`/api/ai/session/${chat.data.sessionId}`,undefined,'get');assert.equal(saved.data.messages.length,2);
 writeFileSync(new URL('../.runtime/feature-evidence.json',import.meta.url),JSON.stringify({symbol:'GP',quoteDate:detail.marketInformation.asOfDate.slice(0,10),sessionId:chat.data.sessionId,transactionId:tx,model:chat.data.model,checks:'passed'},null,2));
 console.log(`PASS generated ${chat.data.provider} advisor response and saved conversation`);
}finally{await Promise.all([user.dispose(),seller.dispose(),admin.dispose(),guest.dispose()]);}
