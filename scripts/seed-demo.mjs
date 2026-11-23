// Real market snapshots and fictional accounts, isolated from the normal database.
import {createRequire} from 'node:module';
import {randomBytes} from 'node:crypto';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
const requireApi=createRequire(new URL('../services/api/package.json',import.meta.url));
const mongoose=requireApi('mongoose');const User=requireApi('./models/User');
const requireAdmin=createRequire(new URL('../services/admin-api/package.json',import.meta.url));
const adminMongoose=requireAdmin('mongoose');const Admin=requireAdmin('./models/Admin');
const uri=process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bloomfolio_demo';
const target=new URL(uri);
if(!['127.0.0.1','localhost','[::1]'].includes(target.hostname)||!target.pathname.endsWith('_demo'))throw new Error('Use a local database whose name ends in _demo.');
await mongoose.connect(uri);await adminMongoose.connect(uri);
const file=new URL('../.runtime/demo-credentials.json',import.meta.url);
const credentials=existsSync(file)?JSON.parse(readFileSync(file)):{};
try {
  const result=await fetch((process.env.MARKET_DATA_URL || 'http://127.0.0.1:8000')+'/api/stocks');const body=await result.json();
  if(!result.ok||!body.data?.length)throw new Error('Start the market-data service before seeding.');
  for(const s of body.data) await mongoose.connection.db.collection('stocks').updateOne({tradingCode:s.tradingCode},{$set:s},{upsert:true});
  for(const [role,email,name] of [['user','investor@example.test','Demo Investor'],['seller','seller@example.test','Demo Counterparty'],['admin','admin@example.test','Demo Admin']]) {
    const Model=role==='admin'?Admin:User;
    if(!credentials[role])credentials[role]={email,password:randomBytes(18).toString('base64url')};
    let account=await Model.findOne({email});
    if(!account)account=await Model.create({name,...credentials[role]});
    if(role!=='admin'&&credentials.version!==2){
      account.purchasePower=300000;
      account.portfolio=['GP','BRACBANK','SQURPHARMA'].map((code,i)=>({stock:code,quantity:role==='seller'?1000:100*(i+1),buyPrice:Math.round(body.data.find(s=>s.tradingCode===code).marketInformation.lastTradingPrice*(i===0?1.03:0.96)*100)/100}));
      await account.save();
    }
  }
  credentials.version=2;mkdirSync(new URL('../.runtime/',import.meta.url),{recursive:true});writeFileSync(file,JSON.stringify(credentials,null,2),{mode:0o600});
  console.log(`Imported ${body.data.length} real market snapshots. Demo accounts ready; credentials remain in .runtime/demo-credentials.json.`);
}finally{await Promise.all([mongoose.disconnect(),adminMongoose.disconnect()]);}
